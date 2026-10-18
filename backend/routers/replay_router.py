"""
FastAPI router for Recorded Real-World Data Replay.
Provides endpoints for monitoring, controlling, and retrieving the replay stream.
"""

from typing import Dict, Any, List, Optional
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from backend.services.replay_service import replay_service

router = APIRouter(prefix="/api/replay", tags=["Recorded Real-World Replay"])


class ReplayControlRequest(BaseModel):
    dataset_key: Optional[str] = Field("opencem", description="Dataset to replay ('opencem' or 'bath')")
    speed: Optional[float] = Field(2.0, ge=0.2, le=50.0, description="Replay speed factor")
    start_index: Optional[int] = Field(0, ge=0, description="Record index to start from")


@router.get("/status")
def get_replay_status() -> Dict[str, Any]:
    """Get live playback state, progress, and latest replayed frame."""
    return replay_service.get_status()


@router.get("/sources")
def get_replay_sources() -> List[Dict[str, Any]]:
    """Get list of available published real-world replay datasets."""
    return replay_service.get_sources()


@router.post("/start")
def start_replay(req: ReplayControlRequest) -> Dict[str, Any]:
    """Start recorded data replay playback."""
    return replay_service.start(
        dataset_key=req.dataset_key or "opencem",
        speed=req.speed or 2.0,
        start_index=req.start_index or 0
    )


@router.post("/pause")
def pause_replay() -> Dict[str, Any]:
    """Pause replay playback."""
    return replay_service.pause()


@router.post("/resume")
def resume_replay() -> Dict[str, Any]:
    """Resume playback."""
    return replay_service.resume()


@router.post("/step")
def step_forward() -> Dict[str, Any]:
    """Advance replay by exactly one recorded measurement record."""
    frame = replay_service.step_forward()
    if frame is None:
        raise HTTPException(status_code=400, detail="Replay dataset is empty or not loaded.")
    return frame


@router.post("/stop")
def stop_replay() -> Dict[str, Any]:
    """Stop replay completely."""
    return replay_service.stop()


@router.post("/reset")
def reset_replay() -> Dict[str, Any]:
    """Reset replay to the beginning of the dataset."""
    return replay_service.reset()


@router.get("/log")
def get_replay_log(limit: int = 50) -> List[Dict[str, Any]]:
    """Retrieve audit log frames from replay execution."""
    return replay_service.get_audit_trail(limit=limit)
