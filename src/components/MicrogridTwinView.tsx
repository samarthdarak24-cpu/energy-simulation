import React, { useState } from 'react';
import {
  Sun,
  Zap,
  BatteryCharging,
  Radio,
  Play,
  Pause,
  RotateCcw,
  AlertTriangle,
  Download,
  Calendar,
  ChevronDown,
  Building2,
  Home,
  Car,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react';
import { useMicrogrid } from '../context/MicrogridContext';

const FlowConnector: React.FC<{
  value: string;
  color: string;
  direction?: 'right' | 'left';
}> = ({ value, color, direction = 'right' }) => (
  <div className="hidden w-16 shrink-0 flex-col items-center justify-center md:flex">
    <span className={`font-mono text-[9px] font-bold ${color}`}>{value}</span>
    <svg viewBox="0 0 64 8" className="h-2 w-full" preserveAspectRatio="none" aria-hidden="true">
      <line
        x1={direction === 'right' ? 0 : 64}
        y1="4"
        x2={direction === 'right' ? 56 : 8}
        y2="4"
        stroke="#6EE7B7"
        strokeWidth="1.5"
      />
      <path
        d={direction === 'right' ? 'M53 1 L60 4 L53 7' : 'M11 1 L4 4 L11 7'}
        fill="none"
        stroke="#10B981"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  </div>
);

export const MicrogridTwinView: React.FC = () => {
  const {
    telemetry,
    runRecoveryLoop,
    isSimulating,
    injectFault,
    clearFault,
    resetAll,
    activeFault,
    faultSeverity,
    exportAuditCsv,
  } = useMicrogrid();

  const [dateRange] = useState('Apr 28, 2025 – May 4, 2025');
  const [liveMode, setLiveMode] = useState(true);
  const [activeForecastTab, setActiveForecastTab] = useState<'solar' | 'demand' | 'shortage'>('solar');
  const [isPaused, setIsPaused] = useState(false);
  const [recoveryEnabled, setRecoveryEnabled] = useState(true);

  // Hourly metrics (6 AM to 9 PM)
  const hourlyMetrics = [
    { hour: '6 AM', gen: 15, dem: 45 },
    { hour: '9 AM', gen: 68, dem: 72 },
    { hour: '12 PM', gen: 128, dem: 105 },
    { hour: '3 PM', gen: 110, dem: 95 },
    { hour: '6 PM', gen: 45, dem: 115 },
    { hour: '9 PM', gen: 8, dem: 88 },
  ];

  // Consumer split follows the reference proportions and always sums to total demand
  const total = telemetry.totalDemand;
  const homesKw = Math.round((total * 52) / 105);
  const hospitalKw = Math.round((total * 28) / 105);
  const evKw = Math.round((total * 18) / 105);
  const flexibleKw = Math.max(0, total - homesKw - hospitalKw - evKw);

  const netBalance = telemetry.netBalanceKw;
  const netLabel = `${netBalance >= 0 ? '+' : ''}${netBalance} kW`;
  const batteryLabel =
    telemetry.batteryPower >= 0
      ? `${telemetry.batteryPower} kW (discharge)`
      : `${Math.abs(telemetry.batteryPower)} kW (charge)`;

  const gridConnected = telemetry.gridStatus === 'connected';
  const simStatus = isPaused ? 'Simulation paused' : isSimulating ? 'Recovery loop running' : 'Simulation running';

  return (
    <div className="flex-1 p-6 space-y-6 max-w-[1600px] mx-auto text-slate-800">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Microgrid Digital Twin
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time simulation of your renewable energy microgrid
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Date Range Dropdown */}
          <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs">
            <Calendar className="h-3.5 w-3.5 text-slate-400" />
            <span>{dateRange}</span>
            <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
          </div>

          {/* Live indicator button */}
          <button
            onClick={() => setLiveMode(!liveMode)}
            className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold shadow-2xs ${
              isPaused
                ? 'border-slate-200 bg-slate-50 text-slate-600'
                : 'border-emerald-200 bg-emerald-50/70 text-emerald-800'
            }`}
          >
            <span
              className={`h-2 w-2 rounded-full ${
                isPaused ? 'bg-slate-400' : 'bg-emerald-500 animate-pulse'
              }`}
            />
            <span>{isPaused ? 'Paused' : 'Live'}</span>
            <ChevronDown className={`h-3.5 w-3.5 ${isPaused ? 'text-slate-500' : 'text-emerald-600'}`} />
          </button>
        </div>
      </div>

      {/* 4 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Solar Generation */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
              <Sun className="h-4 w-4 text-emerald-600" />
              <span>Solar Generation</span>
            </div>
            <div className="text-2xl font-bold tracking-tight text-slate-900 font-mono">
              {telemetry.solarGeneration} kW
            </div>
            <div
              className={`text-[11px] font-medium ${
                telemetry.solarPrevChange >= 0 ? 'text-emerald-600' : 'text-rose-600'
              }`}
            >
              {telemetry.solarPrevChange >= 0 ? '↑' : '↓'} {Math.abs(telemetry.solarPrevChange)}%{' '}
              <span className="text-slate-400 font-normal">vs. previous 7 days</span>
            </div>
          </div>
          <div className="w-16 h-8">
            <svg viewBox="0 0 60 30" className="w-full h-full">
              <path
                d="M 0 24 Q 15 28 30 14 T 60 6"
                fill="none"
                stroke="#10B981"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </div>
        </div>

        {/* Total Demand */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
              <Zap className="h-4 w-4 text-emerald-600" />
              <span>Total Demand</span>
            </div>
            <div className="text-2xl font-bold tracking-tight text-slate-900 font-mono">
              {telemetry.totalDemand} kW
            </div>
            <div className="text-[11px] font-medium text-emerald-600">
              ↑ {telemetry.demandPrevChange}%{' '}
              <span className="text-slate-400 font-normal">vs. previous 7 days</span>
            </div>
          </div>
          <div className="w-16 h-8">
            <svg viewBox="0 0 60 30" className="w-full h-full">
              <path
                d="M 0 20 Q 20 22 40 12 T 60 8"
                fill="none"
                stroke="#10B981"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </div>
        </div>

        {/* Battery SoC */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
              <BatteryCharging className="h-4 w-4 text-emerald-600" />
              <span>Battery SoC</span>
            </div>
            <div className="text-2xl font-bold tracking-tight text-slate-900 font-mono">
              {telemetry.batterySoc}%
            </div>
            <div className="text-[11px] font-medium text-emerald-600">
              ↑ {telemetry.batterySocChange}%{' '}
              <span className="text-slate-400 font-normal">vs. previous 7 days</span>
            </div>
          </div>
          <div className="w-16 h-8">
            <svg viewBox="0 0 60 30" className="w-full h-full">
              <path
                d="M 0 22 Q 25 24 45 10 T 60 8"
                fill="none"
                stroke="#10B981"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </div>
        </div>

        {/* Grid Import / Export */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
              <Radio className="h-4 w-4 text-emerald-600" />
              <span>Grid Import / Export</span>
            </div>
            <div className="text-2xl font-bold tracking-tight text-slate-900 font-mono">
              {telemetry.gridPower} kW
            </div>
            <div className="text-[11px] font-medium text-slate-500">
              → 0% <span className="text-slate-400 font-normal">vs. previous 7 days</span>
            </div>
          </div>
          <div className="w-16 h-8 flex items-center">
            <div className="w-full h-0.5 bg-slate-300" />
          </div>
        </div>
      </div>

      {/* Main Middle Row: Energy Flow (Left/Center) + Right Column Panels */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* Left 9 Columns */}
        <div className="xl:col-span-9 space-y-6">
          {/* Microgrid Energy Flow Card */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-4">
              <h2 className="text-sm font-bold text-slate-900">Microgrid Energy Flow</h2>
              <div className="flex items-center gap-4 text-xs font-medium text-slate-600">
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  Power Flow
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-blue-500" />
                  Charging
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-amber-500" />
                  Discharging
                </span>
              </div>
            </div>

            {/* Diagram container */}
            <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-4">
              <div className="grid grid-cols-1 items-center gap-2 md:grid-cols-[1fr_auto_1fr]">
                {/* Left Source Nodes */}
                <div className="space-y-3">
                  {/* Solar PV */}
                  <div className="flex items-center">
                    <div className="flex flex-1 items-center justify-between rounded-xl border border-slate-200 bg-white p-3 shadow-2xs">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                          <Sun className="h-5 w-5" />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-slate-800">Solar PV</div>
                          <div className="text-xs font-mono font-bold text-slate-900">
                            {telemetry.solarGeneration} kW
                          </div>
                          <div className="text-[10px] text-emerald-600 flex items-center gap-1">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Active
                          </div>
                        </div>
                      </div>
                      <span className="font-mono text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
                        {telemetry.solarGeneration} kW
                      </span>
                    </div>
                    <FlowConnector value={`${telemetry.solarGeneration} kW`} color="text-emerald-600" />
                  </div>

                  {/* Battery Storage */}
                  <div className="flex items-center">
                    <div className="flex flex-1 items-center justify-between rounded-xl border border-slate-200 bg-white p-3 shadow-2xs">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                          <BatteryCharging className="h-5 w-5" />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-slate-800">Battery Storage</div>
                          <div className="text-xs font-mono text-slate-500">
                            {telemetry.batterySoc}% SoC · {batteryLabel}
                          </div>
                          <div className="text-[10px] text-emerald-600 flex items-center gap-1">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />{' '}
                            {telemetry.batteryPower > 0 ? 'Discharging' : 'Standby'}
                          </div>
                        </div>
                      </div>
                      <span className="font-mono text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
                        {telemetry.batteryPower} kW
                      </span>
                    </div>
                    <FlowConnector
                      value={`${telemetry.batteryPower} kW`}
                      color={telemetry.batteryPower > 0 ? 'text-amber-600' : 'text-slate-500'}
                    />
                  </div>

                  {/* Grid */}
                  <div className="flex items-center">
                    <div className="flex flex-1 items-center justify-between rounded-xl border border-slate-200 bg-white p-3 shadow-2xs">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                          <Radio className="h-5 w-5" />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-slate-800">Grid</div>
                          <div className="text-xs font-mono text-slate-500">
                            {telemetry.gridPower} kW
                          </div>
                          <div
                            className={`text-[10px] flex items-center gap-1 ${
                              gridConnected ? 'text-emerald-600' : 'text-rose-600'
                            }`}
                          >
                            <span
                              className={`h-1.5 w-1.5 rounded-full ${
                                gridConnected ? 'bg-emerald-500' : 'bg-rose-500'
                              }`}
                            />{' '}
                            {gridConnected ? 'Connected' : 'Islanded'}
                          </div>
                        </div>
                      </div>
                      <span className="font-mono text-xs font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">
                        {telemetry.gridPower} kW
                      </span>
                    </div>
                    <FlowConnector
                      value={`${telemetry.gridPower} kW`}
                      color={telemetry.gridPower > 0 ? 'text-emerald-600' : 'text-slate-400'}
                    />
                  </div>
                </div>

                {/* Central Energy Hub */}
                <div className="flex flex-col items-center justify-center p-2">
                  <div className="relative w-full max-w-[190px] rounded-2xl border-2 border-emerald-500 bg-white p-5 text-center shadow-sm">
                    <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                      <Zap className="h-6 w-6" />
                    </div>
                    <div className="text-xs font-bold text-slate-900">Energy Hub</div>
                    <div className="mt-0.5 text-[11px] text-slate-500">Power Balance</div>
                    <div
                      className={`mt-2 rounded-full py-1 px-3 text-xs font-mono font-bold ${
                        netBalance >= 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                      }`}
                    >
                      {netLabel}
                    </div>
                  </div>
                </div>

                {/* Right Consumption Nodes */}
                <div className="space-y-3">
                  {/* Homes */}
                  <div className="flex items-center">
                    <FlowConnector value={`${homesKw} kW`} color="text-emerald-600" direction="left" />
                    <div className="flex flex-1 items-center justify-between rounded-xl border border-slate-200 bg-white p-2.5 shadow-2xs">
                      <span className="font-mono text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
                        {homesKw} kW
                      </span>
                      <div className="flex items-center gap-2.5 text-right">
                        <div>
                          <div className="text-xs font-bold text-slate-800">Homes</div>
                          <div className="text-xs font-mono text-slate-500">{homesKw} kW</div>
                          <div className="text-[10px] text-emerald-600">● Active</div>
                        </div>
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                          <Home className="h-4 w-4" />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Hospital */}
                  <div className="flex items-center">
                    <FlowConnector
                      value={`${hospitalKw} kW`}
                      color="text-emerald-600"
                      direction="left"
                    />
                    <div className="flex flex-1 items-center justify-between rounded-xl border border-slate-200 bg-white p-2.5 shadow-2xs">
                      <span className="font-mono text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
                        {hospitalKw} kW
                      </span>
                      <div className="flex items-center gap-2.5 text-right">
                        <div>
                          <div className="text-xs font-bold text-slate-800">Hospital</div>
                          <div className="text-xs font-mono text-slate-500">{hospitalKw} kW</div>
                          <div className="text-[10px] text-emerald-600">● Active</div>
                        </div>
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                          <Building2 className="h-4 w-4" />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* EV Charging */}
                  <div className="flex items-center">
                    <FlowConnector value={`${evKw} kW`} color="text-blue-600" direction="left" />
                    <div className="flex flex-1 items-center justify-between rounded-xl border border-slate-200 bg-white p-2.5 shadow-2xs">
                      <span className="font-mono text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">
                        {evKw} kW
                      </span>
                      <div className="flex items-center gap-2.5 text-right">
                        <div>
                          <div className="text-xs font-bold text-slate-800">EV Charging</div>
                          <div className="text-xs font-mono text-slate-500">{evKw} kW</div>
                          <div className="text-[10px] text-blue-600">● Charging</div>
                        </div>
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                          <Car className="h-4 w-4" />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Flexible Loads */}
                  <div className="flex items-center">
                    <FlowConnector value={`${flexibleKw} kW`} color="text-emerald-600" direction="left" />
                    <div className="flex flex-1 items-center justify-between rounded-xl border border-slate-200 bg-white p-2.5 shadow-2xs">
                      <span className="font-mono text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
                        {flexibleKw} kW
                      </span>
                      <div className="flex items-center gap-2.5 text-right">
                        <div>
                          <div className="text-xs font-bold text-slate-800">Flexible Loads</div>
                          <div className="text-xs font-mono text-slate-500">{flexibleKw} kW</div>
                          <div className="text-[10px] text-emerald-600">● Active</div>
                        </div>
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                          <Zap className="h-4 w-4" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom 3 Cards: Real-time Metrics, Forecast (24h), Recent Events */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Real-time Metrics */}
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-slate-900">Real-time Metrics</span>
                <div className="flex items-center gap-2 text-[10px] text-slate-500">
                  <span className="flex items-center gap-1">
                    <span className="h-2 w-2 rounded-full bg-emerald-500" /> Gen
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="h-2 w-2 rounded-full bg-slate-400" /> Dem
                  </span>
                </div>
              </div>

              {/* Bar Chart */}
              <div className="h-36 flex items-end justify-between gap-1 pt-2">
                {hourlyMetrics.map((hm) => (
                  <div key={hm.hour} className="flex-1 flex flex-col items-center gap-1">
                    <div className="w-full flex items-end justify-center gap-1 h-28">
                      <div
                        className="w-2.5 bg-emerald-500 rounded-t-xs"
                        style={{ height: `${(hm.gen / 140) * 100}%` }}
                      />
                      <div
                        className="w-2.5 bg-slate-300 rounded-t-xs"
                        style={{ height: `${(hm.dem / 140) * 100}%` }}
                      />
                    </div>
                    <span className="text-[9px] font-mono text-slate-400">{hm.hour}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Forecast (Next 24 Hours) */}
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-900">Forecast (Next 24 Hours)</span>
                  <div className="flex rounded-md bg-slate-100 p-0.5 text-[10px] font-medium">
                    {(['solar', 'demand', 'shortage'] as const).map((tab) => (
                      <button
                        key={tab}
                        onClick={() => setActiveForecastTab(tab)}
                        className={`px-2 py-0.5 rounded capitalize ${
                          activeForecastTab === tab
                            ? 'bg-emerald-600 text-white font-semibold'
                            : 'text-slate-600'
                        }`}
                      >
                        {tab}
                      </button>
                    ))}
                  </div>
                </div>

                {/* SVG Mountain Curve */}
                <div className="h-24 w-full">
                  <svg className="w-full h-full overflow-visible" viewBox="0 0 180 70">
                    <path
                      d={
                        activeForecastTab === 'solar'
                          ? 'M 0 65 Q 40 60 70 30 T 110 20 T 150 50 L 180 65'
                          : activeForecastTab === 'demand'
                          ? 'M 0 55 Q 30 50 60 40 T 110 18 T 150 45 L 180 60'
                          : 'M 0 62 Q 40 55 80 48 T 120 40 T 160 55 L 180 62'
                      }
                      fill="#D1FAE5"
                      opacity="0.6"
                    />
                    <path
                      d={
                        activeForecastTab === 'solar'
                          ? 'M 0 65 Q 40 60 70 30 T 110 20 T 150 50 L 180 65'
                          : activeForecastTab === 'demand'
                          ? 'M 0 55 Q 30 50 60 40 T 110 18 T 150 45 L 180 60'
                          : 'M 0 62 Q 40 55 80 48 T 120 40 T 160 55 L 180 62'
                      }
                      fill="none"
                      stroke="#10B981"
                      strokeWidth="2"
                    />
                    <path
                      d="M 0 50 Q 50 48 90 35 T 180 40"
                      fill="none"
                      stroke="#94A3B8"
                      strokeWidth="1.5"
                      strokeDasharray="3 3"
                    />
                  </svg>
                  <div className="flex justify-between text-[8px] font-mono text-slate-400">
                    <span>12 AM</span>
                    <span>6 AM</span>
                    <span>12 PM</span>
                    <span>6 PM</span>
                    <span>12 AM</span>
                  </div>
                </div>
              </div>

              {/* Peak summary stats */}
              <div className="grid grid-cols-3 gap-1 pt-2 border-t border-slate-100 text-center text-xs">
                <div>
                  <div className="text-[9px] text-slate-400">Peak Gen</div>
                  <div className="font-mono font-bold text-slate-900">168 kW</div>
                </div>
                <div>
                  <div className="text-[9px] text-slate-400">Peak Demand</div>
                  <div className="font-mono font-bold text-slate-900">142 kW</div>
                </div>
                <div>
                  <div className="text-[9px] text-slate-400">Shortage</div>
                  <div className="font-mono font-bold text-emerald-600">
                    {telemetry.unservedEnergyKwh > 0 ? `${telemetry.unservedEnergyKwh} kWh` : '0 kW'}
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Events */}
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-900">Recent Events</span>
                <span className="text-[10px] text-slate-400 font-medium">View All &gt;</span>
              </div>
              <div className="space-y-2 text-[11px]">
                <div className="flex items-center justify-between">
                  <div className="truncate">
                    <span className="font-mono text-slate-400 text-[10px]">10:24 AM </span>
                    <span className="text-slate-800">Solar generation drop</span>
                  </div>
                  <span className="rounded-md bg-rose-50 px-1.5 py-0.5 text-[9px] font-semibold text-rose-700">
                    Detected
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="truncate">
                    <span className="font-mono text-slate-400 text-[10px]">09:17 AM </span>
                    <span className="text-slate-800">Recovery action applied</span>
                  </div>
                  <span className="rounded-md bg-emerald-50 px-1.5 py-0.5 text-[9px] font-semibold text-emerald-700">
                    Recovered
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="truncate">
                    <span className="font-mono text-slate-400 text-[10px]">08:32 AM </span>
                    <span className="text-slate-800">Battery SoC low warning</span>
                  </div>
                  <span className="rounded-md bg-amber-50 px-1.5 py-0.5 text-[9px] font-semibold text-amber-700">
                    Warning
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="truncate">
                    <span className="font-mono text-slate-400 text-[10px]">04:21 PM </span>
                    <span className="text-slate-800">EV charging peak</span>
                  </div>
                  <span className="rounded-md bg-emerald-50 px-1.5 py-0.5 text-[9px] font-semibold text-emerald-700">
                    Resolved
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="truncate">
                    <span className="font-mono text-slate-400 text-[10px]">11:03 AM </span>
                    <span className="text-slate-800">Grid connection restored</span>
                  </div>
                  <span className="rounded-md bg-blue-50 px-1.5 py-0.5 text-[9px] font-semibold text-blue-700">
                    Info
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right 3 Columns */}
        <div className="xl:col-span-3 space-y-6">
          {/* Grid Status & System Health */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-[11px] font-medium text-slate-500">Grid Status</div>
                <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5 mt-0.5">
                  <span
                    className={`h-2 w-2 rounded-full ${
                      gridConnected ? 'bg-emerald-500' : 'bg-rose-500'
                    }`}
                  />{' '}
                  {gridConnected ? 'Connected' : 'Islanded'}
                </div>
              </div>
              <div className="text-right">
                <div className="text-[11px] font-medium text-slate-500">System Health</div>
                <div className="text-xs font-bold text-emerald-700 flex items-center gap-1 mt-0.5">
                  <span>✦ {telemetry.constraintViolations === 0 ? 'Healthy' : 'Degraded'}</span>
                </div>
              </div>
            </div>

            {/* Asset Availability percentage list */}
            <div className="pt-2 border-t border-slate-100 space-y-1.5 text-xs">
              <span className="text-[11px] font-semibold text-slate-600 block mb-1">
                Asset Availability
              </span>
              <div className="flex justify-between items-center text-slate-600">
                <span className="flex items-center gap-1.5">
                  <Sun className="h-3.5 w-3.5 text-emerald-600" /> Solar PV
                </span>
                <span className="font-mono font-bold text-slate-900">100%</span>
              </div>
              <div className="flex justify-between items-center text-slate-600">
                <span className="flex items-center gap-1.5">
                  <BatteryCharging className="h-3.5 w-3.5 text-emerald-600" /> Battery
                </span>
                <span className="font-mono font-bold text-slate-900">100%</span>
              </div>
              <div className="flex justify-between items-center text-slate-600">
                <span className="flex items-center gap-1.5">
                  <Car className="h-3.5 w-3.5 text-emerald-600" /> EV Chargers
                </span>
                <span className="font-mono font-bold text-slate-900">92%</span>
              </div>
              <div className="flex justify-between items-center text-slate-600">
                <span className="flex items-center gap-1.5">
                  <Radio className="h-3.5 w-3.5 text-emerald-600" /> Grid
                </span>
                <span className="font-mono font-bold text-slate-900">100%</span>
              </div>
              <div className="flex justify-between items-center text-slate-600">
                <span className="flex items-center gap-1.5">
                  <Building2 className="h-3.5 w-3.5 text-emerald-600" /> Critical Loads
                </span>
                <span className="font-mono font-bold text-slate-900">100%</span>
              </div>
              <div className="flex justify-between items-center text-slate-600">
                <span className="flex items-center gap-1.5">
                  <Home className="h-3.5 w-3.5 text-emerald-600" /> Flexible Loads
                </span>
                <span className="font-mono font-bold text-slate-900">90%</span>
              </div>
            </div>
          </div>

          {/* Asset Details */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900">Asset Details</span>
              <span className="text-[10px] text-slate-400 font-medium">View All &gt;</span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between p-1.5 rounded-lg hover:bg-slate-50">
                <div className="flex items-center gap-2">
                  <Sun className="h-4 w-4 text-emerald-600" />
                  <div>
                    <div className="font-semibold text-slate-900 text-xs">Solar PV</div>
                    <div className="text-[10px] text-slate-400 font-mono">
                      {telemetry.solarGeneration} kW | 100%
                    </div>
                  </div>
                </div>
                <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                  Online
                </span>
              </div>

              <div className="flex items-center justify-between p-1.5 rounded-lg hover:bg-slate-50">
                <div className="flex items-center gap-2">
                  <BatteryCharging className="h-4 w-4 text-emerald-600" />
                  <div>
                    <div className="font-semibold text-slate-900 text-xs">Battery Storage</div>
                    <div className="text-[10px] text-slate-400 font-mono">
                      {telemetry.batteryPower} kW | {telemetry.batterySoc}% SoC
                    </div>
                  </div>
                </div>
                <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                  Online
                </span>
              </div>

              <div className="flex items-center justify-between p-1.5 rounded-lg hover:bg-slate-50">
                <div className="flex items-center gap-2">
                  <Car className="h-4 w-4 text-emerald-600" />
                  <div>
                    <div className="font-semibold text-slate-900 text-xs">EV Chargers</div>
                    <div className="text-[10px] text-slate-400 font-mono">
                      {telemetry.evChargingPower} kW | 2/4 active
                    </div>
                  </div>
                </div>
                <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                  Online
                </span>
              </div>

              <div className="flex items-center justify-between p-1.5 rounded-lg hover:bg-slate-50">
                <div className="flex items-center gap-2">
                  <Radio className="h-4 w-4 text-emerald-600" />
                  <div>
                    <div className="font-semibold text-slate-900 text-xs">Grid Connection</div>
                    <div className="text-[10px] text-slate-400 font-mono">
                      {telemetry.gridPower} kW | {gridConnected ? 'Connected' : 'Islanded'}
                    </div>
                  </div>
                </div>
                <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                  Online
                </span>
              </div>

              <div className="flex items-center justify-between p-1.5 rounded-lg hover:bg-slate-50">
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-emerald-600" />
                  <div>
                    <div className="font-semibold text-slate-900 text-xs">Critical Loads</div>
                    <div className="text-[10px] text-slate-400 font-mono">
                      {telemetry.criticalLoadsPower} kW | {telemetry.criticalLoadsServed}%
                    </div>
                  </div>
                </div>
                <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                  Online
                </span>
              </div>

              <div className="flex items-center justify-between p-1.5 rounded-lg hover:bg-slate-50">
                <div className="flex items-center gap-2">
                  <Home className="h-4 w-4 text-emerald-600" />
                  <div>
                    <div className="font-semibold text-slate-900 text-xs">Flexible Loads</div>
                    <div className="text-[10px] text-slate-400 font-mono">
                      {telemetry.flexibleLoadsPower} kW | 90%
                    </div>
                  </div>
                </div>
                <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                  Online
                </span>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs space-y-3">
            <span className="text-xs font-bold text-slate-900 block">Quick Actions</span>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                onClick={() => {
                  setIsPaused(false);
                  runRecoveryLoop();
                }}
                disabled={isSimulating}
                className="flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 p-2.5 font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              >
                <Play className="h-3.5 w-3.5 text-emerald-600 fill-current" />
                <span>Start Sim</span>
              </button>

              <button
                onClick={() => setIsPaused(true)}
                className={`flex items-center justify-center gap-1.5 rounded-lg border p-2.5 font-semibold hover:bg-slate-50 ${
                  isPaused
                    ? 'border-amber-300 bg-amber-50/60 text-amber-800'
                    : 'border-slate-200 text-slate-700'
                }`}
              >
                <Pause className="h-3.5 w-3.5 text-slate-600" />
                <span>{isPaused ? 'Paused' : 'Pause'}</span>
              </button>

              <button
                onClick={() => {
                  resetAll();
                  setIsPaused(false);
                }}
                className="flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 p-2.5 font-semibold text-slate-700 hover:bg-slate-50"
              >
                <RotateCcw className="h-3.5 w-3.5 text-slate-600" />
                <span>Reset</span>
              </button>

              <button
                onClick={() => injectFault('solar_drop', 50)}
                className="flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 p-2.5 font-semibold text-slate-700 hover:bg-amber-50 hover:border-amber-300"
              >
                <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
                <span>Inject Fault</span>
              </button>
            </div>

            {activeFault && (
              <div className="flex items-center justify-between p-2 rounded-xl border border-rose-200 bg-rose-50/70 text-xs">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="h-2 w-2 rounded-full bg-rose-500 shrink-0" />
                  <span className="font-semibold text-rose-900 truncate">
                    {activeFault.name} ({faultSeverity}%)
                  </span>
                </div>
                <button
                  onClick={clearFault}
                  className="shrink-0 text-[11px] font-semibold text-rose-700 hover:underline pl-2"
                >
                  Clear
                </button>
              </div>
            )}

            <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
              <button
                onClick={() => setRecoveryEnabled(!recoveryEnabled)}
                className="flex items-center gap-2 font-medium text-slate-700"
              >
                {recoveryEnabled ? (
                  <ToggleRight className="h-5 w-5 text-emerald-600" />
                ) : (
                  <ToggleLeft className="h-5 w-5 text-slate-400" />
                )}
                <span>{recoveryEnabled ? 'Recovery On' : 'Recovery Off'}</span>
              </button>

              <button
                onClick={exportAuditCsv}
                className="flex items-center gap-1.5 text-slate-600 hover:text-slate-900"
              >
                <Download className="h-4 w-4" />
                <span>Export Data</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Footer bar */}
      <div className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs text-slate-500 flex flex-wrap items-center gap-3">
        <span
          className={`flex items-center gap-1.5 font-semibold ${
            isPaused ? 'text-amber-700' : 'text-emerald-700'
          }`}
        >
          <span
            className={`h-2 w-2 rounded-full ${
              isPaused ? 'bg-amber-500' : 'bg-emerald-500 animate-pulse'
            }`}
          />
          {simStatus}
        </span>
        <span className="text-slate-300">|</span>
        <span>Scenario: Normal Operation</span>
        <span className="text-slate-300">|</span>
        <span className="font-mono text-[11px]">Last updated: May 4, 2025 10:24 AM</span>
      </div>
    </div>
  );
};
