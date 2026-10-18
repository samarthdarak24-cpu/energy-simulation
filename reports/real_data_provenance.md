# GridHeal Phase 2: Real-World Dataset Provenance & Origin Specification

**Project:** GridHeal: Recovery Lab  
**Report Generated:** 2026-10-18 08:05:06 UTC  
**Auditor / Architect:** Antigravity AI  
**Repository State:** Phase 2 Real Dataset Ingestion & Validation  

---

## 1. Data Origin Taxonomy & Strict Separation Policy

To preserve scientific integrity and eliminate ambiguity between physical truth and digital simulation, GridHeal enforces strict origin tags on every dataframe, API response, and visualization component:

| Origin Tag | Definition | Permitted Claim | Real-World Hardware Connection? |
| :--- | :--- | :--- | :--- |
| `measured_public` | Empirical telemetry recorded by public operational microgrid installations. | "Calibrated with real campus microgrid telemetry." | **No** (Recorded archive, not live field actuator). |
| `experimental_lab` | Physical laboratory testbench measurements (high-frequency oscilloscope / power electronics). | "Evaluated on laboratory PV array & microgrid bench test data." | **No** (Physical bench recordings). |
| `synthetic` | Generated from mathematical differential equations and Kirchhoff physics in the GridHeal digital twin. | "Simulated digital twin scenario under synthetic disturbance." | **No** (Physics-constrained simulator). |
| `derived_from_real` | Features, resampled time series, or integrated energy computed directly from real observations. | "Engineered features derived from published measurements." | **No** (Offline mathematical derivation). |
| `simulated_replay` | Streaming playback of timestamped real observations through the software platform. | "Demonstrated using recorded real-world data replay." | **No** (Read-only recorded telemetry replay). |

> [!IMPORTANT]
> The term **"Live Hardware"** is strictly forbidden until an authorized physical telemetry gateway is connected and transmitting real-time packets. The term **"Real-Time"** must never be used to describe fetching a pre-stored CSV file.

---

## 2. Published Reference Datasets Registry

### 2.1 OpenCEM Microgrid Platform (`measured_public`)
- **Primary Source:** Campus Modbus Telemetry Repository (`https://github.com/OpenCEM-platform/opencem-dataset`)
- **Raw File:** `gridheal_synthetic_data/data/raw_reference/opencem_measurements_2025_07_a.csv`
- **File Size:** 429,290 bytes (1639 records)
- **Retrieval Date:** 2026-10-18
- **Source License:** MIT License
- **SHA-256 Digest:** `9094f34779cc58046eab3a3ab0bb6a355db5ec0e0fccc254dfae762d0855f907`
- **Verified Variables Ingested:**
  - Solar generation: `pv1power`, `pv2power`, `pv3power` $\rightarrow$ `solar_pv_kw` (summed and converted from Watts to kW)
  - Demand: `outsumw` $\rightarrow$ `load_demand_kw` (Watts to kW)
  - BESS telemetry: `battsoc` (%), `battvolt` (V), `battchgpower` (kW)
  - AC Grid coupling: `gridpowerw_a`, `gridpowerw_b`, `gridpowerw_c` $\rightarrow$ `grid_active_power_kw`
  - Electrical frequency & inverter temperature: `outfreq` (Hz), `temper1` (°C)
- **Transformations Applied:**
  - UTC ISO-8601 timestamp standardisation from epoch seconds (`read_ts`).
  - Unit normalization from Watts to kW ($/ 1000.0$).
  - Trapezoidal energy integration for cumulative solar and load energy ($E(t) = \int P dt$ in kWh).
- **Final Use:** Real-data diurnal forecasting training, digital-twin parameter calibration, and recorded-data replay demonstration.

