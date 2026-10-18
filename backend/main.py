import asyncio
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.database import init_db
from backend.mongodb import init_mongo, close_mongo, is_mongodb_configured, MONGODB_DB_NAME
from backend.simulation.orchestrator import orchestrator
from backend.routers import (
    simulation_router,
    twin_router,
    fault_router,
    forecast_router,
    recovery_router,
    benchmark_router,
    event_router,
    config_router,
    support_router,
    dataset_router,
    mongo_router,
    weather_router,
)


async def simulation_clock_loop():
    """Background task advancing simulated time while the clock is active."""
    while True:
        try:
            if orchestrator.clock.is_running:
                # Interval scaled by speed: 1.0s / speed
                delay = max(0.2, 1.5 / max(0.1, orchestrator.clock.speed))
                await asyncio.sleep(delay)
                orchestrator.step_forward()
            else:
                await asyncio.sleep(0.5)
        except asyncio.CancelledError:
            break
        except Exception as e:
            import traceback
            traceback.print_exc()
            await asyncio.sleep(1.0)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: initialize database tables & MongoDB connection
    init_db()
    await init_mongo()
    # Start background simulation clock task
    task = asyncio.create_task(simulation_clock_loop())
    yield
    # Shutdown: cancel background task & close MongoDB
    task.cancel()
    try:
        await task
    except asyncio.CancelledError:
        pass
    await close_mongo()


app = FastAPI(
    title="GridHeal: Recovery Lab API",
    description="A Predictive, Self-Healing Software-Defined Microgrid Simulation Platform",
    version="1.0.0",
    lifespan=lifespan
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include all domain feature routers
app.include_router(simulation_router.router)
app.include_router(twin_router.router)
app.include_router(fault_router.router)
app.include_router(forecast_router.router)
app.include_router(recovery_router.router)
app.include_router(benchmark_router.router)
app.include_router(event_router.router)
app.include_router(config_router.router)
app.include_router(support_router.router)
app.include_router(dataset_router.router)
app.include_router(mongo_router.router)
app.include_router(weather_router.router)


@app.get("/")
def root():
    return {
        "project": "GridHeal: Recovery Lab",
        "tagline": "Simulate. Anticipate. Recover. Verify.",
        "status": "Online",
        "docs": "/docs",
        "simulationRunId": orchestrator.run_id,
        "mongodb": {
            "configured": is_mongodb_configured(),
            "database": MONGODB_DB_NAME
        }
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host="0.0.0.0", port=8000, reload=True)
