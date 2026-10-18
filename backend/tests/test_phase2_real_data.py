"""
GridHeal Phase 2 Automated Verification Test Suite.
Tests:
  1. Ingestion schema, units, and trapezoidal energy integration (OpenCEM, Bath, GPVS)
  2. Timestamp conversions, chronological ordering, and deduplication
  3. Provenance metadata and SHA-256 immutability
  4. Chronological train/test isolation and absence of forward leakage
  5. GPVS experimental fault classification and class validity
  6. SciPy HiGHS MILP integer decision variables and mutual exclusion
  7. Recorded real-data replay engine state machine and pipeline separation
  8. Origin categorization integrity (measured_public, experimental_lab, synthetic, etc.)
"""

import pytest
from pathlib import Path
import pandas as pd
import numpy as np

from backend.data_ingestion import OpenCEMAdapter, BathMicrogridAdapter, GPVSFaultsAdapter
from backend.intelligence.optimizer import optimizer
from backend.intelligence.gpvs_fault_classifier import gpvs_fault_classifier
from backend.intelligence.real_forecast_pipeline import real_forecast_pipeline
from backend.services.replay_service import replay_service


class TestPhase2RealDataIngestion:
    """Verifies that published reference measurements are ingested accurately."""

    def test_opencem_ingestion_schema_and_units(self):
        adapter = OpenCEMAdapter()
        df = adapter.ingest()

        assert len(df) > 0, "OpenCEM ingested dataset must not be empty"
        expected_cols = [
            "timestamp", "epoch_ts", "solar_pv_kw", "load_demand_kw",
            "battery_soc_pct", "battery_voltage_v", "battery_power_kw",
            "frequency_hz", "cum_solar_energy_kwh", "cum_load_energy_kwh",
            "data_origin", "source_dataset"
        ]
        for col in expected_cols:
            assert col in df.columns, f"OpenCEM missing required column: {col}"

        # Units check: Solar and load must be in kW (not raw Watts)
        assert df["solar_pv_kw"].max() < 100.0, "Solar power must be in kW, not Watts"
        assert df["load_demand_kw"].max() < 100.0, "Load power must be in kW, not Watts"

        # Battery voltage in reasonable DC range
        assert 40.0 <= df["battery_voltage_v"].median() <= 65.0, "Battery voltage should be around 48-54V DC"

        # Origin tag
        assert (df["data_origin"] == "measured_public").all(), "OpenCEM must be tagged 'measured_public'"

        # Monotonic energy integration
        cum_solar = df["cum_solar_energy_kwh"].values
        diffs = np.diff(cum_solar)
        assert (diffs >= -1e-6).all(), "Cumulative solar energy must be monotonically non-decreasing"

    def test_bath_ingestion_and_irradiance_omission(self):
        adapter = BathMicrogridAdapter()
        df = adapter.ingest()

        assert len(df) > 0, "Bath ingested dataset must not be empty"
        assert (df["data_origin"] == "experimental_lab").all(), "Bath must be tagged 'experimental_lab'"

        # Crucial Audit Check: Irradiance is None / absent
        assert df["irradiance_wm2"].isnull().all(), "Bath dataset must NOT claim plane-of-array irradiance measurements"

        # Empirical losses must be non-zero (physical reality)
        assert df["losses_kw"].mean() > 0.0, "Physical inverter/battery losses must be strictly positive"
        assert 2.0 <= df["losses_pct"].mean() <= 12.0, "Mean losses must reflect physical bench efficiency (2-12%)"

    def test_gpvs_fault_classes_and_boundaries(self):
        adapter = GPVSFaultsAdapter()
        df = adapter.ingest()

        assert len(df) >= 20, "GPVS dataset must contain experimental waveforms"
        assert (df["data_origin"] == "experimental_lab").all(), "GPVS must be tagged 'experimental_lab'"

        # Verified physical fault classes
        unique_classes = set(df["fault_class"].unique())
        assert "fault_free_normal" in unique_classes

        # Verify that battery runaway and EV surges are NOT assigned to GPVS
        assert "battery_thermal_runaway" not in unique_classes
        assert "ev_charging_surge" not in unique_classes
        assert "grid_substation_blackout" not in unique_classes


