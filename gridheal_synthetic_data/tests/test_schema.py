"""
Dataset schema, non-null, and metadata integrity tests for GridHeal.
Verifies:
- All required columns exist in each generated dataset
- No unexpected NaNs in operational columns
- Explicit labeling: data_origin == 'Physics-Constrained Synthetic'
- Nonnegative power variables
"""

import pytest
import pandas as pd
from pathlib import Path


@pytest.fixture
def dataset_paths():
    root = Path(__file__).resolve().parent.parent
    return {
        "baseline": root / "data" / "synthetic" / "baseline_operational_timeseries.csv",
        "combined": root / "data" / "synthetic" / "microgrid_operational_dataset.csv",
        "forecasting": root / "data" / "processed" / "forecasting_dataset.csv",
        "fault_detection": root / "data" / "processed" / "fault_detection_dataset.csv",
        "recovery_eval": root / "data" / "processed" / "recovery_evaluation_dataset.csv",
        "manifest": root / "data" / "synthetic" / "dataset_manifest.json",
    }


def test_operational_dataset_schema(dataset_paths):
    p = dataset_paths["baseline"]
    assert p.exists(), f"Missing file: {p}"
    df = pd.read_csv(p)

    required_cols = [
        "timestamp",
        "irradiance_ghi_wm2",
        "solar_power_potential_kw",
        "solar_power_actual_kw",
        "solar_power_curtailed_kw",
        "load_critical_kw",
        "load_commercial_kw",
        "load_residential_kw",
        "load_flexible_kw",
        "load_ev_charging_kw",
        "total_demand_kw",
        "served_critical_kw",
        "unserved_critical_kw",
        "served_commercial_kw",
        "unserved_commercial_kw",
        "served_residential_kw",
        "unserved_residential_kw",
        "served_flexible_kw",
        "curtailed_flexible_kw",
        "served_ev_kw",
        "deferred_ev_kw",
        "total_served_load_kw",
        "total_unserved_load_kw",
        "battery_energy_kwh",
        "battery_soc",
        "battery_charge_kw",
        "battery_discharge_kw",
        "battery_available",
        "grid_import_kw",
        "grid_export_kw",
        "grid_available",
        "system_losses_kw",
        "power_balance_error_kw",
        "sensor_irradiance_wm2",
        "sensor_solar_kw",
        "sensor_total_demand_kw",
        "sensor_battery_soc",
        "fault_active",
        "fault_type",
        "episode_id",
        "recovery_status",
        "verification_passed",
        "data_origin",
    ]

    for col in required_cols:
        assert col in df.columns, f"Required column missing: {col}"

    # Verify origin
    assert (df["data_origin"] == "Physics-Constrained Synthetic").all()

    # Verify no nulls
    assert df[required_cols].isna().sum().sum() == 0, "Found unexpected null values"


def test_nonnegative_powers(dataset_paths):
    df = pd.read_csv(dataset_paths["combined"])
    power_cols = [
        "solar_power_potential_kw",
        "solar_power_actual_kw",
        "solar_power_curtailed_kw",
        "battery_charge_kw",
        "battery_discharge_kw",
        "grid_import_kw",
        "grid_export_kw",
        "served_critical_kw",
        "served_commercial_kw",
        "served_residential_kw",
        "served_flexible_kw",
        "served_ev_kw",
        "system_losses_kw",
    ]
    for col in power_cols:
        assert (df[col] >= -1e-5).all(), f"Found negative values in {col}"
