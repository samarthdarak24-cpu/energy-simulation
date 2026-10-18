import React, { useState } from 'react';
import {
  Sun,
  Zap,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  ChevronDown,
  TrendingUp,
  BarChart2,
  Download,
  Eye,
  Sliders,
  Play,
  RotateCcw,
  Database,
} from 'lucide-react';
import { useMicrogrid } from '../context/MicrogridContext';

type PeriodTab = 'Day' | 'Week' | 'Month';

interface PeriodConfig {
  labels: string[];
  solarPath: string;
  demandPath: string;
  actualPath: string;
  imbalance: { short: string; surplus: number; shortage: number }[];
}

const PERIOD_CONFIG: Record<PeriodTab, PeriodConfig> = {
  Day: {
    labels: ['6 AM', '9 AM', '12 PM', '3 PM', '6 PM', '9 PM', '12 AM'],
    solarPath: 'M 50 152 Q 90 120 150 40 T 260 45 T 410 142',
    demandPath: 'M 50 120 Q 110 118 170 100 T 290 45 T 410 95',
    actualPath: 'M 50 148 Q 95 118 155 44 T 255 48',
    imbalance: [
      { short: '6AM', surplus: 8, shortage: 14 },
      { short: '9AM', surplus: 34, shortage: 6 },
      { short: '12PM', surplus: 96, shortage: 4 },
      { short: '3PM', surplus: 78, shortage: 8 },
      { short: '6PM', surplus: 12, shortage: 42 },
      { short: '9PM', surplus: 4, shortage: 28 },
      { short: '12AM', surplus: 2, shortage: 10 },
    ],
  },
  Week: {
    labels: ['Apr 28', 'Apr 29', 'Apr 30', 'May 1', 'May 2', 'May 3', 'May 4'],
    solarPath: 'M 50 130 Q 110 80 170 50 T 290 60 T 410 70',
    demandPath: 'M 50 110 Q 110 115 170 95 T 290 50 T 410 80',
    actualPath: 'M 50 132 Q 110 82 170 52 T 260 55',
    imbalance: [
      { short: '28', surplus: 100, shortage: 20 },
      { short: '29', surplus: 120, shortage: 25 },
      { short: '30', surplus: 115, shortage: 15 },
      { short: '1', surplus: 110, shortage: 35 },
      { short: '2', surplus: 95, shortage: 42 },
      { short: '3', surplus: 130, shortage: 30 },
      { short: '4', surplus: 145, shortage: 18 },
    ],
  },
  Month: {
    labels: ['Apr 7', 'Apr 14', 'Apr 21', 'Apr 28', 'May 5', 'May 12', 'May 19'],
    solarPath: 'M 50 118 Q 130 66 220 62 T 410 88',
    demandPath: 'M 50 100 Q 120 110 210 85 T 410 74',
    actualPath: 'M 50 120 Q 128 70 215 66 T 320 72',
    imbalance: [
      { short: '7', surplus: 420, shortage: 90 },
      { short: '14', surplus: 505, shortage: 120 },
      { short: '21', surplus: 470, shortage: 80 },
      { short: '28', surplus: 530, shortage: 145 },
      { short: '5', surplus: 490, shortage: 110 },
      { short: '12', surplus: 560, shortage: 95 },
      { short: '19', surplus: 610, shortage: 70 },
    ],
  },
};

const COMPARISON_PATHS: Record<'solar' | 'demand' | 'shortage', { actual: string; forecast: string }> = {
  solar: {
    actual: 'M 10 70 Q 25 20 40 70 T 70 70 T 100 70 T 130 70 T 160 70 T 190 70',
    forecast: 'M 10 70 Q 25 15 40 70 T 70 70 T 100 70 T 130 70 T 160 70 T 190 70',
  },
  demand: {
    actual: 'M 10 60 Q 25 35 40 60 T 70 60 T 100 60 T 130 60 T 160 60 T 190 60',
    forecast: 'M 10 62 Q 25 30 40 62 T 70 62 T 100 62 T 130 62 T 160 62 T 190 62',
  },
  shortage: {
    actual: 'M 10 72 Q 25 55 40 72 T 70 72 T 100 72 T 130 72 T 160 72 T 190 72',
    forecast: 'M 10 74 Q 25 50 40 74 T 70 74 T 100 74 T 130 74 T 160 74 T 190 74',
  },
};

