import React, { useState } from 'react';
import {
  Sun,
  Zap,
  BatteryLow,
  Car,
  Radio,
  WifiOff,
  Play,
  Pause,
  RotateCcw,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  ChevronDown,
  Clock,
  ShieldCheck,
  Check,
  Lightbulb,
} from 'lucide-react';
import { useMicrogrid } from '../context/MicrogridContext';

interface FaultPreview {
  title: string;
  icon: React.ElementType;
  iconColor: string;
  headline: (severity: number, duration: string) => string;
  impacts: (severity: number) => string[];
  faultPath: string;
}

const FAULT_PREVIEWS: Record<string, FaultPreview> = {
  solar_drop: {
    title: 'Solar Generation Loss',
    icon: Sun,
    iconColor: 'text-amber-500',
    headline: (severity, duration) => `${severity}% reduction in solar output for ${duration}`,
    impacts: (severity) => {
      const remaining = Math.round(128 * (1 - (severity / 100) * 0.6));
      return [
        `Generation drops from 128 kW → ${remaining} kW`,
        `Possible energy shortage ~ ${Math.max(0, 105 - remaining - 37)}–${Math.max(0, 105 - remaining)} kW`,
        'Battery discharge will increase',
        'Non-urgent EV charging may be deferred',
      ];
    },
    faultPath: 'M 10 80 Q 50 70 80 55 L 85 70 L 125 70 L 130 45 T 160 55 L 190 80',
  },
  demand_surge: {
    title: 'Sudden Demand Surge',
    icon: Zap,
    iconColor: 'text-amber-500',
    headline: (severity, duration) =>
      `Total demand rises by ${Math.round((severity / 100) * 45)} kW for ${duration}`,
    impacts: (severity) => {
      const added = Math.round((severity / 100) * 45);
      return [
        `Demand climbs from 105 kW → ${105 + added} kW`,
        `Reserve margin narrows by ${added} kW`,
        'Battery discharge ramps to cover the peak',
        'Grid import may be required if SoC is low',
      ];
    },
    faultPath: 'M 10 78 Q 40 74 60 70 L 65 40 L 140 35 L 145 55 Q 165 68 190 78',
  },
  battery_trip: {
    title: 'Battery Failure',
    icon: BatteryLow,
    iconColor: 'text-rose-500',
    headline: (_severity, duration) => `Storage unavailable for ${duration}`,
    impacts: () => [
      'Battery discharge drops to 0 kW',
      'No buffer for cloud transients',
      'Critical loads exposed during evening peak',
      'Grid import or load shedding required',
    ],
    faultPath: 'M 10 80 Q 45 70 75 50 L 80 78 L 150 78 L 155 50 Q 175 65 190 80',
  },
  ev_peak: {
    title: 'EV Charging Peak',
    icon: Car,
    iconColor: 'text-blue-500',
    headline: (severity, duration) =>
      `EV charging rises to ${Math.round((severity / 100) * 50)} kW for ${duration}`,
    impacts: (severity) => {
      const ev = Math.round((severity / 100) * 50);
      return [
        `EV load climbs from 18 kW → ${ev} kW`,
        'Evening peak overlaps with solar ramp-down',
        'Flexible loads deferred first',
        'Transformer headroom may be exceeded',
      ];
    },
    faultPath: 'M 10 80 Q 40 74 65 70 L 70 45 Q 100 25 120 45 L 125 70 Q 160 76 190 80',
  },
  grid_outage: {
    title: 'Grid Outage',
    icon: Radio,
    iconColor: 'text-rose-500',
    headline: (_severity, duration) => `Utility supply lost for ${duration}`,
    impacts: () => [
      'Grid import drops to 0 kW',
      'Microgrid islands automatically',
      'Battery becomes the only buffer',
      'Critical loads prioritised over EV charging',
    ],
    faultPath: 'M 10 80 Q 40 72 70 60 L 75 80 L 160 80 L 165 55 Q 178 68 190 80',
  },
  comm_failure: {
    title: 'Communication Failure',
    icon: WifiOff,
    iconColor: 'text-slate-500',
    headline: (_severity, duration) => `Telemetry unavailable for ${duration}`,
    impacts: () => [
      'Asset telemetry becomes stale',
      'Controller falls back to last known state',
      'Recovery latency increases',
      'Manual operator override recommended',
    ],
    faultPath: 'M 10 80 Q 45 70 80 50 L 120 50 L 125 45 T 160 55 L 190 80',
  },
};


