import math


class BatteryModel:
    """Battery Energy Storage System (BESS) tracking SoC and enforcing operational limits."""

    def __init__(
        self,
        capacity_kwh: float = 200.0,
        initial_soc: float = 76.0,
        min_soc: float = 20.0,
        max_soc: float = 95.0,
        max_charge_kw: float = 60.0,
        max_discharge_kw: float = 60.0,
        efficiency: float = 0.94,
    ):
        self.capacity_kwh = capacity_kwh
        self.min_soc = min_soc
        self.max_soc = max_soc
        self.max_charge_kw = max_charge_kw
        self.max_discharge_kw = max_discharge_kw
        self.efficiency = efficiency
        self.one_way_eff = math.sqrt(efficiency)

        self.current_soc = initial_soc
        self.stored_kwh = (initial_soc / 100.0) * capacity_kwh
        self.current_power_kw = 0.0  # > 0 discharging, < 0 charging
        self.is_tripped = False
        self.temperature_c = 28.0

    @property
    def min_energy_kwh(self) -> float:
        return (self.min_soc / 100.0) * self.capacity_kwh

    @property
    def max_energy_kwh(self) -> float:
        return (self.max_soc / 100.0) * self.capacity_kwh

    @property
    def available_discharge_energy_kwh(self) -> float:
        if self.is_tripped:
            return 0.0
        return max(0.0, self.stored_kwh - self.min_energy_kwh)

    @property
    def available_charge_capacity_kwh(self) -> float:
        if self.is_tripped:
            return 0.0
        return max(0.0, self.max_energy_kwh - self.stored_kwh)

    def max_feasible_discharge_kw(self, dt_hours: float) -> float:
        if self.is_tripped or dt_hours <= 0:
            return 0.0
        # Power bound vs energy bound
        energy_limited_kw = (self.available_discharge_energy_kwh * self.one_way_eff) / dt_hours
        return min(self.max_discharge_kw, max(0.0, energy_limited_kw))

    def max_feasible_charge_kw(self, dt_hours: float) -> float:
        if self.is_tripped or dt_hours <= 0:
            return 0.0
        # Power bound vs capacity bound
        capacity_limited_kw = (self.available_charge_capacity_kwh / self.one_way_eff) / dt_hours
        return min(self.max_charge_kw, max(0.0, capacity_limited_kw))

    def step(self, requested_power_kw: float, dt_hours: float) -> float:
        """
        Advance battery state by requested_power_kw for dt_hours.
        requested_power_kw > 0 => discharge (supply to microgrid)
        requested_power_kw < 0 => charge (absorb from microgrid)
        Returns the actual power delivered/absorbed in kW.
        """
        if self.is_tripped or dt_hours <= 0:
            self.current_power_kw = 0.0
            return 0.0

        if requested_power_kw > 0:
            # Discharge
            max_p = self.max_feasible_discharge_kw(dt_hours)
            actual_p = min(requested_power_kw, max_p)
            energy_drawn_kwh = (actual_p * dt_hours) / self.one_way_eff
            self.stored_kwh = max(self.min_energy_kwh, self.stored_kwh - energy_drawn_kwh)
        elif requested_power_kw < 0:
            # Charge
            max_p = self.max_feasible_charge_kw(dt_hours)
            actual_p = -min(abs(requested_power_kw), max_p)
            energy_stored_kwh = (abs(actual_p) * dt_hours) * self.one_way_eff
            self.stored_kwh = min(self.max_energy_kwh, self.stored_kwh + energy_stored_kwh)
        else:
            actual_p = 0.0

        self.stored_kwh = round(self.stored_kwh, 3)
        self.current_soc = round((self.stored_kwh / self.capacity_kwh) * 100.0, 2)
        self.current_power_kw = round(actual_p, 2)

        # Temperature variation based on C-rate
        c_rate = abs(self.current_power_kw) / max(1.0, self.capacity_kwh)
        self.temperature_c = round(25.0 + c_rate * 12.0, 1)

        return self.current_power_kw
