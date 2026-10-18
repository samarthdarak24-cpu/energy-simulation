import React, { useState } from 'react';
import {
  Sun,
  Zap,
  BatteryCharging,
  ShieldCheck,
  ChevronDown,
  Calendar,
  AlertTriangle,
  Play,
  BarChart2,
  Download,
  CheckCircle2,
  Clock,
  Check,
  Building2,
  Home,
  Car,
  Radio,
  ArrowRight,
  TrendingUp,
  Activity,
  Layers,
} from 'lucide-react';
import { useMicrogrid } from '../context/MicrogridContext';
import { HistoricalBarData } from '../types/microgrid';

interface OverviewDashboardProps {
  onOpenFaultModal: () => void;
  onOpenExportModal: () => void;
}

export const OverviewDashboard: React.FC<OverviewDashboardProps> = ({
  onOpenFaultModal,
  onOpenExportModal,
}) => {
  const {
    telemetry,
    pipelineSteps,
    alerts,
    events,
    assets,
    historicalData,
    dateRange,
    setDateRange,
    runRecoveryLoop,
    isSimulating,
    recoveryStateText,
    setActivePage,
  } = useMicrogrid();

  const [hoveredBar, setHoveredBar] = useState<HistoricalBarData | null>(
    historicalData.find((d) => d.label === 'May 2') || null
  );

  const [dateDropdownOpen, setDateDropdownOpen] = useState(false);

  const dateOptions = ['Last 7 days', 'Today', 'Last 24 hours', 'Last 30 days'];

  // Net balance formatted
  const netBalanceSign = telemetry.netBalanceKw >= 0 ? '+' : '';

  return (
    <div className="flex-1 p-6 space-y-6 max-w-[1600px] mx-auto">
      {/* 2-Column Main Layout: Left = Main Stream, Right = System Health & Quick Actions */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* Left 9 Columns */}
        <div className="xl:col-span-9 space-y-6">
          {/* Section Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                Microgrid Overview
              </h1>
              <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1.5">
                <span>Live digital twin</span>
                <span className="text-slate-300">•</span>
                <span>Simulation data</span>
              </p>
            </div>

            {/* Date Range Selector Dropdown */}
            <div className="relative">
              <button
                onClick={() => setDateDropdownOpen(!dateDropdownOpen)}
                className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 transition-colors"
              >
                <Calendar className="h-3.5 w-3.5 text-slate-400" />
                <span>{dateRange}</span>
                <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
              </button>

              {dateDropdownOpen && (
                <div className="absolute right-0 mt-1.5 w-40 rounded-xl border border-slate-200 bg-white p-1 shadow-lg z-20 animate-in fade-in zoom-in-95 duration-100">
                  {dateOptions.map((opt) => (
                    <button
                      key={opt}
                      onClick={() => {
                        setDateRange(opt);
                        setDateDropdownOpen(false);
                      }}
                      className={`flex w-full items-center px-3 py-1.5 text-xs rounded-md text-left transition-colors ${
                        dateRange === opt
                          ? 'bg-emerald-50 text-emerald-800 font-semibold'
                          : 'text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Row 1: 4 Metric Cards + Compact Summary on the Right */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-4">
            {/* Card 1: Solar Generation */}
            <div className="lg:col-span-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs flex flex-col justify-between">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                  <Sun className="h-4 w-4" />
                </div>
                <span className="text-xs font-medium text-slate-500">Solar Generation</span>
              </div>
              <div className="mt-3">
                <div className="text-2xl font-bold tracking-tight text-slate-900 font-mono tabular-nums">
                  {telemetry.solarGeneration} kW
                </div>
                <div className="mt-1 flex items-center gap-1 text-[11px] font-medium text-emerald-600">
                  <span>
                    ↑ {telemetry.solarPrevChange > 0 ? telemetry.solarPrevChange : 12}%
                  </span>
                  <span className="text-slate-400 font-normal">vs. previous 7 days</span>
                </div>
              </div>
            </div>

            {/* Card 2: Total Demand */}
            <div className="lg:col-span-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs flex flex-col justify-between">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                  <Zap className="h-4 w-4" />
                </div>
                <span className="text-xs font-medium text-slate-500">Total Demand</span>
              </div>
              <div className="mt-3">
                <div className="text-2xl font-bold tracking-tight text-slate-900 font-mono tabular-nums">
                  {telemetry.totalDemand} kW
                </div>
                <div className="mt-1 flex items-center gap-1 text-[11px] font-medium text-emerald-600">
                  <span>
                    ↑ {telemetry.demandPrevChange > 0 ? telemetry.demandPrevChange : 6}%
                  </span>
                  <span className="text-slate-400 font-normal">vs. previous 7 days</span>
                </div>
              </div>
            </div>

            {/* Card 3: Battery SoC */}
            <div className="lg:col-span-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs flex flex-col justify-between">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                  <BatteryCharging className="h-4 w-4" />
                </div>
                <span className="text-xs font-medium text-slate-500">Battery SoC</span>
              </div>
              <div className="mt-3">
                <div className="text-2xl font-bold tracking-tight text-slate-900 font-mono tabular-nums">
                  {telemetry.batterySoc}%
                </div>
                <div className="mt-1 flex items-center gap-1 text-[11px] font-medium text-emerald-600">
                  <span>
                    ↑ {telemetry.batterySocChange > 0 ? telemetry.batterySocChange : 5}%
                  </span>
                  <span className="text-slate-400 font-normal">vs. previous 7 days</span>
                </div>
              </div>
            </div>

            {/* Card 4: Critical Loads Served */}
            <div className="lg:col-span-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs flex flex-col justify-between">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                  <ShieldCheck className="h-4 w-4" />
                </div>
                <span className="text-xs font-medium text-slate-500">Critical Loads Served</span>
              </div>
              <div className="mt-3">
                <div className="text-2xl font-bold tracking-tight text-slate-900 font-mono tabular-nums">
                  {telemetry.criticalLoadsServed}%
                </div>
                <div className="mt-1 flex items-center gap-1 text-[11px] font-medium text-slate-600">
                  <span>→ 0%</span>
                  <span className="text-slate-400 font-normal">vs. previous 7 days</span>
                </div>
              </div>
            </div>
          </div>

          {/* Row 2: Solar Generation vs Demand (kW) Stacked Bar Chart */}
          <div className="relative rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-4">
              <h2 className="text-sm font-bold text-slate-900">
                Solar Generation vs Demand (kW)
              </h2>

              {/* Chart Legend matching exact image colors */}
              <div className="flex items-center gap-4 text-xs font-medium text-slate-600">
                <div className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-[#86EFAC]" />
                  <span>Solar</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-[#FDE047]" />
                  <span>Battery</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-[#FDBA74]" />
                  <span>Grid</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-[#94A3B8]" />
                  <span>Demand</span>
                </div>
              </div>
            </div>

            {/* Custom SVG Stacked Bar Chart with May 2 Tooltip */}
            <div className="relative h-64 w-full pt-4">
              <svg className="w-full h-full overflow-visible" viewBox="0 0 650 200">
                {/* Horizontal Grid lines */}
                <g className="text-slate-300 stroke-slate-200" strokeDasharray="3 3">
                  <line x1="40" y1="20" x2="630" y2="20" />
                  <line x1="40" y1="60" x2="630" y2="60" />
                  <line x1="40" y1="100" x2="630" y2="100" />
                  <line x1="40" y1="140" x2="630" y2="140" />
                  <line x1="40" y1="180" x2="630" y2="180" strokeDasharray="none" />
                </g>

                {/* Y-axis labels */}
                <g className="text-[11px] fill-slate-400 font-mono" textAnchor="end">
                  <text x="32" y="24">200</text>
                  <text x="32" y="64">150</text>
                  <text x="32" y="104">100</text>
                  <text x="32" y="144">50</text>
                  <text x="32" y="184">0</text>
                </g>

                {/* Stacked Bars */}
                {historicalData.map((d, index) => {
                  const barWidth = 36;
                  const x = 70 + index * 95;
                  const scale = 160 / 200; // 160px height for 200kW

                  const solarH = d.solar * scale;
                  const batteryH = d.battery * scale;
                  const gridH = d.grid * scale;

                  const solarY = 180 - solarH;
                  const batteryY = solarY - batteryH;
                  const gridY = batteryY - gridH;

                  const demandY = 180 - d.demand * scale;
                  const isHovered = hoveredBar?.date === d.date;

                  return (
                    <g
                      key={d.date}
                      className="cursor-pointer group"
                      onMouseEnter={() => setHoveredBar(d)}
                    >
                      {/* Solar segment (green) */}
                      <rect
                        x={x}
                        y={solarY}
                        width={barWidth}
                        height={solarH}
                        fill="#86EFAC"
                        className="transition-opacity group-hover:opacity-90"
                      />

                      {/* Battery segment (yellow) */}
                      <rect
                        x={x}
                        y={batteryY}
                        width={barWidth}
                        height={batteryH}
                        fill="#FDE047"
                        className="transition-opacity group-hover:opacity-90"
                      />

                      {/* Grid segment (orange) with rounded top */}
                      <rect
                        x={x}
                        y={gridY}
                        width={barWidth}
                        height={gridH}
                        rx="3"
                        fill="#FDBA74"
                        className="transition-opacity group-hover:opacity-90"
                      />

                      {/* Demand horizontal indicator line across bar */}
                      <line
                        x1={x - 6}
                        y1={demandY}
                        x2={x + barWidth + 6}
                        y2={demandY}
                        stroke="#94A3B8"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                      />

                      {/* X-axis date label */}
                      <text
                        x={x + barWidth / 2}
                        y="196"
                        textAnchor="middle"
                        className={`text-xs ${
                          isHovered ? 'fill-slate-900 font-bold' : 'fill-slate-500'
                        }`}
                      >
                        {d.label}
                      </text>
                    </g>
                  );
                })}
              </svg>

              {/* Floating Tooltip matching image (fixed on May 2 or hovered) */}
              {hoveredBar && (
                <div
                  className="absolute pointer-events-none rounded-xl border border-slate-200 bg-white/95 p-3 text-xs shadow-md z-10 backdrop-blur-xs transition-all"
                  style={{
                    left: '58%',
                    top: '12%',
                    transform: 'translateX(-50%)',
                    minWidth: '130px',
                  }}
                >
                  <div className="font-semibold text-slate-800">
                    {hoveredBar.date === '2025-05-02' ? 'May 2, 2025' : hoveredBar.label}
                  </div>
                  <div className="text-[11px] font-bold text-slate-600 pb-1.5 mb-1.5 border-b border-slate-100">
                    Total: {hoveredBar.total} kW
                  </div>
                  <div className="space-y-1 font-mono text-[11px]">
                    <div className="flex items-center justify-between text-slate-700">
                      <span className="flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full bg-[#86EFAC]" />
                        <span className="font-sans">Solar</span>
                      </span>
                      <span>{hoveredBar.solar} kW</span>
                    </div>
                    <div className="flex items-center justify-between text-slate-700">
                      <span className="flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full bg-[#FDE047]" />
                        <span className="font-sans">Battery</span>
                      </span>
                      <span>{hoveredBar.battery} kW</span>
                    </div>
                    <div className="flex items-center justify-between text-slate-700">
                      <span className="flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full bg-[#FDBA74]" />
                        <span className="font-sans">Grid</span>
                      </span>
                      <span>{hoveredBar.grid} kW</span>
                    </div>
                    <div className="flex items-center justify-between text-slate-700 pt-1 border-t border-slate-100">
                      <span className="flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full bg-[#94A3B8]" />
                        <span className="font-sans">Demand</span>
                      </span>
                      <span>{hoveredBar.demand} kW</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Watermark label bottom right */}
              <div className="absolute bottom-1 right-2 text-[10px] text-slate-400 italic">
                Illustrative demo data
              </div>
            </div>
          </div>

          {/* Row 3: Energy Flow — Microgrid Architecture Card */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs">
            <h2 className="text-sm font-bold text-slate-900 mb-4">
              Energy Flow — Microgrid
            </h2>

            <div className="relative rounded-xl border border-slate-100 bg-slate-50/40 p-6 overflow-hidden">
              {/* Top Layer: Solar, Battery, EV, Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {/* Solar PV */}
                <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-2xs flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                    <Sun className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-xs font-medium text-slate-500">Solar PV</div>
                    <div className="text-sm font-bold text-slate-900 font-mono">
                      {telemetry.solarGeneration} kW
                    </div>
                  </div>
                </div>

                {/* Battery Storage */}
                <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-2xs flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                    <BatteryCharging className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-xs font-medium text-slate-500">
                      Battery Storage
                      <span className="text-[10px] text-slate-400 block font-mono">
                        (SoC {telemetry.batterySoc}%)
                      </span>
                    </div>
                    <div className="text-sm font-bold text-slate-900 font-mono">
                      {telemetry.batteryPower} kW
                    </div>
                  </div>
                </div>

                {/* EV Charging */}
                <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-2xs flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                    <Car className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-xs font-medium text-slate-500">EV Charging</div>
                    <div className="text-sm font-bold text-slate-900 font-mono">
                      {telemetry.evChargingPower} kW
                    </div>
                  </div>
                </div>

                {/* Grid Connection */}
                <div className="relative rounded-xl border border-slate-200 bg-white p-3 shadow-2xs flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                    <Radio className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-xs font-medium text-slate-500">Grid Connection</div>
                    <div className="text-sm font-bold text-slate-900 font-mono">
                      {telemetry.gridPower} kW
                    </div>
                  </div>
                </div>
              </div>

              {/* Connecting Flow Paths SVG */}
              <div className="relative my-4 flex justify-center">
                <svg className="w-full h-12 overflow-visible" viewBox="0 0 600 48">
                  {/* Flow lines converging to center */}
                  <path
                    d="M 75 4 L 75 24 Q 75 40 180 40 L 300 40"
                    fill="none"
                    stroke="#10B981"
                    strokeWidth="2"
                    strokeDasharray="6 4"
                    className="animate-flow-dash"
                  />
                  <path
                    d="M 225 4 L 225 24 Q 225 40 270 40 L 300 40"
                    fill="none"
                    stroke="#10B981"
                    strokeWidth="2"
                    strokeDasharray="6 4"
                    className="animate-flow-dash"
                  />
                  <path
                    d="M 375 4 L 375 24 Q 375 40 330 40 L 300 40"
                    fill="none"
                    stroke="#10B981"
                    strokeWidth="2"
                    strokeDasharray="6 4"
                    className="animate-flow-dash"
                  />
                  <path
                    d="M 525 4 L 525 24 Q 525 40 420 40 L 300 40"
                    fill="none"
                    stroke="#94A3B8"
                    strokeWidth="2"
                    strokeDasharray="6 4"
                  />
                </svg>

                {/* Center Badge Capsule */}
                <div className="absolute top-1/2 -translate-y-1/2 flex items-center justify-center">
                  <div className="flex flex-col items-center justify-center rounded-full bg-[#2E7D32] px-6 py-2 text-white shadow-sm ring-4 ring-emerald-100">
                    <span className="text-[11px] font-medium tracking-tight">
                      Supply – Demand Balance
                    </span>
                    <span className="text-xs font-bold font-mono tracking-wider">
                      {netBalanceSign} {telemetry.netBalanceKw} kW
                    </span>
                  </div>
                </div>
              </div>

              {/* Downward Lines */}
              <div className="relative mb-3 flex justify-center">
                <svg className="w-full h-10 overflow-visible" viewBox="0 0 600 40">
                  <path
                    d="M 300 0 L 300 16 Q 300 32 200 32 L 180 32"
                    fill="none"
                    stroke="#10B981"
                    strokeWidth="2"
                    strokeDasharray="6 4"
                    className="animate-flow-dash"
                  />
                  <path
                    d="M 300 0 L 300 16 Q 300 32 400 32 L 420 32"
                    fill="none"
                    stroke="#10B981"
                    strokeWidth="2"
                    strokeDasharray="6 4"
                    className="animate-flow-dash"
                  />
                </svg>
              </div>

              {/* Bottom Layer: Critical Loads & Flexible Loads */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-xl mx-auto">
                {/* Critical Loads */}
                <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-2xs flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                    <Building2 className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-xs font-medium text-slate-500">Critical Loads</div>
                    <div className="text-sm font-bold text-slate-900 font-mono">
                      {telemetry.criticalLoadsPower} kW
                    </div>
                  </div>
                </div>

                {/* Flexible Loads */}
                <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-2xs flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                    <Home className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-xs font-medium text-slate-500">Flexible Loads</div>
                    <div className="text-sm font-bold text-slate-900 font-mono">
                      {telemetry.flexibleLoadsPower} kW
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Row 4: Recovery Pipeline (DETECT -> PREDICT -> REALLOCATE -> VERIFY) */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs">
            <h2 className="text-sm font-bold text-slate-900 mb-4">Recovery Pipeline</h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 relative">
              {pipelineSteps.map((step, idx) => {
                const isStepActive = step.status === 'active';
                const isStepCompleted = step.status === 'completed';

                return (
                  <div
                    key={step.id}
                    className={`relative rounded-xl border p-4 transition-all ${
                      isStepActive
                        ? 'border-amber-300 bg-amber-50/40 shadow-xs ring-1 ring-amber-300'
                        : isStepCompleted
                        ? 'border-slate-200 bg-slate-50/50'
                        : 'border-slate-100 bg-white opacity-60'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div
                        className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                          isStepCompleted
                            ? 'bg-emerald-600 text-white'
                            : isStepActive
                            ? 'bg-amber-500 text-white ring-2 ring-amber-200'
                            : 'bg-slate-200 text-slate-600'
                        }`}
                      >
                        {step.stepNumber}
                      </div>

                      {/* Status indicator */}
                      {isStepCompleted && (
                        <div className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600">
                          <Check className="h-3 w-3" />
                          <span>Completed</span>
                        </div>
                      )}
                      {isStepActive && (
                        <div className="flex items-center gap-1 text-[11px] font-semibold text-amber-600">
                          <div className="h-2 w-2 rounded-full bg-amber-500 animate-ping" />
                          <span>Active</span>
                        </div>
                      )}
                      {!isStepCompleted && !isStepActive && (
                        <div className="flex items-center gap-1 text-[11px] text-slate-400">
                          <span>Pending</span>
                        </div>
                      )}
                    </div>

                    <div className="text-xs font-bold uppercase tracking-wider text-slate-900">
                      {step.title}
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      {step.subtitle}
                    </div>

                    {/* Connecting Chevron Arrow between steps (desktop) */}
                    {idx < pipelineSteps.length - 1 && (
                      <div className="hidden lg:flex absolute -right-3 top-1/2 -translate-y-1/2 z-10 h-6 w-6 items-center justify-center rounded-full bg-white border border-slate-200 text-slate-400 shadow-2xs">
                        <ArrowRight className="h-3 w-3" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Loop reassess subtext */}
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-center gap-2 text-xs text-slate-500 font-medium">
              <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
              <span>{recoveryStateText}</span>
            </div>
          </div>

          {/* Row 5: 4 Cards Grid (Solar vs Demand Forecast, Recovery Performance, Active Alerts, Recent Events) */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Card 1: Solar vs Demand Forecast */}
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs flex flex-col justify-between">
              <div>
                <div className="text-xs font-bold text-slate-900">
                  Solar vs Demand Forecast
                </div>
                {/* Micro Legend */}
                <div className="mt-2 flex flex-wrap items-center gap-2 text-[10px] text-slate-500">
                  <span className="flex items-center gap-1">
                    <span className="inline-block w-3 border-b-2 border-emerald-500 border-dashed" />
                    Solar
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="inline-block w-3 border-b-2 border-slate-500 border-dashed" />
                    Demand
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="inline-block w-3 border-b-2 border-emerald-700" />
                    Actual
                  </span>
                </div>
              </div>

              {/* Sparkline forecast curve */}
              <div className="mt-3 h-28 w-full">
                <svg className="w-full h-full overflow-visible" viewBox="0 0 160 80">
                  {/* Grid Lines */}
                  <line x1="0" y1="20" x2="160" y2="20" stroke="#f1f5f9" strokeWidth="1" />
                  <line x1="0" y1="50" x2="160" y2="50" stroke="#f1f5f9" strokeWidth="1" />
                  <line x1="0" y1="75" x2="160" y2="75" stroke="#e2e8f0" strokeWidth="1" />

                  {/* Solar Forecast (green dashed curve) */}
                  <path
                    d="M 0 55 Q 30 40 60 48 T 110 32 T 160 40"
                    fill="none"
                    stroke="#10B981"
                    strokeWidth="1.8"
                    strokeDasharray="4 3"
                  />

                  {/* Demand Forecast (slate dashed curve) */}
                  <path
                    d="M 0 42 Q 40 44 80 35 T 160 48"
                    fill="none"
                    stroke="#64748B"
                    strokeWidth="1.8"
                    strokeDasharray="4 3"
                  />

                  {/* Actual Curve (solid) */}
                  <path
                    d="M 0 54 Q 30 38 60 48 T 90 35"
                    fill="none"
                    stroke="#047857"
                    strokeWidth="2"
                  />

                  {/* Point at current */}
                  <circle cx="90" cy="35" r="2.5" fill="#047857" />
                </svg>
                <div className="flex justify-between text-[9px] text-slate-400 font-mono mt-1">
                  <span>May 1</span>
                  <span>May 3</span>
                  <span>May 5</span>
                  <span>May 7</span>
                </div>
              </div>
            </div>

            {/* Card 2: Recovery Performance */}
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs">
              <div className="text-xs font-bold text-slate-900 mb-3">
                Recovery Performance
              </div>
              <div className="space-y-2.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-slate-600 text-[11px]">
                    <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                    Critical-load service
                  </span>
                  <div className="flex items-center gap-1 font-mono font-bold text-slate-900 text-[11px]">
                    <span>{telemetry.criticalLoadsServed}%</span>
                    <span className="text-[10px] text-slate-400 font-normal">↑ 0%</span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-slate-600 text-[11px]">
                    <Zap className="h-3.5 w-3.5 text-emerald-600" />
                    Unserved energy
                  </span>
                  <div className="flex items-center gap-1 font-mono font-bold text-slate-900 text-[11px]">
                    <span>{telemetry.unservedEnergyKwh} kWh</span>
                    <span className="text-[10px] text-emerald-600 font-normal">↓ 100%</span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-slate-600 text-[11px]">
                    <Clock className="h-3.5 w-3.5 text-emerald-600" />
                    Recovery time
                  </span>
                  <div className="flex items-center gap-1 font-mono font-bold text-slate-900 text-[11px]">
                    <span>{telemetry.recoveryTimeMin} min</span>
                    <span className="text-[10px] text-emerald-600 font-normal">↓ 76%</span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-slate-600 text-[11px]">
                    <AlertTriangle className="h-3.5 w-3.5 text-emerald-600" />
                    Constraint violations
                  </span>
                  <div className="flex items-center gap-1 font-mono font-bold text-slate-900 text-[11px]">
                    <span>{telemetry.constraintViolations}</span>
                    <span className="text-[10px] text-emerald-600 font-normal">↓ 100%</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Card 3: Active Alerts */}
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-slate-900">Active Alerts</span>
                  <button
                    onClick={() => setActivePage('faults')}
                    className="text-[11px] font-medium text-slate-400 hover:text-slate-700"
                  >
                    View all &gt;
                  </button>
                </div>

                {alerts.length === 0 ? (
                  <div className="py-4 text-center text-xs text-slate-400">
                    No active warnings
                  </div>
                ) : (
                  <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
                        <span className="text-xs font-semibold text-slate-900 truncate">
                          {alerts[0].title}
                        </span>
                      </div>
                      <span className="rounded-md bg-amber-100 px-1.5 py-0.5 text-[9px] font-bold text-amber-800">
                        {alerts[0].severity}
                      </span>
                    </div>
                    <div className="mt-1 text-[11px] text-slate-500 leading-tight">
                      {alerts[0].description}
                    </div>
                    <div className="mt-1 text-right text-[10px] text-slate-400 font-mono">
                      {alerts[0].time}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Card 4: Recent Recovery Events */}
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-900">Recent Recovery Events</span>
                  <button
                    onClick={() => setActivePage('logs')}
                    className="text-[11px] font-medium text-slate-400 hover:text-slate-700"
                  >
                    View all &gt;
                  </button>
                </div>

                <div className="space-y-2 mt-2">
                  {events.slice(0, 4).map((evt) => (
                    <div
                      key={evt.id}
                      className="flex items-center justify-between text-[11px] gap-2 border-b border-slate-100 pb-1.5 last:border-0"
                    >
                      <div className="flex items-center gap-1.5 truncate">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" />
                        <span className="font-mono text-slate-400 text-[10px]">{evt.time}</span>
                        <span className="text-slate-700 truncate">{evt.title}</span>
                      </div>
                      <span className="rounded-md bg-emerald-50 px-1.5 py-0.5 text-[9px] font-semibold text-emerald-700 shrink-0">
                        {evt.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right 3 Columns: System Health & Quick Actions */}
        <div className="xl:col-span-3 space-y-6">
          {/* Supply Summary — matches reference right-rail stack */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs divide-y divide-slate-100">
            <div className="pb-2.5">
              <span className="text-[11px] font-medium text-slate-500">Total Supply</span>
              <div className="text-xl font-bold text-slate-900 font-mono tabular-nums">
                {telemetry.totalSupply} kW
              </div>
            </div>
            <div className="py-2.5">
              <span className="text-[11px] font-medium text-slate-500">Grid Import</span>
              <div className="text-xl font-bold text-slate-900 font-mono tabular-nums">
                {telemetry.gridImport} kW
              </div>
            </div>
            <div className="pt-2.5">
              <span className="text-[11px] font-medium text-slate-500">Unserved Energy</span>
              <div className="text-xl font-bold text-slate-900 font-mono tabular-nums">
                {telemetry.unservedEnergyKwh} kWh
              </div>
            </div>
          </div>

          {/* System Health Card */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs">
            <h2 className="text-sm font-bold text-slate-900 mb-3">System Health</h2>

            {/* Main Status Header */}
            <div className="flex items-center gap-3 rounded-xl border border-emerald-100 bg-emerald-50/50 p-3.5 mb-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-600 text-white shrink-0">
                <Check className="h-5 w-5 stroke-[2.5]" />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-900">
                  {telemetry.gridStatus === 'islanded' ? 'Islanded Mode' : 'Grid-connected'}
                </div>
                <div className="text-[11px] text-slate-500">
                  {telemetry.gridStatus === 'islanded'
                    ? 'Autonomous balance active'
                    : 'Microgrid operating normally'}
                </div>
              </div>
            </div>

            {/* Asset Status List */}
            <div className="space-y-3 pt-1">
              {assets.map((asset) => {
                const getAssetIcon = () => {
                  switch (asset.type) {
                    case 'solar':
                      return <Sun className="h-4 w-4 text-emerald-600" />;
                    case 'battery':
                      return <BatteryCharging className="h-4 w-4 text-emerald-600" />;
                    case 'ev':
                      return <Car className="h-4 w-4 text-emerald-600" />;
                    case 'grid':
                      return <Radio className="h-4 w-4 text-emerald-600" />;
                    case 'critical':
                      return <Building2 className="h-4 w-4 text-emerald-600" />;
                    case 'flexible':
                      return <Home className="h-4 w-4 text-emerald-600" />;
                  }
                };

                return (
                  <div
                    key={asset.id}
                    className="flex items-center justify-between text-xs py-0.5"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-7 w-7 items-center justify-center rounded-md bg-slate-50 border border-slate-100">
                        {getAssetIcon()}
                      </div>
                      <span className="font-medium text-slate-700">{asset.name}</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span
                        className={`h-2 w-2 rounded-full ${
                          asset.isHealthy ? 'bg-emerald-500' : 'bg-rose-500'
                        }`}
                      />
                      <span
                        className={`text-[11px] font-semibold ${
                          asset.isHealthy ? 'text-slate-600' : 'text-rose-600'
                        }`}
                      >
                        {asset.status}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick Actions Card */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs">
            <h2 className="text-sm font-bold text-slate-900 mb-3">Quick Actions</h2>

            <div className="grid grid-cols-2 gap-3">
              {/* Inject Fault */}
              <button
                onClick={onOpenFaultModal}
                className="flex flex-col items-center justify-center gap-2 rounded-xl border border-slate-200 p-3.5 text-center text-xs font-semibold text-slate-700 hover:border-amber-300 hover:bg-amber-50/30 transition-all"
              >
                <AlertTriangle className="h-4 w-4 text-amber-500" />
                <span>Inject Fault</span>
              </button>

              {/* Run Recovery */}
              <button
                onClick={runRecoveryLoop}
                disabled={isSimulating}
                className="flex flex-col items-center justify-center gap-2 rounded-xl border border-slate-200 p-3.5 text-center text-xs font-semibold text-slate-700 hover:border-emerald-300 hover:bg-emerald-50/30 transition-all"
              >
                <Play className="h-4 w-4 text-emerald-600" />
                <span>Run Recovery</span>
              </button>

              {/* Compare Baseline */}
              <button
                onClick={() => setActivePage('benchmark')}
                className="flex flex-col items-center justify-center gap-2 rounded-xl border border-slate-200 p-3.5 text-center text-xs font-semibold text-slate-700 hover:border-blue-300 hover:bg-blue-50/30 transition-all"
              >
                <BarChart2 className="h-4 w-4 text-blue-600" />
                <span>Compare Baseline</span>
              </button>

              {/* Export Report */}
              <button
                onClick={onOpenExportModal}
                className="flex flex-col items-center justify-center gap-2 rounded-xl border border-slate-200 p-3.5 text-center text-xs font-semibold text-slate-700 hover:border-slate-300 hover:bg-slate-50 transition-all"
              >
                <Download className="h-4 w-4 text-slate-600" />
                <span>Export Report</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
