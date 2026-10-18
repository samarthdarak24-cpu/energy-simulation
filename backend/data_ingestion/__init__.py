"""
GridHeal Real-World Dataset Ingestion Adapters.
Ingests, cleans, calibrates, and provenance-tags measurements from:
1. OpenCEM Platform (OpenCEM-platform/opencem-dataset) -> measured_public
2. University of Bath Experimental Microgrid (researchdata.bath.ac.uk/1287/) -> experimental_lab
3. GPVS-Faults Waveform Dataset (yasinahmadpoor/FaultDiagnosis) -> experimental_lab
"""

from backend.data_ingestion.opencem_adapter import OpenCEMAdapter
from backend.data_ingestion.bath_adapter import BathMicrogridAdapter
from backend.data_ingestion.gpvs_adapter import GPVSFaultsAdapter

__all__ = [
    "OpenCEMAdapter",
    "BathMicrogridAdapter",
    "GPVSFaultsAdapter",
]
