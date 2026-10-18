import math


class DemandModel:
    """Multi-sector electrical demand model with critical load priority and surge capabilities."""

    def __init__(
        self,
        critical_base_kw: float = 40.0,
        residential_base_kw: float = 35.0,
        commercial_base_kw: float = 20.0,
        flexible_base_kw: float = 10.0,
    ):
        self.critical_base_kw = critical_base_kw
        self.residential_base_kw = residential_base_kw
        self.commercial_base_kw = commercial_base_kw
        self.flexible_base_kw = flexible_base_kw

        # Dynamic control/fault adjustments
        self.surge_kw = 0.0
        self.flexible_curtailment_kw = 0.0

    def compute_requested_demand(self, hour_of_day: float) -> dict:
        """Calculate requested demand by category at the given hour of day."""
        # Critical load: essential continuous equipment with minor random fluctuation
        critical = self.critical_base_kw + 2.0 * math.sin(hour_of_day * 0.5)

        # Residential: double peak (morning 7-9am, evening 18-22pm)
        morning_peak = math.exp(-((hour_of_day - 8.0) ** 2) / 3.0) * 12.0
        evening_peak = math.exp(-((hour_of_day - 19.5) ** 2) / 4.0) * 20.0
        residential = self.residential_base_kw + morning_peak + evening_peak

        # Commercial: business hours (9am - 18pm)
        if 8.0 <= hour_of_day <= 18.0:
            comm_factor = 1.0 + 0.4 * math.sin((hour_of_day - 8.0) / 10.0 * math.pi)
        else:
            comm_factor = 0.4
        commercial = self.commercial_base_kw * comm_factor

        # Flexible: HVAC & thermal buffers
        flexible = max(0.0, self.flexible_base_kw - self.flexible_curtailment_kw)

        # Apply demand surge to residential/commercial
        total_surge = self.surge_kw
        residential += total_surge * 0.6
        commercial += total_surge * 0.4

        critical = round(max(5.0, critical), 2)
        residential = round(max(5.0, residential), 2)
        commercial = round(max(5.0, commercial), 2)
        flexible = round(max(0.0, flexible), 2)

        total = round(critical + residential + commercial + flexible, 2)

        return {
            "critical_kw": critical,
            "residential_kw": residential,
            "commercial_kw": commercial,
            "flexible_kw": flexible,
            "total_requested_kw": total,
            "surge_kw": self.surge_kw,
            "flexible_curtailed_kw": self.flexible_curtailment_kw,
        }
