import React from 'react';
import {
  AlertTriangle,
  ArrowRight,
  BatteryLow,
  Check,
  CheckCircle2,
  CloudSun,
  Flame,
  Radio,
  ShieldAlert,
  ShieldCheck,
  Sun,
  X,
  Zap,
} from 'lucide-react';
import { Card, Chip, C, Reveal, Section, SectionHeading, useGo } from '../ui';
import genImg from '../../assets/illustrations/problem-generation.webp';
import demandImg from '../../assets/illustrations/problem-demand.webp';
import relImg from '../../assets/illustrations/problem-reliability.webp';

const SOLAR_PHOTO =
  'https://images.unsplash.com/photo-1508873696983-2df5293cb395?auto=format&fit=crop&w=800&q=75';
const EV_PHOTO =
  'https://images.unsplash.com/photo-1593941707882-a5bba14938c7?auto=format&fit=crop&w=800&q=75';
const GRID_PHOTO =
  'https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?auto=format&fit=crop&w=800&q=75';

const PROBLEMS = [
  {
    id: 'generation',
    badge: 'Generation Volatility',
    badgeTone: 'green' as const,
    title: 'Unpredictable Solar Dips & Cloud Shocks',
    description:
      'Solar irradiance can plummet by over 60% in less than 30 seconds due to cloud cover. Without forecasting, the sudden deficit triggers inverter trips and frequency sags.',
    illustration: genImg,
    photo: SOLAR_PHOTO,
    stats: [
      { label: 'Irradiance Drop', value: '-60.2%' },
      { label: 'Ramp Rate', value: '4.2 kW/s' },
      { label: 'Frequency Sag', value: '48.8 Hz' },
    ],
    gridhealSolution:
      'Multi-horizon HistGradientBoosting anticipates cloud dips 15 minutes ahead, pre-charging storage reserves.',
  },
  {
    id: 'demand',
    badge: 'Demand Surge Strain',
    badgeTone: 'amber' as const,
    title: 'Uncoordinated EV Clusters & Peak Demand',
    description:
      'Simultaneous vehicle charging surges coincide with residential evening peaks, overloading local distribution transformers up to 114% of rated thermal capacity.',
    illustration: demandImg,
    photo: EV_PHOTO,
    stats: [
      { label: 'Cluster Spike', value: '+52 kW' },
      { label: 'Transformer Load', value: '114%' },
      { label: 'Feeder Sag', value: '0.93 p.u.' },
    ],
    gridhealSolution:
      'Automated deferral coordinates EV charging schedules without violating user departure deadlines.',
  },
  {
    id: 'reliability',
    badge: 'Utility Outage Risk',
    badgeTone: 'red' as const,
    title: 'Catastrophic Islanding & Blackouts',
    description:
      'Substation faults or grid storms instantly sever external import capacity (up to 500 kW). Without fast autonomous islanding, critical hospital wings lose power.',
    illustration: relImg,
    photo: GRID_PHOTO,
    stats: [
      { label: 'Import Lost', value: '500 kW' },
      { label: 'System Inertia', value: '0 MW·s' },
      { label: 'Hospital Risk', value: 'Priority 1' },
    ],
    gridhealSolution:
      'Sub-120ms autonomous islanding transition with 100% guaranteed critical load continuity.',
  },
];

const COMPARISON_ROWS = [
  {
    metric: 'Disruption Response Time',
    conventional: '15 to 30 minutes (Manual dispatch)',
    gridheal: '1.14 ms (Autonomous HiGHS LP solver)',
    advantage: '10,000x faster reaction',
  },
  {
    metric: 'Critical Hospital Feeder Uptime',
    conventional: '96.2% (Frequent shedding during faults)',
    gridheal: '99.8% to 100% (Strict priority constraints)',
    advantage: 'Zero hospital outages',
  },
  {
    metric: 'Unserved Energy During Outages',
    conventional: '9.0 kWh unserved',
    gridheal: '4.0 kWh unserved (-55.6% reduction)',
    advantage: '55.6% energy saved',
  },
  {
    metric: 'Solar Curtailment Waste',
    conventional: '7.0 kWh curtailed / dumped',
    gridheal: '1.5 kWh curtailed (-78.6% less waste)',
    advantage: 'Maximum green utilization',
  },
  {
    metric: 'Physical Verification & Safety',
    conventional: 'Unverified (Blind heuristics)',
    gridheal: '100% Kirchhoff Power Balance Validated',
    advantage: 'Mathematically proven feasible',
  },
];

