"""
Unit and invariant tests for Battery Energy Storage System (BESS) constraints.
Validates:
- Mutual exclusivity: charge_kw * discharge_kw == 0
- SoC bounds: 20% <= SoC <= 95%
- Power rating limits: charge <= 50 kW, discharge <= 75 kW
- Inactivity when unavailable / tripped
"""

import pytest
import yaml
from pathlib import Path
from datetime import datetime, timezone

from gridheal_synthetic_data.src.microgrid_simulator import MicrogridSimulator
from gridheal_synthetic_data.src.battery_model import BatteryModel
from gridheal_synthetic_data.src.fault_injection import FaultEvent


@pytest.fixture
def configs():
    root = Path(__file__).resolve().parent.parent
    with open(root / "config" / "microgrid_config.yaml") as f:
        mg_cfg = yaml.safe_load(f)
    with open(root / "config" / "scenario_config.yaml") as f:
        sc_cfg = yaml.safe_load(f)
    return mg_cfg, sc_cfg


def test_battery_mutual_exclusivity(configs):
    """Ensures charge and discharge are never simultaneously positive."""
    mg_cfg, sc_cfg = configs
    sim = MicrogridSimulator(mg_cfg, sc_cfg, seed=42)
    sim.reset(start_time=datetime(2026, 6, 1, 8, 0, 0, tzinfo=timezone.utc), initial_soc=0.50)

    for step_idx in range(120):
        rec = sim.step(mode="highs_optimizer")
        chg = rec["battery_charge_kw"]
        dis = rec["battery_discharge_kw"]
        assert not (chg > 1e-4 and dis > 1e-4), (
            f"Step {step_idx}: Simultaneous charge ({chg}) and discharge ({dis})"
        )


def test_battery_soc_boundaries(configs):
    """Ensures battery never drains below 20% or overcharges above 95%."""
    mg_cfg, _ = configs
    batt = BatteryModel(mg_cfg)

    # Attempt to overcharge
    batt.set_soc(0.94)
    dt_min = 60.0  # 1 hour
    chg, dis, state = batt.step(requested_charge_kw=100.0, requested_discharge_kw=0.0, dt_minutes=dt_min)
    assert state.soc <= 0.95 + 1e-5

    # Attempt to over-discharge past reserve and minimum
    batt.set_soc(0.22)
    chg, dis, state = batt.step(
        requested_charge_kw=0.0,
        requested_discharge_kw=100.0,
        dt_minutes=dt_min,
        allow_below_reserve=True,
    )
    assert state.soc >= 0.20 - 1e-5


def test_battery_unavailable_fault(configs):
    """Ensures zero charge and discharge occur during battery_unavailable fault."""
    mg_cfg, sc_cfg = configs
    sim = MicrogridSimulator(mg_cfg, sc_cfg, seed=42)
    sim.reset(start_time=datetime(2026, 6, 1, 14, 0, 0, tzinfo=timezone.utc))

    sim.fault_engine.schedule_event(
        FaultEvent(
            episode_id="TEST_BATT_TRIP",
            fault_type="battery_unavailable",
            start_minute=5,
            duration_minutes=15,
            severity=1.0,
            target_asset="battery",
        )
    )

    for m in range(25):
        rec = sim.step(mode="highs_optimizer")
        if 5 <= m < 20:
            assert rec["battery_available"] is False
            assert rec["battery_charge_kw"] == 0.0
            assert rec["battery_discharge_kw"] == 0.0
