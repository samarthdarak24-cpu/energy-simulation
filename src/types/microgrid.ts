export type UserRole = 'operator' | 'admin' | 'researcher';

export type PipelineStage = 'DETECT' | 'PREDICT' | 'REALLOCATE' | 'VERIFY';

export interface MicrogridTelemetry {
  solarGeneration: number; // in kW (e.g. 128)
  solarPrevChange: number; // % e.g. +12%
  totalDemand: number; // in kW (e.g. 105)
  demandPrevChange: number; // % e.g. +6%
  batterySoc: number; // % e.g. 76%
  batterySocChange: number; // % e.g. +5%
  batteryPower: number; // kW e.g. 50 (discharging) or -20 (charging)
  batteryCapacityKwh: number; // e.g. 200 kWh
  criticalLoadsServed: number; // % e.g. 100%
  criticalLoadsPower: number; // kW e.g. 70
  flexibleLoadsPower: number; // kW e.g. 18
  evChargingPower: number; // kW e.g. 32
  gridPower: number; // kW e.g. 0 (import/export)
  gridStatus: 'connected' | 'islanded' | 'faulted';
  
  totalSupply: number; // kW e.g. 210
  gridImport: number; // kW e.g. 0
  unservedEnergyKwh: number; // kWh e.g. 0
  netBalanceKw: number; // kW e.g. +105
  
  recoveryTimeMin: number; // e.g. 8 min
  constraintViolations: number; // e.g. 0
}

export interface RecoveryStep {
  stepNumber: number;
  id: PipelineStage;
  title: string;
  subtitle: string;
  status: 'completed' | 'active' | 'pending';
  note?: string;
}

export interface ActiveAlert {
  id: string;
  title: string;
  severity: 'Low' | 'Medium' | 'High' | 'Critical';
  description: string;
  time: string;
  category: 'imbalance' | 'fault' | 'storage' | 'grid';
}

export interface RecoveryEvent {
  id: string;
  time: string;
  title: string;
  status: 'Detected' | 'Predicted' | 'Actioned' | 'Verified' | 'Unresolved';
  badgeColor: 'emerald' | 'amber' | 'blue' | 'rose';
  details?: string;
}

export interface HistoricalBarData {
  date: string;
  label: string;
  solar: number;
  battery: number;
  grid: number;
  demand: number;
  total: number;
}

export interface ForecastPoint {
  date: string;
  solarForecast: number;
  demandForecast: number;
  actual?: number;
}

export interface AssetHealth {
  id: string;
  name: string;
  type: 'solar' | 'battery' | 'ev' | 'grid' | 'critical' | 'flexible';
  status: 'Online' | 'Connected' | 'Degraded' | 'Offline';
  isHealthy: boolean;
  powerKw: number;
  efficiency: number;
  temperature?: number;
}

export interface FaultScenario {
  id: string;
  name: string;
  description: string;
  type: 'solar_drop' | 'demand_surge' | 'battery_trip' | 'ev_peak' | 'grid_outage' | 'comm_failure';
  defaultSeverity: number; // 0 - 100%
  impactSummary: string;
}
