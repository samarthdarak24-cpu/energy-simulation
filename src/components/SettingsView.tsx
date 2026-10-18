import React, { useState } from 'react';
import {
  Settings,
  Calendar,
  ChevronDown,
  Save,
  RotateCcw,
  Upload,
  Download,
  Sun,
  BatteryCharging,
  Car,
  Zap,
  Radio,
  Sliders,
  CheckCircle2,
  Check,
  Plus,
} from 'lucide-react';
import { useMicrogrid } from '../context/MicrogridContext';
import { SimulationSettingsPanel } from './settings/SimulationSettingsPanel';
import { ControlOptimizationPanel } from './settings/ControlOptimizationPanel';
import { ForecastingSettingsPanel } from './settings/ForecastingSettingsPanel';
import { ScenarioManagementPanel } from './settings/ScenarioManagementPanel';
import { SystemSettingsPanel } from './settings/SystemSettingsPanel';

export const SettingsView: React.FC = () => {
  const [activeTab, setActiveTab] = useState('Asset Configuration');
  const [dateRange] = useState('Apr 28, 2025 – May 4, 2025');
  const [savedAlert, setSavedAlert] = useState(false);

  // Editable configuration fields
  const [solarCapacity, setSolarCapacity] = useState(150);
  const [solarProfile, setSolarProfile] = useState('Realistic (Clear/Cloudy)');
  const [tiltAngle, setTiltAngle] = useState(20);
  const [efficiencyFactor, setEfficiencyFactor] = useState(0.85);

  const [batteryCapacity, setBatteryCapacity] = useState(200);
  const [maxChargePower, setMaxChargePower] = useState(50);
  const [maxDischargePower, setMaxDischargePower] = useState(50);
  const [initialSoc, setInitialSoc] = useState(80);
  const [minSoc, setMinSoc] = useState(20);
  const [maxSoc, setMaxSoc] = useState(100);

  const [numChargers, setNumChargers] = useState('3');
  const [chargerPower, setChargerPower] = useState(7);
  const [totalEvCapacity, setTotalEvCapacity] = useState(50);

  const [baseDemand, setBaseDemand] = useState(100);
  const [criticalLoad, setCriticalLoad] = useState(30);
  const [flexibleLoad, setFlexibleLoad] = useState(40);
  const [nonCriticalLoad, setNonCriticalLoad] = useState(30);

  const [gridMaxImport, setGridMaxImport] = useState(500);
  const [gridMaxExport, setGridMaxExport] = useState(500);
  const [tariffImport, setTariffImport] = useState('₹8.0');
  const [tariffExport, setTariffExport] = useState('₹5.0');

  const [forecastHorizonHours, setForecastHorizonHours] = useState(24);
  const [weightCost, setWeightCost] = useState(0.4);
  const [weightEmissions, setWeightEmissions] = useState(0.3);
  const [weightReliability, setWeightReliability] = useState(0.3);

  const [activePreset, setActivePreset] = useState('Normal Operation');

  const presets = [
    { id: 'normal', name: 'Normal Operation', desc: 'Standard renewable mix', icon: Zap },
    { id: 'solar', name: 'High Solar Scenario', desc: 'Sunny day with high generation', icon: Sun },
    { id: 'peak', name: 'Peak Demand Scenario', desc: 'Evening peak with high demand', icon: Zap },
    { id: 'islanded', name: 'Grid Islanded Scenario', desc: 'No grid connection', icon: Radio },
    { id: 'ev', name: 'EV Heavy Scenario', desc: 'High EV charging load', icon: Car },
  ];

  const handleSave = async () => {
    setSavedAlert(true);
    try {
      await fetch('http://localhost:8000/api/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          solarInstalledCapacityKw: solarCapacity,
          solarEfficiency: efficiencyFactor / 100,
          batteryCapacityKwh: batteryCapacity,
          batteryInitialSoc: 76.0,
          batteryMinSoc: 20.0,
          batteryMaxSoc: 95.0,
          batteryMaxChargeKw: maxChargePower,
          batteryMaxDischargeKw: maxDischargePower,
          residentialBaseKw: baseDemand,
          commercialBaseKw: nonCriticalLoad,
          criticalBaseKw: criticalLoad,
          flexibleBaseKw: 10.0,
          evNumChargers: 6,
          evMaxChargingKw: 40.0,
          gridConnected: true,
          gridImportLimitKw: 100.0,
          gridExportLimitKw: 80.0,
        }),
      });
    } catch (e) {
      // Fallback
    }
    setTimeout(() => setSavedAlert(false), 2500);
  };

  const handleSelectPreset = async (presetId: string, presetName: string) => {
    setActivePreset(presetName);
    const presetKeyMap: Record<string, string> = {
      normal: 'normal',
      solar: 'high_solar',
      peak: 'peak_demand',
      islanded: 'grid_islanding',
      ev: 'high_ev',
    };
    const key = presetKeyMap[presetId] || 'normal';
    try {
      await fetch(`http://localhost:8000/api/config/presets/${key}`, { method: 'POST' });
    } catch (e) {
      // Fallback
    }
  };

  return (
    <div className="flex-1 p-6 space-y-6 max-w-[1600px] mx-auto text-slate-800">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Settings
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure your microgrid parameters, simulation environment and control preferences.
          </p>
        </div>

        <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs">
          <Calendar className="h-3.5 w-3.5 text-slate-400" />
          <span>{dateRange}</span>
          <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
        </div>
      </div>

      {/* Tabs Row */}
      <div className="flex items-center gap-1 border-b border-slate-200 overflow-x-auto pb-1 text-xs font-semibold">
        {[
          'Asset Configuration',
          'Simulation Settings',
          'Control & Optimization',
          'Forecasting Settings',
          'Scenario Management',
          'System Settings',
        ].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-t-lg transition-colors whitespace-nowrap ${
              activeTab === tab
                ? 'border-b-2 border-emerald-600 text-emerald-800 font-bold bg-emerald-50/40'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* 5 KPI Summary Cards */}
      {activeTab === 'Asset Configuration' && (
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-3.5 shadow-2xs flex items-center justify-between">
          <div>
            <div className="text-[11px] text-slate-500 font-medium">Total Solar Capacity</div>
            <div className="text-xl font-bold text-slate-900 font-mono mt-0.5">150 kW</div>
            <div className="text-[10px] text-emerald-600">Configured</div>
          </div>
          <div className="w-12 h-6">
            <svg viewBox="0 0 50 25" className="w-full h-full">
              <path d="M 0 20 Q 20 22 35 10 T 50 8" fill="none" stroke="#10B981" strokeWidth="2" />
            </svg>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-3.5 shadow-2xs flex items-center justify-between">
          <div>
            <div className="text-[11px] text-slate-500 font-medium">Battery Capacity</div>
            <div className="text-xl font-bold text-slate-900 font-mono mt-0.5">200 kWh</div>
            <div className="text-[10px] text-emerald-600">Configured</div>
          </div>
          <div className="w-12 h-6">
            <svg viewBox="0 0 50 25" className="w-full h-full">
              <path d="M 0 18 Q 20 20 35 12 T 50 10" fill="none" stroke="#10B981" strokeWidth="2" />
            </svg>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-3.5 shadow-2xs">
          <div className="text-[11px] text-slate-500 font-medium">EV Chargers</div>
          <div className="text-xl font-bold text-slate-900 font-mono mt-0.5">50 kW</div>
          <div className="text-[10px] text-slate-400">3 chargers</div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-3.5 shadow-2xs flex items-center justify-between">
          <div>
            <div className="text-[11px] text-slate-500 font-medium">Total Demand (Base)</div>
            <div className="text-xl font-bold text-slate-900 font-mono mt-0.5">100 kW</div>
            <div className="text-[10px] text-emerald-600">Configured</div>
          </div>
          <div className="w-12 h-6">
            <svg viewBox="0 0 50 25" className="w-full h-full">
              <path d="M 0 22 Q 20 20 35 12 T 50 10" fill="none" stroke="#10B981" strokeWidth="2" />
            </svg>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-3.5 shadow-2xs flex items-center justify-between">
          <div>
            <div className="text-[11px] text-slate-500 font-medium">Grid Connection</div>
            <div className="text-xl font-bold text-slate-900 font-mono mt-0.5">500 kW</div>
            <div className="text-[10px] text-emerald-600">Configured</div>
          </div>
          <div className="w-12 h-6">
            <svg viewBox="0 0 50 25" className="w-full h-full">
              <path d="M 0 20 L 50 20" fill="none" stroke="#10B981" strokeWidth="2" />
            </svg>
          </div>
        </div>
      </div>
      )}

      {/* Main Configuration Grid: Left (Forms) & Right (Presets + Quick Actions) */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* Left 9 Columns */}
        <div className="xl:col-span-9 space-y-6">
          {activeTab === 'Asset Configuration' && (
            <>
          {/* Row 1: Solar PV Config (Left) & Battery Storage Config (Right) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Solar PV Configuration */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs space-y-4">
              <div className="flex items-center gap-2">
                <Sun className="h-4 w-4 text-emerald-600" />
                <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Solar PV Configuration
                </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-3 text-xs">
                  <div>
                    <label className="text-[10px] font-semibold text-slate-500 block mb-0.5">
                      Installed Capacity (kW)
                    </label>
                    <input
                      type="number"
                      value={solarCapacity}
                      onChange={(e) => setSolarCapacity(Number(e.target.value))}
                      className="w-full rounded-lg border border-slate-200 p-1.5 font-mono text-xs"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-semibold text-slate-500 block mb-0.5">
                      Generation Profile
                    </label>
                    <div className="relative">
                      <select
                        value={solarProfile}
                        onChange={(e) => setSolarProfile(e.target.value)}
                        className="w-full appearance-none rounded-lg border border-slate-200 bg-white p-1.5 pr-7 text-xs"
                      >
                        <option>Realistic (Clear/Cloudy)</option>
                        <option>Clear Sky Model</option>
                        <option>Heavy Cloud Simulation</option>
                      </select>
                      <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-semibold text-slate-500 block mb-0.5">
                      Tilt Angle (°)
                    </label>
                    <input
                      type="number"
                      value={tiltAngle}
                      onChange={(e) => setTiltAngle(Number(e.target.value))}
                      className="w-full rounded-lg border border-slate-200 p-1.5 font-mono text-xs"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-semibold text-slate-500 block mb-0.5">
                      Efficiency Factor
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={efficiencyFactor}
                      onChange={(e) => setEfficiencyFactor(Number(e.target.value))}
                      className="w-full rounded-lg border border-slate-200 p-1.5 font-mono text-xs"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-semibold text-slate-500 block mb-0.5">
                      Weather Variability
                    </label>
                    <div className="relative">
                      <select className="w-full appearance-none rounded-lg border border-slate-200 bg-white p-1.5 pr-7 text-xs">
                        <option>Enabled</option>
                        <option>Disabled</option>
                      </select>
                      <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
                    </div>
                  </div>
                </div>

                {/* Sample Solar Generation Profile (Bell Curve) */}
                <div className="flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-slate-600 block mb-1">
                      Sample Solar Generation Profile
                    </span>
                    <div className="h-36 w-full pt-2">
                      <svg className="w-full h-full overflow-visible" viewBox="0 0 160 80">
                        <path
                          d="M 10 75 Q 40 75 60 40 Q 80 10 100 40 Q 120 75 150 75 Z"
                          fill="#D1FAE5"
                          opacity="0.7"
                        />
                        <path
                          d="M 10 75 Q 40 75 60 40 Q 80 10 100 40 Q 120 75 150 75"
                          fill="none"
                          stroke="#10B981"
                          strokeWidth="2"
                        />
                      </svg>
                      <div className="flex justify-between text-[7px] font-mono text-slate-400">
                        <span>6 AM</span>
                        <span>9 AM</span>
                        <span>12 PM</span>
                        <span>3 PM</span>
                        <span>6 PM</span>
                        <span>9 PM</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Battery Storage Configuration */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs space-y-4">
              <div className="flex items-center gap-2">
                <BatteryCharging className="h-4 w-4 text-emerald-600" />
                <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Battery Storage Configuration
                </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-3 text-xs">
                  <div>
                    <label className="text-[10px] font-semibold text-slate-500 block mb-0.5">
                      Total Capacity (kWh)
                    </label>
                    <input
                      type="number"
                      value={batteryCapacity}
                      onChange={(e) => setBatteryCapacity(Number(e.target.value))}
                      className="w-full rounded-lg border border-slate-200 p-1.5 font-mono text-xs"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-semibold text-slate-500 block mb-0.5">
                      Max Charge Power (kW)
                    </label>
                    <input
                      type="number"
                      value={maxChargePower}
                      onChange={(e) => setMaxChargePower(Number(e.target.value))}
                      className="w-full rounded-lg border border-slate-200 p-1.5 font-mono text-xs"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-semibold text-slate-500 block mb-0.5">
                      Max Discharge Power (kW)
                    </label>
                    <input
                      type="number"
                      value={maxDischargePower}
                      onChange={(e) => setMaxDischargePower(Number(e.target.value))}
                      className="w-full rounded-lg border border-slate-200 p-1.5 font-mono text-xs"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-semibold text-slate-500 block mb-0.5">
                      Initial State of Charge (%)
                    </label>
                    <input
                      type="number"
                      value={initialSoc}
                      onChange={(e) => setInitialSoc(Number(e.target.value))}
                      className="w-full rounded-lg border border-slate-200 p-1.5 font-mono text-xs"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] font-semibold text-slate-500 block mb-0.5">
                        Min SoC Limit (%)
                      </label>
                      <input
                        type="number"
                        value={minSoc}
                        onChange={(e) => setMinSoc(Number(e.target.value))}
                        className="w-full rounded-lg border border-slate-200 p-1.5 font-mono text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-semibold text-slate-500 block mb-0.5">
                        Max SoC Limit (%)
                      </label>
                      <input
                        type="number"
                        value={maxSoc}
                        onChange={(e) => setMaxSoc(Number(e.target.value))}
                        className="w-full rounded-lg border border-slate-200 p-1.5 font-mono text-xs"
                      />
                    </div>
                  </div>
                </div>

                {/* SoC Operating Range Graphic Battery Meter */}
                <div className="flex flex-col items-center justify-center p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-[10px] font-bold text-slate-600 block mb-2">
                    SoC Operating Range
                  </span>
                  <div className="relative w-14 h-32 rounded-xl border-2 border-slate-300 p-1 flex flex-col justify-end bg-white">
                    <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-5 h-2 bg-slate-400 rounded-t" />
                    <div
                      className="w-full bg-emerald-500 rounded-lg transition-all"
                      style={{ height: `${initialSoc}%` }}
                    />
                  </div>
                  <div className="mt-2 text-[10px] font-mono text-slate-500 space-y-0.5 text-center">
                    <div>100%</div>
                    <div className="font-bold text-emerald-700">{initialSoc}% (Initial)</div>
                    <div className="text-amber-700">{minSoc}% (Min)</div>
                    <div>0%</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Row 2: EV Charging Config (Left) & Load Configuration (Right) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* EV Charging Configuration */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs space-y-4">
              <div className="flex items-center gap-2">
                <Car className="h-4 w-4 text-emerald-600" />
                <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  EV Charging Configuration
                </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-3 text-xs">
                  <div>
                    <label className="text-[10px] font-semibold text-slate-500 block mb-0.5">
                      Number of Chargers
                    </label>
                    <input
                      type="text"
                      value={numChargers}
                      onChange={(e) => setNumChargers(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 p-1.5 font-mono text-xs"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-semibold text-slate-500 block mb-0.5">
                      Charger Power (each kW)
                    </label>
                    <input
                      type="number"
                      value={chargerPower}
                      onChange={(e) => setChargerPower(Number(e.target.value))}
                      className="w-full rounded-lg border border-slate-200 p-1.5 font-mono text-xs"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-semibold text-slate-500 block mb-0.5">
                      Total Charging Capacity (kW)
                    </label>
                    <input
                      type="number"
                      value={totalEvCapacity}
                      onChange={(e) => setTotalEvCapacity(Number(e.target.value))}
                      className="w-full rounded-lg border border-slate-200 p-1.5 font-mono text-xs"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-semibold text-slate-500 block mb-0.5">
                      Charging Schedule
                    </label>
                    <select className="w-full rounded-lg border border-slate-200 bg-white p-1.5 text-xs">
                      <option>Smart (Optimized)</option>
                      <option>Uncontrolled</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-semibold text-slate-500 block mb-0.5">
                      Allow Vehicle-to-Grid (V2G)
                    </label>
                    <select className="w-full rounded-lg border border-slate-200 bg-white p-1.5 text-xs">
                      <option>Enabled</option>
                      <option>Disabled</option>
                    </select>
                  </div>
                </div>

                {/* Typical EV Charging Profile Bar chart */}
                <div>
                  <span className="text-[10px] font-bold text-slate-600 block mb-1">
                    Typical EV Charging Profile
                  </span>
                  <div className="h-36 w-full pt-2 flex items-end justify-between gap-1">
                    {[5, 10, 8, 12, 22, 35, 48, 42, 30, 20].map((val, i) => (
                      <div key={i} className="flex-1 flex flex-col items-center">
                        <div
                          className="w-2.5 bg-emerald-600 rounded-t-xs"
                          style={{ height: `${(val / 50) * 100}%` }}
                        />
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-between text-[7px] font-mono text-slate-400 mt-1">
                    <span>12 AM</span>
                    <span>6 AM</span>
                    <span>12 PM</span>
                    <span>6 PM</span>
                    <span>12 AM</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Load Configuration */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs space-y-4">
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-emerald-600" />
                <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Load Configuration
                </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-3 text-xs">
                  <div>
                    <label className="text-[10px] font-semibold text-slate-500 block mb-0.5">
                      Base Demand (kW)
                    </label>
                    <input
                      type="number"
                      value={baseDemand}
                      onChange={(e) => setBaseDemand(Number(e.target.value))}
                      className="w-full rounded-lg border border-slate-200 p-1.5 font-mono text-xs"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-semibold text-slate-500 block mb-0.5">
                      Critical Load (kW)
                    </label>
                    <input
                      type="number"
                      value={criticalLoad}
                      onChange={(e) => setCriticalLoad(Number(e.target.value))}
                      className="w-full rounded-lg border border-slate-200 p-1.5 font-mono text-xs"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-semibold text-slate-500 block mb-0.5">
                      Flexible Load (kW)
                    </label>
                    <input
                      type="number"
                      value={flexibleLoad}
                      onChange={(e) => setFlexibleLoad(Number(e.target.value))}
                      className="w-full rounded-lg border border-slate-200 p-1.5 font-mono text-xs"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-semibold text-slate-500 block mb-0.5">
                      Non-Critical Load (kW)
                    </label>
                    <input
                      type="number"
                      value={nonCriticalLoad}
                      onChange={(e) => setNonCriticalLoad(Number(e.target.value))}
                      className="w-full rounded-lg border border-slate-200 p-1.5 font-mono text-xs"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-semibold text-slate-500 block mb-0.5">
                      Demand Profile
                    </label>
                    <select className="w-full rounded-lg border border-slate-200 bg-white p-1.5 text-xs">
                      <option>Residential + Commercial</option>
                      <option>Industrial Heavy</option>
                    </select>
                  </div>
                </div>

                {/* Load Distribution Donut Chart */}
                <div className="flex flex-col items-center justify-between p-2">
                  <span className="text-[10px] font-bold text-slate-600 block mb-1">
                    Load Distribution
                  </span>

                  <div className="relative w-28 h-28">
                    <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                      {/* Circle donut segments */}
                      <circle cx="50" cy="50" r="35" fill="none" stroke="#F43F5E" strokeWidth="16" strokeDasharray="66 154" />
                      <circle cx="50" cy="50" r="35" fill="none" stroke="#3B82F6" strokeWidth="16" strokeDasharray="88 132" strokeDashoffset="-66" />
                      <circle cx="50" cy="50" r="35" fill="none" stroke="#FBBF24" strokeWidth="16" strokeDasharray="66 154" strokeDashoffset="-154" />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                      <span className="font-mono font-bold text-xs text-slate-900 leading-tight">100 kW</span>
                      <span className="text-[8px] text-slate-400">Total</span>
                    </div>
                  </div>

                  <div className="text-[9px] space-y-1 text-slate-600 pt-2 font-mono">
                    <div className="flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-rose-500" />
                      <span>Critical: 30 kW (30%)</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-blue-500" />
                      <span>Flexible: 40 kW (40%)</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-amber-400" />
                      <span>Non-Critical: 30 kW (30%)</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Row 3: Grid Connection Settings, Simulation Parameters, Advanced Settings */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Grid Connection Settings */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs space-y-3">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
                <Radio className="h-4 w-4 text-emerald-600" /> Grid Connection Settings
              </div>
              <div className="space-y-2 text-xs">
                <div>
                  <label className="text-[10px] text-slate-400">Grid Connection</label>
                  <select className="w-full rounded-md border border-slate-200 p-1 text-xs">
                    <option>Enabled</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] text-slate-400">Max Import Power (kW)</label>
                  <input
                    type="number"
                    value={gridMaxImport}
                    onChange={(e) => setGridMaxImport(Number(e.target.value))}
                    className="w-full rounded-md border border-slate-200 p-1 font-mono text-xs"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400">Max Export Power (kW)</label>
                  <input
                    type="number"
                    value={gridMaxExport}
                    onChange={(e) => setGridMaxExport(Number(e.target.value))}
                    className="w-full rounded-md border border-slate-200 p-1 font-mono text-xs"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-slate-400">Grid Tariff (Import)</label>
                    <input
                      type="text"
                      value={tariffImport}
                      onChange={(e) => setTariffImport(e.target.value)}
                      className="w-full rounded-md border border-slate-200 p-1 font-mono text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400">Grid Tariff (Export)</label>
                    <input
                      type="text"
                      value={tariffExport}
                      onChange={(e) => setTariffExport(e.target.value)}
                      className="w-full rounded-md border border-slate-200 p-1 font-mono text-xs"
                    />
                  </div>
                </div>

                {/* Grid Import / Export Limits chart */}
                <div className="mt-1 border-t border-slate-100 pt-2">
                  <span className="mb-1 block text-[10px] font-bold text-slate-600">
                    Grid Import / Export Limits
                  </span>
                  <div className="h-20 w-full">
                    <svg viewBox="0 0 200 70" className="h-full w-full overflow-visible">
                      <line x1="30" y1="12" x2="192" y2="12" stroke="#F1F5F9" />
                      <line x1="30" y1="38" x2="192" y2="38" stroke="#CBD5E1" strokeDasharray="2 3" />
                      <line x1="30" y1="64" x2="192" y2="64" stroke="#F1F5F9" />

                      <path
                        d="M 30 27 L 70 25 L 110 28 L 150 26 L 190 27 L 190 38 L 30 38 Z"
                        fill="#D1FAE5"
                        opacity="0.45"
                      />
                      <path
                        d="M 30 27 L 70 25 L 110 28 L 150 26 L 190 27"
                        fill="none"
                        stroke="#10B981"
                        strokeWidth="1.8"
                        strokeDasharray="4 3"
                      />
                      <path
                        d="M 30 50 L 70 52 L 110 49 L 150 51 L 190 50"
                        fill="none"
                        stroke="#F59E0B"
                        strokeWidth="1.8"
                        strokeDasharray="4 3"
                      />

                      <text x="24" y="15" textAnchor="end" className="fill-slate-400 font-mono text-[6px]">
                        600
                      </text>
                      <text x="24" y="41" textAnchor="end" className="fill-slate-400 font-mono text-[6px]">
                        0
                      </text>
                      <text x="24" y="67" textAnchor="end" className="fill-slate-400 font-mono text-[6px]">
                        -600
                      </text>
                    </svg>
                  </div>
                  <div className="flex justify-between font-mono text-[7px] text-slate-400">
                    <span>12 AM</span>
                    <span>6 AM</span>
                    <span>12 PM</span>
                    <span>6 PM</span>
                    <span>12 AM</span>
                  </div>
                  <div className="mt-1 flex items-center gap-3 text-[8px] text-slate-500">
                    <span className="flex items-center gap-1">
                      <span className="inline-block w-2.5 border-b-2 border-emerald-500 border-dashed" />
                      Import Limit
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="inline-block w-2.5 border-b-2 border-amber-500 border-dashed" />
                      Export Limit
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Simulation Parameters */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs space-y-3">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
                <Sliders className="h-4 w-4 text-emerald-600" /> Simulation Parameters
              </div>
              <div className="space-y-2 text-xs">
                <div>
                  <label className="text-[10px] text-slate-400">Simulation Time Step</label>
                  <input
                    type="text"
                    defaultValue="15 minutes"
                    className="w-full rounded-md border border-slate-200 p-1 font-mono text-xs"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400">Simulation Duration</label>
                  <input
                    type="text"
                    defaultValue="24 hours"
                    className="w-full rounded-md border border-slate-200 p-1 font-mono text-xs"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400">Start Date & Time</label>
                  <input
                    type="text"
                    defaultValue="May 4, 2025 12:00 AM"
                    className="w-full rounded-md border border-slate-200 p-1 font-mono text-xs"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400">Weather Scenario</label>
                  <select className="w-full rounded-md border border-slate-200 p-1 text-xs">
                    <option>Mixed (Realistic)</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] text-slate-400">Unit System</label>
                  <input
                    type="text"
                    defaultValue="Metric (kW, kWh, °C)"
                    className="w-full rounded-md border border-slate-200 p-1 font-mono text-xs"
                  />
                </div>
              </div>
            </div>

            {/* Advanced Settings */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs space-y-3">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
                <Sliders className="h-4 w-4 text-emerald-600" /> Advanced Settings
              </div>
              <div className="space-y-3 text-xs pt-1">
                <div>
                  <div className="flex justify-between text-[11px] mb-1">
                    <span className="text-slate-600">Forecast Horizon</span>
                    <span className="font-mono font-bold">{forecastHorizonHours} hours</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="48"
                    value={forecastHorizonHours}
                    onChange={(e) => setForecastHorizonHours(Number(e.target.value))}
                    className="w-full accent-emerald-600"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-[11px] mb-1">
                    <span className="text-slate-600">Optimization Weight (Cost)</span>
                    <span className="font-mono font-bold">{weightCost}</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={weightCost}
                    onChange={(e) => setWeightCost(Number(e.target.value))}
                    className="w-full accent-emerald-600"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-[11px] mb-1">
                    <span className="text-slate-600">Optimization Weight (Emissions)</span>
                    <span className="font-mono font-bold">{weightEmissions}</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={weightEmissions}
                    onChange={(e) => setWeightEmissions(Number(e.target.value))}
                    className="w-full accent-emerald-600"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-[11px] mb-1">
                    <span className="text-slate-600">Optimization Weight (Reliability)</span>
                    <span className="font-mono font-bold">{weightReliability}</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={weightReliability}
                    onChange={(e) => setWeightReliability(Number(e.target.value))}
                    className="w-full accent-emerald-600"
                  />
                </div>
              </div>
            </div>
          </div>

            </>
          )}

          {activeTab === 'Simulation Settings' && <SimulationSettingsPanel />}
          {activeTab === 'Control & Optimization' && <ControlOptimizationPanel />}
          {activeTab === 'Forecasting Settings' && <ForecastingSettingsPanel />}
          {activeTab === 'Scenario Management' && <ScenarioManagementPanel />}
          {activeTab === 'System Settings' && <SystemSettingsPanel />}
        </div>

        {/* Right 3 Columns */}
        <div className="xl:col-span-3 space-y-6">
          {/* Quick Actions */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs space-y-3">
            <span className="text-xs font-bold text-slate-900 block">Quick Actions</span>
            <button
              onClick={handleSave}
              className="w-full flex items-center justify-center gap-2 rounded-lg bg-[#2E7D32] py-2.5 text-xs font-bold text-white shadow-xs hover:bg-[#256829] transition-all"
            >
              <Save className="h-3.5 w-3.5" />
              <span>{savedAlert ? 'Settings Saved!' : 'Save Settings'}</span>
            </button>

            <button
              onClick={() => {}}
              className="w-full flex items-center justify-center gap-2 rounded-lg border border-slate-200 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              <RotateCcw className="h-3.5 w-3.5 text-slate-500" />
              <span>Reset to Default</span>
            </button>

            <div className="grid grid-cols-2 gap-2 text-xs pt-1">
              <button
                onClick={() => {}}
                className="flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 p-2 font-semibold text-slate-700 hover:bg-slate-50"
              >
                <Upload className="h-3.5 w-3.5 text-slate-500" />
                <span>Load Preset</span>
              </button>
              <button
                onClick={() => {}}
                className="flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 p-2 font-semibold text-slate-700 hover:bg-slate-50"
              >
                <Download className="h-3.5 w-3.5 text-slate-500" />
                <span>Export Config</span>
              </button>
            </div>
          </div>

          {/* Configuration Presets */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900">Configuration Presets</span>
              <span className="text-[10px] text-slate-400 font-medium">See All &gt;</span>
            </div>

            <div className="space-y-2 text-xs">
              {presets.map((pr) => {
                const Icon = pr.icon;
                const isCurrent = activePreset === pr.name;

                return (
                  <button
                    key={pr.id}
                    onClick={() => handleSelectPreset(pr.id, pr.name)}
                    className={`flex items-start gap-2.5 w-full p-2.5 rounded-xl border text-left transition-all ${
                      isCurrent
                        ? 'border-emerald-500 bg-emerald-50/40 ring-1 ring-emerald-500'
                        : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 text-slate-700 shrink-0 mt-0.5">
                      <Icon className="h-3.5 w-3.5 text-emerald-600" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-slate-800 text-[11px]">{pr.name}</span>
                        {isCurrent ? (
                          <div className="h-4 w-4 rounded-full bg-emerald-600 text-white flex items-center justify-center">
                            <Check className="h-2.5 w-2.5 stroke-[3]" />
                          </div>
                        ) : (
                          <div className="h-3.5 w-3.5 rounded-full border border-slate-300" />
                        )}
                      </div>
                      <div className="text-[10px] text-slate-400 leading-tight mt-0.5">{pr.desc}</div>
                    </div>
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => {}}
              className="w-full flex items-center justify-center gap-1.5 rounded-lg border border-dashed border-slate-300 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 mt-2"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Save Current as Preset</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
