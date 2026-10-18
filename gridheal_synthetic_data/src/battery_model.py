"""
Battery Energy Storage System (BESS) physics model for GridHeal.
Strictly respects thermodynamics, energy conservation, power bounds, SoC limits,
and mutual exclusivity of charge and discharge.
"""

from dataclasses import dataclass
from typing import Dict, Any, Tuple


@dataclass
class BatteryState:
    energy_kwh: float
    soc: float  # 0.0 to 1.0
    power_charge_kw: float
    power_discharge_kw: float
    is_available: bool
    temperature_c: float
    soh: float  # State of Health: 1.0 down to 0.0


class BatteryModel:
    """
    Simulates a Lithium-ion / LiFePO4 battery pack with physical constraints:
    E(t + dt) = E(t) + eta_c * P_c * dt - (P_d / eta_d) * dt - E_idle_loss
    """

    def __init__(self, config: Dict[str, Any]):
        batt_cfg = config.get("battery", {})
        self.capacity_total_kwh = float(batt_cfg.get("capacity_total_kwh", 200.0))
        self.capacity_usable_kwh = float(batt_cfg.get("capacity_usable_kwh", 150.0))
        self.max_charge_kw = float(batt_cfg.get("max_charge_rate_kw", 50.0))
        self.max_discharge_kw = float(batt_cfg.get("max_discharge_rate_kw", 75.0))
        self.efficiency_charge = float(batt_cfg.get("efficiency_charge", 0.95))
        self.efficiency_discharge = float(batt_cfg.get("efficiency_discharge", 0.95))
        self.min_soc = float(batt_cfg.get("min_soc", 0.20))
        self.max_soc = float(batt_cfg.get("max_soc", 0.95))
        self.reserve_soc = float(batt_cfg.get("reserve_soc", 0.30))
        self.self_discharge_hourly = float(batt_cfg.get("self_discharge_rate_per_hour", 0.0001))

        # Initial conditions
        initial_soc = float(batt_cfg.get("initial_soc", 0.65))
        self.energy_kwh = self.capacity_total_kwh * initial_soc
        self.is_available = True
        self.temperature_c = 25.0
        self.soh = 1.0

    @property
    def soc(self) -> float:
        return self.energy_kwh / self.capacity_total_kwh

    def get_max_discharge_kw(self, dt_hours: float, allow_below_reserve: bool = False) -> float:
        """
        Calculates maximum physically feasible discharge power over duration dt_hours
        respecting current SoC, minimum SoC (or reserve SoC), and power rating.
        """
        if not self.is_available or dt_hours <= 0:
            return 0.0

        floor_soc = self.min_soc if allow_below_reserve else max(self.min_soc, self.reserve_soc)
        floor_energy = self.capacity_total_kwh * floor_soc
        available_energy = max(0.0, self.energy_kwh - floor_energy)

        # Output power = (Energy drained * eta_d) / dt
        max_power_from_energy = (available_energy * self.efficiency_discharge) / dt_hours
        return min(self.max_discharge_kw, max(0.0, max_power_from_energy))

    def get_max_charge_kw(self, dt_hours: float) -> float:
        """
        Calculates maximum physically feasible charge power over duration dt_hours
        respecting current SoC, maximum SoC, and power rating.
        """
        if not self.is_available or dt_hours <= 0:
            return 0.0

        ceiling_energy = self.capacity_total_kwh * self.max_soc
        headroom_energy = max(0.0, ceiling_energy - self.energy_kwh)

        # Input power = Headroom / (eta_c * dt)
        max_power_from_headroom = headroom_energy / (self.efficiency_charge * dt_hours)
        return min(self.max_charge_kw, max(0.0, max_power_from_headroom))

    def step(
        self,
        requested_charge_kw: float,
        requested_discharge_kw: float,
        dt_minutes: float,
        allow_below_reserve: bool = False,
        fault_override_unavailable: bool = False,
    ) -> Tuple[float, float, BatteryState]:
        """
        Updates battery state for a time step of dt_minutes.
        Enforces mutual exclusivity: if both requested, net direction is taken or charge is prioritized.
        Returns:
            actual_charge_kw: float >= 0.0
            actual_discharge_kw: float >= 0.0
            state: BatteryState
        """
        dt_hours = dt_minutes / 60.0

        # Availability check
        if fault_override_unavailable:
            self.is_available = False
        else:
            self.is_available = True

        if not self.is_available or dt_hours <= 0:
            # Only self discharge / idle loss occurs
            idle_loss = self.energy_kwh * self.self_discharge_hourly * dt_hours
            self.energy_kwh = max(0.0, self.energy_kwh - idle_loss)
            return 0.0, 0.0, BatteryState(
                energy_kwh=self.energy_kwh,
                soc=self.soc,
                power_charge_kw=0.0,
                power_discharge_kw=0.0,
                is_available=self.is_available,
                temperature_c=self.temperature_c,
                soh=self.soh,
            )

        # Enforce mutual exclusivity
        req_chg = max(0.0, float(requested_charge_kw))
        req_dis = max(0.0, float(requested_discharge_kw))
        if req_chg > 0 and req_dis > 0:
            # Resolving conflict by net power
            if req_chg >= req_dis:
                req_chg -= req_dis
                req_dis = 0.0
            else:
                req_dis -= req_chg
                req_chg = 0.0

        actual_charge_kw = 0.0
        actual_discharge_kw = 0.0

        if req_dis > 0:
            max_dis = self.get_max_discharge_kw(dt_hours, allow_below_reserve=allow_below_reserve)
            actual_discharge_kw = min(req_dis, max_dis)
            energy_drained = (actual_discharge_kw / self.efficiency_discharge) * dt_hours
            self.energy_kwh = max(0.0, self.energy_kwh - energy_drained)
        elif req_chg > 0:
            max_chg = self.get_max_charge_kw(dt_hours)
            actual_charge_kw = min(req_chg, max_chg)
            energy_added = actual_charge_kw * self.efficiency_charge * dt_hours
            self.energy_kwh = min(self.capacity_total_kwh * self.max_soc, self.energy_kwh + energy_added)

        # Self-discharge loss with BMS undervoltage floor protection
        idle_loss = self.energy_kwh * self.self_discharge_hourly * dt_hours
        min_floor = self.capacity_total_kwh * self.min_soc
        self.energy_kwh = max(min_floor, self.energy_kwh - idle_loss)

        # Temperature thermal effect (approximate heat dissipation)
        internal_loss_kw = actual_charge_kw * (1.0 - self.efficiency_charge) + actual_discharge_kw * (1.0 / self.efficiency_discharge - 1.0)
        # Thermal relaxation to 25C with thermal mass
        self.temperature_c = self.temperature_c + (internal_loss_kw * 0.05 * dt_hours) - (self.temperature_c - 25.0) * 0.1 * dt_hours

        return actual_charge_kw, actual_discharge_kw, BatteryState(
            energy_kwh=self.energy_kwh,
            soc=self.soc,
            power_charge_kw=actual_charge_kw,
            power_discharge_kw=actual_discharge_kw,
            is_available=self.is_available,
            temperature_c=self.temperature_c,
            soh=self.soh,
        )

    def set_soc(self, soc_val: float):
        """Helper to reset SoC for scenario testing."""
        clamped_soc = max(0.0, min(1.0, soc_val))
        self.energy_kwh = self.capacity_total_kwh * clamped_soc
