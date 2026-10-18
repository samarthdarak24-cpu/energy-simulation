"""
Solar Photovoltaic Physical Model.
Calculates available and actual PV power generation based on irradiance,
temperature derating coefficient, inverter rating, curtailment, and fault derating.
"""

from typing import Dict, Any


class SolarModel:
    """
    Physics-based Photovoltaic Generation Model.
    P_dc = P_rated * (G / 1000) * [1 + gamma * (T_cell - 25)] * eta_module
    P_pv,available = min(P_dc * eta_inverter, P_inverter_max)
    """

    def __init__(
        self,
        installed_capacity_kw: float = 160.0,
        inverter_capacity_kw: float = 160.0,
        module_efficiency: float = 0.92,
        inverter_efficiency: float = 0.97,
        temp_coeff_pct_c: float = -0.40,
        stc_irradiance: float = 1000.0,
        stc_temperature: float = 25.0
    ):
        self.installed_capacity_kw = installed_capacity_kw
        self.inverter_capacity_kw = inverter_capacity_kw
        self.module_efficiency = module_efficiency
        self.inverter_efficiency = inverter_efficiency
        self.temp_coeff = temp_coeff_pct_c / 100.0  # convert % to fraction
        self.stc_irradiance = stc_irradiance
        self.stc_temperature = stc_temperature

        # Operating state
        self.fault_derate_pct = 0.0  # 0 to 100%
        self.curtailment_kw = 0.0
        self.is_available = True

    def reset_state(self):
        self.fault_derate_pct = 0.0
        self.curtailment_kw = 0.0
        self.is_available = True

    def compute_potential(
        self,
        irradiance_w_m2: float,
        cell_temp_c: float,
        derate_factor: float = 1.0,
        inverter_limit_kw: float = None,
    ) -> float:
        """Calculates theoretical AC generation potential after temperature and physical derates."""
        if irradiance_w_m2 <= 0.0 or not self.is_available:
            return 0.0
        temp_delta = cell_temp_c - self.stc_temperature
        thermal_derate = max(0.5, 1.0 + self.temp_coeff * temp_delta)
        g_ratio = max(0.0, irradiance_w_m2 / self.stc_irradiance)
        p_dc = self.installed_capacity_kw * g_ratio * thermal_derate * self.module_efficiency
        p_ac = p_dc * self.inverter_efficiency
        inv_cap = self.inverter_capacity_kw if inverter_limit_kw is None else min(self.inverter_capacity_kw, inverter_limit_kw)
        p_bounded = min(p_ac, inv_cap)
        return float(max(0.0, p_bounded * derate_factor))

    def calculate_output(
        self,
        irradiance_ghi: float,
        cell_temp_c: float,
        derate_multiplier: float = 1.0,
        inverter_capacity_kw: float = None,
    ):
        from dataclasses import dataclass

        @dataclass
        class SolarEval:
            potential_generation_kw: float

        pot = self.compute_potential(irradiance_ghi, cell_temp_c, derate_multiplier, inverter_capacity_kw)
        return SolarEval(potential_generation_kw=pot)

    def compute_generation(
        self,
        irradiance_w_m2: float,
        cell_temp_c: float,
        curtailment_request_kw: float = 0.0
    ) -> Dict[str, float]:
        """
        Calculate solar power for given environmental conditions.
        Returns:
            available_power_kw: Theoretical maximum generator output without curtailment or faults
            actual_power_kw: Actual power injected into AC microgrid bus
            curtailment_kw: Curtailed solar power
        """
        if irradiance_w_m2 <= 0.0 or not self.is_available:
            return {
                "available_power_kw": 0.0,
                "actual_power_kw": 0.0,
                "curtailment_kw": 0.0
            }

        # Temperature derating factor
        temp_delta = cell_temp_c - self.stc_temperature
        thermal_derate = max(0.5, 1.0 + self.temp_coeff * temp_delta)

        # DC power generation
        g_ratio = max(0.0, irradiance_w_m2 / self.stc_irradiance)
        p_dc = self.installed_capacity_kw * g_ratio * thermal_derate * self.module_efficiency

        # Inverter AC conversion and power capping
        p_ac_ideal = p_dc * self.inverter_efficiency
        available_power_kw = round(min(p_ac_ideal, self.inverter_capacity_kw), 3)

        # Apply fault derating if present (e.g. string open circuit, shading)
        fault_multiplier = max(0.0, 1.0 - (self.fault_derate_pct / 100.0))
        potential_after_fault = available_power_kw * fault_multiplier

        # Apply curtailment (bounded by available post-fault output)
        curtailment_kw = min(potential_after_fault, max(0.0, curtailment_request_kw))
        actual_power_kw = round(max(0.0, potential_after_fault - curtailment_kw), 3)
        curtailment_kw = round(available_power_kw - actual_power_kw if self.fault_derate_pct == 0.0 else curtailment_kw, 3)

        return {
            "available_power_kw": available_power_kw,
            "actual_power_kw": actual_power_kw,
            "curtailment_kw": max(0.0, curtailment_kw)
        }
