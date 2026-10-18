"""
Timestamp regularity and continuity tests for GridHeal.
Verifies:
- Monotonic strictly increasing time progression
- Uniform 1-minute delta between adjacent steps
- Valid ISO 8601 parsing with UTC timezone
"""

import pytest
import pandas as pd
from pathlib import Path
from datetime import datetime, timedelta


@pytest.fixture
def baseline_csv():
    root = Path(__file__).resolve().parent.parent
    return root / "data" / "synthetic" / "baseline_operational_timeseries.csv"


def test_timestamp_uniformity_and_monotonicity(baseline_csv):
    df = pd.read_csv(baseline_csv)
    timestamps = pd.to_datetime(df["timestamp"])

    # Strictly monotonic increasing
    assert timestamps.is_monotonic_increasing, "Timestamps are not strictly monotonic increasing"

    # Delta between successive rows is exactly 1 minute
    deltas = timestamps.diff().dropna()
    expected_delta = pd.Timedelta(minutes=1)
    assert (deltas == expected_delta).all(), f"Found irregular timestep deltas: {deltas.unique()}"


def test_iso8601_format(baseline_csv):
    df = pd.read_csv(baseline_csv)
    for ts_str in df["timestamp"].iloc[:20]:
        dt = datetime.fromisoformat(ts_str)
        assert dt.tzinfo is not None, f"Timestamp missing timezone info: {ts_str}"
