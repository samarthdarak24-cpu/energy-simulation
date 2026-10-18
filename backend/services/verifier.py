"""
Forwarding proxy for backward compatibility.
Exposes VerificationEngine and verifier instance from backend.intelligence.verifier.
"""
from backend.intelligence.verifier import VerificationEngine, verifier

__all__ = ["VerificationEngine", "verifier"]