export const PredictionCentreView: React.FC = () => {
  const { exportAuditCsv, setActivePage } = useMicrogrid();

  const [dateRange] = useState('Apr 28, 2025 – May 4, 2025');
  const [periodTab, setPeriodTab] = useState<PeriodTab>('Week');
  const [comparisonTab, setComparisonTab] = useState<'solar' | 'demand' | 'shortage'>('solar');
  const [forecastHorizon, setForecastHorizon] = useState('7 days');
  const [predictionInterval, setPredictionInterval] = useState('1 hour');
  const [modelType, setModelType] = useState('Hybrid (Time Series + ML)');
  const [updating, setUpdating] = useState(false);
  const [lastUpdated, setLastUpdated] = useState('May 2, 2025 10:15 AM');

  const period = PERIOD_CONFIG[periodTab];
  const comparison = COMPARISON_PATHS[comparisonTab];
  const imbalanceMax = Math.max(
    ...period.imbalance.map((point) => Math.max(point.surplus, point.shortage))
  );

  const [forecastMetrics, setForecastMetrics] = useState({
    maeSolar: 3.2,
    rmseSolar: 4.8,
    maeDemand: 2.8,
    rmseDemand: 4.1,
    accuracy: 94.0,
  });
  const [forecastInsights, setForecastInsights] = useState<string[]>([]);

  const updateForecast = async () => {
    if (updating) return;
    setUpdating(true);
    try {
      const modelMap: Record<string, string> = {
        'Hybrid (Time Series + ML)': 'Ensemble Predictive',
        'AutoETS / Exponential': 'Exponential Smoothing',
        'Persistence / Naive': 'Persistence Naive',
      };
      const requestedModel = modelMap[modelType] || 'Ensemble Predictive';

      const res = await fetch('http://localhost:8000/api/forecast/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: requestedModel,
          horizonMinutes: 60,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setForecastMetrics({
          maeSolar: data.maeSolar,
          rmseSolar: data.rmseSolar,
          maeDemand: data.maeDemand,
          rmseDemand: data.rmseDemand,
          accuracy: data.forecastAccuracyPct,
        });
        if (data.insights && data.insights.length > 0) {
          setForecastInsights(data.insights);
        }
      }
    } catch (e) {
      // Graceful fallback
    } finally {
      setUpdating(false);
      setLastUpdated('Just now');
    }
  };

  const recentForecastUpdates = [
    {
      time: 'May 2, 2025 10:15 AM',
      type: 'Solar Forecast',
      details: 'Next 24h generation: 1,240 kWh (±6.2%)',
      accuracy: '94%',
      status: 'Completed',
    },
    {
      time: 'May 2, 2025 09:42 AM',
      type: 'Demand Forecast',
      details: 'Next 24h peak: 168 kW (±7.8%)',
      accuracy: '91%',
      status: 'Completed',
    },
    {
      time: 'May 1, 2025 06:20 PM',
      type: 'Shortage Prediction',
      details: 'Potential gap: 42 kWh at 02:00 PM (May 2)',
      accuracy: '88%',
      status: 'Completed',
    },
  ];

  return (
    <div className="flex-1 p-6 space-y-6 max-w-[1600px] mx-auto text-slate-800">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Prediction Centre
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Forecast energy generation, demand and potential imbalances
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => setActivePage('settings')}
            className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-800 shadow-2xs hover:bg-emerald-100 transition-colors"
          >
            <Database className="h-3.5 w-3.5 text-emerald-600" />
            <span>Dataset & Model Inspector</span>
          </button>

          <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs">
            <Calendar className="h-3.5 w-3.5 text-slate-400" />
            <span>{dateRange}</span>
            <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
          </div>

          <div className="flex rounded-lg border border-slate-200 bg-white p-0.5 text-xs font-semibold">
            {(['Day', 'Week', 'Month'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setPeriodTab(tab)}
                className={`px-3 py-1 rounded-md transition-colors ${
                  periodTab === tab
                    ? 'bg-emerald-600 text-white shadow-2xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 4 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Forecast Solar */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
              <Sun className="h-4 w-4 text-emerald-600" />
              <span>Forecast Solar Generation</span>
            </div>
            <div className="text-2xl font-bold tracking-tight text-slate-900 font-mono">
              842 kWh
            </div>
            <div className="text-[11px] font-medium text-emerald-600">
              ↑ 8% <span className="text-slate-400 font-normal">vs. previous 7 days</span>
            </div>
          </div>
          <div className="w-16 h-8">
            <svg viewBox="0 0 60 30" className="w-full h-full">
              <path d="M 0 25 Q 20 28 40 10 T 60 6" fill="none" stroke="#10B981" strokeWidth="2" />
            </svg>
          </div>
        </div>

        {/* Forecast Demand */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
              <Zap className="h-4 w-4 text-emerald-600" />
              <span>Forecast Demand</span>
            </div>
            <div className="text-2xl font-bold tracking-tight text-slate-900 font-mono">
              812 kWh
            </div>
            <div className="text-[11px] font-medium text-emerald-600">
              ↑ 5% <span className="text-slate-400 font-normal">vs. previous 7 days</span>
            </div>
          </div>
          <div className="w-16 h-8">
            <svg viewBox="0 0 60 30" className="w-full h-full">
              <path d="M 0 22 Q 25 24 45 8 T 60 8" fill="none" stroke="#10B981" strokeWidth="2" />
            </svg>
          </div>
        </div>

        {/* Predicted Shortage (Peak) */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              <span>Predicted Shortage (Peak)</span>
            </div>
            <div className="text-2xl font-bold tracking-tight text-slate-900 font-mono">
              42 kWh
            </div>
            <div className="text-[11px] font-medium text-amber-600">
              ↓ 37% <span className="text-slate-400 font-normal">vs. previous 7 days</span>
            </div>
          </div>
          <div className="w-16 h-8">
            <svg viewBox="0 0 60 30" className="w-full h-full">
              <path d="M 0 10 Q 20 8 40 22 T 60 20" fill="none" stroke="#F59E0B" strokeWidth="2" />
            </svg>
          </div>
        </div>

        {/* Forecast Accuracy (MAE) */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              <span>Forecast Accuracy (MAE)</span>
            </div>
            <div className="text-2xl font-bold tracking-tight text-slate-900 font-mono">
              4.8%
            </div>
            <div className="text-[11px] font-medium text-emerald-600">
              ↓ 2.6% <span className="text-slate-400 font-normal">vs. previous 7 days</span>
            </div>
          </div>
          <div className="w-16 h-8">
            <svg viewBox="0 0 60 30" className="w-full h-full">
              <path d="M 0 20 Q 20 18 40 8 T 60 6" fill="none" stroke="#10B981" strokeWidth="2" />
            </svg>
          </div>
        </div>
      </div>

      {/* Main Row: Solar Generation & Demand Forecast Chart (Left) + Settings (Right) */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* Chart + Prediction Insights (9 cols) */}
        <div className="xl:col-span-9 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Chart (8 cols) */}
            <div className="lg:col-span-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-3">
                <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Solar Generation & Demand Forecast
                </h2>
                <div className="flex items-center gap-3 text-[10px] text-slate-500">
                  <span className="flex items-center gap-1">
                    <span className="inline-block w-2.5 border-b-2 border-emerald-500" /> Solar (Actual)
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="inline-block w-2.5 border-b-2 border-emerald-500 border-dashed" /> Solar (Forecast)
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="inline-block w-2.5 border-b-2 border-slate-500" /> Demand (Actual)
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="inline-block w-2.5 border-b-2 border-slate-400 border-dashed" /> Demand (Forecast)
                  </span>
                </div>
              </div>

              {/* Chart SVG */}
              <div className="relative h-60 w-full pt-2">
                <svg className="w-full h-full overflow-visible" viewBox="0 0 450 180">
                  {/* Grid Lines */}
                  <line x1="30" y1="20" x2="430" y2="20" stroke="#f1f5f9" />
                  <line x1="30" y1="60" x2="430" y2="60" stroke="#f1f5f9" />
                  <line x1="30" y1="100" x2="430" y2="100" stroke="#f1f5f9" />
                  <line x1="30" y1="140" x2="430" y2="140" stroke="#f1f5f9" />
                  <line x1="30" y1="160" x2="430" y2="160" stroke="#cbd5e1" />

                  {/* Y Ticks */}
                  <text x="24" y="24" className="text-[9px] fill-slate-400 font-mono" textAnchor="end">200</text>
                  <text x="24" y="64" className="text-[9px] fill-slate-400 font-mono" textAnchor="end">150</text>
                  <text x="24" y="104" className="text-[9px] fill-slate-400 font-mono" textAnchor="end">100</text>
                  <text x="24" y="144" className="text-[9px] fill-slate-400 font-mono" textAnchor="end">50</text>
                  <text x="24" y="164" className="text-[9px] fill-slate-400 font-mono" textAnchor="end">0</text>

                  {/* Solar Forecast (green dashed) */}
                  <path
                    d={period.solarPath}
                    fill="none"
                    stroke="#10B981"
                    strokeWidth="2"
                    strokeDasharray="4 3"
                  />

                  {/* Demand Forecast (slate dashed) */}
                  <path
                    d={period.demandPath}
                    fill="none"
                    stroke="#475569"
                    strokeWidth="2"
                    strokeDasharray="4 3"
                  />

                  {/* Actual Curve (solid green) */}
                  <path
                    d={period.actualPath}
                    fill="none"
                    stroke="#047857"
                    strokeWidth="2.5"
                  />

                  {/* Vertical dashed line at May 2 */}
                  <line x1="260" y1="20" x2="260" y2="160" stroke="#94A3B8" strokeDasharray="3 3" />

                  {/* Tooltip on May 2 */}
                  <g transform="translate(265, 30)">
                    <rect width="90" height="60" rx="6" fill="white" stroke="#E2E8F0" />
                    <text x="8" y="14" className="text-[9px] font-bold fill-slate-800">May 2, 2025</text>
                    <text x="8" y="28" className="text-[8px] font-mono fill-emerald-600">● Solar (F): 128 kW</text>
                    <text x="8" y="42" className="text-[8px] font-mono fill-slate-600">● Demand (F): 142 kW</text>
                    <text x="8" y="54" className="text-[8px] font-mono font-bold fill-amber-600">● Gap: 14 kW</text>
                  </g>

                  {/* X Labels */}
                  {period.labels.map((label, i) => (
                    <text
                      key={label}
                      x={50 + i * 60}
                      y="174"
                      textAnchor="middle"
                      className="text-[9px] fill-slate-400 font-medium"
                    >
                      {label}
                    </text>
                  ))}
                </svg>
              </div>
            </div>

            {/* Prediction Insights (4 cols) */}
            <div className="lg:col-span-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs space-y-4 flex flex-col justify-between">
              <div>
                <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">
                  Prediction Insights
                </h2>

                <div className="space-y-3 text-xs">
                  <div className="flex items-start gap-2.5 p-2 rounded-xl bg-amber-50/50 border border-amber-100">
                    <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <div className="text-[11px] font-semibold text-slate-800">
                        Highest shortage expected
                      </div>
                      <div className="text-[10px] text-slate-400">May 2, 2025 – 02:00 PM</div>
                    </div>
                    <span className="font-mono font-bold text-amber-700">42 kWh</span>
                  </div>

                  <div className="flex items-start gap-2.5 p-2 rounded-xl bg-emerald-50/50 border border-emerald-100">
                    <Sun className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <div className="text-[11px] font-semibold text-slate-800">
                        Surplus generation expected
                      </div>
                      <div className="text-[10px] text-slate-400">May 4, 2025 – 11:00 AM</div>
                    </div>
                    <span className="font-mono font-bold text-emerald-700">36 kWh</span>
                  </div>

                  <div className="flex items-start gap-2.5 p-2 rounded-xl bg-slate-50 border border-slate-100">
                    <Zap className="h-4 w-4 text-slate-600 shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <div className="text-[11px] font-semibold text-slate-800">
                        Demand peak predicted
                      </div>
                      <div className="text-[10px] text-slate-400">May 3, 2025 – 07:00 PM</div>
                    </div>
                    <span className="font-mono font-bold text-slate-900">168 kW</span>
                  </div>
                </div>
              </div>

              {/* Forecast Confidence Bar */}
              <div className="pt-3 border-t border-slate-100 space-y-1.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-[11px] font-semibold text-slate-600">Forecast Confidence</span>
                  <span className="font-mono font-bold text-emerald-700">87%</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div className="bg-emerald-500 h-full rounded-full" style={{ width: '87%' }} />
                </div>
                <div className="text-[10px] text-slate-400">
                  Based on historical data, time patterns and prediction model.
                </div>
              </div>
            </div>
          </div>

          {/* Bottom 3 Cards: Forecast vs Actual, Forecast Accuracy, Potential Imbalance */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Forecast vs Actual Comparison */}
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-900">Forecast vs Actual Comparison</span>
                <div className="flex rounded-md bg-slate-100 p-0.5 text-[9px] font-medium">
                  <button
                    onClick={() => setComparisonTab('solar')}
                    className={`px-1.5 py-0.5 rounded ${
                      comparisonTab === 'solar' ? 'bg-emerald-600 text-white font-bold' : 'text-slate-600'
                    }`}
                  >
                    Solar
                  </button>
                  <button
                    onClick={() => setComparisonTab('demand')}
                    className={`px-1.5 py-0.5 rounded ${
                      comparisonTab === 'demand' ? 'bg-emerald-600 text-white font-bold' : 'text-slate-600'
                    }`}
                  >
                    Demand
                  </button>
                  <button
                    onClick={() => setComparisonTab('shortage')}
                    className={`px-1.5 py-0.5 rounded ${
                      comparisonTab === 'shortage' ? 'bg-emerald-600 text-white font-bold' : 'text-slate-600'
                    }`}
                  >
                    Shortage
                  </button>
                </div>
              </div>

              {/* Sine Wave comparison */}
              <div className="h-28 w-full pt-1">
                <svg className="w-full h-full overflow-visible" viewBox="0 0 200 80">
                  <path
                    d={comparison.actual}
                    fill="none"
                    stroke="#10B981"
                    strokeWidth="2"
                  />
                  <path
                    d={comparison.forecast}
                    fill="none"
                    stroke="#94A3B8"
                    strokeWidth="1.5"
                    strokeDasharray="3 3"
                  />
                </svg>
                <div className="flex justify-between text-[8px] font-mono text-slate-400">
                  <span>Apr 28</span>
                  <span>Apr 30</span>
                  <span>May 2</span>
                  <span>May 4</span>
                </div>
              </div>
            </div>

            {/* Forecast Accuracy */}
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs space-y-2">
              <span className="text-xs font-bold text-slate-900 block">Forecast Accuracy</span>
              <div className="grid grid-cols-2 gap-2 text-center">
                <div className="rounded-lg bg-slate-50 p-2">
                  <div className="text-[10px] text-slate-400">MAE</div>
                  <div className="text-base font-bold font-mono text-slate-900">4.8%</div>
                  <div className="text-[9px] text-emerald-600">↓ 2.6% vs prev</div>
                </div>
                <div className="rounded-lg bg-slate-50 p-2">
                  <div className="text-[10px] text-slate-400">RMSE</div>
                  <div className="text-base font-bold font-mono text-slate-900">7.9%</div>
                  <div className="text-[9px] text-emerald-600">↓ 3.2% vs prev</div>
                </div>
              </div>

              <div className="pt-2 text-[10px] text-slate-500 font-mono">
                <div className="flex justify-between py-0.5 border-b border-slate-100">
                  <span className="font-sans">Metric</span>
                  <span>Solar</span>
                  <span>Demand</span>
                  <span>Shortage</span>
                </div>
                <div className="flex justify-between py-0.5">
                  <span className="font-sans font-medium text-slate-700">MAE</span>
                  <span>4.2%</span>
                  <span>5.6%</span>
                  <span>8.7%</span>
                </div>
                <div className="flex justify-between py-0.5">
                  <span className="font-sans font-medium text-slate-700">RMSE</span>
                  <span>6.8%</span>
                  <span>9.1%</span>
                  <span>13.4%</span>
                </div>
              </div>
            </div>

            {/* Potential Imbalance Forecast (Bar chart) */}
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-900">Potential Imbalance Forecast</span>
                <div className="flex items-center gap-2 text-[9px] text-slate-500">
                  <span className="flex items-center gap-1">
                    <span className="h-2 w-2 rounded-full bg-emerald-500" /> Surplus
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="h-2 w-2 rounded-full bg-amber-500" /> Shortage
                  </span>
                </div>
              </div>

              {/* Bar SVG */}
              <div className="h-28 flex items-end justify-between gap-1 pt-2">
                {period.imbalance.map((point) => (
                  <div key={point.short} className="flex-1 flex flex-col items-center gap-1">
                    <div className="w-full flex items-end justify-center gap-1 h-20">
                      <div
                        className="w-2 bg-emerald-500 rounded-t-xs"
                        style={{ height: `${(point.surplus / imbalanceMax) * 100}%` }}
                      />
                      <div
                        className="w-2 bg-amber-400 rounded-t-xs"
                        style={{ height: `${(point.shortage / imbalanceMax) * 100}%` }}
                      />
                    </div>
                    <span className="text-[7px] font-mono text-slate-400">{point.short}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right 3 Columns: Forecast Settings & Quick Actions */}
        <div className="xl:col-span-3 space-y-6">
          {/* Forecast Settings */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs space-y-4">
            <div className="flex items-center gap-2 text-slate-900">
              <Sliders className="h-4 w-4 text-emerald-600" />
              <h2 className="text-xs font-bold uppercase tracking-wider">Forecast Settings</h2>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                  Forecast Horizon
                </label>
                <div className="relative">
                  <select
                    value={forecastHorizon}
                    onChange={(e) => setForecastHorizon(e.target.value)}
                    className="w-full appearance-none rounded-lg border border-slate-200 bg-white py-2 pl-3 pr-8 text-xs font-semibold text-slate-800"
                  >
                    <option value="24 hours">24 hours</option>
                    <option value="7 days">7 days</option>
                    <option value="14 days">14 days</option>
                  </select>
                  <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                  Prediction Interval
                </label>
                <div className="relative">
                  <select
                    value={predictionInterval}
                    onChange={(e) => setPredictionInterval(e.target.value)}
                    className="w-full appearance-none rounded-lg border border-slate-200 bg-white py-2 pl-3 pr-8 text-xs font-semibold text-slate-800"
                  >
                    <option value="15 minutes">15 minutes</option>
                    <option value="1 hour">1 hour</option>
                    <option value="4 hours">4 hours</option>
                  </select>
                  <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                  Model Type
                </label>
                <div className="relative">
                  <select
                    value={modelType}
                    onChange={(e) => setModelType(e.target.value)}
                    className="w-full appearance-none rounded-lg border border-slate-200 bg-white py-2 pl-3 pr-8 text-xs font-semibold text-slate-800"
                  >
                    <option value="Hybrid (Time Series + ML)">Hybrid (Time Series + ML)</option>
                    <option value="Deep LSTM">Deep LSTM</option>
                    <option value="ARIMA Baseline">ARIMA Baseline</option>
                  </select>
                  <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
                </div>
              </div>

              <button
                onClick={updateForecast}
                disabled={updating}
                className="w-full flex items-center justify-center gap-2 rounded-lg bg-[#2E7D32] py-2.5 text-xs font-bold text-white shadow-xs hover:bg-[#256829] transition-all disabled:opacity-70"
              >
                <span>{updating ? 'Updating...' : 'Update Forecast'}</span>
              </button>
              <p className="text-[10px] text-slate-400 text-center">
                Last updated: {lastUpdated}
              </p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs space-y-3">
            <span className="text-xs font-bold text-slate-900 block">Quick Actions</span>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                onClick={updateForecast}
                disabled={updating}
                className="flex flex-col items-center justify-center p-3 rounded-xl border border-slate-200 hover:bg-slate-50 font-semibold text-slate-700 disabled:opacity-50"
              >
                <TrendingUp className="h-4 w-4 text-emerald-600 mb-1" />
                <span className="text-[10px]">Run Forecast</span>
              </button>
              <button
                onClick={() => setActivePage('benchmark')}
                className="flex flex-col items-center justify-center p-3 rounded-xl border border-slate-200 hover:bg-slate-50 font-semibold text-slate-700"
              >
                <BarChart2 className="h-4 w-4 text-blue-600 mb-1" />
                <span className="text-[10px]">Compare Models</span>
              </button>
              <button
                onClick={exportAuditCsv}
                className="flex flex-col items-center justify-center p-3 rounded-xl border border-slate-200 hover:bg-slate-50 font-semibold text-slate-700"
              >
                <Download className="h-4 w-4 text-slate-600 mb-1" />
                <span className="text-[10px]">Export Report</span>
              </button>
              <button
                onClick={() => setActivePage('logs')}
                className="flex flex-col items-center justify-center p-3 rounded-xl border border-slate-200 hover:bg-slate-50 font-semibold text-slate-700"
              >
                <Eye className="h-4 w-4 text-purple-600 mb-1" />
                <span className="text-[10px]">View Details</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Forecast Updates Table */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs">
        <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">
          Recent Forecast Updates
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3">Time</th>
                <th className="py-2.5 px-3">Type</th>
                <th className="py-2.5 px-3">Details</th>
                <th className="py-2.5 px-3">Accuracy</th>
                <th className="py-2.5 px-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
              {recentForecastUpdates.map((rfu, idx) => (
                <tr key={idx} className="hover:bg-slate-50">
                  <td className="py-2.5 px-3 text-slate-500 whitespace-nowrap">{rfu.time}</td>
                  <td className="py-2.5 px-3 font-sans font-semibold text-slate-800">{rfu.type}</td>
                  <td className="py-2.5 px-3 font-sans text-slate-600">{rfu.details}</td>
                  <td className="py-2.5 px-3 font-bold text-emerald-600">{rfu.accuracy}</td>
                  <td className="py-2.5 px-3 font-sans">
                    <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                      {rfu.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
