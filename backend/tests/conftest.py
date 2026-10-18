import os
import pytest
from fastapi.testclient import TestClient

# Set test environment
os.environ["DATABASE_URL"] = "sqlite:///:memory:"

from backend.main import app
from backend.database import init_db
from backend.simulation.orchestrator import orchestrator


@pytest.fixture(scope="session", autouse=True)
def setup_test_db():
    init_db()
    yield


@pytest.fixture
def client():
    with TestClient(app) as c:
        yield c


@pytest.fixture(autouse=True)
def reset_simulation():
    orchestrator.reset()
    yield
