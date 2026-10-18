import math


class EVChargingModel:
    """EV Charging station model with flexible smart charging deferral."""

    def __init__(self, num_chargers: int = 6, max_station_kw: float = 40.0):
        self.num_chargers = num_chargers
        self.max_station_kw = max_station_kw
        self.deferred_kw = 0.0
        self.surge_peak_kw = 0.0

    def compute_charging_demand(self, hour_of_day: float) -> dict:
        """Calculate requested EV charging load at given hour."""
        # Workplace peak (11am-2pm) + residential evening peak (5pm-9pm)
        workplace = math.exp(-((hour_of_day - 12.5) ** 2) / 2.5) * 15.0
        evening = math.exp(-((hour_of_day - 18.5) ** 2) / 3.0) * 22.0

        base_kw = 5.0 + workplace + evening
        requested_kw = min(self.max_station_kw + self.surge_peak_kw, base_kw + self.surge_peak_kw)
        requested_kw = max(0.0, round(requested_kw, 2))

        # Applied allocation after smart deferral
        allocated_kw = max(0.0, round(requested_kw - self.deferred_kw, 2))
        actual_deferred_kw = round(requested_kw - allocated_kw, 2)

        return {
            "requested_kw": requested_kw,
            "allocated_kw": allocated_kw,
            "deferred_kw": actual_deferred_kw,
            "max_station_kw": self.max_station_kw,
            "surge_kw": self.surge_peak_kw
        }
