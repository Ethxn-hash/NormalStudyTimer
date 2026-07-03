document.addEventListener("DOMContentLoaded", () => {
  // ----------------------------
  // HTML ELEMENTS
  // ----------------------------
  const timerDisplay = document.getElementById("timerDisplay");
  const timeInput = document.getElementById("timeInput");
  const setTimeButton = document.getElementById("setTimeButton");

  const startButton = document.getElementById("startButton");
  const pauseButton = document.getElementById("pauseButton");
  const resetButton = document.getElementById("resetButton");

  const effectStatus = document.getElementById("effectStatus");
  const eventLogBox = document.getElementById("eventLog");
  const screenEffect = document.getElementById("screenEffect");

  // ----------------------------
  // TIMER STATE
  // ----------------------------
  let studyMinutes = 25;
  let remainingSeconds = studyMinutes * 60;
  let running = false;
  let timerInterval = null;

  // ----------------------------
  // EVENT STATE
  // ----------------------------
  let eventLog = [];

  let eventFreezeSeconds = 0;
  let eventCooldownSeconds = 0;

  let hasShield = false;
  let doubleSpeedSeconds = 0;
  let slowSpeedSeconds = 0;
  let reverseTimeSeconds = 0;
  let slowTick = false;

  // ----------------------------
  // SEA EVENTS
  // ----------------------------
  const seaEvents = [
    {
      name: "Time Whirlpool",
      chance: 0.01,
      message:
        "A swirling Time Whirlpool pulls your ship off course! Minutes and seconds have been reversed.",
      action: eventSwitchMinutesSeconds,
      type: "bad",
    },
    {
      name: "Siren Song",
      chance: 0.03,
      message:
        "A haunting Siren Song drifts across the waves... your ship is frozen for 5 seconds.",
      action: eventPauseFor5Seconds,
      type: "bad",
    },
    {
      name: "Tailwind Blessing",
      chance: 0.02,
      message:
        "A blessed tailwind fills your sails! Your voyage speeds ahead by 10 seconds.",
      action: eventRemove10Seconds,
      type: "good",
    },
    {
      name: "Heavy Fog",
      chance: 0.02,
      message:
        "A thick enchanted fog rolls in... your voyage slows by 10 seconds.",
      action: eventAdd10Seconds,
      type: "bad",
    },
    {
      name: "Storm Surge",
      chance: 0.01,
      message:
        "A violent storm surge crashes over the deck! Your voyage is delayed by 20 seconds.",
      action: eventAdd20Seconds,
      type: "bad",
    },
    {
      name: "Dolphin Escort",
      chance: 0.015,
      message:
        "A pod of dolphins guides your ship through the waves! You skip ahead by 15 seconds.",
      action: eventRemove15Seconds,
      type: "good",
    },
    {
      name: "Anchor Drop",
      chance: 0.015,
      message: "Your anchor drops by accident! The ship is stuck for 3 seconds.",
      action: eventPauseFor3Seconds,
      type: "bad",
    },
    {
      name: "Pirate Raid",
      chance: 0.01,
      message:
        "Pirates board your ship and steal your focus! Your voyage is delayed by 30 seconds.",
      action: eventAdd30Seconds,
      type: "bad",
    },
    {
      name: "Treasure Map",
      chance: 0.015,
      message:
        "You discover a treasure map that reveals a shortcut! You move ahead by 25 seconds.",
      action: eventRemove25Seconds,
      type: "good",
    },
    {
      name: "Magic Lighthouse",
      chance: 0.01,
      message:
        "A magic lighthouse protects your ship. The next bad event will be blocked.",
      action: eventGainShield,
      type: "good",
    },
    {
      name: "Coral Maze",
      chance: 0.015,
      message:
        "Your ship drifts into a glowing coral maze. You lose 15 seconds finding your way out.",
      action: eventAdd15Seconds,
      type: "bad",
    },
    {
      name: "Moonlit Current",
      chance: 0.01,
      message:
        "A moonlit current carries your ship forward. The timer moves twice as fast for 8 seconds.",
      action: eventDoubleSpeed8Seconds,
      type: "good",
    },
    {
      name: "Cursed Seaweed",
      chance: 0.01,
      message:
        "Cursed seaweed wraps around the rudder. The timer slows down for 8 seconds.",
      action: eventSlowSpeed8Seconds,
      type: "bad",
    },
    {
      name: "Ghost Ship",
      chance: 0.008,
      message:
        "A ghost ship sails beside you... time flows backward for 5 seconds.",
      action: eventReverseTime5Seconds,
      type: "bad",
    },
    {
      name: "Captain's Focus",
      chance: 0.012,
      message:
        "Your captain locks in with perfect focus! You gain a 20-second boost.",
      action: eventRemove20Seconds,
      type: "good",
    },
  ];

  // ----------------------------
  // BASIC TIMER FUNCTIONS
  // ----------------------------
  function formatTime(seconds) {
    const safeSeconds = Math.max(0, seconds);
    const minutes = Math.floor(safeSeconds / 60);
    const leftoverSeconds = safeSeconds % 60;

    return `${String(minutes).padStart(2, "0")}:${String(leftoverSeconds).padStart(2, "0")}`;
  }

  function updateTimerDisplay() {
    timerDisplay.textContent = formatTime(remainingSeconds);
  }

  function startTimer() {
    if (running) return;

    running = true;

    if (timerInterval === null) {
      timerInterval = setInterval(countDown, 1000);
    }

    logEvent("The voyage begins. Stay focused, captain.", "neutral");
  }

  function pauseTimer() {
    running = false;
    clearInterval(timerInterval);
    timerInterval = null;

    logEvent("The ship drops anchor. Timer paused.", "neutral");
  }

  function resetTimer() {
    running = false;
    clearInterval(timerInterval);
    timerInterval = null;

    remainingSeconds = studyMinutes * 60;

    eventFreezeSeconds = 0;
    eventCooldownSeconds = 0;
    hasShield = false;
    doubleSpeedSeconds = 0;
    slowSpeedSeconds = 0;
    reverseTimeSeconds = 0;
    slowTick = false;

    updateTimerDisplay();
    updateEffectStatus();

    logEvent("The voyage has been reset.", "neutral");
  }

  function finishSession() {
    running = false;
    clearInterval(timerInterval);
    timerInterval = null;

    remainingSeconds = 0;
    updateTimerDisplay();
    updateEffectStatus();

    logEvent("Journey complete! You disembark from the ship.", "good");
  }

  function countDown() {
    if (!running) return;

    if (eventFreezeSeconds > 0) {
      eventFreezeSeconds -= 1;
      updateEffectStatus();
      return;
    }

    if (remainingSeconds <= 0) {
      finishSession();
      return;
    }

    if (reverseTimeSeconds > 0) {
      remainingSeconds += 1;
      reverseTimeSeconds -= 1;
    } else if (doubleSpeedSeconds > 0) {
      remainingSeconds = Math.max(0, remainingSeconds - 2);
      doubleSpeedSeconds -= 1;
    } else if (slowSpeedSeconds > 0) {
      slowSpeedSeconds -= 1;
      slowTick = !slowTick;

      if (slowTick) {
        remainingSeconds = Math.max(0, remainingSeconds - 1);
      }
    } else {
      remainingSeconds = Math.max(0, remainingSeconds - 1);
    }

    updateTimerDisplay();

    if (remainingSeconds <= 0) {
      finishSession();
      return;
    }

    checkSeaEvent();
    updateEffectStatus();
  }

  // ----------------------------
  // RANDOM EVENT SYSTEM
  // ----------------------------
  function checkSeaEvent() {
    if (eventCooldownSeconds > 0) {
      eventCooldownSeconds -= 1;
      return;
    }

    for (const event of seaEvents) {
      if (Math.random() < event.chance) {
        if (event.type === "bad" && hasShield) {
            hasShield = false;
            logEvent(`The Magic Lighthouse blocks ${event.name}!`, "good");
            triggerVisualEffect("Magic Lighthouse", "good");
        } else {
            logEvent(event.message, event.type);
            event.action();
            triggerVisualEffect(event.name, event.type);
        }

        eventCooldownSeconds = 3;
        updateTimerDisplay();

        if (remainingSeconds <= 0) {
          finishSession();
        }

        break;
      }
    }
  }

  function changeTime(seconds) {
    remainingSeconds = Math.max(0, remainingSeconds + seconds);
    updateTimerDisplay();
  }

  // ----------------------------
  // EVENT ACTIONS
  // ----------------------------
  function eventSwitchMinutesSeconds() {
    const minutes = Math.floor(remainingSeconds / 60);
    const seconds = remainingSeconds % 60;

    remainingSeconds = seconds * 60 + minutes;
    updateTimerDisplay();
  }

  function eventPauseFor5Seconds() {
    eventFreezeSeconds = 5;
  }

  function eventPauseFor3Seconds() {
    eventFreezeSeconds = 3;
  }

  function eventRemove10Seconds() {
    changeTime(-10);
  }

  function eventRemove15Seconds() {
    changeTime(-15);
  }

  function eventRemove20Seconds() {
    changeTime(-20);
  }

  function eventRemove25Seconds() {
    changeTime(-25);
  }

  function eventAdd10Seconds() {
    changeTime(10);
  }

  function eventAdd15Seconds() {
    changeTime(15);
  }

  function eventAdd20Seconds() {
    changeTime(20);
  }

  function eventAdd30Seconds() {
    changeTime(30);
  }

  function eventGainShield() {
    hasShield = true;
  }

  function eventDoubleSpeed8Seconds() {
    doubleSpeedSeconds = 8;
    slowSpeedSeconds = 0;
    reverseTimeSeconds = 0;
  }

  function eventSlowSpeed8Seconds() {
    slowSpeedSeconds = 8;
    doubleSpeedSeconds = 0;
    reverseTimeSeconds = 0;
    slowTick = false;
  }

  function eventReverseTime5Seconds() {
    reverseTimeSeconds = 5;
    doubleSpeedSeconds = 0;
    slowSpeedSeconds = 0;
  }

  // ----------------------------
  // CAPTAIN'S LOG
  // ----------------------------
  function logEvent(message, type = "neutral") {
    eventLog.push({
      message,
      type,
    });

    // Prevent the page from storing thousands of messages forever.
    eventLog = eventLog.slice(-100);

    eventLogBox.innerHTML = "";

    for (const event of eventLog) {
      const entry = document.createElement("p");
      entry.classList.add("log-entry", event.type);
      entry.textContent = `• ${event.message}`;

      eventLogBox.appendChild(entry);
    }

    eventLogBox.scrollTop = eventLogBox.scrollHeight;
  }

  function triggerVisualEffect(eventName, type = "neutral") {
  const effectMap = {
    "Time Whirlpool": "effect-whirlpool",
    "Siren Song": "effect-freeze",
    "Anchor Drop": "effect-freeze",
    "Heavy Fog": "effect-fog",
    "Cursed Seaweed": "effect-fog",
    "Magic Lighthouse": "effect-shield",
    "Ghost Ship": "effect-ghost",
  };

  const effectClass =
    effectMap[eventName] ||
    (type === "good" ? "effect-good" : type === "bad" ? "effect-bad" : "effect-good");

  screenEffect.className = "screen-effect";

  // Restarts the animation even if the same event happens twice
  void screenEffect.offsetWidth;

  screenEffect.classList.add(effectClass);

  setTimeout(() => {
    screenEffect.className = "screen-effect";
  }, 1500);
}

  // ----------------------------
  // TIME SETTING
  // ----------------------------
  function setStudyTime() {
    if (running) {
      logEvent(
        "Drop anchor first! Pause the timer before changing the voyage length.",
        "neutral"
      );
      return;
    }

    const minutes = Number(timeInput.value);

    if (!Number.isInteger(minutes)) {
      logEvent("Enter a whole number of minutes.", "bad");
      return;
    }

    if (minutes <= 0) {
      logEvent("The voyage must be at least 1 minute long.", "bad");
      return;
    }

    if (minutes > 180) {
      logEvent("That voyage is too long. Choose 180 minutes or less.", "bad");
      return;
    }

    studyMinutes = minutes;
    remainingSeconds = studyMinutes * 60;

    updateTimerDisplay();
    updateEffectStatus();

    logEvent(`New voyage length set: ${minutes} minutes.`, "neutral");
  }

  // ----------------------------
  // EFFECT STATUS TEXT
  // ----------------------------
  function updateEffectStatus() {
    if (eventFreezeSeconds > 0) {
      effectStatus.textContent = `The ship is frozen for ${eventFreezeSeconds} more second(s).`;
      return;
    }

    if (reverseTimeSeconds > 0) {
      effectStatus.textContent = `Ghostly waters pull time backward for ${reverseTimeSeconds} more second(s).`;
      return;
    }

    if (doubleSpeedSeconds > 0) {
      effectStatus.textContent = `Moonlit Current active: double speed for ${doubleSpeedSeconds} more second(s).`;
      return;
    }

    if (slowSpeedSeconds > 0) {
      effectStatus.textContent = `Cursed Seaweed active: slowed time for ${slowSpeedSeconds} more second(s).`;
      return;
    }

    if (hasShield) {
      effectStatus.textContent = "Magic Lighthouse active: the next bad event will be blocked.";
      return;
    }

    effectStatus.textContent = "The sea is calm.";
  }

  // ----------------------------
  // BUTTON CONNECTIONS
  // ----------------------------
  startButton.addEventListener("click", startTimer);
  pauseButton.addEventListener("click", pauseTimer);
  resetButton.addEventListener("click", resetTimer);
  setTimeButton.addEventListener("click", setStudyTime);

  timeInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      setStudyTime();
    }
  });

  // ----------------------------
  // INITIAL DISPLAY
  // ----------------------------
  updateTimerDisplay();
  updateEffectStatus();
});