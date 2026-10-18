"""
Electrical Demand and Consumption Model.
Models multi-category loads (Critical, Residential, Commercial, Flexible, EV)
with diurnal profiles, weekday/weekend differentiation, autocorrelated fluctuations,
and component-level served vs unserved tracking.
"""

import math
import numpy as np
from datetime import datetime
from typing import Dict, Any


class LoadModel:
    """
    Simulates multi-tier microgrid demand.
    Enforces exact reconciliation:
    total_demand = critical + residential + commercial + flexible + ev
    served + unserved = demand for every component.
    """

    def __init__(
        self,
        critical_base_kw: float = 40.0,
        residential_base_kw: float = 35.0,
        commercial_base_kw: float = 20.0,
        flexible_base_kw: float = 10.0,
        ev_max_charging_kw: float = 40.0,
        ev_num_chargers: int = 6,
        seed: int = 42
    ):
        self.critical_base = critical_base_kw
        self.residential_base = residential_base_kw
        self.commercial_base = commercial_base_kw
        self.flexible_base = flexible_base_kw
        self.ev_max_charging = ev_max_charging_kw
        self.ev_num_chargers = ev_num_chargers

        self.rng = np.random.default_rng(seed)
        self.demand_noise_state = 0.0

        # Dynamic disturbance / dispatch parameters
        self.surge_kw = 0.0
        self.flexible_curtailment_kw = 0.0
        self.ev_deferral_kw = 0.0

    def reset_seed(self, seed: int):
        self.rng = np.random.default_rng(seed)
        self.demand_noise_state = 0.0
        self.surge_kw = 0.0
        self.flexible_curtailment_kw = 0.0
        self.ev_deferral_kw = 0.0

    def compute_requested_demand(self, dt: datetime, dt_minutes: float = 1.0) -> Dict[str, float]:
        """
        Compute requested electrical power demand for each load tier.
        """
        hour = dt.hour + (dt.minute / 60.0)
        is_weekend = dt.weekday() >= 5

        # Autocorrelated stochastic load noise (Ornstein-Uhlenbeck)
        dt_hr = dt_minutes / 60.0
        dW = self.rng.normal(0.0, math.sqrt(dt_hr))
        self.demand_noise_state += -2.0 * self.demand_noise_state * dt_hr + 1.2 * dW
        self.demand_noise_state = max(-5.0, min(5.0, self.demand_noise_state))

        # 1. Critical Load (Hospital/Data center): Flat continuous with minor equipment cycling
        critical = self.critical_base + 3.0 * math.sin(math.radians(hour / 24.0 * 360.0))
        critical = round(max(20.0, critical + 0.3 * self.demand_noise_state), 3)

        # 2. Residential Load: Morning peak (07:00-09:00) and evening peak (18:00-22:00)
        morning_peak = 12.0 * math.exp(-((hour - 8.0) ** 2) / 3.0)
        evening_peak = 18.0 * math.exp(-((hour - 20.0) ** 2) / 4.5)
        weekend_mult = 1.15 if is_weekend else 1.0
        residential = (self.residential_base + morning_peak + evening_peak) * weekend_mult
        residential = round(max(15.0, residential + 0.5 * self.demand_noise_state), 3)

        # 3. Commercial Load: Active during business hours (08:00-18:00), low on weekends
        comm_weekend_mult = 0.30 if is_weekend else 1.0
        if 8.0 <= hour <= 18.0:
            comm_activity = 1.0 + 0.3 * math.sin(math.radians((hour - 8.0) / 10.0 * 180.0))
        else:
            comm_activity = 0.3
        commercial = self.commercial_base * comm_activity * comm_weekend_mult
        commercial = round(max(5.0, commercial + 0.2 * self.demand_noise_state), 3)

        # 4. Flexible Load (Controllable HVAC & water heating fleet)
        # Higher in the afternoon/evening
        flexible = self.flexible_base * (0.8 + 0.4 * math.sin(math.radians((hour - 12.0) / 24.0 * 360.0)))
        flexible = round(max(2.0, flexible), 3)

        # 5. EV Charging Load: Fleet arrives at workplace (09:00) & residential evening (18:00-21:00)
        ev_morning = 15.0 * math.exp(-((hour - 9.5) ** 2) / 2.0)
        ev_evening = 25.0 * math.exp(-((hour - 19.5) ** 2) / 3.5)
        ev_demand = min(self.ev_max_charging, (ev_morning + ev_evening) * (0.7 if is_weekend else 1.0))
        ev_demand = round(max(0.0, ev_demand), 3)

        # Apply demand surge if active
        residential = round(residential + self.surge_kw, 3)

        total_demand = round(critical + residential + commercial + flexible + ev_demand, 3)

        return {
            "critical_demand_kw": critical,
            "residential_demand_kw": residential,
            "commercial_demand_kw": commercial,
            "flexible_demand_kw": flexible,
            "ev_demand_kw": ev_demand,
            "total_demand_kw": total_demand
        }

    def step(self, dt: datetime, dt_minutes: float = 1.0):
        req = self.compute_requested_demand(dt, dt_minutes)
        from dataclasses import dataclass

        @dataclass
        class BaseLoads:
            critical_kw: float
            residential_kw: float
            commercial_kw: float
            flexible_kw: float
            ev_charging_kw: float
            total_kw: float

        return BaseLoads(
            critical_kw=req["critical_demand_kw"],
            residential_kw=req["residential_demand_kw"],
            commercial_kw=req["commercial_demand_kw"],
            flexible_kw=req["flexible_demand_kw"],
            ev_charging_kw=req["ev_demand_kw"],
            total_kw=req["total_demand_kw"],
        )

    def allocate_service(
        self,
        requested: Dict[str, float],
        available_supply_kw: float,
        ev_deferred_request_kw: float = 0.0,
        flex_curtailed_request_kw: float = 0.0
    ) -> Dict[str, float]:
        """
        Allocate available generation/discharge according to strict hierarchy:
        1. Critical Loads (highest priority)
        2. Residential Loads
        3. Commercial Loads
        4. Flexible Loads (can be deferred/curtailed)
        5. EV Charging (can be shifted/deferred)
        Guarantees: served + unserved == demand for every tier.
        """
        crit_req = requested["critical_demand_kw"]
        res_req = requested["residential_demand_kw"]
        comm_req = requested["commercial_demand_kw"]
        flex_req = requested["flexible_demand_kw"]
        ev_req = requested["ev_demand_kw"]

        # Apply voluntary optimizer adjustments
        target_flex = max(0.0, flex_req - flex_curtailed_request_kw)
        target_ev = max(0.0, ev_req - ev_deferred_request_kw)

        remaining_supply = max(0.0, available_supply_kw)

        # 1. Critical served
        crit_served = min(crit_req, remaining_supply)
        remaining_supply = max(0.0, remaining_supply - crit_served)

        # 2. Residential served
        res_served = min(res_req, remaining_supply)
        remaining_supply = max(0.0, remaining_supply - res_served)

        # 3. Commercial served
        comm_served = min(comm_req, remaining_supply)
        remaining_supply = max(0.0, remaining_supply - comm_served)

        # 4. Flexible served
        flex_served = min(target_flex, remaining_supply)
        remaining_supply = max(0.0, remaining_supply - flex_served)

        # 5. EV served
        ev_served = min(target_ev, remaining_supply)
        remaining_supply = max(0.0, remaining_supply - ev_served)

        # Unserved loads
        crit_unserved = round(crit_req - crit_served, 3)
        flex_unserved = round(flex_req - flex_served, 3)
        ev_unserved = round(ev_req - ev_served, 3)
        res_unserved = round(res_req - res_served, 3)
        comm_unserved = round(comm_req - comm_served, 3)

        total_served = round(crit_served + res_served + comm_served + flex_served + ev_served, 3)
        total_unserved = round(crit_unserved + res_unserved + comm_unserved + flex_unserved + ev_unserved, 3)

        return {
            "critical_load_served_kw": round(crit_served, 3),
            "flexible_load_served_kw": round(flex_served, 3),
            "ev_charging_served_kw": round(ev_served, 3),
            "residential_served_kw": round(res_served, 3),
            "commercial_served_kw": round(comm_served, 3),
            "unserved_critical_load_kw": crit_unserved,
            "unserved_flexible_load_kw": flex_unserved,
            "unserved_ev_load_kw": ev_unserved,
            "total_unserved_load_kw": total_unserved,
            "total_load_served_kw": total_served
        }
