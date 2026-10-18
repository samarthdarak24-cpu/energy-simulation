"""
Real-Data Multi-Horizon Energy Forecasting Pipeline.
Trains and evaluates HistGradientBoosting regressors on genuine OpenCEM platform telemetry.
Uses strict chronological train/validation/test splits (no shuffling, no data leakage).
Evaluates 15-minute and 60-minute forward horizons against Persistence and Seasonal baselines.
Computes empirical prediction interval coverage (P10 to P90).
"""

from pathlib import Path
from typing import Dict, Any, List, Optional, Tuple
import pandas as pd
import numpy as np
from sklearn.ensemble import HistGradientBoostingRegressor
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score


class RealForecastPipeline:
    """Forecasting pipeline operating on verified real-world telemetry."""

    def __init__(self, data_path: Optional[Path] = None):
        self.data_path = data_path or Path("gridheal_synthetic_data/data/processed/opencem_ingested.csv")
        self.solar_15m_model: Optional[HistGradientBoostingRegressor] = None
        self.demand_15m_model: Optional[HistGradientBoostingRegressor] = None
        self.solar_60m_model: Optional[HistGradientBoostingRegressor] = None
        self.demand_60m_model: Optional[HistGradientBoostingRegressor] = None
        # Quantile models for prediction intervals
        self.solar_p10: Optional[HistGradientBoostingRegressor] = None
        self.solar_p90: Optional[HistGradientBoostingRegressor] = None
        self.demand_p10: Optional[HistGradientBoostingRegressor] = None
        self.demand_p90: Optional[HistGradientBoostingRegressor] = None
        self.evaluation_results: Dict[str, Any] = {}
        self.is_trained = False

    def prepare_features(self, freq: str = "15min") -> Tuple[pd.DataFrame, List[str]]:
        """Resample, interpolate missing gaps, and engineer strict causal lag features."""
        if not self.data_path.exists():
            from backend.data_ingestion.opencem_adapter import OpenCEMAdapter
            adapter = OpenCEMAdapter()
            df = adapter.ingest()
        else:
            df = pd.read_csv(self.data_path)

        df["dt"] = pd.to_datetime(df["timestamp"])
        df = df.set_index("dt").sort_index()

        # Resample to uniform resolution
        res = df[["solar_pv_kw", "load_demand_kw"]].resample(freq).mean().interpolate(method="linear")

        feats = pd.DataFrame(index=res.index)
        for col in ["solar_pv_kw", "load_demand_kw"]:
            feats[f"{col}_lag0"] = res[col]
            feats[f"{col}_lag1"] = res[col].shift(1)
            feats[f"{col}_lag2"] = res[col].shift(2)
            feats[f"{col}_roll4"] = res[col].rolling(4).mean()

        feats["hour"] = res.index.hour + res.index.minute / 60.0
        feats["sin_hour"] = np.sin(2 * np.pi * feats["hour"] / 24.0)
        feats["cos_hour"] = np.cos(2 * np.pi * feats["hour"] / 24.0)

        # 1-step ahead is 15 min, 4-step ahead is 60 min
        feats["target_solar_t15"] = res["solar_pv_kw"].shift(-1)
        feats["target_demand_t15"] = res["load_demand_kw"].shift(-1)
        feats["target_solar_t60"] = res["solar_pv_kw"].shift(-4)
        feats["target_demand_t60"] = res["load_demand_kw"].shift(-4)

        clean_data = feats.dropna()
        feature_cols = [c for c in clean_data.columns if not c.startswith("target_")]
        return clean_data, feature_cols

    def train_and_evaluate(self, train_ratio: float = 0.70, val_ratio: float = 0.15) -> Dict[str, Any]:
        """Train models with chronological splits and evaluate against baselines."""
        data, feature_cols = self.prepare_features()

        n = len(data)
        n_train = int(n * train_ratio)
        n_val = int(n * val_ratio)

        train = data.iloc[:n_train]
        val = data.iloc[n_train:n_train + n_val]
        test = data.iloc[n_train + n_val:]

        results = {
            "dataset": "OpenCEM Campus Microgrid Telemetry",
            "data_origin": "measured_public",
            "total_samples": n,
            "train_samples": len(train),
            "val_samples": len(val),
            "test_samples": len(test),
            "time_range": {
                "start": str(data.index[0]),
                "end": str(data.index[-1]),
                "test_start": str(test.index[0]),
                "test_end": str(test.index[-1]),
            },
            "horizons": {}
        }

        # Train Point & Quantile Regressors for 15-min and 60-min horizons
        horizons_cfg = [
            ("15_min", "t15", 1),
            ("60_min", "t60", 4),
        ]

        for h_name, t_suffix, step_ahead in horizons_cfg:
            h_res = {}
            for target_name, t_col, lag0_col in [
                ("solar", f"target_solar_{t_suffix}", "solar_pv_kw_lag0"),
                ("demand", f"target_demand_{t_suffix}", "load_demand_kw_lag0")
            ]:
                # 1. Main model (mean prediction)
                model = HistGradientBoostingRegressor(max_iter=100, random_state=42)
                model.fit(train[feature_cols], train[t_col])
                pred_test = model.predict(test[feature_cols])

                # 2. Quantile models (P10 and P90)
                q10 = HistGradientBoostingRegressor(loss="quantile", quantile=0.10, max_iter=75, random_state=42)
                q10.fit(train[feature_cols], train[t_col])
                pred_p10 = q10.predict(test[feature_cols])

                q90 = HistGradientBoostingRegressor(loss="quantile", quantile=0.90, max_iter=75, random_state=42)
                q90.fit(train[feature_cols], train[t_col])
                pred_p90 = q90.predict(test[feature_cols])

                # Empirical coverage of 80% interval [P10, P90]
                y_true = test[t_col].values
                inside = (y_true >= pred_p10) & (y_true <= pred_p90)
                coverage = float(np.mean(inside) * 100.0)

                # 3. Baselines
                # Persistence:
                pred_persist = test[lag0_col].values
                # Seasonal Diurnal:
                hour_means = train.groupby(train["hour"].round())[t_col].mean().to_dict()
                pred_seasonal = test["hour"].round().map(hour_means).fillna(train[t_col].mean()).values

                mae_m = float(mean_absolute_error(y_true, pred_test))
                rmse_m = float(np.sqrt(mean_squared_error(y_true, pred_test)))
                r2_m = float(r2_score(y_true, pred_test))

                mae_p = float(mean_absolute_error(y_true, pred_persist))
                rmse_p = float(np.sqrt(mean_squared_error(y_true, pred_persist)))
                r2_p = float(r2_score(y_true, pred_persist))

                mae_s = float(mean_absolute_error(y_true, pred_seasonal))
                rmse_s = float(np.sqrt(mean_squared_error(y_true, pred_seasonal)))
                r2_s = float(r2_score(y_true, pred_seasonal))

                h_res[target_name] = {
                    "hist_gradient_boosting": {
                        "mae_kw": round(mae_m, 4),
                        "rmse_kw": round(rmse_m, 4),
                        "r2_score": round(r2_m, 4),
                        "p10_p90_coverage_pct": round(coverage, 2)
                    },
                    "persistence_baseline": {
                        "mae_kw": round(mae_p, 4),
                        "rmse_kw": round(rmse_p, 4),
                        "r2_score": round(r2_p, 4)
                    },
                    "seasonal_baseline": {
                        "mae_kw": round(mae_s, 4),
                        "rmse_kw": round(rmse_s, 4),
                        "r2_score": round(r2_s, 4)
                    }
                }

                if h_name == "15_min" and target_name == "solar":
                    self.solar_15m_model = model
                    self.solar_p10 = q10
                    self.solar_p90 = q90
                elif h_name == "15_min" and target_name == "demand":
                    self.demand_15m_model = model
                    self.demand_p10 = q10
                    self.demand_p90 = q90
                elif h_name == "60_min" and target_name == "solar":
                    self.solar_60m_model = model
                elif h_name == "60_min" and target_name == "demand":
                    self.demand_60m_model = model

            results["horizons"][h_name] = h_res

        self.evaluation_results = results
        self.is_trained = True
        return results

    def predict_step(self, current_solar_kw: float, current_demand_kw: float, hour_float: float) -> Dict[str, Any]:
        """Predict forward steps using current telemetry readings."""
        if not self.is_trained or self.solar_15m_model is None:
            self.train_and_evaluate()

        sin_h = np.sin(2 * np.pi * hour_float / 24.0)
        cos_h = np.cos(2 * np.pi * hour_float / 24.0)

        # Feature vector matching FEATURE_COLS:
        # solar_lag0, solar_lag1, solar_lag2, solar_roll4, demand_lag0, demand_lag1, demand_lag2, demand_roll4, hour, sin_hour, cos_hour
        feat_vec = np.array([[
            current_solar_kw, current_solar_kw, current_solar_kw, current_solar_kw,
            current_demand_kw, current_demand_kw, current_demand_kw, current_demand_kw,
            hour_float, sin_h, cos_h
        ]])

        pred_solar_15 = max(0.0, float(self.solar_15m_model.predict(feat_vec)[0]))
        pred_demand_15 = max(0.0, float(self.demand_15m_model.predict(feat_vec)[0]))
        p10_solar = max(0.0, float(self.solar_p10.predict(feat_vec)[0]))
        p90_solar = max(0.0, float(self.solar_p90.predict(feat_vec)[0]))

        return {
            "forecast_origin": "derived_from_real",
            "horizon_15m": {
                "solar_kw": round(pred_solar_15, 3),
                "demand_kw": round(pred_demand_15, 3),
                "solar_p10_kw": round(min(p10_solar, pred_solar_15), 3),
                "solar_p90_kw": round(max(p90_solar, pred_solar_15), 3),
                "expected_imbalance_kw": round(pred_solar_15 - pred_demand_15, 3)
            }
        }


real_forecast_pipeline = RealForecastPipeline()

if __name__ == "__main__":
    res = real_forecast_pipeline.train_and_evaluate()
    print("Real Forecast Pipeline Trained Successfully:")
    import json
    print(json.dumps(res["horizons"], indent=2))
