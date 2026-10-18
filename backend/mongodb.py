import os
import asyncio
from pathlib import Path
from typing import Optional, Dict, Any
from dotenv import load_dotenv

# Load root .env if present
root_dir = Path(__file__).resolve().parent.parent
env_file = root_dir / ".env"
if env_file.exists():
    load_dotenv(dotenv_path=env_file)

import motor.motor_asyncio
from pymongo import MongoClient

MONGODB_URL = os.getenv("MONGODB_URL", "").strip()
MONGODB_DB_NAME = os.getenv("MONGODB_DB_NAME", "gridheal").strip()

# Global async client and db references
_async_client: Optional[motor.motor_asyncio.AsyncIOMotorClient] = None
_async_db: Optional[motor.motor_asyncio.AsyncIOMotorDatabase] = None


def is_mongodb_configured() -> bool:
    """Check if a MongoDB connection string has been provided."""
    return bool(MONGODB_URL and not MONGODB_URL.startswith("mongodb+srv://<username>"))


def get_mongo_client() -> Optional[motor.motor_asyncio.AsyncIOMotorClient]:
    """Retrieve or initialize the singleton AsyncIOMotorClient."""
    global _async_client
    if _async_client is None and is_mongodb_configured():
        try:
            _async_client = motor.motor_asyncio.AsyncIOMotorClient(
                MONGODB_URL,
                serverSelectionTimeoutMS=5000,
                connectTimeoutMS=5000,
                socketTimeoutMS=5000,
            )
        except Exception as e:
            print(f"[MongoDB] Client initialization warning: {e}")
            _async_client = None
    return _async_client


def get_mongo_db() -> Optional[motor.motor_asyncio.AsyncIOMotorDatabase]:
    """Retrieve the target MongoDB database instance."""
    global _async_db
    client = get_mongo_client()
    if client is not None:
        if _async_db is None or _async_db.name != MONGODB_DB_NAME:
            _async_db = client[MONGODB_DB_NAME]
        return _async_db
    return None


async def check_mongo_connection() -> Dict[str, Any]:
    """Verify connectivity to MongoDB Atlas by executing a ping command."""
    if not is_mongodb_configured():
        return {
            "connected": False,
            "configured": False,
            "database": MONGODB_DB_NAME,
            "error": "MONGODB_URL is not configured. Add your MongoDB Atlas connection string to .env",
            "collections": []
        }

    client = get_mongo_client()
    if client is None:
        return {
            "connected": False,
            "configured": True,
            "database": MONGODB_DB_NAME,
            "error": "Failed to initialize MongoDB client",
            "collections": []
        }

    try:
        # Execute admin ping command with 4 second timeout
        start_time = asyncio.get_event_loop().time()
        await client.admin.command('ping')
        latency_ms = round((asyncio.get_event_loop().time() - start_time) * 1000, 2)

        db = get_mongo_db()
        collections = await db.list_collection_names() if db is not None else []

        return {
            "connected": True,
            "configured": True,
            "database": MONGODB_DB_NAME,
            "latencyMs": latency_ms,
            "collections": collections,
            "message": "Successfully connected to MongoDB Atlas cluster"
        }
    except Exception as e:
        return {
            "connected": False,
            "configured": True,
            "database": MONGODB_DB_NAME,
            "error": str(e),
            "collections": []
        }


async def save_telemetry_to_mongo(telemetry: Dict[str, Any]) -> bool:
    """Save a real-time telemetry measurement document to MongoDB Atlas."""
    db = get_mongo_db()
    if db is None:
        return False
    try:
        from datetime import datetime
        doc = dict(telemetry)
        doc["_received_at"] = datetime.utcnow()
        await db["telemetry_measurements"].insert_one(doc)
        return True
    except Exception as e:
        print(f"[MongoDB] Telemetry save error: {e}")
        return False


async def save_event_to_mongo(event: Dict[str, Any]) -> bool:
    """Save an audit or recovery event document to MongoDB Atlas."""
    db = get_mongo_db()
    if db is None:
        return False
    try:
        from datetime import datetime
        doc = dict(event)
        doc["_created_at"] = datetime.utcnow()
        await db["recovery_events"].insert_one(doc)
        return True
    except Exception as e:
        print(f"[MongoDB] Event save error: {e}")
        return False


async def save_benchmark_to_mongo(benchmark: Dict[str, Any]) -> bool:
    """Save controller benchmark evaluation results to MongoDB Atlas."""
    db = get_mongo_db()
    if db is None:
        return False
    try:
        from datetime import datetime
        doc = dict(benchmark)
        doc["_evaluated_at"] = datetime.utcnow()
        await db["benchmark_results"].insert_one(doc)
        return True
    except Exception as e:
        print(f"[MongoDB] Benchmark save error: {e}")
        return False


async def init_mongo():
    """Application startup initialization for MongoDB Atlas."""
    if is_mongodb_configured():
        res = await check_mongo_connection()
        if res.get("connected"):
            print(f"[MongoDB] Connected to Atlas database '{MONGODB_DB_NAME}' ({res.get('latencyMs')}ms)")
        else:
            print(f"[MongoDB] Atlas connection pending: {res.get('error')}")


async def close_mongo():
    """Application shutdown cleanup for MongoDB client connections."""
    global _async_client, _async_db
    if _async_client is not None:
        _async_client.close()
        _async_client = None
        _async_db = None
