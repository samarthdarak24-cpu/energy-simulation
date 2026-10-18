"""
Multi-horizon forecasting target builder for GridHeal.
Computes forward-looking physical generation and load targets:
- t + 15 min (15 steps ahead)
- t + 30 min (30 steps ahead)
- t + 60 min (60 steps ahead)
Enforces strict prevention of data leakage: targets are forward-shifted ground-truth,
while feature vectors include only past/present sensor telemetry.
"""

from typing import List, Dict, Any
import pandas as pd
import numpy as np


def add_forecasting_targets(
    df: pd.DataFrame,
    horizons_minutes: List[int] = [15, 30, 60],
) -> pd.DataFrame:
    """
    Appends forward-looking forecasting targets to an operational timeseries.
    Assumes df is ordered by timestamp at 1-minute resolution.
    Target columns added:
      - target_solar_kw_t15, target_solar_kw_t30, target_solar_kw_t60
      - target_demand_kw_t15, target_demand_kw_t30, target_demand_kw_t60
      - target_net_load_kw_t15, target_net_load_kw_t30, target_net_load_kw_t60
    """
    df = df.copy()

    for h in horizons_minutes:
        shift_steps = -h  # Shift backwards so row t has value at t + h

        # Physical solar target (ground truth potential or actual)
        df[f"target_solar_kw_t{h}"] = df["solar_power_actual_kw"].shift(shift_steps)

        # Physical total demand target
        df[f"target_demand_kw_t{h}"] = df["total_demand_kw"].shift(shift_steps)

        # Net load target = Demand - Solar
        df[f"target_net_load_kw_t{h}"] = (
            df[f"target_demand_kw_t{h}"] - df[f"target_solar_kw_t{h}"]
        )

    return df


def extract_forecasting_features(
    df: pd.DataFrame,
    lags_minutes: List[int] = [1, 5, 15, 30, 60],
) -> pd.DataFrame:
    """
    Constructs leak-free feature vectors using ONLY historical sensor measurements and time features.
    Strictly excludes:
      - Ground-truth fault labels (fault_active, fault_type, fault_severity)
      - Solver internal variables (power_balance_error_kw, solve_status)
      - Post-dispatch recovery allocations (served/unserved loads, optimizer decisions)
    """
    df_feat = pd.DataFrame(index=df.index)
    df_feat["timestamp"] = df["timestamp"]

    # Parse datetime features
    dt_series = pd.to_datetime(df["timestamp"])
    df_feat["hour_of_day"] = dt_series.dt.hour + dt_series.dt.minute / 60.0
    df_feat["day_of_week"] = dt_series.dt.dayofweek
    df_feat["is_weekend"] = (df_feat["day_of_week"] >= 5).astype(int)
    df_feat["day_of_year"] = dt_series.dt.dayofyear

    # Cyclical hour encodings
    df_feat["sin_hour"] = np.sin(2 * np.pi * df_feat["hour_of_day"] / 24.0)
    df_feat["cos_hour"] = np.cos(2 * np.pi * df_feat["hour_of_day"] / 24.0)

    # Current sensor telemetry
    df_feat["sensor_irradiance_wm2"] = df["sensor_irradiance_wm2"]
    df_feat["sensor_solar_kw"] = df["sensor_solar_kw"]
    df_feat["sensor_total_demand_kw"] = df["sensor_total_demand_kw"]
    df_feat["sensor_battery_soc"] = df["sensor_battery_soc"]
    df_feat["ambient_temperature_c"] = df["ambient_temperature_c"]

    # Historical lag features
    for lag in lags_minutes:
        df_feat[f"solar_kw_lag_{lag}m"] = df["sensor_solar_kw"].shift(lag)
        df_feat[f"demand_kw_lag_{lag}m"] = df["sensor_total_demand_kw"].shift(lag)
        df_feat[f"irradiance_lag_{lag}m"] = df["sensor_irradiance_wm2"].shift(lag)

    # Rolling statistics over past 15 and 60 minutes
    df_feat["solar_rolling_mean_15m"] = df["sensor_solar_kw"].rolling(15).mean()
    df_feat["solar_rolling_std_15m"] = df["sensor_solar_kw"].rolling(15).std().fillna(0.0)
    df_feat["demand_rolling_mean_15m"] = df["sensor_total_demand_kw"].rolling(15).mean()
    df_feat["demand_rolling_mean_60m"] = df["sensor_total_demand_kw"].rolling(60).mean()

    return df_feat
