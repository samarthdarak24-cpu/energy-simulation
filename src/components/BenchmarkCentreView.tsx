import React, { useState } from 'react';
import {
  Trophy,
  Download,
  Calendar,
  ChevronDown,
  Play,
  BarChart2,
  FileText,
  Eye,
  Sun,
  ShieldCheck,
  Zap,
  Radio,
  Leaf,
  Check,
  Clock,
  Lightbulb,
} from 'lucide-react';
import { useMicrogrid } from '../context/MicrogridContext';

export const BenchmarkCentreView: React.FC = () => {
  const { exportAuditCsv } = useMicrogrid();

  const [dateRange] = useState('Apr 28, 2025 – May 4, 2025');
  const [selectedScenario, setSelectedScenario] = useState('Solar Generation Loss (50%)');
  const [activeTrendTab, setActiveTrendTab] = useState<'unserved' | 'peak' | 'emissions' | 'renewable'>('unserved');

  const comparisonCategories = [
    { name: 'Renewable Use (%)', baseline: 70, ruleBased: 76, predictive: 82 },
    { name: 'Critical Load Service (%)', baseline: 96.2, ruleBased: 98.7, predictive: 99.8 },
    { name: 'Unserved Energy (kWh)', baseline: 13.1, ruleBased: 8.6, predictive: 4.2 },
    { name: 'Peak Demand (kW)', baseline: 61, ruleBased: 54, predictive: 48 },
    { name: 'Emissions (kg)', baseline: 31.8, ruleBased: 24.6, predictive: 18.7 },
    { name: 'Recovery Time (min)', baseline: 15.8, ruleBased: 11.2, predictive: 7.4 },
  ];

  const scenarioSummary = [
    { metric: 'Renewable Energy Use', baseline: '70%', ruleBased: '76%', predictive: '82%' },
    { metric: 'Critical Load Service', baseline: '98.0%', ruleBased: '98.7%', predictive: '99.8%' },
    { metric: 'Unserved Energy', baseline: '13.1 kWh', ruleBased: '8.6 kWh', predictive: '4.2 kWh' },
    { metric: 'Peak Demand', baseline: '61 kW', ruleBased: '54 kW', predictive: '48 kW' },
    { metric: 'Emissions', baseline: '31.8 kg', ruleBased: '24.6 kg', predictive: '18.7 kg' },
    { metric: 'Recovery Time', baseline: '15.8 min', ruleBased: '11.2 min', predictive: '7.4 min' },
  ];

  const recentBenchmarkRuns = [
    {
      dateTime: 'May 3, 2025 – 12:00 PM',
      scenario: 'Solar Generation Loss (50%)',
      controller: 'Predictive (Our Approach)',
      unserved: '4.2',
      critical: '99.8%',
      time: '7.4 min',
      status: 'Completed',
    },
    {
      dateTime: 'May 3, 2025 – 12:00 PM',
      scenario: 'Solar Generation Loss (50%)',
      controller: 'Rule-based',
      unserved: '8.6',
      critical: '98.7%',
      time: '11.2 min',
      status: 'Completed',
    },
    {
      dateTime: 'May 3, 2025 – 12:00 PM',
      scenario: 'Solar Generation Loss (50%)',
      controller: 'Baseline',
      unserved: '13.1',
      critical: '98.0%',
      time: '15.8 min',
      status: 'Completed',
    },
    {
      dateTime: 'May 2, 2025 – 06:00 PM',
      scenario: 'Demand Surge',
      controller: 'Predictive (Our Approach)',
      unserved: '5.8',
      critical: '99.5%',
      time: '8.9 min',
      status: 'Completed',
    },
    {
      dateTime: 'May 1, 2025 – 03:30 PM',
      scenario: 'Grid Outage',
      controller: 'Predictive (Our Approach)',
      unserved: '6.7',
      critical: '99.1%',
      time: '10.3 min',
      status: 'Completed',
    },
  ];

  return (
    <div className="flex-1 p-6 space-y-6 max-w-[1600px] mx-auto text-slate-800">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Benchmark Centre
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Compare performance across different controllers and scenarios.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs">
            <Calendar className="h-3.5 w-3.5 text-slate-400" />
            <span>{dateRange}</span>
            <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
          </div>

          <div className="relative">
            <select
              value={selectedScenario}
              onChange={(e) => setSelectedScenario(e.target.value)}
              className="appearance-none rounded-lg border border-slate-200 bg-white py-1.5 pl-3 pr-8 text-xs font-semibold text-slate-700 shadow-2xs"
            >
              <option value="Solar Generation Loss (50%)">Solar Generation Loss (50%)</option>
              <option value="Demand Surge (+40 kW)">Demand Surge (+40 kW)</option>
              <option value="Grid Islanding Blackout">Grid Islanding Blackout</option>
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
          </div>

          <button
            onClick={() => {}}
            className="flex items-center gap-1.5 rounded-lg bg-[#2E7D32] px-3.5 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-[#256829] transition-all"
          >
            <Play className="h-3.5 w-3.5 fill-current" />
            <span>Run Benchmark</span>
          </button>
        </div>
      </div>

      {/* 5 KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-3.5 shadow-2xs space-y-1">
          <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-medium">
            <Leaf className="h-3.5 w-3.5 text-emerald-600" /> Renewable Energy Use
          </div>
          <div className="text-xl font-bold text-slate-900 font-mono">82%</div>
          <div className="text-[10px] text-emerald-600">
            ↑ 12% <span className="text-slate-400">vs. baseline (70%)</span>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-3.5 shadow-2xs space-y-1">
          <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-medium">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" /> Critical Load Service
          </div>
          <div className="text-xl font-bold text-slate-900 font-mono">99.8%</div>
          <div className="text-[10px] text-emerald-600">
            ↑ 1.8% <span className="text-slate-400">vs. baseline (98.0%)</span>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-3.5 shadow-2xs space-y-1">
          <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-medium">
            <Zap className="h-3.5 w-3.5 text-emerald-600" /> Unserved Energy
          </div>
          <div className="text-xl font-bold text-slate-900 font-mono">4.2 kWh</div>
          <div className="text-[10px] text-emerald-600">
            ↓ 68% <span className="text-slate-400">vs. baseline (13.1 kWh)</span>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-3.5 shadow-2xs space-y-1">
          <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-medium">
            <Radio className="h-3.5 w-3.5 text-emerald-600" /> Peak Grid Demand
          </div>
          <div className="text-xl font-bold text-slate-900 font-mono">48 kW</div>
          <div className="text-[10px] text-emerald-600">
            ↓ 22% <span className="text-slate-400">vs. baseline (61 kW)</span>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-3.5 shadow-2xs space-y-1">
          <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-medium">
            <Leaf className="h-3.5 w-3.5 text-emerald-600" /> Estimated Emissions
          </div>
          <div className="text-xl font-bold text-slate-900 font-mono">
            18.7 kg CO₂
          </div>
          <div className="text-[10px] text-emerald-600">
            ↓ 41% <span className="text-slate-400">vs. baseline (31.8 kg)</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Left 9 cols (Comparison + Scenario details + Metric trends + Summary) & Right 3 cols */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* Left 9 Columns */}
        <div className="xl:col-span-9 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Performance Comparison Grouped Bar Chart (8 cols) */}
            <div className="lg:col-span-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-4">
                <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Performance Comparison
                </h2>
                <div className="flex items-center gap-3 text-[10px] text-slate-600">
                  <span className="flex items-center gap-1">
                    <span className="h-2 w-2 rounded-full bg-slate-400" /> Baseline (No Recovery)
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="h-2 w-2 rounded-full bg-amber-400" /> Rule-based Recovery
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="h-2 w-2 rounded-full bg-emerald-600" /> Predictive (Our Approach)
                  </span>
                </div>
              </div>

              {/* Grouped Bar Chart */}
              <div className="relative h-60 w-full pt-4">
                <svg className="w-full h-full overflow-visible" viewBox="0 0 500 180">
                  {/* Grid Lines */}
                  <line x1="30" y1="20" x2="490" y2="20" stroke="#f1f5f9" />
                  <line x1="30" y1="60" x2="490" y2="60" stroke="#f1f5f9" />
                  <line x1="30" y1="100" x2="490" y2="100" stroke="#f1f5f9" />
                  <line x1="30" y1="140" x2="490" y2="140" stroke="#f1f5f9" />
                  <line x1="30" y1="160" x2="490" y2="160" stroke="#cbd5e1" />

                  <text x="24" y="24" className="text-[8px] fill-slate-400 font-mono" textAnchor="end">100</text>
                  <text x="24" y="64" className="text-[8px] fill-slate-400 font-mono" textAnchor="end">75</text>
                  <text x="24" y="104" className="text-[8px] fill-slate-400 font-mono" textAnchor="end">50</text>
                  <text x="24" y="144" className="text-[8px] fill-slate-400 font-mono" textAnchor="end">25</text>
                  <text x="24" y="164" className="text-[8px] fill-slate-400 font-mono" textAnchor="end">0</text>

                  {/* 6 Category Clusters */}
                  {comparisonCategories.map((cat, idx) => {
                    const groupX = 40 + idx * 75;
                    const barW = 14;

                    const hBase = (cat.baseline / 100) * 140;
                    const hRule = (cat.ruleBased / 100) * 140;
                    const hPred = (cat.predictive / 100) * 140;

                    return (
                      <g key={cat.name}>
                        {/* Baseline */}
                        <rect
                          x={groupX}
                          y={160 - hBase}
                          width={barW}
                          height={hBase}
                          fill="#CBD5E1"
                          rx="1.5"
                        />
                        <text
                          x={groupX + barW / 2}
                          y={155 - hBase}
                          textAnchor="middle"
                          className="text-[7px] font-mono fill-slate-500"
                        >
                          {cat.baseline}
                        </text>

                        {/* Rule-based */}
                        <rect
                          x={groupX + barW + 2}
                          y={160 - hRule}
                          width={barW}
                          height={hRule}
                          fill="#FBBF24"
                          rx="1.5"
                        />
                        <text
                          x={groupX + barW + 2 + barW / 2}
                          y={155 - hRule}
                          textAnchor="middle"
                          className="text-[7px] font-mono fill-amber-700"
                        >
                          {cat.ruleBased}
                        </text>

                        {/* Predictive */}
                        <rect
                          x={groupX + (barW + 2) * 2}
                          y={160 - hPred}
                          width={barW}
                          height={hPred}
                          fill="#10B981"
                          rx="1.5"
                        />
                        <text
                          x={groupX + (barW + 2) * 2 + barW / 2}
                          y={155 - hPred}
                          textAnchor="middle"
                          className="text-[7px] font-mono font-bold fill-emerald-800"
                        >
                          {cat.predictive}
                        </text>

                        {/* Category Label */}
                        <text
                          x={groupX + 24}
                          y="173"
                          textAnchor="middle"
                          className="text-[7px] fill-slate-500 font-sans"
                        >
                          {cat.name.split(' ')[0]}
                        </text>
                      </g>
                    );
                  })}
                </svg>
              </div>
            </div>

            {/* Scenario Details (4 cols) */}
            <div className="lg:col-span-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs space-y-3 flex flex-col justify-between">
              <div>
                <span className="text-xs font-bold text-slate-900 block mb-3">
                  Scenario Details
                </span>

                <div className="flex items-start gap-2.5 p-2 rounded-xl bg-slate-50 border border-slate-100 mb-3">
                  <Sun className="h-5 w-5 text-amber-500 shrink-0" />
                  <div>
                    <div className="text-xs font-bold text-slate-900">
                      Solar Generation Loss (50%)
                    </div>
                    <div className="text-[10px] text-slate-400">
                      Solar output dropped by 50% at 12:00 PM
                    </div>
                  </div>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-400 text-[11px]">Fault Type</span>
                    <span className="font-semibold text-slate-800">Generation Loss</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-400 text-[11px]">Severity</span>
                    <span className="font-mono font-bold text-slate-800">50%</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-400 text-[11px]">Duration</span>
                    <span className="font-mono text-slate-800">2 hours</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-400 text-[11px]">Start Time</span>
                    <span className="font-mono text-slate-800 text-[11px]">
                      May 3, 2025 – 12:00 PM
                    </span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => {}}
                className="w-full flex items-center justify-center gap-1.5 rounded-lg bg-emerald-700 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-emerald-800"
              >
                <Eye className="h-3.5 w-3.5" />
                <span>View Scenario Details</span>
              </button>
            </div>
          </div>

          {/* Metric Trends (Left) & Scenario Results Summary Table (Right) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Metric Trends (6 cols) */}
            <div className="lg:col-span-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900">Metric Trends</span>
                <div className="flex rounded-md bg-slate-100 p-0.5 text-[9px] font-medium">
                  {(['unserved', 'peak', 'emissions', 'renewable'] as const).map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTrendTab(tab)}
                      className={`px-2 py-0.5 rounded capitalize ${
                        activeTrendTab === tab
                          ? 'bg-emerald-600 text-white font-bold'
                          : 'text-slate-600'
                      }`}
                    >
                      {tab === 'unserved' ? 'Unserved Energy' : tab === 'peak' ? 'Peak Demand' : tab}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 text-[9px] text-slate-500">
                <span className="flex items-center gap-1">
                  <span className="inline-block w-2.5 border-b-2 border-slate-400 border-dashed" /> Baseline
                </span>
                <span className="flex items-center gap-1">
                  <span className="inline-block w-2.5 border-b-2 border-amber-500" /> Rule-based
                </span>
                <span className="flex items-center gap-1">
                  <span className="inline-block w-2.5 border-b-2 border-emerald-600" /> Predictive
                </span>
              </div>

              {/* Trend lines */}
              <div className="h-32 w-full pt-1">
                <svg className="w-full h-full overflow-visible" viewBox="0 0 240 90">
                  <path d="M 10 70 Q 70 30 130 50 T 230 75" fill="none" stroke="#94A3B8" strokeWidth="1.8" strokeDasharray="3 3" />
                  <path d="M 10 75 Q 70 45 130 60 T 230 80" fill="none" stroke="#F59E0B" strokeWidth="2" />
                  <path d="M 10 80 Q 70 60 130 70 T 230 85" fill="none" stroke="#10B981" strokeWidth="2.5" />
                </svg>
                <div className="flex justify-between text-[7px] font-mono text-slate-400">
                  <span>12:00 PM</span>
                  <span>2:00 PM</span>
                  <span>4:00 PM</span>
                  <span>6:00 PM</span>
                  <span>8:00 PM</span>
                  <span>10:00 PM</span>
                </div>
              </div>
            </div>

            {/* Scenario Results Summary Table (6 cols) */}
            <div className="lg:col-span-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs">
              <span className="text-xs font-bold text-slate-900 block mb-3">
                Scenario Results Summary
              </span>
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 text-[11px]">
                    <tr>
                      <th className="py-2 px-2">Metric</th>
                      <th className="py-2 px-2">Baseline</th>
                      <th className="py-2 px-2">Rule-based</th>
                      <th className="py-2 px-2 font-bold text-emerald-800">Predictive</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                    {scenarioSummary.map((sm, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="py-1.5 px-2 font-sans font-medium text-slate-800">
                          {sm.metric}
                        </td>
                        <td className="py-1.5 px-2 text-slate-500">{sm.baseline}</td>
                        <td className="py-1.5 px-2 text-slate-700">{sm.ruleBased}</td>
                        <td className="py-1.5 px-2 font-bold text-emerald-700">{sm.predictive}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Recent Benchmark Runs */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs">
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">
              Recent Benchmark Runs
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 text-[11px]">
                  <tr>
                    <th className="py-2.5 px-2">Date & Time</th>
                    <th className="py-2.5 px-2">Scenario</th>
                    <th className="py-2.5 px-2">Controller</th>
                    <th className="py-2.5 px-2">Unserved Energy</th>
                    <th className="py-2.5 px-2">Critical Load</th>
                    <th className="py-2.5 px-2">Recovery Time</th>
                    <th className="py-2.5 px-2">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                  {recentBenchmarkRuns.map((rbr, idx) => (
                    <tr key={idx} className="hover:bg-slate-50">
                      <td className="py-2 px-2 text-slate-500 whitespace-nowrap">{rbr.dateTime}</td>
                      <td className="py-2 px-2 font-sans text-slate-800">{rbr.scenario}</td>
                      <td className="py-2 px-2 font-sans font-semibold text-emerald-700">
                        {rbr.controller}
                      </td>
                      <td className="py-2 px-2 text-slate-800">{rbr.unserved} kWh</td>
                      <td className="py-2 px-2 text-slate-800">{rbr.critical}</td>
                      <td className="py-2 px-2 text-slate-800">{rbr.time}</td>
                      <td className="py-2 px-2 font-sans">
                        <span className="rounded-md bg-emerald-50 px-1.5 py-0.5 text-[9px] font-bold text-emerald-700">
                          {rbr.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right 3 Columns */}
        <div className="xl:col-span-3 space-y-6">
          {/* Quick Actions */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs space-y-3">
            <span className="text-xs font-bold text-slate-900 block">Quick Actions</span>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                onClick={() => {}}
                className="flex flex-col items-center justify-center p-3 rounded-xl border border-slate-200 hover:bg-slate-50 font-semibold text-slate-700"
              >
                <Play className="h-4 w-4 text-emerald-600 mb-1" />
                <span className="text-[10px]">Run Benchmark</span>
              </button>
              <button
                onClick={exportAuditCsv}
                className="flex flex-col items-center justify-center p-3 rounded-xl border border-slate-200 hover:bg-slate-50 font-semibold text-slate-700"
              >
                <Download className="h-4 w-4 text-slate-600 mb-1" />
                <span className="text-[10px]">Export Report</span>
              </button>
              <button
                onClick={() => {}}
                className="flex flex-col items-center justify-center p-3 rounded-xl border border-slate-200 hover:bg-slate-50 font-semibold text-slate-700"
              >
                <BarChart2 className="h-4 w-4 text-blue-600 mb-1" />
                <span className="text-[10px]">Compare Models</span>
              </button>
              <button
                onClick={() => {}}
                className="flex flex-col items-center justify-center p-3 rounded-xl border border-slate-200 hover:bg-slate-50 font-semibold text-slate-700"
              >
                <FileText className="h-4 w-4 text-purple-600 mb-1" />
                <span className="text-[10px]">View Logs</span>
              </button>
            </div>
          </div>

          {/* Benchmark Settings */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs space-y-3 text-xs">
            <span className="font-bold text-slate-900 block">Benchmark Settings</span>
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-slate-600 block">Controllers</label>
              <div className="space-y-1 text-slate-700">
                <label className="flex items-center gap-2">
                  <input type="checkbox" defaultChecked className="accent-emerald-600 rounded" />
                  <span>Baseline</span>
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" defaultChecked className="accent-emerald-600 rounded" />
                  <span>Rule-based</span>
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" defaultChecked className="accent-emerald-600 rounded" />
                  <span>Predictive (Our Approach)</span>
                </label>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 space-y-2">
              <div>
                <label className="text-[10px] text-slate-500 block mb-0.5">Metrics</label>
                <div className="relative">
                  <select className="w-full rounded-lg border border-slate-200 bg-white p-1.5 text-xs">
                    <option>All Metrics</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-[10px] text-slate-500 block mb-0.5">Test Runs</label>
                <div className="relative">
                  <select className="w-full rounded-lg border border-slate-200 bg-white p-1.5 text-xs">
                    <option>3 runs (average)</option>
                  </select>
                </div>
              </div>
              <button className="w-full rounded-lg bg-emerald-700 py-2 text-xs font-bold text-white hover:bg-emerald-800">
                Apply Settings
              </button>
            </div>
          </div>

          {/* Key Insights List */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs space-y-3">
            <span className="text-xs font-bold text-slate-900 block">Key Insights</span>
            <div className="space-y-2.5 text-xs">
              <div className="flex items-start gap-2">
                <Zap className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                <p className="text-[11px] text-slate-600 leading-tight">
                  Our <strong className="text-slate-900">predictive recovery</strong> reduced unserved energy by 68% compared to baseline.
                </p>
              </div>
              <div className="flex items-start gap-2">
                <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                <p className="text-[11px] text-slate-600 leading-tight">
                  <strong className="text-slate-900">Critical load</strong> service improved from 98.0% to 99.8%.
                </p>
              </div>
              <div className="flex items-start gap-2">
                <Leaf className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                <p className="text-[11px] text-slate-600 leading-tight">
                  <strong className="text-slate-900">Estimated emissions</strong> decreased by 41% with optimized resource allocation.
                </p>
              </div>
              <div className="flex items-start gap-2">
                <Clock className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                <p className="text-[11px] text-slate-600 leading-tight">
                  <strong className="text-slate-900">Recovery time</strong> was 53% faster than baseline in the same fault scenario.
                </p>
              </div>
            </div>

            <div className="rounded-xl border border-emerald-100 bg-emerald-50/50 p-2.5 flex items-start gap-2 pt-2">
              <Leaf className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
              <p className="text-[10px] text-emerald-900 font-medium italic">
                &ldquo;Smarter decisions. Cleaner energy. A more resilient tomorrow.&rdquo;
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
