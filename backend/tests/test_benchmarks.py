import pytest
from backend.benchmark.runner import benchmark_runner


def test_benchmark_runner_3_controllers():
    res = benchmark_runner.run_experiment(
        scenario="solar_drop",
        severity=60.0,
        duration_min=60.0
    )
    assert res["scenarioName"] == "Solar Drop Benchmark"
    assert len(res["results"]) == 3

    controllers = [r["controllerType"] for r in res["results"]]
    assert "fixed_policy" in controllers
    assert "rule_based" in controllers
    assert "predictive_opt" in controllers

    fixed_res = next(r for r in res["results"] if r["controllerType"] == "fixed_policy")
    opt_res = next(r for r in res["results"] if r["controllerType"] == "predictive_opt")

    # Predictive HiGHS optimization should outperform or equal fixed policy on unserved energy
    assert opt_res["unservedEnergyKwh"] <= fixed_res["unservedEnergyKwh"]
    assert opt_res["recoveryTimeMin"] < fixed_res["recoveryTimeMin"]
    assert opt_res["criticalLoadsServedPct"] >= 99.0
