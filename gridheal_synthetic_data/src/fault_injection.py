"""
Fault scenario generator and injection engine for GridHeal microgrid.
Implements 9 distinct, physics-grounded fault types with clean separation
between ground-truth physical state and corrupted sensor observations.
"""

from dataclasses import dataclass, field
from typing import Dict, Any, List, Optional
import numpy as np


@dataclass
class FaultEvent:
    episode_id: str
    fault_type: str
    start_minute: int
    duration_minutes: int
    severity: float  # 0.0 to 1.0
    target_asset: str
    parameters: Dict[str, Any] = field(default_factory=dict)
    description: str = ""

    @property
    def end_minute(self) -> int:
        return self.start_minute + self.duration_minutes

    def is_active(self, current_minute: int) -> bool:
        return self.start_minute <= current_minute < self.end_minute


@dataclass
class FaultState:
    active_faults: List[str] = field(default_factory=list)
    solar_derate_factor: float = 1.0  # Physical solar generation multiplier
    inverter_capacity_override_kw: Optional[float] = None
    grid_available: bool = True
    battery_available: bool = True
    battery_reserve_override: bool = False
    demand_spike_kw: float = 0.0
    sensor_irradiance_bias_wm2: float = 0.0
    sensor_power_bias_kw: float = 0.0
    sensor_stuck: bool = False
    stuck_solar_reading_kw: Optional[float] = None


