import pytest
from fastapi.testclient import TestClient
from backend.main import app
from backend.mongodb import is_mongodb_configured, check_mongo_connection

client = TestClient(app)


def test_mongodb_status_endpoint():
    response = client.get("/api/mongodb/status")
    assert response.status_code == 200
    data = response.json()
    assert "connected" in data
    assert "configured" in data
    assert "database" in data
    assert "counts" in data


@pytest.mark.anyio
async def test_mongodb_connection_check():
    res = await check_mongo_connection()
    assert isinstance(res, dict)
    assert "connected" in res
    assert "configured" in res


def test_root_mongodb_metadata():
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert "mongodb" in data
    assert "configured" in data["mongodb"]
    assert "database" in data["mongodb"]