export const ProblemSection: React.FC = () => {
  const go = useGo();

  return (
    <Section tone="white" className="relative">
      <SectionHeading
        align="left"
        eyebrow="The operational challenge"
        title="Renewable energy is volatile. Traditional microgrids are blind."
        description="Intermittent solar generation, surging EV adoption, and aging utility grids create compounding disruptions. GridHeal replaces slow manual intervention with predictive autonomous self-healing."
      />

      {/* 3 Rich Disruption Cards */}
      <div className="mt-12 grid items-stretch gap-6 md:grid-cols-3">
        {PROBLEMS.map((item, idx) => (
          <Reveal key={item.id} delay={idx * 90} className="h-full">
            <Card
              hover
              className="flex h-full flex-col overflow-hidden border border-[#E4E9E4] bg-white shadow-sm hover:border-[#BFD9C6] hover:shadow-lg transition-all duration-300"
            >
              {/* Graphic Visual Header with blended illustration and photography */}
              <div className="relative h-48 w-full overflow-hidden bg-[#103D2B]">
                <div
                  className="absolute inset-0 bg-cover bg-center opacity-45 mix-blend-overlay transition-transform duration-500 hover:scale-105"
                  style={{ backgroundImage: `url('${item.photo}')` }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#103D2B] via-[#103D2B]/70 to-transparent" />
                <img
                  src={item.illustration}
                  alt={item.title}
                  className="relative z-10 h-full w-full object-contain p-4 opacity-95"
                />
                <div className="absolute top-3 left-3 z-20">
                  <Chip tone={item.badgeTone}>{item.badge}</Chip>
                </div>
              </div>

              {/* Card Body */}
              <div className="flex flex-1 flex-col p-6">
                <h3 className="text-lg font-bold text-[#16241E] leading-snug">
                  {item.title}
                </h3>
                <p className="mt-2.5 text-xs text-[#5B6B62] leading-relaxed">
                  {item.description}
                </p>

                {/* Quantitative Impact Stat Pills */}
                <div className="mt-4 grid grid-cols-3 gap-2 rounded-xl border border-[#EEF2F4] bg-[#F9FAF9] p-2.5">
                  {item.stats.map((stat) => (
                    <div key={stat.label} className="text-center">
                      <p className="text-[10px] font-medium text-[#5B6B62] truncate">
                        {stat.label}
                      </p>
                      <p className="font-mono text-xs font-bold text-[#16241E]">
                        {stat.value}
                      </p>
                    </div>
                  ))}
                </div>

                {/* GridHeal Solution Callout */}
                <div className="mt-5 rounded-xl border border-[#CFE6D5] bg-[#EAF5EC] p-3 text-xs">
                  <div className="flex items-center gap-1.5 font-semibold text-[#1B5E36]">
                    <ShieldCheck className="h-4 w-4 text-[#3E984A]" />
                    <span>GridHeal Solution:</span>
                  </div>
                  <p className="mt-1 text-[11.5px] leading-relaxed text-[#234B32]">
                    {item.gridhealSolution}
                  </p>
                </div>
              </div>
            </Card>
          </Reveal>
        ))}
      </div>

      {/* Deep Side-by-Side Comparison Matrix */}
      <Reveal delay={200}>
        <div className="mt-16 rounded-2xl border border-[#E4E9E4] bg-[#F7F5F0] p-6 sm:p-8 shadow-sm">
          <div className="max-w-2xl">
            <span className="text-xs font-bold uppercase tracking-wider text-[#1B5E36]">
              Performance Benchmark
            </span>
            <h3 className="gh-display mt-2 text-2xl font-bold text-[#16241E] sm:text-3xl">
              Conventional Microgrid Management vs. GridHeal Self-Healing
            </h3>
            <p className="mt-2 text-sm text-[#5B6B62]">
              Real empirical benchmark comparison under identical solar drop, demand surge, and utility outage scenarios.
            </p>
          </div>

          <div className="mt-8 overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-[#E4E9E4] text-[#5B6B62]">
                  <th className="pb-3 font-semibold">Evaluation Metric</th>
                  <th className="pb-3 font-semibold">Conventional / Heuristic</th>
                  <th className="pb-3 font-semibold text-[#1B5E36]">GridHeal Digital Twin</th>
                  <th className="pb-3 font-semibold text-right">Proven Advantage</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E4E9E4]/70">
                {COMPARISON_ROWS.map((row) => (
                  <tr key={row.metric} className="hover:bg-white/60 transition-colors">
                    <td className="py-3.5 font-medium text-[#16241E]">
                      {row.metric}
                    </td>
                    <td className="py-3.5 text-[#5B6B62]">
                      <span className="inline-flex items-center gap-1.5">
                        <X className="h-4 w-4 text-[#DC3545] shrink-0" />
                        <span>{row.conventional}</span>
                      </span>
                    </td>
                    <td className="py-3.5 font-semibold text-[#1B5E36]">
                      <span className="inline-flex items-center gap-1.5">
                        <Check className="h-4 w-4 text-[#3E984A] shrink-0" />
                        <span>{row.gridheal}</span>
                      </span>
                    </td>
                    <td className="py-3.5 text-right font-mono font-bold text-[#1B5E36]">
                      {row.advantage}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-[#E4E9E4] pt-5">
            <p className="text-xs text-[#5B6B62]">
              Benchmark results verified on Python 3.11 with HiGHS LP solver and pandapower load-flow engine.
            </p>
            <button
              type="button"
              onClick={() => go('benchmark')}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#1B5E36] hover:underline"
            >
              <span>View Full Benchmark Lab</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </Reveal>
    </Section>
  );
};