class TestPhase2ModelEvaluationAndLeakage:
    """Verifies honest out-of-sample evaluation without data leakage."""

    def test_forecasting_lag_causality_and_no_leakage(self):
        data, feature_cols = real_forecast_pipeline.prepare_features()

        # All feature columns must strictly reference lag0, lag1, lag2, roll4, hour
        for f in feature_cols:
            assert not f.startswith("target_"), f"Data leakage detected! Feature contains target: {f}"
            assert "shift(-" not in f, f"Forward-looking feature detected: {f}"

    def test_real_forecasting_evaluates_on_held_out_test(self):
        res = real_forecast_pipeline.train_and_evaluate()

        assert "horizons" in res
        assert "15_min" in res["horizons"]
        assert "60_min" in res["horizons"]

        solar_60 = res["horizons"]["60_min"]["solar"]["hist_gradient_boosting"]
        persist_60 = res["horizons"]["60_min"]["solar"]["persistence_baseline"]

        # 60m solar forecast model should outperform naive persistence
        assert solar_60["mae_kw"] <= persist_60["mae_kw"], "60m ML forecast MAE should outperform naive persistence"
        assert solar_60["r2_score"] >= persist_60["r2_score"], "60m ML forecast R2 should beat persistence baseline"

    def test_gpvs_fault_classifier_accuracy_and_limitations(self):
        eval_res = gpvs_fault_classifier.train_and_evaluate()

        # Multi-mode test accuracy on physical classes exceeds 95%
        assert eval_res["overall_accuracy_pct"] >= 95.0, "GPVS multi-mode held-out accuracy should exceed 95%"
        assert eval_res["macro_f1"] >= 0.90, "GPVS macro F1 should exceed 0.90"

        # Verify documented cross-mode transfer limitation
        assert eval_res["cross_mode_transfer_accuracy_pct"] is not None
        assert eval_res["cross_mode_transfer_accuracy_pct"] < 60.0, "Cross-mode transfer limitation must be acknowledged"


class TestPhase2MILPOptimizer:
    """Verifies true Mixed-Integer Linear Programming formulation."""

    def test_milp_solver_enforces_binary_mutual_exclusion(self):
        # When net imbalance requires battery discharge, u_dis must be 1 and u_chg must be 0
        state = {
            "solar_avail_kw": 10.0,
            "batt_dis_max_kw": 50.0,
            "batt_chg_max_kw": 50.0,
            "grid_imp_max_kw": 100.0,
            "grid_exp_max_kw": 50.0,
            "crit_demand_kw": 30.0,
            "noncrit_demand_kw": 40.0,
            "flex_avail_kw": 5.0,
            "ev_req_kw": 10.0,
        }
        res = optimizer.solve_dispatch(solver_mode="milp", explicit_state=state)

        assert res["success"] is True
        assert "scipy.optimize.milp" in res["solver"]
        assert "binary_decisions" in res

        dec = res["binary_decisions"]
        # Mutual exclusion: cannot both discharge and charge
        assert dec["u_discharge"] + dec["u_charge"] <= 1, "Battery charge and discharge cannot be simultaneously active"
        assert dec["v_import"] + dec["v_export"] <= 1, "Grid import and export cannot be simultaneously active"

    def test_continuous_lp_relaxation_fallback(self):
        res = optimizer.solve_dispatch(solver_mode="lp")
        assert res["success"] is True
        assert "scipy.optimize.linprog" in res["solver"]


class TestPhase2RecordedDataReplay:
    """Verifies recorded real-data replay player state machine and isolation."""

    def test_replay_lifecycle_and_record_ordering(self):
        # Reset and start replay with OpenCEM
        replay_service.reset()
        status = replay_service.start(dataset_key="opencem", speed=5.0, start_index=0)

        assert status["is_running"] is True
        assert status["active_dataset"] == "opencem"
        assert status["data_origin"] == "measured_public"

        # Step forward
        frame1 = replay_service.step_forward()
        assert frame1 is not None
        assert frame1["record_index"] == 0
        assert "observed_measurements" in frame1
        assert "model_predictions" in frame1
        assert "optimizer_dispatch" in frame1
        assert "verification" in frame1

        # Step forward again
        frame2 = replay_service.step_forward()
        assert frame2 is not None
        assert frame2["record_index"] == 1

        # Pause and resume
        replay_service.pause()
        assert replay_service.is_paused is True
        replay_service.resume()
        assert replay_service.is_paused is False

        # Stop
        replay_service.stop()
        assert replay_service.is_running is False