class FaultInjectionEngine:
    """
    Manages active faults and applies their physical and sensor impacts at each timestep.
    """

    SUPPORTED_FAULTS = [
        "solar_drop",
        "solar_degradation",
        "grid_outage",
        "demand_spike",
        "battery_unavailable",
        "battery_reserve_limit",
        "sensor_anomaly",
        "inverter_anomaly",
        "compound_event",
    ]

    def __init__(self, scenario_config: Dict[str, Any]):
        self.config = scenario_config
        self.fault_catalog = scenario_config.get("fault_scenarios", {})
        self.scheduled_events: List[FaultEvent] = []

    def schedule_event(self, event: FaultEvent) -> None:
        self.scheduled_events.append(event)

    def clear_schedule(self) -> None:
        self.scheduled_events.clear()

    def generate_random_fault(
        self,
        fault_type: str,
        start_minute: int,
        episode_idx: int,
        rng: np.random.Generator,
    ) -> FaultEvent:
        """
        Creates a randomized fault event conforming to scenario_config ranges.
        """
        if fault_type not in self.SUPPORTED_FAULTS:
            raise ValueError(f"Unknown fault type: {fault_type}")

        cfg = self.fault_catalog.get(fault_type, {})
        dur_range = cfg.get("duration_minutes_range", [15, 60])
        sev_range = cfg.get("severity_range", [0.5, 0.9])

        duration = int(rng.integers(dur_range[0], dur_range[1] + 1))
        severity = float(rng.uniform(sev_range[0], sev_range[1]))
        episode_id = f"EP_{fault_type.upper()}_{episode_idx:03d}"

        params: Dict[str, Any] = {}
        target = "system"
        desc = ""

        if fault_type == "solar_drop":
            target = "pv"
            params["solar_reduction_factor"] = severity  # drop by this fraction
            desc = f"Rapid cloud shadow reducing solar generation by {severity*100:.1f}%"

        elif fault_type == "solar_degradation":
            target = "pv"
            params["soiling_derate"] = 0.20 + 0.30 * severity
            desc = f"Severe panel soiling/dust accumulation causing {params['soiling_derate']*100:.1f}% loss"

        elif fault_type == "grid_outage":
            target = "grid"
            desc = "External utility distribution feeder trip; microgrid forced to island"

        elif fault_type == "demand_spike":
            target = "load"
            spike_kw = float(rng.uniform(30.0, 75.0) * severity)
            params["spike_kw"] = spike_kw
            desc = f"Unscheduled commercial machinery or EV charging cluster spike of +{spike_kw:.1f} kW"

        elif fault_type == "battery_unavailable":
            target = "battery"
            desc = "Battery Energy Storage BMS trip; main DC contactor opened"

        elif fault_type == "battery_reserve_limit":
            target = "battery"
            params["enforce_strict_reserve"] = True
            desc = "Battery reached 30% reserve boundary; discharge prohibited for non-critical loads"

        elif fault_type == "sensor_anomaly":
            target = "sensor"
            sub_type = rng.choice(["bias", "noise", "stuck"])
            params["sub_type"] = sub_type
            if sub_type == "bias":
                params["bias_kw"] = float(rng.choice([-35.0, 45.0]))
            elif sub_type == "stuck":
                params["stuck_solar_kw"] = float(rng.uniform(20.0, 80.0))
            else:
                params["noise_std_kw"] = 15.0
            desc = f"Sensor calibration failure: {sub_type} mode affecting solar telemetry"

        elif fault_type == "inverter_anomaly":
            target = "inverter"
            max_limit_kw = float(160.0 * (1.0 - severity * 0.75))  # derate from 160 kW down to e.g. 40 kW
            params["inverter_limit_kw"] = max_limit_kw
            desc = f"Inverter thermal throttling limiting AC export/output to {max_limit_kw:.1f} kW"

        elif fault_type == "compound_event":
            target = "compound"
            # Simultaneous grid outage + solar drop
            params["grid_outage"] = True
            params["solar_reduction_factor"] = 0.70 * severity
            desc = f"Compound crisis: Utility grid outage combined with sudden {params['solar_reduction_factor']*100:.1f}% solar reduction"

        return FaultEvent(
            episode_id=episode_id,
            fault_type=fault_type,
            start_minute=start_minute,
            duration_minutes=duration,
            severity=severity,
            target_asset=target,
            parameters=params,
            description=desc,
        )

    def evaluate_timestep(self, minute: int) -> FaultState:
        """
        Determines the cumulative active fault state at the given minute.
        """
        state = FaultState()

        for event in self.scheduled_events:
            if not event.is_active(minute):
                continue

            state.active_faults.append(event.fault_type)

            if event.fault_type == "solar_drop":
                factor = 1.0 - event.parameters.get("solar_reduction_factor", event.severity)
                state.solar_derate_factor = min(state.solar_derate_factor, max(0.05, factor))

            elif event.fault_type == "solar_degradation":
                derate = event.parameters.get("soiling_derate", 0.35)
                state.solar_derate_factor = min(state.solar_derate_factor, max(0.1, 1.0 - derate))

            elif event.fault_type == "grid_outage":
                state.grid_available = False

            elif event.fault_type == "demand_spike":
                state.demand_spike_kw += event.parameters.get("spike_kw", 40.0)

            elif event.fault_type == "battery_unavailable":
                state.battery_available = False

            elif event.fault_type == "battery_reserve_limit":
                state.battery_reserve_override = True

            elif event.fault_type == "sensor_anomaly":
                sub_type = event.parameters.get("sub_type", "bias")
                if sub_type == "bias":
                    state.sensor_power_bias_kw += event.parameters.get("bias_kw", 30.0)
                elif sub_type == "stuck":
                    state.sensor_stuck = True
                    state.stuck_solar_reading_kw = event.parameters.get("stuck_solar_kw", 50.0)
                elif sub_type == "noise":
                    # Gaussian noise sample
                    noise = np.random.normal(0, event.parameters.get("noise_std_kw", 10.0))
                    state.sensor_power_bias_kw += noise

            elif event.fault_type == "inverter_anomaly":
                inv_limit = event.parameters.get("inverter_limit_kw", 50.0)
                if state.inverter_capacity_override_kw is None:
                    state.inverter_capacity_override_kw = inv_limit
                else:
                    state.inverter_capacity_override_kw = min(state.inverter_capacity_override_kw, inv_limit)

            elif event.fault_type == "compound_event":
                if event.parameters.get("grid_outage", True):
                    state.grid_available = False
                sol_drop = event.parameters.get("solar_reduction_factor", 0.6)
                state.solar_derate_factor = min(state.solar_derate_factor, max(0.05, 1.0 - sol_drop))

        return state
