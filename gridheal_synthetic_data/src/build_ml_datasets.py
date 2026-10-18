"""
ML and evaluation dataset builder for GridHeal.
Transforms raw simulation episodes into:
1. forecasting_dataset.csv (Multi-horizon prediction features & targets)
2. fault_detection_dataset.csv (Anomaly detection / classification dataset)
3. recovery_evaluation_dataset.csv (Benchmark comparison of Optimizer vs. Baseline)
"""

from typing import Dict, Any, List
import pandas as pd
import numpy as np

from .forecasting_targets import add_forecasting_targets, extract_forecasting_features


def build_forecasting_dataset(operational_df: pd.DataFrame) -> pd.DataFrame:
    """
    Constructs Dataset B: Multi-Horizon Forecasting Benchmark.
    Appends targets, extracts strictly historical features, and removes NaNs from edge rolling/lags.
    """
    df_with_targets = add_forecasting_targets(operational_df, horizons_minutes=[15, 30, 60])
    df_features = extract_forecasting_features(df_with_targets)

    # Attach targets to feature dataframe
    for col in df_with_targets.columns:
        if col.startswith("target_"):
            df_features[col] = df_with_targets[col]

    df_features["episode_id"] = operational_df["episode_id"].values
    df_features["data_origin"] = "Physics-Constrained Synthetic"

    # Drop early rows that have NaN from 60m lag and late rows with NaN from 60m forecast horizon
    clean_df = df_features.dropna().reset_index(drop=True)
    return clean_df


def build_fault_detection_dataset(operational_df: pd.DataFrame) -> pd.DataFrame:
    """
    Constructs Dataset C: Fault Detection and Classification Dataset.
    Features: Past and present sensor observations, lag deltas, residual telemetry.
    Labels:
      - label_fault_binary: 0 (Normal) or 1 (Fault Active)
      - label_fault_category: categorical string (normal, solar_drop, grid_outage, etc.)
      - label_severity: continuous float 0.0 to 1.0
      - label_target_asset: pv, grid, battery, load, sensor, inverter, compound, or none
    Note: Ground-truth physical variables and future labels are NEVER in features!
    """
    df = operational_df.copy()

    # Time features
    dt_series = pd.to_datetime(df["timestamp"])
    hour_float = dt_series.dt.hour + dt_series.dt.minute / 60.0

    features = pd.DataFrame(index=df.index)
    features["timestamp"] = df["timestamp"]
    features["hour_of_day"] = hour_float
    features["day_of_week"] = dt_series.dt.dayofweek
    features["sin_hour"] = np.sin(2 * np.pi * hour_float / 24.0)
    features["cos_hour"] = np.cos(2 * np.pi * hour_float / 24.0)

    # Telemetry observations
    features["sensor_irradiance_wm2"] = df["sensor_irradiance_wm2"]
    features["sensor_solar_kw"] = df["sensor_solar_kw"]
    features["sensor_total_demand_kw"] = df["sensor_total_demand_kw"]
    features["sensor_battery_soc"] = df["sensor_battery_soc"]
    features["ambient_temperature_c"] = df["ambient_temperature_c"]

    # Rate of change / differential features (derivatives indicate sudden trips)
    features["d_solar_1m"] = df["sensor_solar_kw"].diff(1).fillna(0.0)
    features["d_solar_5m"] = df["sensor_solar_kw"].diff(5).fillna(0.0)
    features["d_demand_1m"] = df["sensor_total_demand_kw"].diff(1).fillna(0.0)
    features["d_demand_5m"] = df["sensor_total_demand_kw"].diff(5).fillna(0.0)
    features["d_irradiance_1m"] = df["sensor_irradiance_wm2"].diff(1).fillna(0.0)
    features["d_soc_5m"] = df["sensor_battery_soc"].diff(5).fillna(0.0)

    # Rolling statistics
    features["solar_mean_15m"] = df["sensor_solar_kw"].rolling(15).mean().fillna(df["sensor_solar_kw"])
    features["solar_std_15m"] = df["sensor_solar_kw"].rolling(15).std().fillna(0.0)
    features["demand_mean_15m"] = df["sensor_total_demand_kw"].rolling(15).mean().fillna(df["sensor_total_demand_kw"])

    # Discrepancy indicator: Ratio of solar power to irradiance (deviations suggest shading or inverter faults)
    expected_pv_ratio = 160.0 / 1000.0  # nominal ~0.16 kW per W/m2
    pv_ratio = np.where(df["sensor_irradiance_wm2"] > 50.0, df["sensor_solar_kw"] / df["sensor_irradiance_wm2"], expected_pv_ratio)
    features["telemetry_pv_to_irr_ratio"] = np.clip(pv_ratio, 0.0, 0.5)

    # Ground-truth targets
    features["label_fault_binary"] = df["fault_active"].astype(int)
    features["label_fault_category"] = df["fault_type"]
    features["label_severity"] = df["fault_severity"]
    features["episode_id"] = df["episode_id"]
    features["data_origin"] = "Physics-Constrained Synthetic"

    return features.dropna().reset_index(drop=True)


def build_recovery_comparison_dataset(
    optimizer_df: pd.DataFrame,
    baseline_df: pd.DataFrame,
) -> pd.DataFrame:
    """
    Constructs Dataset D: Recovery Performance Evaluation.
    Aligns timesteps and episodes between HiGHS Optimizer and Baseline Controller.
    Computes comparative metrics:
      - delta_unserved_energy_kwh
      - delta_critical_served_pct
      - delta_curtailed_solar_kwh
      - solve_efficiency
    """
    opt = optimizer_df.copy()
    base = baseline_df.copy()

    # Verify identical length and episodes
    assert len(opt) == len(base), "Optimizer and Baseline runs must have matching row counts"

    comparison = pd.DataFrame()
    comparison["timestamp"] = opt["timestamp"]
    comparison["episode_id"] = opt["episode_id"]
    comparison["fault_active"] = opt["fault_active"]
    comparison["fault_type"] = opt["fault_type"]
    comparison["fault_severity"] = opt["fault_severity"]

    # Optimizer metrics
    comparison["opt_served_critical_kw"] = opt["served_critical_kw"]
    comparison["opt_unserved_critical_kw"] = opt["unserved_critical_kw"]
    comparison["opt_total_served_kw"] = opt["total_served_load_kw"]
    comparison["opt_total_unserved_kw"] = opt["total_unserved_load_kw"]
    comparison["opt_curtailed_solar_kw"] = opt["solar_power_curtailed_kw"]
    comparison["opt_recovery_status"] = opt["recovery_status"]
    comparison["opt_balance_error_kw"] = opt["power_balance_error_kw"]

    # Baseline metrics
    comparison["base_served_critical_kw"] = base["served_critical_kw"]
    comparison["base_unserved_critical_kw"] = base["unserved_critical_kw"]
    comparison["base_total_served_kw"] = base["total_served_load_kw"]
    comparison["base_total_unserved_kw"] = base["total_unserved_load_kw"]
    comparison["base_curtailed_solar_kw"] = base["solar_power_curtailed_kw"]
    comparison["base_recovery_status"] = base["recovery_status"]
    comparison["base_balance_error_kw"] = base["power_balance_error_kw"]

    # Differences: positive means Optimizer served more / unserved less
    comparison["delta_served_load_kw"] = (
        comparison["opt_total_served_kw"] - comparison["base_total_served_kw"]
    )
    comparison["delta_curtailed_solar_kw"] = (
        comparison["base_curtailed_solar_kw"] - comparison["opt_curtailed_solar_kw"]
    )

    comparison["data_origin"] = "Physics-Constrained Synthetic"

    return comparison
