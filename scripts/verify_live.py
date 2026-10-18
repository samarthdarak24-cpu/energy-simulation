import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
import json
from backend.data_ingestion import OpenCEMAdapter, BathMicrogridAdapter, GPVSFaultsAdapter
from backend.intelligence.real_forecast_pipeline import real_forecast_pipeline
from backend.intelligence.gpvs_fault_classifier import gpvs_fault_classifier
from backend.intelligence.optimizer import optimizer
from backend.services.replay_service import replay_service

def verify_all():
    print("=== 1. DATASETS VERIFICATION ===")
    df_oc = OpenCEMAdapter().ingest()
    print(f"OpenCEM Dataset: {len(df_oc)} real campus records ingested.")
    print(f"  Solar power range: {df_oc['solar_pv_kw'].min()} to {df_oc['solar_pv_kw'].max()} kW")
    print(f"  Load power range: {df_oc['load_demand_kw'].min()} to {df_oc['load_demand_kw'].max()} kW")

    df_bath = BathMicrogridAdapter().ingest()
    print(f"\nBath Dataset: {len(df_bath)} laboratory records ingested.")
    print(f"  Physical losses mean: {df_bath['losses_pct'].mean():.2f}%")
    print(f"  Irradiance absent verified: {df_bath['irradiance_wm2'].isnull().all()}")

    df_gpvs = GPVSFaultsAdapter().ingest()
    print(f"\nGPVS Dataset: {len(df_gpvs)} experimental waveform records.")
    print(f"  Physical fault classes: {df_gpvs['fault_class'].nunique()} classes")

    print("\n=== 2. AI FORECASTING MODEL LIVE INFERENCE ===")
    fc_out = real_forecast_pipeline.predict_step(current_solar_kw=1.85, current_demand_kw=0.72, hour_float=13.5)
    print(f"Input: solar=1.85 kW, load=0.72 kW, time=1:30 PM")
    print(f"Live 15-min Solar Forecast: {fc_out['horizon_15m']['solar_kw']} kW")
    print(f"Live 15-min Load Forecast:  {fc_out['horizon_15m']['demand_kw']} kW")
    print(f"80% Prediction Interval:     [{fc_out['horizon_15m']['solar_p10_kw']}, {fc_out['horizon_15m']['solar_p90_kw']}] kW")

    print("\n=== 3. AI FAULT CLASSIFIER LIVE INFERENCE ===")
    sample_waveform = {
        'pv_current_a': 1.62, 'pv_voltage_v': 45.2, 'pv_power_kw': 0.073, 'dc_bus_voltage_v': 140.5,
        'current_phase_a': -0.15, 'current_phase_b': 0.45, 'current_phase_c': -0.30,
        'voltage_phase_a': 41.5, 'voltage_phase_b': -150.0, 'voltage_phase_c': 109.0,
        'i_rms_abc': 0.45, 'current_frequency_hz': 49.9, 'v_rms_abc': 154.0, 'voltage_frequency_hz': 50.0
    }
    fault_out = gpvs_fault_classifier.predict_sample(sample_waveform)
    print(f"Predicted Physical State: {fault_out['predicted_fault_class']}")
    print(f"Model Confidence:        {fault_out['confidence'] * 100:.1f}%")
    print(f"Is Anomaly:              {fault_out['is_anomaly']}")

    print("\n=== 4. MILP RECOVERY OPTIMIZER LIVE DISPATCH ===")
    disp_out = optimizer.solve_dispatch(solver_mode='milp')
    print(f"Solver Engine:           {disp_out['solver']}")
    print(f"Solve Latency:           {disp_out['latency_ms']} ms")
    print(f"Battery Dispatch:        Discharge {disp_out['batt_discharge_kw']} kW, Charge {disp_out['batt_charge_kw']} kW")
    print(f"Grid Import / Export:    {disp_out['grid_import_kw']} kW / {disp_out['grid_export_kw']} kW")
    print(f"Binary Decisions:        {disp_out.get('binary_decisions')}")
    print(f"Critical Loads Served:   {disp_out['critical_served_pct']}%")

    print("\n=== 5. RECORDED REPLAY LIVE STEP ===")
    replay_service.reset()
    replay_service.start(dataset_key='opencem', speed=2.0)
    frame = replay_service.step_forward()
    print(f"Audit ID:                {frame['audit_id']}")
    print(f"Timestamp:               {frame['timestamp']}")
    print(f"Observed Solar / Load:   {frame['observed_measurements']['solar_pv_kw']} kW / {frame['observed_measurements']['load_demand_kw']} kW")
    print(f"Verification Verdict:    {frame['verification']['status']}")

if __name__ == "__main__":
    verify_all()
