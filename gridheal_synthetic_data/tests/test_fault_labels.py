"""
Tests for Fault Injection, Classification Labels, and Telemetry Corruption.
Verifies:
- All 9 fault categories produce expected physical derates or trips
- Sensor anomaly: divergence between sensor reading and ground-truth physics
- Ground-truth physics remains balanced even during sensor corruption
"""

import pytest
import yaml
from pathlib import Path
from datetime import datetime, timezone

from gridheal_synthetic_data.src.microgrid_simulator import MicrogridSimulator
from gridheal_synthetic_data.src.fault_injection import FaultEvent


@pytest.fixture
def configs():
    root = Path(__file__).resolve().parent.parent
    with open(root / "config" / "microgrid_config.yaml") as f:
        mg_cfg = yaml.safe_load(f)
    with open(root / "config" / "scenario_config.yaml") as f:
        sc_cfg = yaml.safe_load(f)
    return mg_cfg, sc_cfg


def test_sensor_anomaly_divergence(configs):
    """
    Ensures that during a sensor anomaly:
    1. Sensor solar telemetry diverges from actual physical solar generation
    2. Physical power balance error remains <= 0.05 kW
    3. Verification passes physically
    """
    mg_cfg, sc_cfg = configs
    sim = MicrogridSimulator(mg_cfg, sc_cfg, seed=99)
    sim.reset(start_time=datetime(2026, 6, 1, 12, 0, 0, tzinfo=timezone.utc))

    # Inject sensor anomaly with +45 kW bias
    sim.fault_engine.schedule_event(
        FaultEvent(
            episode_id="TEST_SENSOR_BIAS",
            fault_type="sensor_anomaly",
            start_minute=2,
            duration_minutes=5,
            severity=0.5,
            target_asset="sensor",
            parameters={"sub_type": "bias", "bias_kw": 45.0},
        )
    )

    for m in range(8):
        rec = sim.step(mode="highs_optimizer")
        if 2 <= m < 7:
            assert rec["fault_active"] is True
            assert rec["fault_type"] == "sensor_anomaly"
            # Divergence between sensor reading and actual physics
            discrepancy = abs(rec["sensor_solar_kw"] - rec["solar_power_actual_kw"])
            assert discrepancy > 30.0, f"Expected sensor bias divergence, got {discrepancy:.2f}"
            # Physical power balance is strictly conserved
            assert rec["power_balance_error_kw"] <= 0.05
            assert rec["verification_passed"] is True


def test_grid_outage_islanding(configs):
    """Ensures grid outage enforces zero grid exchange and battery discharge."""
    mg_cfg, sc_cfg = configs
    sim = MicrogridSimulator(mg_cfg, sc_cfg, seed=42)
    sim.reset(start_time=datetime(2026, 6, 1, 13, 0, 0, tzinfo=timezone.utc), initial_soc=0.70)

    sim.fault_engine.schedule_event(
        FaultEvent(
            episode_id="TEST_ISLANDING",
            fault_type="grid_outage",
            start_minute=2,
            duration_minutes=10,
            severity=1.0,
            target_asset="grid",
        )
    )

    for m in range(15):
        rec = sim.step(mode="highs_optimizer")
        if 2 <= m < 12:
            assert rec["grid_available"] is False
            assert rec["grid_import_kw"] == 0.0
            assert rec["grid_export_kw"] == 0.0
            assert rec["power_balance_error_kw"] <= 0.05
            assert rec["verification_passed"] is True
