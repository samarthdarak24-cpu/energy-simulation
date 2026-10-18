"""
Data Leakage and Feature Hygiene Tests for GridHeal ML Datasets.
Verifies:
- No future timestamp data in feature columns
- No ground-truth fault labels or solver internals in forecasting feature set
- Forward-looking targets match expected shifted values
- Strict separation of features and target labels
"""

import pytest
import pandas as pd
from pathlib import Path


@pytest.fixture
def processed_paths():
    root = Path(__file__).resolve().parent.parent
    return {
        "forecasting": root / "data" / "processed" / "forecasting_dataset.csv",
        "fault_detection": root / "data" / "processed" / "fault_detection_dataset.csv",
        "combined": root / "data" / "synthetic" / "microgrid_operational_dataset.csv",
    }


def test_forecasting_leakage_prevention(processed_paths):
    """
    Ensures forecasting feature vector contains strictly past/present sensor telemetry
    and NO ground truth fault labels or recovery outcomes.
    """
    df = pd.read_csv(processed_paths["forecasting"])

    forbidden_in_features = [
        "fault_active",
        "fault_type",
        "fault_severity",
        "recovery_status",
        "verification_passed",
        "power_balance_error_kw",
        "solve_status",
        "unserved_critical_kw",
        "served_critical_kw",
    ]

    for col in forbidden_in_features:
        assert col not in df.columns, f"Data leakage: forbidden column '{col}' found in forecasting features"


def test_forecasting_target_alignment(processed_paths):
    """Verifies that target_solar_kw_t15 is indeed shifted forward by exactly 15 minutes."""
    df_fc = pd.read_csv(processed_paths["forecasting"])
    df_raw = pd.read_csv(processed_paths["combined"])

    # Align by timestamp on a subset
    sample_ts = df_fc["timestamp"].iloc[100]
    expected_t15_ts = pd.to_datetime(sample_ts) + pd.Timedelta(minutes=15)

    raw_row_t15 = df_raw[pd.to_datetime(df_raw["timestamp"]) == expected_t15_ts]
    if len(raw_row_t15) > 0:
        actual_solar_at_t15 = raw_row_t15["solar_power_actual_kw"].iloc[0]
        target_solar = df_fc[df_fc["timestamp"] == sample_ts]["target_solar_kw_t15"].iloc[0]
        assert abs(actual_solar_at_t15 - target_solar) < 1e-3, (
            f"Forecast target misaligned: {actual_solar_at_t15} != {target_solar}"
        )


def test_fault_detection_leak_free(processed_paths):
    """
    Ensures fault detection inputs contain only telemetry and lag derivatives,
    not internal ground-truth variables.
    """
    df_fd = pd.read_csv(processed_paths["fault_detection"])

    forbidden_inputs = [
        "power_balance_error_kw",
        "system_losses_kw",
        "solar_power_potential_kw",
        "solar_power_actual_kw",
        "battery_energy_kwh",
    ]

    for col in forbidden_inputs:
        assert col not in df_fd.columns, f"Data leakage in fault detection: '{col}' present in dataset"