export const FaultStudioView: React.FC = () => {
  const {
    telemetry,
    injectFault,
    activeFault,
    faultSeverity,
    faultDurationHours,
    clearFault,
    resetAll,
    runRecoveryLoop,
    isSimulating,
  } = useMicrogrid();

  const [selectedFaultType, setSelectedFaultType] = useState<string>('solar_drop');
  const [severity, setSeverity] = useState<string>('50%');
  const [duration, setDuration] = useState<string>('2 hours');
  const [startTime, setStartTime] = useState<string>('Now');
  const [dateRange] = useState('Apr 28, 2025 – May 4, 2025');
  const [timeView, setTimeView] = useState('Day');
  const [paused, setPaused] = useState(false);
  const [recoveryOn, setRecoveryOn] = useState(true);

  const faultTypes = [
    {
      id: 'solar_drop',
      title: 'Solar Generation Loss',
      desc: 'Reduced solar output',
      icon: Sun,
    },
    {
      id: 'demand_surge',
      title: 'Sudden Demand Surge',
      desc: 'Increase in total demand',
      icon: Zap,
    },
    {
      id: 'battery_trip',
      title: 'Battery Failure',
      desc: 'Battery unavailable',
      icon: BatteryLow,
    },
    {
      id: 'ev_peak',
      title: 'EV Charging Peak',
      desc: 'High EV charging load',
      icon: Car,
    },
    {
      id: 'grid_outage',
      title: 'Grid Outage',
      desc: 'Loss of grid connection',
      icon: Radio,
    },
    {
      id: 'comm_failure',
      title: 'Communication Failure',
      desc: 'Asset data unavailable',
      icon: WifiOff,
    },
  ];

  const faultScenariosTable = [
    {
      id: '1',
      name: 'Solar Generation Loss',
      severity: '50%',
      duration: '2 hours',
      status: 'Ready',
      type: 'solar_drop',
      icon: Sun,
    },
    {
      id: '2',
      name: 'Sudden Demand Surge',
      severity: '30%',
      duration: '1 hour',
      status: 'Ready',
      type: 'demand_surge',
      icon: Zap,
    },
    {
      id: '3',
      name: 'Battery Failure',
      severity: '100%',
      duration: '3 hours',
      status: 'Ready',
      type: 'battery_trip',
      icon: BatteryLow,
    },
    {
      id: '4',
      name: 'EV Charging Peak',
      severity: '75%',
      duration: '2 hours',
      status: 'Ready',
      type: 'ev_peak',
      icon: Car,
    },
    {
      id: '5',
      name: 'Grid Outage',
      severity: '100%',
      duration: '4 hours',
      status: 'Ready',
      type: 'grid_outage',
      icon: Radio,
    },
    {
      id: '6',
      name: 'Communication Failure',
      severity: '-',
      duration: '1 hour',
      status: 'Ready',
      type: 'comm_failure',
      icon: WifiOff,
    },
  ];

  const recentFaultEvents = [
    {
      time: 'May 4, 10:12 AM',
      type: 'Solar Generation Loss',
      severity: '50%',
      status: 'Active',
      action: 'Recovery in progress',
      statusColor: 'rose',
    },
    {
      time: 'May 4, 08:45 AM',
      type: 'Demand Surge',
      severity: '30%',
      status: 'Resolved',
      action: 'Auto-recovered',
      statusColor: 'emerald',
    },
    {
      time: 'May 4, 06:20 AM',
      type: 'Grid Outage',
      severity: '100%',
      status: 'Resolved',
      action: 'Auto-recovered',
      statusColor: 'emerald',
    },
    {
      time: 'May 4, 03:15 AM',
      type: 'EV Charging Peak',
      severity: '75%',
      status: 'Resolved',
      action: 'Auto-recovered',
      statusColor: 'emerald',
    },
  ];

  const handleInject = (
    typeId = selectedFaultType,
    sevOverride?: string,
    durOverride?: string
  ) => {
    const sevNum = parseInt(sevOverride ?? severity, 10) || 50;
    const durNum = parseInt(durOverride ?? duration, 10) || 2;
    injectFault(typeId, sevNum, durNum);
  };

  const preview = FAULT_PREVIEWS[selectedFaultType] ?? FAULT_PREVIEWS.solar_drop;
  const PreviewIcon = preview.icon;
  const severityNum = parseInt(severity, 10) || 50;

  return (
    <div className="flex-1 p-6 space-y-6 max-w-[1600px] mx-auto text-slate-800">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Fault Simulation Studio
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Introduce faults, observe impact and test the recovery system.
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
        </div>
      </div>

      {/* Select Fault Type (6 horizontal cards) */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs space-y-4">
        <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
          Select Fault Type
        </h2>

        <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
          {faultTypes.map((ft) => {
            const Icon = ft.icon;
            const isSelected = selectedFaultType === ft.id;

            return (
              <button
                key={ft.id}
                onClick={() => setSelectedFaultType(ft.id)}
                className={`relative rounded-xl border p-3.5 text-left transition-all ${
                  isSelected
                    ? 'border-emerald-500 bg-emerald-50/20 ring-1 ring-emerald-500 shadow-xs'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                {isSelected && (
                  <div className="absolute top-2 right-2 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-600 text-white">
                    <Check className="h-2.5 w-2.5 stroke-[3]" />
                  </div>
                )}
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-50 text-emerald-600 mb-2">
                  <Icon className="h-4 w-4" />
                </div>
                <div className="text-xs font-bold text-slate-900 leading-tight">
                  {ft.title}
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5 leading-snug">
                  {ft.desc}
                </div>
              </button>
            );
          })}
        </div>

        {/* Fault Parameters & Inject Button */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center pt-2 border-t border-slate-100">
          <div>
            <label className="text-[11px] font-semibold text-slate-600 block mb-1">
              Fault Severity
            </label>
            <div className="relative">
              <select
                value={severity}
                onChange={(e) => setSeverity(e.target.value)}
                className="w-full appearance-none rounded-lg border border-slate-200 bg-white py-2 pl-3 pr-8 text-xs font-semibold text-slate-800"
              >
                <option value="25%">25%</option>
                <option value="50%">50%</option>
                <option value="75%">75%</option>
                <option value="100%">100%</option>
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
            </div>
            <span className="text-[10px] text-slate-400 mt-0.5 block">
              (e.g., 50% generation loss)
            </span>
          </div>

          <div>
            <label className="text-[11px] font-semibold text-slate-600 block mb-1">
              Fault Duration
            </label>
            <div className="relative">
              <select
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="w-full appearance-none rounded-lg border border-slate-200 bg-white py-2 pl-3 pr-8 text-xs font-semibold text-slate-800"
              >
                <option value="1 hour">1 hour</option>
                <option value="2 hours">2 hours</option>
                <option value="4 hours">4 hours</option>
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
            </div>
            <span className="text-[10px] text-slate-400 mt-0.5 block">(simulation time)</span>
          </div>

          <div>
            <label className="text-[11px] font-semibold text-slate-600 block mb-1">
              Start Time
            </label>
            <div className="relative">
              <select
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full appearance-none rounded-lg border border-slate-200 bg-white py-2 pl-3 pr-8 text-xs font-semibold text-slate-800"
              >
                <option value="Now">Now</option>
                <option value="In 15 min">In 15 min</option>
                <option value="In 1 hour">In 1 hour</option>
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
            </div>
            <span className="text-[10px] text-slate-400 mt-0.5 block">
              (apply fault immediately)
            </span>
          </div>

          <div className="md:pt-4">
            <button
              onClick={() => handleInject()}
              className="w-full flex items-center justify-center gap-2 rounded-lg bg-[#2E7D32] py-2.5 text-xs font-bold text-white shadow-xs hover:bg-[#256829] transition-all"
            >
              <Play className="h-3.5 w-3.5 fill-current" />
              <span>Inject Fault</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid: Left (Scenarios + Impact Preview) & Right Status Panel */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* Left 9 Columns */}
        <div className="xl:col-span-9 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Fault Scenarios Table (7 cols) */}
            <div className="lg:col-span-7 rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs">
              <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">
                Fault Scenarios
              </h2>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-2">#</th>
                      <th className="py-2.5 px-2">Fault Type</th>
                      <th className="py-2.5 px-2">Severity</th>
                      <th className="py-2.5 px-2">Duration</th>
                      <th className="py-2.5 px-2">Status</th>
                      <th className="py-2.5 px-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {faultScenariosTable.map((sc) => {
                      const Icon = sc.icon;
                      return (
                        <tr key={sc.id} className="hover:bg-slate-50">
                          <td className="py-2 px-2 text-slate-400 font-mono">{sc.id}</td>
                          <td className="py-2 px-2">
                            <div className="flex items-center gap-1.5">
                              <Icon className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                              <span className="font-semibold text-slate-800 truncate">
                                {sc.name}
                              </span>
                            </div>
                          </td>
                          <td className="py-2 px-2 font-mono text-slate-600">{sc.severity}</td>
                          <td className="py-2 px-2 font-mono text-slate-600">{sc.duration}</td>
                          <td className="py-2 px-2">
                            <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                              {sc.status}
                            </span>
                          </td>
                          <td className="py-2 px-2">
                            <button
                              onClick={() => handleInject(sc.type, sc.severity, sc.duration)}
                              className="flex items-center gap-1 rounded-md bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 px-2 py-1 text-[11px] font-medium transition-colors"
                            >
                              <Play className="h-3 w-3 fill-current" />
                              <span>Apply</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Fault Impact Preview (5 cols) */}
            <div className="lg:col-span-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs space-y-3">
              <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Fault Impact Preview
              </h2>

              <div className="flex items-center gap-2.5 p-2 rounded-xl bg-slate-50 border border-slate-100">
                <PreviewIcon className={`h-5 w-5 ${preview.iconColor}`} />
                <div>
                  <div className="text-xs font-bold text-slate-900">{preview.title}</div>
                  <div className="text-[10px] text-slate-500">
                    {preview.headline(severityNum, duration)}
                  </div>
                </div>
              </div>

              <div>
                <span className="text-[11px] font-bold text-slate-700 block mb-1">
                  Expected impact:
                </span>
                <ul className="text-[11px] text-slate-600 space-y-1 list-disc list-inside">
                  {preview.impacts(severityNum).map((impact) => (
                    <li key={impact}>{impact}</li>
                  ))}
                </ul>
              </div>

              {/* Output Comparison Chart */}
              <div className="pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between text-[10px] font-medium text-slate-600 mb-1">
                  <span>Output Comparison</span>
                  <div className="flex items-center gap-2">
                    <span className="flex items-center gap-1">
                      <span className="inline-block w-2.5 border-b-2 border-emerald-500 border-dashed" />
                      Normal
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="inline-block w-2.5 border-b-2 border-amber-500" />
                      With Fault
                    </span>
                  </div>
                </div>

                <div className="relative h-28 w-full">
                  <svg className="w-full h-full overflow-visible" viewBox="0 0 200 90">
                    {/* Pink Fault Period Banner */}
                    <rect x="75" y="10" width="50" height="70" fill="#FEE2E2" opacity="0.6" rx="4" />
                    <text x="100" y="20" textAnchor="middle" className="text-[7px] font-bold fill-rose-700">
                      Fault Period
                    </text>

                    {/* Normal Curve (green dashed) */}
                    <path
                      d="M 10 80 Q 50 70 80 40 T 120 25 T 160 55 L 190 80"
                      fill="none"
                      stroke="#10B981"
                      strokeWidth="2"
                      strokeDasharray="4 3"
                    />

                    {/* With Fault Curve */}
                    <path
                      d={preview.faultPath}
                      fill="none"
                      stroke="#F59E0B"
                      strokeWidth="2"
                    />
                  </svg>
                  <div className="flex justify-between text-[8px] font-mono text-slate-400">
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

          {/* Bottom Row: Recent Fault Events (Left) & Quick Actions (Right) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-7 rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-slate-900">Recent Fault Events</span>
                <span className="text-[11px] text-slate-400 font-medium">View All &gt;</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
                    <tr>
                      <th className="py-2 px-2">Time</th>
                      <th className="py-2 px-2">Fault Type</th>
                      <th className="py-2 px-2">Severity</th>
                      <th className="py-2 px-2">Status</th>
                      <th className="py-2 px-2">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                    {recentFaultEvents.map((rfe, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="py-2 px-2 text-slate-500 whitespace-nowrap">{rfe.time}</td>
                        <td className="py-2 px-2 font-sans font-medium text-slate-900">
                          {rfe.type}
                        </td>
                        <td className="py-2 px-2 text-slate-600">{rfe.severity}</td>
                        <td className="py-2 px-2 font-sans">
                          <span
                            className={`rounded-md px-1.5 py-0.5 text-[9px] font-bold ${
                              rfe.statusColor === 'rose'
                                ? 'bg-rose-50 text-rose-700'
                                : 'bg-emerald-50 text-emerald-700'
                            }`}
                          >
                            {rfe.status}
                          </span>
                        </td>
                        <td className="py-2 px-2 font-sans text-slate-600 text-[10px]">
                          {rfe.action}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Quick Actions (5 cols) */}
            <div className="lg:col-span-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs">
              <span className="text-xs font-bold text-slate-900 block mb-3">Quick Actions</span>
              <div className="grid grid-cols-3 gap-2.5 text-xs">
                <button
                  onClick={() => {
                    setPaused(false);
                    runRecoveryLoop();
                  }}
                  disabled={isSimulating}
                  className="flex flex-col items-center justify-center p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 font-semibold text-slate-700 disabled:opacity-50"
                >
                  <Play className="h-4 w-4 text-emerald-600 fill-current mb-1" />
                  <span className="text-[10px]">Start Sim</span>
                </button>
                <button
                  onClick={() => setPaused(true)}
                  className={`flex flex-col items-center justify-center p-2.5 rounded-xl border font-semibold hover:bg-slate-50 ${
                    paused
                      ? 'border-amber-300 bg-amber-50/60 text-amber-800'
                      : 'border-slate-200 text-slate-700'
                  }`}
                >
                  <Pause className="h-4 w-4 text-slate-600 mb-1" />
                  <span className="text-[10px]">{paused ? 'Paused' : 'Pause'}</span>
                </button>
                <button
                  onClick={resetAll}
                  className="flex flex-col items-center justify-center p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 font-semibold text-slate-700"
                >
                  <RotateCcw className="h-4 w-4 text-slate-600 mb-1" />
                  <span className="text-[10px]">Reset</span>
                </button>
                <button
                  onClick={() => handleInject()}
                  className="flex flex-col items-center justify-center p-2.5 rounded-xl border border-slate-200 hover:bg-amber-50 font-semibold text-slate-700"
                >
                  <AlertTriangle className="h-4 w-4 text-amber-500 mb-1" />
                  <span className="text-[10px]">Inject Fault</span>
                </button>
                <button
                  onClick={() => {
                    setRecoveryOn(true);
                    runRecoveryLoop();
                  }}
                  disabled={isSimulating}
                  className={`flex flex-col items-center justify-center p-2.5 rounded-xl border font-semibold hover:bg-emerald-50 disabled:opacity-50 ${
                    recoveryOn
                      ? 'border-emerald-300 bg-emerald-50/60 text-emerald-800'
                      : 'border-slate-200 text-slate-700'
                  }`}
                >
                  <ShieldCheck className="h-4 w-4 text-emerald-600 mb-1" />
                  <span className="text-[10px]">Enable Rec</span>
                </button>
                <button
                  onClick={() => setRecoveryOn(false)}
                  className={`flex flex-col items-center justify-center p-2.5 rounded-xl border font-semibold hover:bg-slate-50 ${
                    !recoveryOn
                      ? 'border-slate-400 bg-slate-100 text-slate-800'
                      : 'border-slate-200 text-slate-700'
                  }`}
                >
                  <RotateCcw className="h-4 w-4 text-slate-400 mb-1" />
                  <span className="text-[10px]">Disable Rec</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right 3 Columns */}
        <div className="xl:col-span-3 space-y-6">
          {/* Current Simulation Status */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900">Current Simulation Status</span>
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                  paused
                    ? 'bg-amber-100 text-amber-800'
                    : isSimulating
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-emerald-100 text-emerald-800'
                }`}
              >
                {paused ? 'Paused' : isSimulating ? 'Recovering' : 'Running'}
              </span>
            </div>
            <div className="text-[10px] text-slate-400">
              {activeFault
                ? `${activeFault.name} · ${faultSeverity}% · ${faultDurationHours}h`
                : 'Scenario 1 – Normal Operation'}{' '}
              · Last updated: May 4, 2025 10:15 AM
            </div>

            <div className="space-y-2 pt-2 border-t border-slate-100 text-xs">
              <div className="flex justify-between items-center text-slate-600">
                <span className="flex items-center gap-1.5">
                  <Sun className="h-3.5 w-3.5 text-emerald-600" /> Solar Generation
                </span>
                <span className="font-mono font-bold text-slate-900">
                  {telemetry.solarGeneration} kW
                </span>
              </div>
              <div className="flex justify-between items-center text-slate-600">
                <span className="flex items-center gap-1.5">
                  <Zap className="h-3.5 w-3.5 text-emerald-600" /> Total Demand
                </span>
                <span className="font-mono font-bold text-slate-900">
                  {telemetry.totalDemand} kW
                </span>
              </div>
              <div className="flex justify-between items-center text-slate-600">
                <span className="flex items-center gap-1.5">
                  <BatteryLow className="h-3.5 w-3.5 text-emerald-600" /> Battery SoC
                </span>
                <span className="font-mono font-bold text-slate-900">
                  {telemetry.batterySoc}%
                </span>
              </div>
              <div className="flex justify-between items-center text-slate-600">
                <span className="flex items-center gap-1.5">
                  <Radio className="h-3.5 w-3.5 text-emerald-600" /> Grid Status
                </span>
                <span
                  className={`font-semibold flex items-center gap-1 ${
                    telemetry.gridStatus === 'connected' ? 'text-emerald-700' : 'text-rose-700'
                  }`}
                >
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${
                      telemetry.gridStatus === 'connected' ? 'bg-emerald-500' : 'bg-rose-500'
                    }`}
                  />
                  {telemetry.gridStatus === 'connected' ? 'Connected' : 'Islanded'}
                </span>
              </div>
              <div className="flex justify-between items-center text-slate-600 pt-1 border-t border-slate-100">
                <span className="font-semibold text-slate-700">Power Balance</span>
                <span
                  className={`font-mono font-bold ${
                    telemetry.netBalanceKw >= 0 ? 'text-emerald-600' : 'text-rose-600'
                  }`}
                >
                  {telemetry.netBalanceKw >= 0 ? `+${telemetry.netBalanceKw}` : `${telemetry.netBalanceKw}`} kW
                </span>
              </div>
            </div>
          </div>

          {/* Active Faults count */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-900">Active Faults</span>
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                  activeFault ? 'bg-rose-100 text-rose-800' : 'bg-slate-100 text-slate-600'
                }`}
              >
                {activeFault ? '1' : '0'}
              </span>
            </div>
            <p className="text-xs text-slate-500">
              {activeFault
                ? `Active: ${activeFault.name} · ${faultSeverity}% · ${faultDurationHours}h`
                : 'No active faults'}
            </p>
            {activeFault && (
              <button
                onClick={clearFault}
                className="mt-2.5 w-full flex items-center justify-center gap-1 text-[11px] font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg py-1.5 transition-colors border border-rose-200"
              >
                <RotateCcw className="h-3 w-3" />
                Clear Active Fault
              </button>
            )}
          </div>

          {/* Recovery Status */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs space-y-3">
            <span className="text-xs font-bold text-slate-900 block">Recovery Status</span>
            <div className="flex items-center justify-between text-[10px] font-medium text-slate-500">
              <span className="flex items-center gap-1 text-emerald-600 font-bold">
                <span className="h-2 w-2 rounded-full bg-emerald-500" /> Detect
              </span>
              <span>&rarr; Predict</span>
              <span>&rarr; Reallocate</span>
              <span>&rarr; Verify</span>
            </div>

            <div className="rounded-xl border border-emerald-100 bg-emerald-50/50 p-2.5 flex items-start gap-2">
              <Lightbulb className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
              <p className="text-[10px] text-emerald-900 leading-tight">
                The system will automatically respond to faults and verify recovery.
              </p>
            </div>
          </div>

          {/* Simulation Summary */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs space-y-2.5 text-xs">
            <span className="font-bold text-slate-900 block">Simulation Summary</span>
            <div className="flex justify-between items-center text-slate-600">
              <span>Total Scenarios Run</span>
              <span className="font-mono font-bold text-slate-900">12</span>
            </div>
            <div className="flex justify-between items-center text-slate-600">
              <span>Successful Recoveries</span>
              <span className="font-mono font-bold text-emerald-600">10 (83%)</span>
            </div>
            <div className="flex justify-between items-center text-slate-600">
              <span>Failed Recoveries</span>
              <span className="font-mono font-bold text-rose-600">2 (17%)</span>
            </div>
            <div className="flex justify-between items-center text-slate-600 pt-1 border-t border-slate-100">
              <span>Avg. Recovery Time</span>
              <span className="font-mono font-bold text-slate-900">8.4 min</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
