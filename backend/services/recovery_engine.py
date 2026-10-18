"""
Forwarding proxy for backward compatibility.
Exposes RecoveryOptimizer from backend.intelligence.optimizer.
"""
from backend.intelligence.optimizer import RecoveryOptimizer

__all__ = ["RecoveryOptimizer"]
