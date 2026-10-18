import React, { useState } from 'react';
import {
  Sun,
  Zap,
  BatteryCharging,
  Radio,
  CheckCircle2,
  Calendar,
  ChevronDown,
  ChevronRight,
  AlertTriangle,
  Play,
  Pause,
  RotateCcw,
  Sliders,
  Check,
  ShieldCheck,
  Clock,
  Car,
  Home,
  Layers,
  Leaf,
} from 'lucide-react';
import { useMicrogrid } from '../context/MicrogridContext';

export const RecoveryControlView: React.FC = () => {
  const {
    telemetry,
    runRecoveryLoop,
    isSimulating,
    injectFault,
    clearFault,
    resetAll,
    activeFault,
    faultSeverity,
    pipelineSteps,
    events,
    appliedActions,
    setActivePage,
  } = useMicrogrid();

  const [dateRange] = useState('Apr 28, 2025 – May 4, 2025');
  const [timeView] = useState('Day');
  const [autoRecovery, setAutoRecovery] = useState(true);
  const [paused, setPaused] = useState(false);

  const shortageKw = Math.max(0, telemetry.totalDemand - telemetry.totalSupply);
  const impactLevel = faultSeverity >= 70 ? 'High' : faultSeverity >= 40 ? 'Medium' : 'Low';
  const faultTitle = activeFault ? activeFault.name : 'Solar Generation Loss';
  const faultDescription = activeFault
    ? `${activeFault.impactSummary} Detected at: May 3, 2025 – 12:14 PM`
    : 'Solar output dropped by 60% due to cloud cover / panel fault (simulated). Detected at: May 3, 2025 – 12:14 PM';

  const recoveryPipelineSteps = [
    {
      num: 1,
      title: 'Detect',
      subtitle: 'Fault identified',
      time: '12:14 PM',
      status: 'completed',
    },
    {
      num: 2,
      title: 'Predict',
      subtitle: 'Forecasted shortage',
      time: '12:15 PM',
      status: 'completed',
    },
    {
      num: 3,
      title: 'Reallocate',
      subtitle: 'Optimizing resources',
      time: '12:16 PM',
      status: 'completed',
    },
    {
      num: 4,
      title: 'Recover',
      subtitle: 'Applying actions',
      time: '12:18 PM',
      status: 'active',
    },
    {
      num: 5,
      title: 'Verify',
      subtitle: 'Checking results',
      time: '12:22 PM',
      status: 'pending',
    },
  ];

  const recoveryLogs = [
    {
      time: '12:14 PM',
      event: 'Fault Detected',
      details: 'Solar generation dropped by 60% (from 128 kW to 51 kW)',
      status: 'Detected',
      statusColor: 'rose',
    },
    {
      time: '12:15 PM',
      event: 'Prediction Completed',
      details: 'Forecasted shortage: 18 kW (next 2 hours)',
      status: 'Completed',
      statusColor: 'emerald',
    },
    {
      time: '12:16 PM',
      event: 'Optimization',
      details: 'Selected battery + EV defer + load shift',
      status: 'Completed',
      statusColor: 'emerald',
    },
    {
      time: '12:18 PM',
      event: 'Recovery Applied',
      details: 'Resources reallocated. Checking constraints...',
      status: 'In Progress',
      statusColor: 'blue',
    },
  ];

  const recentRecoveryEvents = [
    {
      time: '12:14',
      title: 'Fault Detected',
      desc: 'Solar generation loss (60%)',
      icon: AlertTriangle,
      color: 'text-rose-500',
    },
    {
      time: '12:15',
      title: 'Forecast Completed',
      desc: 'Predicted shortage: 18 kW',
      icon: CheckCircle2,
      color: 'text-emerald-600',
    },
    {
      time: '12:16',
      title: 'Recovery Action Selected',
      desc: 'Battery + EV defer + Load shift',
      icon: Layers,
      color: 'text-emerald-600',
    },
    {
      time: '12:18',
      title: 'Action Applied',
      desc: 'Reallocation in progress',
      icon: Sliders,
      color: 'text-blue-500',
    },
    {
      time: '12:22',
      title: 'Verification Pending',
      desc: 'Checking power balance...',
      icon: Clock,
      color: 'text-slate-400',
    },
  ];

  return (
    <div className="flex-1 p-6 space-y-6 max-w-[1600px] mx-auto text-slate-800">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Recovery Control Centre
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Automated fault detection, prediction, resource reallocation and recovery verification.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs">
            <Calendar className="h-3.5 w-3.5 text-slate-400" />
            <span>{dateRange}</span>
            <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
          </div>

          <div className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs">
            <span>{timeView}</span>
            <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
          </div>

          <button
            onClick={() => setAutoRecovery(!autoRecovery)}
            className="flex items-center gap-2 rounded-lg bg-emerald-700 px-3 py-1.5 text-xs font-bold text-white shadow-2xs hover:bg-emerald-800"
          >
            <span>Auto Recovery: {autoRecovery ? 'ON' : 'OFF'}</span>
            <span className="h-2 w-2 rounded-full bg-white animate-pulse" />
          </button>
        </div>
      </div>

      {/* 5 Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {/* Solar Generation */}
        <div className="rounded-2xl border border-slate-200 bg-white p-3.5 shadow-2xs flex items-center justify-between">
          <div>
            <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-medium">
              <Sun className="h-3.5 w-3.5 text-emerald-600" /> Solar Generation
            </div>
            <div className="text-xl font-bold text-slate-900 font-mono mt-1">
              {telemetry.solarGeneration} kW
            </div>
            <div
              className={`text-[10px] ${
                telemetry.solarPrevChange >= 0 ? 'text-emerald-600' : 'text-rose-600'
              }`}
            >
              {telemetry.solarPrevChange >= 0 ? '↑' : '↓'} {Math.abs(telemetry.solarPrevChange)}% vs. prev 7d
            </div>
          </div>
          <div className="w-12 h-6">
            <svg viewBox="0 0 50 25" className="w-full h-full">
              <path d="M 0 20 Q 20 22 35 8 T 50 6" fill="none" stroke="#10B981" strokeWidth="2" />
            </svg>
          </div>
        </div>

        {/* Total Demand */}
        <div className="rounded-2xl border border-slate-200 bg-white p-3.5 shadow-2xs flex items-center justify-between">
          <div>
            <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-medium">
              <Zap className="h-3.5 w-3.5 text-emerald-600" /> Total Demand
            </div>
            <div className="text-xl font-bold text-slate-900 font-mono mt-1">
              {telemetry.totalDemand} kW
            </div>
            <div className="text-[10px] text-emerald-600">↑ {telemetry.demandPrevChange}% vs. prev 7d</div>
          </div>
          <div className="w-12 h-6">
            <svg viewBox="0 0 50 25" className="w-full h-full">
              <path d="M 0 18 Q 20 20 35 10 T 50 8" fill="none" stroke="#10B981" strokeWidth="2" />
            </svg>
          </div>
        </div>

        {/* Battery SoC */}
        <div className="rounded-2xl border border-slate-200 bg-white p-3.5 shadow-2xs flex items-center justify-between">
          <div>
            <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-medium">
              <BatteryCharging className="h-3.5 w-3.5 text-emerald-600" /> Battery SoC
            </div>
            <div className="text-xl font-bold text-slate-900 font-mono mt-1">
              {telemetry.batterySoc}%
            </div>
            <div className="text-[10px] text-emerald-600">↑ {telemetry.batterySocChange}% vs. prev 7d</div>
          </div>
          <div className="w-12 h-6">
            <svg viewBox="0 0 50 25" className="w-full h-full">
              <path d="M 0 20 Q 20 22 35 8 T 50 6" fill="none" stroke="#10B981" strokeWidth="2" />
            </svg>
          </div>
        </div>

        {/* Grid Status */}
        <div className="rounded-2xl border border-slate-200 bg-white p-3.5 shadow-2xs">
          <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-medium">
            <Radio className="h-3.5 w-3.5 text-emerald-600" /> Grid Status
          </div>
          <div className="text-base font-bold text-slate-900 flex items-center gap-1.5 mt-1">
            <span
              className={`h-2 w-2 rounded-full ${
                telemetry.gridStatus === 'connected' ? 'bg-emerald-500' : 'bg-rose-500'
              }`}
            />{' '}
            {telemetry.gridStatus === 'connected' ? 'Connected' : 'Islanded'}
          </div>
          <div className="text-[10px] text-slate-400 font-mono">
            {telemetry.gridPower} kW (import)
          </div>
        </div>

        {/* Critical Load Service */}
        <div className="rounded-2xl border border-slate-200 bg-white p-3.5 shadow-2xs">
          <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-medium">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" /> Critical Load Service
          </div>
          <div className="text-xl font-bold text-slate-900 font-mono mt-1">
            {telemetry.criticalLoadsServed}%
          </div>
          <div className="text-[10px] text-slate-500">
            {telemetry.unservedEnergyKwh > 0 ? `↓ ${telemetry.unservedEnergyKwh} kWh unserved` : '→ +0% vs. prev 7d'}
          </div>
        </div>
      </div>

      {/* Current Fault Scenario Banner */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-50 text-rose-600 shrink-0">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Current Fault Scenario
                </span>
              </div>
              <h2 className="text-base font-bold text-slate-900 mt-0.5">{faultTitle}</h2>
              <p className="text-xs text-slate-500 mt-0.5">{faultDescription}</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-2 text-center">
              <span className="text-[10px] text-slate-400 block">Severity</span>
              <span className="font-mono text-base font-bold text-rose-600">{activeFault ? `${faultSeverity}%` : '0%'}</span>
            </div>
            <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-2 text-center">
              <span className="text-[10px] text-slate-400 block">Estimated Shortage</span>
              <span className="font-mono text-base font-bold text-amber-600">{shortageKw} kW</span>
            </div>
            <div className="rounded-xl border border-rose-100 bg-rose-50/70 px-4 py-2 text-center">
              <span className="text-[10px] text-rose-800 block">Impact Level</span>
              <span className="font-sans text-xs font-bold text-rose-700">{impactLevel}</span>
            </div>
            <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
              <button
                onClick={() => runRecoveryLoop()}
                disabled={isSimulating}
                className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-colors disabled:opacity-50 flex items-center gap-1.5"
              >
                <Play className="h-3.5 w-3.5 fill-current" />
                <span>{isSimulating ? 'Recovering...' : 'Auto-Recover'}</span>
              </button>
              {activeFault && (
                <button
                  onClick={clearFault}
                  className="px-3 py-2 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold transition-colors"
                >
                  Clear Fault
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Recovery Pipeline (4 Live Closed-Loop Steps) */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
            Closed-Loop Recovery Pipeline
          </h2>
          <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
            HiGHS Linear Programming Solver
          </span>
        </div>

        <div className="flex flex-col gap-2 md:flex-row md:items-stretch">
          {pipelineSteps.map((step, index) => {
            const isCompleted = step.status === 'completed';
            const isActive = step.status === 'active';

            return (
              <React.Fragment key={step.id}>
                <div
                  className={`flex-1 rounded-xl border p-3.5 transition-all ${
                    isActive
                      ? 'border-emerald-500 bg-emerald-50/20 ring-1 ring-emerald-500'
                      : isCompleted
                      ? 'border-slate-200 bg-slate-50/50'
                      : 'border-slate-100 bg-white opacity-50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span
                      className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold ${
                        isCompleted
                          ? 'bg-emerald-600 text-white'
                          : isActive
                          ? 'bg-emerald-600 text-white animate-pulse'
                          : 'bg-slate-200 text-slate-600'
                      }`}
                    >
                      {isCompleted ? '✓' : step.stepNumber}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">
                      {isCompleted ? 'Done' : isActive ? 'Active' : 'Pending'}
                    </span>
                  </div>
                  <div className="text-xs font-bold text-slate-900">{step.title}</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">{step.subtitle}</div>
                  {step.note && (
                    <div className="text-[9px] text-emerald-800 font-mono mt-1.5 line-clamp-2 bg-emerald-50/60 p-1 rounded">
                      {step.note}
                    </div>
                  )}
                </div>

                {index < pipelineSteps.length - 1 && (
                  <div className="hidden shrink-0 items-center justify-center text-slate-300 md:flex">
                    <ChevronRight className="h-4 w-4" />
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Main Grid: Left (Response + Allocation + Chart + Log) & Right Side Panels */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* Left 9 Columns */}
        <div className="xl:col-span-9 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* System Response Details */}
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs space-y-3">
              <span className="text-xs font-bold text-slate-900 block">System Response Details</span>

              <div className="rounded-xl border border-emerald-100 bg-emerald-50/50 p-2.5">
                <span className="text-[10px] font-bold text-emerald-950 block">Why this action?</span>
                <p className="text-[11px] text-slate-600 mt-1 leading-snug">
                  Forecast shows demand will exceed available generation in the next 2 hours. Battery and flexible loads can cover the imbalance without affecting critical loads.
                </p>
              </div>

              <div>
                <span className="text-[10px] font-bold text-slate-700 block mb-1">Applied Actions (HiGHS Optimizer):</span>
                {appliedActions.length > 0 ? (
                  <ul className="text-[11px] text-slate-600 space-y-1.5">
                    {appliedActions.map((act) => (
                      <li key={act.id} className="flex items-start gap-1.5 text-emerald-800 font-medium">
                        <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0 mt-0.5" />
                        <div>
                          <div className="text-[11px] font-semibold">{act.reason}</div>
                          {act.constraintConsiderations && (
                            <div className="text-[9px] text-slate-500 font-normal">{act.constraintConsiderations}</div>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <ul className="text-[11px] text-slate-600 space-y-1">
                    <li className="flex items-center gap-1.5 text-emerald-700 font-medium">
                      <Check className="h-3 w-3" /> Autonomous BESS dynamic dispatch
                    </li>
                    <li className="flex items-center gap-1.5 text-emerald-700 font-medium">
                      <Check className="h-3 w-3" /> Smart EV charging concurrency deferral
                    </li>
                    <li className="flex items-center gap-1.5 text-emerald-700 font-medium">
                      <Check className="h-3 w-3" /> Controllable HVAC thermal shedding
                    </li>
                  </ul>
                )}
              </div>

              <div className="pt-2 border-t border-slate-100 space-y-1.5 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 text-[11px]">Constraint Checks</span>
                  <span className="rounded-md bg-emerald-50 px-1.5 py-0.5 text-[9px] font-bold text-emerald-700">
                    All Passed
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 text-[11px]">Expected Recovery Time</span>
                  <span className="font-mono font-bold text-slate-800">~ 8 minutes</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 text-[11px]">Priority</span>
                  <span className="rounded-md bg-emerald-50 px-1.5 py-0.5 text-[9px] font-bold text-emerald-700">
                    Critical Loads Protected
                  </span>
                </div>
              </div>
            </div>

            {/* Resource Allocation (After Recovery) */}
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs space-y-3 flex flex-col justify-between">
              <div>
                <span className="text-xs font-bold text-slate-900 block mb-2">
                  Resource Allocation (After Recovery)
                </span>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="flex items-center gap-1.5 text-slate-600">
                      <Sun className="h-3.5 w-3.5 text-emerald-600" /> Solar Generation
                    </span>
                    <div className="font-mono font-bold text-slate-900">
                      {telemetry.solarGeneration} kW
                    </div>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="flex items-center gap-1.5 text-slate-600">
                      <BatteryCharging className="h-3.5 w-3.5 text-emerald-600" /> Battery Discharge
                    </span>
                    <div className="font-mono font-bold text-slate-900">
                      {telemetry.batteryPower} kW
                    </div>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="flex items-center gap-1.5 text-slate-600">
                      <Car className="h-3.5 w-3.5 text-emerald-600" /> EV Charging Demand
                    </span>
                    <div className="font-mono font-bold text-slate-900">
                      {telemetry.evChargingPower} kW
                    </div>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="flex items-center gap-1.5 text-slate-600">
                      <Home className="h-3.5 w-3.5 text-emerald-600" /> Flexible Loads
                    </span>
                    <div className="font-mono font-bold text-slate-900">
                      {telemetry.flexibleLoadsPower} kW
                    </div>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="flex items-center gap-1.5 text-slate-600">
                      <Radio className="h-3.5 w-3.5 text-emerald-600" /> Grid Exchange
                    </span>
                    <div className="font-mono font-bold text-slate-900">
                      {telemetry.gridPower} kW ({telemetry.gridStatus})
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-xl bg-slate-50 p-2 text-[10px] text-slate-500 leading-tight">
                System is applying the selected actions and will verify the results in the next cycle.
              </div>
            </div>

            {/* Forecast vs Actual (Next 6 Hours) */}
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs space-y-3 flex flex-col justify-between">
              <div>
                <span className="text-xs font-bold text-slate-900 block mb-1">
                  Forecast vs Actual (Next 6 Hours)
                </span>
                <div className="flex items-center gap-2 text-[9px] text-slate-500 mb-2">
                  <span className="flex items-center gap-1">
                    <span className="inline-block w-2 border-b-2 border-slate-400 border-dashed" /> Forecast Demand
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="inline-block w-2 border-b-2 border-blue-500" /> Actual Demand
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Solar Gen
                  </span>
                </div>

                {/* Micro SVG */}
                <div className="h-28 w-full">
                  <svg className="w-full h-full overflow-visible" viewBox="0 0 160 80">
                    <rect x="15" y="45" width="10" height="30" fill="#86EFAC" rx="1" />
                    <rect x="40" y="40" width="10" height="35" fill="#86EFAC" rx="1" />
                    <rect x="65" y="42" width="10" height="33" fill="#86EFAC" rx="1" />
                    <rect x="90" y="48" width="10" height="27" fill="#86EFAC" rx="1" />
                    <rect x="115" y="55" width="10" height="20" fill="#86EFAC" rx="1" />
                    <rect x="140" y="60" width="10" height="15" fill="#86EFAC" rx="1" />

                    <path d="M 10 35 Q 60 25 100 20 T 155 25" fill="none" stroke="#60A5FA" strokeWidth="2" />
                    <path d="M 10 32 Q 60 30 100 24 T 155 30" fill="none" stroke="#94A3B8" strokeWidth="1.5" strokeDasharray="3 3" />
                  </svg>
                  <div className="flex justify-between text-[7px] font-mono text-slate-400">
                    <span>12 PM</span>
                    <span>2 PM</span>
                    <span>4 PM</span>
                    <span>6 PM</span>
                    <span>8 PM</span>
                    <span>10 PM</span>
                  </div>
                </div>
              </div>

              {/* Recovery Progress Bar */}
              <div className="pt-2 border-t border-slate-100 space-y-1">
                <div className="flex justify-between text-[10px]">
                  <span className="text-slate-600 font-semibold">Recovery Progress</span>
                  <span className="font-mono font-bold text-emerald-700">60%</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div className="bg-emerald-600 h-full rounded-full" style={{ width: '60%' }} />
                </div>
                <span className="text-[9px] text-slate-400 block">
                  Applying resource reallocation...
                </span>
              </div>
            </div>
          </div>

          {/* Recovery Log & System Health */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Recovery Log (8 cols) */}
            <div className="lg:col-span-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs">
              <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">
                Recovery Log
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3">Time</th>
                      <th className="py-2.5 px-3">Event</th>
                      <th className="py-2.5 px-3">Details</th>
                      <th className="py-2.5 px-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                    {events.slice(0, 10).map((ev) => (
                      <tr key={ev.id} className="hover:bg-slate-50">
                        <td className="py-2.5 px-3 text-slate-500 whitespace-nowrap">{ev.time}</td>
                        <td className="py-2.5 px-3 font-sans font-semibold text-slate-800">
                          {ev.title}
                        </td>
                        <td className="py-2.5 px-3 font-sans text-slate-600">{ev.details || '—'}</td>
                        <td className="py-2.5 px-3 font-sans">
                          <span
                            className={`rounded-md px-1.5 py-0.5 text-[9px] font-bold ${
                              ev.badgeColor === 'rose'
                                ? 'bg-rose-50 text-rose-700'
                                : ev.badgeColor === 'amber'
                                ? 'bg-amber-50 text-amber-800'
                                : ev.badgeColor === 'blue'
                                ? 'bg-blue-50 text-blue-700'
                                : 'bg-emerald-50 text-emerald-700'
                            }`}
                          >
                            {ev.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* System Health (4 cols) */}
            <div className="lg:col-span-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs space-y-3">
              <span className="text-xs font-bold text-slate-900 block">System Health</span>
              <div className="flex items-center gap-2 p-2 rounded-xl bg-emerald-50/60 text-emerald-900 text-xs font-bold">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                <span>All Systems Operational</span>
              </div>

              <div className="space-y-2 text-xs pt-1">
                <div className="flex justify-between items-center text-slate-600">
                  <span>Simulation Engine</span>
                  <span className="text-emerald-600 font-semibold flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Healthy
                  </span>
                </div>
                <div className="flex justify-between items-center text-slate-600">
                  <span>Forecast Engine</span>
                  <span className="text-emerald-600 font-semibold flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Healthy
                  </span>
                </div>
                <div className="flex justify-between items-center text-slate-600">
                  <span>Optimizer</span>
                  <span className="text-emerald-600 font-semibold flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Healthy
                  </span>
                </div>
                <div className="flex justify-between items-center text-slate-600">
                  <span>Database</span>
                  <span className="text-emerald-600 font-semibold flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Healthy
                  </span>
                </div>
                <div className="flex justify-between items-center text-slate-600">
                  <span>UI Dashboard</span>
                  <span className="text-emerald-600 font-semibold flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Healthy
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right 3 Columns */}
        <div className="xl:col-span-3 space-y-6">
          {/* Quick Actions */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs space-y-3">
            <span className="text-xs font-bold text-slate-900 block">Quick Actions</span>
            <button
              onClick={runRecoveryLoop}
              disabled={isSimulating}
              className="w-full flex items-center justify-center gap-2 rounded-lg bg-[#2E7D32] py-2.5 text-xs font-bold text-white shadow-xs hover:bg-[#256829] transition-all"
            >
              <Play className="h-3.5 w-3.5 fill-current" />
              <span>{isSimulating ? 'Optimizing...' : 'Start Simulation'}</span>
            </button>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                onClick={() => setPaused(!paused)}
                className={`flex items-center justify-center gap-1.5 rounded-lg border p-2 font-semibold hover:bg-slate-50 ${
                  paused ? 'border-amber-300 bg-amber-50/60 text-amber-800' : 'border-slate-200 text-slate-700'
                }`}
              >
                <Pause className="h-3.5 w-3.5 text-slate-600" />
                <span>{paused ? 'Paused' : 'Pause'}</span>
              </button>
              <button
                onClick={resetAll}
                className="flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 p-2 font-semibold text-slate-700 hover:bg-slate-50"
              >
                <RotateCcw className="h-3.5 w-3.5 text-slate-600" />
                <span>Reset</span>
              </button>
            </div>

            <button
              onClick={() => injectFault('solar_drop', 50)}
              className="w-full flex items-center justify-center gap-2 rounded-lg border border-slate-200 p-2 text-xs font-semibold text-slate-700 hover:bg-amber-50 hover:border-amber-300"
            >
              <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
              <span>Inject Fault</span>
            </button>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
              <span className="font-semibold">Auto Recovery</span>
              <button
                onClick={() => setAutoRecovery(!autoRecovery)}
                className={`rounded-full px-2 py-0.5 text-[10px] font-bold transition-colors ${
                  autoRecovery
                    ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                    : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                }`}
              >
                {autoRecovery ? 'ON' : 'OFF'}
              </button>
            </div>

            <button
              onClick={() => setActivePage('settings')}
              className="w-full text-left text-[11px] text-slate-500 hover:text-slate-900 flex items-center gap-1.5 pt-1"
            >
              <Sliders className="h-3.5 w-3.5" />
              <span>Recovery Settings</span>
            </button>
          </div>

          {/* Recent Events List */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900">Recent Events</span>
              <span className="text-[10px] text-slate-400 font-medium">View All &gt;</span>
            </div>

            <div className="space-y-3 text-xs">
              {recentRecoveryEvents.map((re, idx) => {
                const Icon = re.icon;
                return (
                  <div key={idx} className="flex items-start gap-2.5">
                    <Icon className={`h-4 w-4 ${re.color} shrink-0 mt-0.5`} />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-slate-800 text-[11px]">{re.title}</span>
                        <span className="font-mono text-[9px] text-slate-400">{re.time}</span>
                      </div>
                      <div className="text-[10px] text-slate-500 leading-tight mt-0.5">{re.desc}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quote Card */}
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-4 shadow-2xs flex items-start gap-2.5">
            <Leaf className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
            <p className="text-[11px] text-emerald-900 leading-relaxed font-medium">
              Successful recovery will be confirmed after verification. All actions are part of the simulated environment.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
