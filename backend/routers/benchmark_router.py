from fastapi import APIRouter, HTTPException
from backend.benchmark.runner import benchmark_runner
from backend.models.schemas import BenchmarkRunRequest, BenchmarkResponse
from backend.database import SessionLocal
from backend.models.db_models import BenchmarkRun, BenchmarkResult

router = APIRouter(prefix="/api/benchmark", tags=["Benchmark Centre"])

latest_benchmark_cache = None


@router.post("/run", response_model=BenchmarkResponse)
def run_benchmark(req: BenchmarkRunRequest):
    global latest_benchmark_cache
    res = benchmark_runner.run_experiment(
        scenario=req.scenario,
        severity=req.severity,
        duration_min=req.durationMin
    )
    latest_benchmark_cache = res
    return res


@router.get("/latest", response_model=BenchmarkResponse)
def get_latest_benchmark():
    global latest_benchmark_cache
    if not latest_benchmark_cache:
        latest_benchmark_cache = benchmark_runner.run_experiment()
    return latest_benchmark_cache


@router.get("/history")
def list_benchmark_history():
    db = SessionLocal()
    try:
        runs = db.query(BenchmarkRun).order_by(BenchmarkRun.created_at.desc()).limit(10).all()
        return [
            {
                "id": r.id,
                "scenarioName": r.scenario_name,
                "faultType": r.fault_type,
                "severity": r.severity,
                "durationMin": r.duration_min,
                "status": r.status,
                "createdAt": r.created_at.isoformat()
            }
            for r in runs
        ]
    finally:
        db.close()
