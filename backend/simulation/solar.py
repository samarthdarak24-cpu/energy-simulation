import math


class SolarModel:
    """Physics-based PV generation model with diurnal profile and fault responsiveness."""

    def __init__(self, installed_capacity_kw: float = 160.0, efficiency: float = 0.92):
        self.installed_capacity_kw = installed_capacity_kw
        self.efficiency = efficiency
        self.curtailment_kw = 0.0
        self.fault_reduction_pct = 0.0
        self.is_offline = False

    def compute_generation(self, hour_of_day: float, cloud_factor: float = 1.0) -> dict:
        """Calculate solar output at a specific hour of day (0.0 to 24.0)."""
        if self.is_offline:
            return {
                "available_kw": 0.0,
                "curtailed_kw": 0.0,
                "actual_kw": 0.0,
                "capacity_kw": self.installed_capacity_kw,
                "fault_reduction_pct": 100.0
            }

        # Solar bell curve between 06:00 and 19:00 (peaks at 12:30)
        sunrise = 6.0
        sunset = 19.0
        if hour_of_day < sunrise or hour_of_day > sunset:
            irradiance_pu = 0.0
        else:
            midday = (sunrise + sunset) / 2.0
            half_day = (sunset - sunrise) / 2.0
            # Smooth sine / cosine bell curve
            normalized = (hour_of_day - midday) / half_day
            irradiance_pu = max(0.0, math.cos(normalized * (math.pi / 2.0)))

        # Potential theoretical generation
        raw_kw = self.installed_capacity_kw * irradiance_pu * self.efficiency * cloud_factor

        # Apply fault reduction if active
        reduced_kw = raw_kw * (1.0 - (self.fault_reduction_pct / 100.0))
        reduced_kw = max(0.0, round(reduced_kw, 2))

        # Apply curtailment (cannot exceed reduced available power)
        actual_kw = max(0.0, round(reduced_kw - self.curtailment_kw, 2))

        return {
            "available_kw": reduced_kw,
            "curtailed_kw": min(self.curtailment_kw, reduced_kw),
            "actual_kw": actual_kw,
            "capacity_kw": self.installed_capacity_kw,
            "fault_reduction_pct": self.fault_reduction_pct
        }