### 2.2 University of Bath Experimental Microgrid (`experimental_lab`)
- **Primary Source:** University of Bath ResearchData Archive (`https://researchdata.bath.ac.uk/1287/`, DOI: 10.15125/BATH-01287)
- **Raw File:** `gridheal_synthetic_data/data/raw_reference/bath_microgrid_full.csv`
- **File Size:** 123,812 bytes (886 records)
- **Retrieval Date:** 2026-10-18
- **Source License:** CC-BY 4.0
- **SHA-256 Digest:** `62da54fb75977ed29fabbebb034edf061c36fe7456d83e1feb2bcfbede0916aa`
- **Verified Variables Ingested:**
  - AC Bus: `AC voltage` (V), `AC frequency` (Hz), `Output voltage`, `Output frequency`
  - Generation & Load: `PV input power` (W $\rightarrow$ kW), `Output active power` (W $\rightarrow$ kW), `PV current`, `Load current`
  - BESS: `Battery voltage` (V), `Battery capacity` (SoC %), `Battery discharge current` (A), `BatteryPower` (W $\rightarrow$ kW)
  - Physical Losses: `Losses` (W $\rightarrow$ kW), `Losses (%)` (Mean: 5.8%)
- **Critical Finding & Audit Correction:**
  - **Plane-of-array irradiance ($W/m^2$) is NOT present in the Bath dataset.**
  - Field `irradiance_wm2` is explicitly set to `None`. Claims that Bath provides raw irradiance curves have been purged.
- **Final Use:** Independent electrical validation, power electronics efficiency calibration, and experimental replay.

### 2.3 GPVS-Faults Photovoltaic Array Fault Dataset (`experimental_lab`)
- **Primary Source:** Experimental PV Fault Diagnosis (`https://github.com/yasinahmadpoor/FaultDiagnosis`)
- **Raw Files:**
  - Limited Power Point Tracking (Lim): `gpvs_lim_solar_data.csv` (10,935 rows)
    - SHA-256: `c460207e77a54f333d91a5ec80a0d5e0da73079cbf1cd0a613032d127b5b674c`
  - Maximum Power Point Tracking (Max): `gpvs_max_solar_data.csv` (10,701 rows)
    - SHA-256: `db7b6a5e23e0a75f7fbfce418b48c27a7942b573dbe3060042639baa87984777`
- **Retrieval Date:** 2026-10-18
- **Source License:** Open Academic Research / GitHub Open Source
- **Total Ingested Records:** 21,636 experimental waveform snapshots
- **Verified Variables Ingested:**
  - Electrical Channels: `Ipv`, `Vpv`, `Vdc`, `ia`, `ib`, `ic`, `va`, `vb`, `vc`, `Iabc`, `If`, `Vabc`, `Vf`
  - Labeled Physical Fault Classes (8 total):
    1. `fault_free_normal` (F0L / F0M)
    2. `pv_string_open_circuit` (F1L / F1M)
    3. `pv_line_to_line_fault` (F2L / F2M)
    4. `pv_array_open_circuit` (F3L / F3M)
    5. `pv_high_impedance_ground_fault` (F4L / F4M)
    6. `pv_cell_degradation` (F5L / F5M)
    7. `pv_partial_shading` (F6L / F6M)
    8. `pv_bypass_diode_bridging` (F7L / F7M)
- **Critical Finding & Audit Correction:**
  - GPVS-Faults covers electrical array faults exclusively. It does **not** contain battery thermal runaway, grid substation islanding, or EV charging surges.
  - Those non-PV events remain in the synthetic digital twin and are labeled as `synthetic`.
- **Final Use:** High-frequency PV fault classification model training and evaluation.

---

## 3. Data Integrity & Leakage Prevention Guarantees

1. **Raw Immutability:** All source files in `data/raw_reference/` are strictly read-only and never overwritten by ingestion scripts.
2. **Chronological Splitting:** Forecasting models strictly use sequential temporal splits (70% train, 15% validation, 15% test). No random sample shuffling is permitted across adjacent time points.
3. **Cross-Mode Fault Splitting:** GPVS fault classifiers are trained on the Limited power mode (`Lim`) and tested on the Maximum power mode (`Max`), preventing data leakage between identical oscilloscope pulses.
4. **Physical Residual Transparency:** The synthetic simulator residual of 0.000 kW is documented as an internal mass-energy conservation balance; physical laboratory testbench measurements (Bath) explicitly report non-zero losses (5.8% mean).
