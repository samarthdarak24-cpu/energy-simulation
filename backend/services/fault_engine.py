"""
Forwarding proxy for backward compatibility.
Exposes FaultEngine and fault_engine instance from backend.intelligence.fault_engine.
"""
from backend.intelligence.fault_engine import FaultEngine, fault_engine

__all__ = ["FaultEngine", "fault_engine"]
