import pytest
from fastapi.testclient import TestClient
from backend.main import app


def test_complete_hackathon_end_to_end_demonstration():
    """
    Executes the exact 13-step hackathon workflow specified in Part 15:
    Step 1: Start Normal Simulation
    Step 2: Inject Solar Fault (60% severity, 120 min duration)
    Step 3: Backend Applies Fault to Solar Model
    Step 4: Overview Updates (Solar Generation decreases)
    Step 5: Digital Twin Updates (Solar node degraded, power flows rerouted)
    Step 6: Forecasting Runs (Estimates solar shortage & net deficit)
    Step 7: Recovery Optimization (HiGHS solver calculates optimal reallocation)
    Step 8: Action Execution (Dispatches battery, grid, EV deferral)
    Step 9: Verification (Independently verifies power balance & critical protection)
    Step 10: Recovery Result (Outcome: Verified / Partially Recovered)
    Step 11: Audit Logs (Records FAULT_INJECTED, FAULT_DETECTED, VERIFICATION_COMPLETED)
    Step 12: Benchmark (Executes 3-controller comparison under identical disturbance)
    Step 13: Report (Validates benchmark results and exports audit CSV)
    """
    with TestClient(app) as client:
        # Step 1 — Start Normal Simulation
        ctrl_res = client.post("/api/simulation/control", json={"action": "start"})
        assert ctrl_res.status_code == 200
        assert ctrl_res.json()["is_running"] is True

        init_tel_res = client.get("/api/simulation/telemetry")
        assert init_tel_res.status_code == 200
        init_tel = init_tel_res.json()
        baseline_solar = init_tel["solarGeneration"]
        assert baseline_solar > 80.0
        assert init_tel["criticalLoadsServed"] == 100.0

        # Step 2 & 3 — Inject Solar Fault (60% severity)
        fault_res = client.post("/api/faults/inject", json={
            "scenarioId": "solar_drop",
            "severity": 60.0,
            "durationHours": 2.0,
            "autoRecovery": False
        })
        assert fault_res.status_code == 200
        fault_data = fault_res.json()
        assert fault_data["active"] is True
        assert fault_data["severityPct"] == 60.0

        # Step 4 — Overview Updates
        post_fault_tel_res = client.get("/api/simulation/telemetry")
        post_fault_tel = post_fault_tel_res.json()
        assert post_fault_tel["solarGeneration"] < baseline_solar
        assert post_fault_tel["solarGeneration"] == round(baseline_solar * 0.4, 1) or post_fault_tel["solarGeneration"] < baseline_solar * 0.5

        # Step 5 — Digital Twin Updates
        twin_res = client.get("/api/twin/topology")
        assert twin_res.status_code == 200
        twin_data = twin_res.json()
        solar_asset = next(a for a in twin_data["assets"] if a["id"] == "solar_pv")
        assert solar_asset["status"] in ("Degraded", "Faulted")
        assert solar_asset["isHealthy"] is False

        # Step 6 — Forecasting Runs
        forecast_res = client.post("/api/forecast/run", json={
            "model": "Ensemble Predictive",
            "horizonMinutes": 60
        })
        assert forecast_res.status_code == 200
        forecast_data = forecast_res.json()
        assert len(forecast_data["points"]) >= 4
        assert forecast_data["maeSolar"] >= 0.0
        assert len(forecast_data["insights"]) >= 2

        # Step 7, 8, 9, 10 — Recovery Optimization, Action Execution, Verification
        recovery_res = client.post("/api/recovery/trigger")
        assert recovery_res.status_code == 200
        rec_data = recovery_res.json()

        assert rec_data["currentStage"] == "VERIFY"
        assert len(rec_data["pipelineSteps"]) == 4
        assert rec_data["pipelineSteps"][0]["id"] == "DETECT"
        assert rec_data["pipelineSteps"][1]["id"] == "PREDICT"
        assert rec_data["pipelineSteps"][2]["id"] == "REALLOCATE"
        assert rec_data["pipelineSteps"][3]["id"] == "VERIFY"

        # Check that actions were generated and executed
        assert len(rec_data["actions"]) >= 1
        verif = rec_data["verification"]
        assert verif["verified"] is True
        assert verif["outcome"] in ("Verified", "Partially Recovered")
        assert verif["criticalLoadsServedPct"] >= 99.9
        assert verif["powerConservationValid"] is True

        # Step 11 — Audit Logs
        events_res = client.get("/api/events")
        assert events_res.status_code == 200
        events_data = events_res.json()
        event_types = [e["eventType"] for e in events_data["items"]]
        assert "FAULT_INJECTED" in event_types
        assert "FAULT_DETECTED" in event_types
        assert "VERIFICATION_COMPLETED" in event_types

        # Step 12 — Benchmark
        bmk_res = client.post("/api/benchmark/run", json={
            "scenario": "solar_drop",
            "severity": 60.0,
            "durationMin": 60.0
        })
        assert bmk_res.status_code == 200
        bmk_data = bmk_res.json()
        assert len(bmk_data["results"]) == 3
        controllers = [r["controllerType"] for r in bmk_data["results"]]
        assert "fixed_policy" in controllers
        assert "rule_based" in controllers
        assert "predictive_opt" in controllers

        # Step 13 — Report & CSV Export
        csv_res = client.get("/api/events/export-csv")
        assert csv_res.status_code == 200
        assert "Event ID" in csv_res.text
        assert "FAULT_INJECTED" in csv_res.text

        # Restore
        client.post("/api/faults/clear")
