from fastapi import APIRouter, HTTPException
from typing import Dict, Any, List
from pydantic import BaseModel
from backend.mongodb import (
    check_mongo_connection,
    get_mongo_db,
    save_telemetry_to_mongo,
    save_event_to_mongo,
    is_mongodb_configured,
)
from datetime import datetime

router = APIRouter(prefix="/api/mongodb", tags=["MongoDB Atlas Integration"])


class MongoConfigUpdate(BaseModel):
    mongodbUrl: str
    databaseName: str = "gridheal"


@router.get("/status")
async def get_mongodb_status():
    """Verify MongoDB Atlas connectivity, cluster latency, and collection statistics."""
    conn_info = await check_mongo_connection()
    db = get_mongo_db()

    counts = {}
    if db is not None and conn_info.get("connected"):
        for col_name in ["telemetry_measurements", "recovery_events", "benchmark_results", "simulation_runs"]:
            try:
                counts[col_name] = await db[col_name].count_documents({})
            except Exception:
                counts[col_name] = 0

    return {
        **conn_info,
        "counts": counts,
        "timestamp": datetime.utcnow().isoformat()
    }


@router.get("/telemetry")
async def get_latest_mongo_telemetry(limit: int = 50):
    """Retrieve the most recent telemetry documents stored in MongoDB Atlas."""
    db = get_mongo_db()
    if db is None:
        raise HTTPException(
            status_code=503,
            detail="MongoDB Atlas is not configured. Please provide a valid MONGODB_URL."
        )

    cursor = db["telemetry_measurements"].find({}, {"_id": 0}).sort("_received_at", -1).limit(limit)
    docs = await cursor.to_list(length=limit)
    return docs


@router.post("/test")
async def test_mongodb_write_read():
    """Execute an end-to-end write and read test on MongoDB Atlas."""
    db = get_mongo_db()
    if db is None:
        raise HTTPException(
            status_code=503,
            detail="MongoDB Atlas is not configured. Please set MONGODB_URL in your .env file."
        )

    test_doc = {
        "test": "GridHeal Atlas Verification",
        "createdAt": datetime.utcnow(),
        "status": "healthy",
        "message": "MongoDB Atlas connection is active and operational"
    }

    insert_result = await db["_test_connectivity"].insert_one(test_doc)
    doc_id = str(insert_result.inserted_id)

    # Read back to verify
    retrieved = await db["_test_connectivity"].find_one({"_id": insert_result.inserted_id})
    await db["_test_connectivity"].delete_one({"_id": insert_result.inserted_id})

    return {
        "success": True,
        "insertedId": doc_id,
        "verified": retrieved is not None,
        "message": "Successfully verified write and read operations on MongoDB Atlas!"
    }
