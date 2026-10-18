from datetime import datetime, timedelta


class SimulationClock:
    """Maintains simulated microgrid time separate from wall-clock time."""

    def __init__(self, start_hour: int = 12, start_minute: int = 0, step_minutes: int = 5):
        self.step_minutes = step_minutes
        self.base_time = datetime(2025, 5, 4, start_hour, start_minute, 0)
        self.current_step = 0
        self.speed = 1.0
        self.is_running = True

    def reset(self, start_hour: int = 12, start_minute: int = 0):
        self.base_time = datetime(2025, 5, 4, start_hour, start_minute, 0)
        self.current_step = 0
        self.is_running = True

    def tick(self) -> int:
        if self.is_running:
            self.current_step += 1
            # Keep within daytime operating window (12:00 PM to 2:00 PM) for persistent live simulation
            if self.current_step > 24:
                self.current_step = 0
        return self.current_step

    @property
    def current_datetime(self) -> datetime:
        return self.base_time + timedelta(minutes=self.current_step * self.step_minutes)

    @property
    def current_time_str(self) -> str:
        # e.g. "12:00 PM"
        dt = self.current_datetime
        return dt.strftime("%I:%M %p").lstrip("0")

    @property
    def elapsed_minutes(self) -> float:
        return float(self.current_step * self.step_minutes)

    @property
    def hour_of_day(self) -> float:
        dt = self.current_datetime
        return dt.hour + (dt.minute / 60.0)
