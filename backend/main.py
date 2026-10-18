import asyncio
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.database import init_db
from backend.mongodb import init_mongo, close_mongo, is_mongodb_configured, MONGODB_DB_NAME
from backend.simulation.orchestrator import orchestrator
from backend.services.replay_service import replay_service
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
    replay_router,
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


async def replay_background_loop():
    """Background task streaming recorded measurements when replay is active."""
    while True:
        try:
            if replay_service.is_running and not replay_service.is_paused:
                delay = max(0.05, 1.0 / max(0.1, replay_service.speed))
                await asyncio.sleep(delay)
                if replay_service.is_running and not replay_service.is_paused:
                    await asyncio.to_thread(replay_service.step_forward)
            else:
                await asyncio.sleep(0.2)
        except asyncio.CancelledError:
            break
        except Exception as e:
            import traceback
            traceback.print_exc()
            await asyncio.sleep(0.5)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: initialize database tables & MongoDB connection
    init_db()
    await init_mongo()
    # Start background simulation clock and replay stream tasks
    sim_task = asyncio.create_task(simulation_clock_loop())
    replay_task = asyncio.create_task(replay_background_loop())
    yield
    # Shutdown: cancel background tasks
    sim_task.cancel()
    replay_task.cancel()
    try:
        await asyncio.gather(sim_task, replay_task, return_exceptions=True)
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
app.include_router(replay_router.router)


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
