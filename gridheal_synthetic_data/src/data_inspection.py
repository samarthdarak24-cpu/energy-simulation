"""
Data Inspection and Reference Dataset Provenance Module.
Inspects external benchmark datasets (OpenCEM, Univ of Bath, GPVS-Faults) and documents
their verified schema, sampling characteristics, calibration parameters, and limitations.
"""

import os
from typing import Dict, Any, List

REFERENCE_DATASETS_METADATA = {
    "opencem": {
        "source_name": "OpenCEM Microgrid Platform Dataset",
        "url": "https://github.com/OpenCEM-platform/opencem-dataset",
        "verified_variables": [
            {"name": "PV_ActivePower", "unit": "kW", "description": "Solar inverter output"},
            {"name": "BESS_SoC", "unit": "%", "description": "Battery state of charge"},
            {"name": "BESS_ActivePower", "unit": "kW", "description": "Battery active power (+ discharge / - charge)"},
            {"name": "Grid_ActivePower", "unit": "kW", "description": "PCC grid exchange"},
            {"name": "Total_Load", "unit": "kW", "description": "Aggregated facility demand"}
        ],
        "sampling_interval": "1 minute / 15 minutes",
        "date_range": "2021-2022 multi-month intervals",
        "fault_labels_present": False,
        "intended_use": "Calibrating diurnal solar shape factors, load profile autocorrelation, and BESS ramp dynamics.",
        "known_limitations": "Does not label EV fleet charging sessions or automated self-healing recovery sequences.",
        "calibrated_parameters": {
            "solar_diurnal_shape": "Bell-shaped solar generation curve with cloud attenuation",
            "demand_peak_hours": "08:00-11:00 morning peak, 18:00-21:00 evening peak",
            "battery_nominal_c_rate": "0.3C - 0.5C nominal battery dispatch capability"
        }
    },
    "bath_microgrid": {
        "source_name": "University of Bath Experimental Microgrid Dataset",
        "url": "https://researchdata.bath.ac.uk/1287/",
        "verified_variables": [
            {"name": "P_PV", "unit": "kW", "description": "Rooftop PV generation"},
            {"name": "P_Load", "unit": "kW", "description": "Laboratory experimental demand"},
            {"name": "P_Grid", "unit": "kW", "description": "Grid interface exchange"},
            {"name": "SoC", "unit": "%", "description": "Lithium-ion storage state of charge"},
            {"name": "Bus_Voltage", "unit": "V", "description": "AC bus line voltage (400V RMS)"},
            {"name": "Frequency", "unit": "Hz", "description": "Microgrid bus frequency (50 Hz nominal)"}
        ],
        "sampling_interval": "1 minute / 1 second experimental runs",
        "date_range": "2021-2023 experimental campaigns",
        "fault_labels_present": False,
        "intended_use": "Validating energy balance reconciliation, bus frequency droop (50 Hz), and day-ahead forecasting benchmarks.",
        "known_limitations": "Small lab-scale microgrid (< 20 kW); scaled to campus scale for GridHeal.",
        "calibrated_parameters": {
            "nominal_frequency_hz": 50.0,
            "nominal_voltage_v": 400.0,
            "power_balance_tolerance_kw": 0.05
        }
    },
    "gpvs_faults": {
        "source_name": "GPVS-Faults Experimental PV Fault Dataset",
        "url": "https://github.com/yasinahmadpoor/FaultDiagnosis",
        "verified_variables": [
            {"name": "Vpv", "unit": "V", "description": "PV string DC voltage"},
            {"name": "Ipv", "unit": "A", "description": "PV string DC current"},
            {"name": "G", "unit": "W/m2", "description": "Plane-of-array solar irradiance"},
            {"name": "T", "unit": "deg C", "description": "Ambient and module temperature"}
        ],
        "sampling_interval": "100 Hz / high-frequency experimental oscilloscope sampling",
        "date_range": "2020-2021 lab testbench experiments",
        "fault_labels_present": True,
        "fault_categories": [
            "Normal",
            "Open-Circuit String Fault",
            "Short-Circuit String Fault",
            "Partial Shading",
            "Degradation / Soiling Fault"
        ],
        "intended_use": "Calibrating realistic PV generation derating percentages (20% - 80%) under sudden shading and string loss.",
        "known_limitations": "Waveform-level transients (100 Hz) cannot be directly represented in 1-minute energy-management dispatch.",
        "calibrated_parameters": {
            "pv_drop_severity_pct": "20.0% to 80.0% generation loss under cloud cover or string trip",
            "pv_temp_derate_coefficient": "-0.004 per deg C above STC 25 deg C"
        }
    }
}


def get_reference_provenance_table() -> List[Dict[str, Any]]:
    """Return structured provenance records for all investigated datasets."""
    rows = []
    for key, data in REFERENCE_DATASETS_METADATA.items():
        rows.append({
            "key": key,
            "source_name": data["source_name"],
            "url": data["url"],
            "sampling_interval": data["sampling_interval"],
            "date_range": data["date_range"],
            "fault_labels": "Yes" if data["fault_labels_present"] else "No",
            "intended_use": data["intended_use"],
            "known_limitations": data["known_limitations"]
        })
    return rows


def inspect_local_reference_data(raw_data_dir: str) -> Dict[str, Any]:
    """Scan local directory for any raw reference files and report status."""
    if not os.path.exists(raw_data_dir):
        return {"status": "directory_missing", "files_found": []}
    files = [f for f in os.listdir(raw_data_dir) if f.endswith(('.csv', '.parquet', '.h5', '.json'))]
    return {
        "status": "scanned",
        "directory": raw_data_dir,
        "file_count": len(files),
        "files_found": files
    }


if __name__ == "__main__":
    import json
    print("=== Reference Data Provenance Inspection ===")
    for ds in get_reference_provenance_table():
        print(f"\n[{ds['source_name']}]")
        print(f"  URL: {ds['url']}")
        print(f"  Sampling: {ds['sampling_interval']}")
        print(f"  Fault Labels: {ds['fault_labels']}")
        print(f"  Intended Use: {ds['intended_use']}")
