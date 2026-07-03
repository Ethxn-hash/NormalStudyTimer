import customtkinter as ctk
import random
from PIL import Image
import os


ctk.set_appearance_mode("dark")
ctk.set_default_color_theme("blue")


class StudyTimerApp(ctk.CTk):
    def __init__(self):
        super().__init__()

        self.title("Normal Study Timer")
        self.geometry("1000x1000")
        self.minsize(1000, 1000)
        self.resizable(True, True)
        self.bg_path = os.path.join("assets", "sea_background.png")
        self.bg_original_image = Image.open(self.bg_path)
        self.bg_ctk_image = None
        

        # Timer variables
        self.study_minutes = 1
        self.remaining_seconds = self.study_minutes * 60
        self.running = False

        # Event Log
        self.event_log = []

        # Track Events
        self.event_freeze_seconds = 0
        self.event_cooldown_seconds = 0
        self.has_shield = False
        self.double_speed_seconds = 0
        self.slow_speed_seconds = 0
        self.reverse_time_seconds = 0
        self.slow_tick = False

        # Random Events
        self.sea_events = [
    {
        "name": "Time Whirlpool",
        "chance": 0.01,
        "message": "A swirling Time Whirlpool pulls your ship off course! Minutes and seconds have been reversed.",
        "action": self.event_switch_minutes_seconds,
        "type": "bad"
    },
    {
        "name": "Siren Song",
        "chance": 0.03,
        "message": "A haunting Siren Song drifts across the waves... your ship is frozen for 5 seconds.",
        "action": self.event_pause_for_5_seconds,
        "type": "bad"
    },
    {
        "name": "Tailwind Blessing",
        "chance": 0.02,
        "message": "A blessed tailwind fills your sails! Your voyage speeds ahead by 10 seconds.",
        "action": self.event_remove_10_seconds,
        "type": "good"
    },
    {
        "name": "Heavy Fog",
        "chance": 0.02,
        "message": "A thick enchanted fog rolls in... your voyage slows by 10 seconds.",
        "action": self.event_add_10_seconds,
        "type": "bad"
    },
    {
        "name": "Storm Surge",
        "chance": 0.01,
        "message": "A violent storm surge crashes over the deck! Your voyage is delayed by 20 seconds.",
        "action": self.event_add_20_seconds,
        "type": "bad"
    },
    {
        "name": "Dolphin Escort",
        "chance": 0.015,
        "message": "A pod of dolphins guides your ship through the waves! You skip ahead by 15 seconds.",
        "action": self.event_remove_15_seconds,
        "type": "good"
    },
    {
        "name": "Anchor Drop",
        "chance": 0.015,
        "message": "Your anchor drops by accident! The ship is stuck for 3 seconds.",
        "action": self.event_pause_for_3_seconds,
        "type": "bad"
    },
    {
        "name": "Pirate Raid",
        "chance": 0.01,
        "message": "Pirates board your ship and steal your focus! Your voyage is delayed by 30 seconds.",
        "action": self.event_add_30_seconds,
        "type": "bad"
    },
    {
        "name": "Treasure Map",
        "chance": 0.015,
        "message": "You discover a treasure map that reveals a shortcut! You move ahead by 25 seconds.",
        "action": self.event_remove_25_seconds,
        "type": "good"
    },
    {
        "name": "Magic Lighthouse",
        "chance": 0.01,
        "message": "A magic lighthouse protects your ship. The next bad event will be blocked.",
        "action": self.event_gain_shield,
        "type": "good"
    },
    {
        "name": "Coral Maze",
        "chance": 0.015,
        "message": "Your ship drifts into a glowing coral maze. You lose 15 seconds finding your way out.",
        "action": self.event_add_15_seconds,
        "type": "bad"
    },
    {
        "name": "Moonlit Current",
        "chance": 0.01,
        "message": "A moonlit current carries your ship forward. The timer moves twice as fast for 8 seconds.",
        "action": self.event_double_speed_8_seconds,
        "type": "good"
    },
    {
        "name": "Cursed Seaweed",
        "chance": 0.01,
        "message": "Cursed seaweed wraps around the rudder. The timer slows down for 8 seconds.",
        "action": self.event_slow_speed_8_seconds,
        "type": "bad"
    },
    {
        "name": "Ghost Ship",
        "chance": 0.008,
        "message": "A ghost ship sails beside you... time flows backward for 5 seconds.",
        "action": self.event_reverse_time_5_seconds,
        "type": "bad"
    },
    {
        "name": "Captain's Focus",
        "chance": 0.012,
        "message": "Your captain locks in with perfect focus! You gain a 20-second boost.",
        "action": self.event_remove_20_seconds,
        "type": "good"
    },
]

        # Fonts
        self.title_font = ("Press Start 2P", 22, "bold")
        self.timer_font = ("Pixelify Sans", 72, "bold")
        self.normal_font = ("Arial", 16)

        self.create_widgets()

    def create_widgets(self):
        self.background_label = ctk.CTkLabel(
            self,
            text=""
        )
        self.background_label.place(
            x=0,
            y=0,
            relwidth=1,
            relheight=1
        )
        self.update_background_image()
        self.bind("<Configure>", self.resize_background)
        # Main background frame
        self.main_frame = ctk.CTkFrame(
            self,
            fg_color="transparent"
        )
        self.main_frame.pack(
            fill="both",
            expand=True,
            padx=30,
            pady=25
        )

        # Title
        self.title_label = ctk.CTkLabel(
            self.main_frame,
            text="Voyage Time",
            font=self.title_font
        )
        self.title_label.pack(pady=(35, 30))

        # Timer display
        self.timer_label = ctk.CTkLabel(
            self.main_frame,
            text="25:00",
            font=self.timer_font
        )
        self.timer_label.pack(pady=30)

        self.time_setting_frame = ctk.CTkFrame(
            self.main_frame,
            fg_color="transparent"
        )
        self.time_setting_frame.pack(pady=10)

        self.time_entry = ctk.CTkEntry(
            self.time_setting_frame,
            width=80,
            placeholder_text="25"
        )
        self.time_entry.grid(row=0, column=0, padx=6)

        self.time_unit_label = ctk.CTkLabel(
            self.time_setting_frame,
            text="minutes",
            font=("Arial", 14)
        )
        self.time_unit_label.grid(row=0, column=1, padx=4)

        self.set_time_button = ctk.CTkButton(
            self.time_setting_frame,
            text="Set Time",
            width=90,
            command=self.set_study_time
        )
        self.set_time_button.grid(row=0, column=2, padx=6)

        # Button frame
        self.button_frame = ctk.CTkFrame(
            self.main_frame,
            fg_color="transparent"
        )
        self.button_frame.pack(pady=30)

        self.start_button = ctk.CTkButton(
            self.button_frame,
            text="Start",
            font=self.normal_font,
            width=110,
            command=self.start_timer
        )
        self.start_button.grid(row=0, column=0, padx=8)

        self.pause_button = ctk.CTkButton(
            self.button_frame,
            text="Break",
            font=self.normal_font,
            width=110,
            command=self.pause_timer
        )
        self.pause_button.grid(row=0, column=1, padx=8)

        self.reset_button = ctk.CTkButton(
            self.button_frame,
            text="Reset",
            font=self.normal_font,
            width=110,
            command=self.reset_timer
        )
        self.reset_button.grid(row=0, column=2, padx=8)

        # Event text
        self.event_frame = ctk.CTkFrame(
            self.main_frame,
            corner_radius=18
        )
        self.event_frame.pack(
            fill="both",
            expand=True,
            padx=30,
            pady=20
        )

        self.event_title = ctk.CTkLabel(
            self.event_frame,
            text="Captain's Log",
            font=("Arial", 16, "bold")
        )
        self.event_title.pack(pady=(10, 5))

        self.event_box = ctk.CTkTextbox(
            self.event_frame,
            font=("Arial", 32),
            wrap="word",
            corner_radius=12
        )
        self.event_box.pack(
            fill="both",
            expand=True,
            padx=15,
            pady=(5, 15)
        )

        self.event_box.insert("end", "No voyage events yet...")
        self.event_box.configure(state="disabled")

        

    def format_time(self):
        minutes = self.remaining_seconds // 60
        seconds = self.remaining_seconds % 60
        return f"{minutes:02d}:{seconds:02d}"
    
    def update_timer(self):
        self.timer_label.configure(text=self.format_time())

    def start_timer(self):
        if not self.running:
            self.running = True
            self.count_down()

    def pause_timer(self):
        self.running = False

    def reset_timer(self):
        self.running = False
        self.remaining_seconds = self.study_minutes * 60
        self.update_timer()

    def count_down(self):
        if not self.running:
            return

        if self.event_freeze_seconds > 0:
            self.event_freeze_seconds -= 1
            self.after(1000, self.count_down)
            return

        if self.remaining_seconds <= 0:
            self.running = False
            self.log_event("Journey Complete! You disembark from the ship.")
            return

        if self.reverse_time_seconds > 0:
            self.remaining_seconds += 1
            self.reverse_time_seconds -= 1

        elif self.double_speed_seconds > 0:
            self.remaining_seconds = max(0, self.remaining_seconds - 2)
            self.double_speed_seconds -= 1

        elif self.slow_speed_seconds > 0:
            self.slow_speed_seconds -= 1
            self.slow_tick = not self.slow_tick

            if self.slow_tick:
                self.remaining_seconds = max(0, self.remaining_seconds - 1)

        else:
            self.remaining_seconds = max(0, self.remaining_seconds - 1)

        self.update_timer()

        if self.remaining_seconds <= 0:
            self.running = False
            self.log_event("Journey Complete! You disembark from the ship.")
            return

        self.check_sea_event()
        self.after(1000, self.count_down)
    
    def check_sea_event(self):
        if self.event_cooldown_seconds > 0:
            self.event_cooldown_seconds -= 1
            return

        for event in self.sea_events:
            if random.random() < event["chance"]:

                if event["type"] == "bad" and self.has_shield:
                    self.has_shield = False
                    self.log_event(
                        f"The Magic Lighthouse blocks {event['name']}!"
                    )
                else:
                    self.log_event(event["message"])
                    event["action"]()

                self.event_cooldown_seconds = 3
                self.update_timer()
                break
    def change_time(self, seconds):
        self.remaining_seconds = max(0, self.remaining_seconds + seconds)
        self.update_timer()


    def event_switch_minutes_seconds(self):
        minutes = self.remaining_seconds // 60
        seconds = self.remaining_seconds % 60

        self.remaining_seconds = seconds * 60 + minutes
        self.update_timer()


    def event_pause_for_5_seconds(self):
        self.event_freeze_seconds = 5


    def event_pause_for_3_seconds(self):
        self.event_freeze_seconds = 3


    def event_remove_10_seconds(self):
        self.change_time(-10)


    def event_remove_15_seconds(self):
        self.change_time(-15)


    def event_remove_20_seconds(self):
        self.change_time(-20)


    def event_remove_25_seconds(self):
        self.change_time(-25)


    def event_add_10_seconds(self):
        self.change_time(10)


    def event_add_15_seconds(self):
        self.change_time(15)


    def event_add_20_seconds(self):
        self.change_time(20)


    def event_add_30_seconds(self):
        self.change_time(30)


    def event_gain_shield(self):
        self.has_shield = True


    def event_double_speed_8_seconds(self):
        self.double_speed_seconds = 8
        self.slow_speed_seconds = 0
        self.reverse_time_seconds = 0


    def event_slow_speed_8_seconds(self):
        self.slow_speed_seconds = 8
        self.double_speed_seconds = 0
        self.reverse_time_seconds = 0
        self.slow_tick = False


    def event_reverse_time_5_seconds(self):
        self.reverse_time_seconds = 5
        self.double_speed_seconds = 0
        self.slow_speed_seconds = 0 
            
    def log_event(self, message):
        self.event_log.append(message)

        display_text = "\n".join(
            f"• {event}" for event in self.event_log
        )

        self.event_box.configure(state="normal")
        self.event_box.delete("1.0", "end")
        self.event_box.insert("end", display_text)
        self.event_box.configure(state="disabled")

    # Keep newest event visible at the bottom
        self.event_box.see("end")


    def set_study_time(self):
        if self.running:
            self.log_event("Drop anchor first! Pause the timer before changing the voyage length.")
            return

        user_input = self.time_entry.get()

        try:
            minutes = int(user_input)

            if minutes <= 0:
                self.log_event("The voyage must be at least 1 minute long.")
                return

            if minutes > 180:
                self.log_event("That voyage is too long. Choose 180 minutes or less.")
                return

            self.study_minutes = minutes
            self.remaining_seconds = self.study_minutes * 60
            self.update_timer()
            self.log_event(f"New voyage length set: {minutes} minutes.")

        except ValueError:
            self.log_event("Enter a whole number of minutes")

    def update_background_image(self):
        width = self.winfo_width()
        height = self.winfo_height()

        if width <= 1 or height <= 1:
            width = 600
            height = 700

        resized_image = self.bg_original_image.resize((width, height))

        self.bg_ctk_image = ctk.CTkImage(
            light_image=resized_image,
            dark_image=resized_image,
            size=(width, height)
        )

        self.background_label.configure(image=self.bg_ctk_image)


    def resize_background(self, event):
        if event.widget == self:
            self.update_background_image()
    

app = StudyTimerApp()
app.mainloop()


