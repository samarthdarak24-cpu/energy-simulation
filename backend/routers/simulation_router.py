import asyncio
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, HTTPException
from backend.simulation.orchestrator import orchestrator
from backend.models.schemas import MicrogridTelemetrySchema, SimulationControlRequest

router = APIRouter(prefix="/api/simulation", tags=["Simulation & Overview"])


@router.get("/telemetry", response_model=MicrogridTelemetrySchema)
def get_current_telemetry():
    """Retrieve current authoritative microgrid telemetry."""
    return orchestrator.latest_telemetry


@router.get("/history")
def get_telemetry_history(limit: int = 60):
    """Retrieve historical telemetry time-series for analytics charts."""
    return orchestrator.history[-limit:]


@router.post("/control")
def control_simulation(req: SimulationControlRequest):
    """Control simulation lifecycle (start, pause, resume, reset, step)."""
    if req.action == "pause":
        orchestrator.clock.is_running = False
        orchestrator.latest_telemetry["simulationStatus"] = "paused"
    elif req.action in ("start", "resume"):
        orchestrator.clock.is_running = True
        orchestrator.latest_telemetry["simulationStatus"] = "running"
    elif req.action == "reset":
        orchestrator.reset()
    elif req.action == "step":
        orchestrator.step_forward()

    if req.speed:
        orchestrator.clock.speed = req.speed

    return {
        "status": "success",
        "action": req.action,
        "is_running": orchestrator.clock.is_running,
        "speed": orchestrator.clock.speed,
        "current_step": orchestrator.clock.current_step,
        "simulated_time": orchestrator.clock.current_time_str
    }


@router.websocket("/ws")
async def websocket_telemetry_stream(websocket: WebSocket):
    """Live streaming WebSocket for real-time telemetry updates."""
    await websocket.accept()
    queue = asyncio.Queue()
    orchestrator.active_subscribers.append(queue)
    try:
        # Send current initial state immediately upon connection
        await websocket.send_json(orchestrator.latest_telemetry)
        while True:
            # Wait for next state broadcast or heartbeats
            data = await queue.get()
            await websocket.send_json(data)
    except WebSocketDisconnect:
        pass
    except Exception:
        pass
    finally:
        if queue in orchestrator.active_subscribers:
            orchestrator.active_subscribers.remove(queue)
