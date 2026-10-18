import React, { useEffect, useRef, useState } from 'react';
import { Section, SectionHeading, Reveal, PrimaryButton, Card, Chip, C, useGo } from '../ui';

const MONO = 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace';

interface Metric {
  label: string;
  unit: string;
  values: [number, number, number];
  decimals: number;
}

const METRICS: Metric[] = [
  { label: 'Critical load', unit: 'service (%)', values: [96.2, 98.7, 99.8], decimals: 1 },
  { label: 'Unserved', unit: 'energy (kWh)', values: [13.1, 8.6, 4.2], decimals: 1 },
  { label: 'Recovery', unit: 'time (min)', values: [15.8, 11.2, 7.4], decimals: 1 },
  { label: 'Renewable', unit: 'use (%)', values: [70, 76, 82], decimals: 0 },
  { label: 'Peak grid', unit: 'import (kW)', values: [61, 54, 48], decimals: 0 },
  { label: 'Emissions', unit: '(kg)', values: [31.8, 24.6, 18.7], decimals: 1 },
];

const SERIES = [
  { name: 'No recovery', color: '#C9D3CC' },
  { name: 'Rule-based', color: C.amber },
  { name: 'Predictive', color: C.brand },
] as const;

const CHART_W = 520;
const CHART_H = 300;
const PAD_L = 38;
const PAD_R = 10;
const BASE_Y = 252;
const PLOT_TOP = 26;
const PLOT_H = BASE_Y - PLOT_TOP;
const GROUP_W = (CHART_W - PAD_L - PAD_R) / METRICS.length;
const BAR_W = 13;
const BAR_SPACING = 20;
const GROUP_OFFSET = (GROUP_W - (BAR_W * 3 + (BAR_SPACING - BAR_W) * 2)) / 2;

const TICKS = [0, 25, 50, 75, 100];

interface Highlight {
  label: string;
  value: string;
  context: string;
}

const HIGHLIGHTS: Highlight[] = [
  { label: 'Critical load service', value: '99.8%', context: 'vs. no recovery: 96.2%' },
  { label: 'Unserved energy', value: '4.2 kWh', context: 'vs. no recovery: 13.1 kWh' },
  { label: 'Recovery time', value: '7.4 min', context: 'vs. no recovery: 15.8 min' },
  { label: 'Renewable use', value: '82%', context: 'vs. no recovery: 70%' },
  { label: 'Peak grid import', value: '48 kW', context: 'vs. no recovery: 61 kW' },
  { label: 'Emissions', value: '18.7 kg CO\u2082', context: 'vs. no recovery: 31.8 kg' },
  { label: 'Constraint violations', value: '0', context: 'Demo scenario: none recorded' },
];

export const ImpactSection: React.FC = () => {
  const go = useGo();
  const chartRef = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = chartRef.current;
    if (!el) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setShown(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setShown(true);
          io.disconnect();
        }
      },
      { threshold: 0.2 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <Section id="impact" tone="white">
      <Reveal>
        <SectionHeading
          eyebrow="Measurable impact"
          title="Recovery decisions backed by measurable outcomes."
          description="Compare control strategies using repeatable scenarios and evidence-based performance metrics."
        />
      </Reveal>

      <div className="mt-10 grid items-start gap-8 lg:mt-14 lg:grid-cols-12">
        <Reveal delay={80} className="min-w-0 lg:col-span-7">
          <Card className="overflow-hidden">
            <div
              className="flex flex-wrap items-start justify-between gap-3 border-b px-4 py-4 sm:px-5"
              style={{ borderColor: C.border }}
            >
              <div className="min-w-0">
                <h3 className="text-[15px] font-semibold" style={{ color: C.text }}>
                  Controller comparison
                </h3>
                <p className="mt-0.5 text-[12px]" style={{ color: C.muted }}>
                  Six metrics across three control strategies.
                </p>
              </div>
              <Chip tone="amber">Demonstration data — not measured results</Chip>
            </div>

            <div className="px-3 pt-4 pb-2 sm:px-4">
              <div className="mb-3 flex flex-wrap items-center gap-x-4 gap-y-2">
                {SERIES.map((series) => (
                  <span key={series.name} className="inline-flex items-center gap-1.5">
                    <span
                      className="h-2.5 w-2.5 rounded-[2px]"
                      style={{ backgroundColor: series.color }}
                    />
                    <span className="text-[11px] font-medium" style={{ color: C.text }}>
                      {series.name}
                    </span>
                  </span>
                ))}
                <span className="ml-auto text-[10px]" style={{ color: C.muted }}>
                  Index 0–100, normalized per metric
                </span>
              </div>

              <div ref={chartRef}>
                <svg
                  viewBox={`0 0 ${CHART_W} ${CHART_H}`}
                  className="h-auto w-full"
                  role="img"
                  aria-label="Grouped bar chart comparing no recovery, rule-based recovery, and predictive recovery across six metrics. Values are demonstration fixtures."
                >
                  {TICKS.map((tick) => {
                    const y = BASE_Y - (tick / 100) * PLOT_H;
                    return (
                      <g key={tick}>
                        <line
                          x1={PAD_L}
                          y1={y}
                          x2={CHART_W - PAD_R}
                          y2={y}
                          stroke={tick === 0 ? C.border : '#EDF1F3'}
                          strokeWidth={1}
                        />
                        <text
                          x={PAD_L - 8}
                          y={y + 3}
                          textAnchor="end"
                          fontSize={8}
                          fontFamily={MONO}
                          fill={C.muted}
                        >
                          {tick}
                        </text>
                      </g>
                    );
                  })}

                  {METRICS.map((metric, groupIndex) => {
                    const max = Math.max(...metric.values);
                    const groupX = PAD_L + groupIndex * GROUP_W;
                    return (
                      <g key={metric.label}>
                        {metric.values.map((value, seriesIndex) => {
                          const height = Math.max((value / max) * PLOT_H, 1);
                          const x = groupX + GROUP_OFFSET + seriesIndex * BAR_SPACING;
                          const y = BASE_Y - height;
                          return (
                            <g key={seriesIndex}>
                              <rect
                                x={x}
                                y={y}
                                width={BAR_W}
                                height={height}
                                rx={2}
                                fill={SERIES[seriesIndex].color}
                                style={{
                                  transform: shown ? 'scaleY(1)' : 'scaleY(0)',
                                  transformOrigin: 'bottom',
                                  transformBox: 'fill-box',
                                  transition: `transform 720ms cubic-bezier(.16,1,.3,1) ${
                                    groupIndex * 55 + seriesIndex * 70
                                  }ms`,
                                }}
                              />
                              <text
                                x={x + BAR_W / 2}
                                y={y - 5}
                                textAnchor="middle"
                                fontSize={8}
                                fontFamily={MONO}
                                fill={C.muted}
                                style={{
                                  opacity: shown ? 1 : 0,
                                  transition: `opacity 320ms ease-out ${
                                    groupIndex * 55 + seriesIndex * 70 + 260
                                  }ms`,
                                }}
                              >
                                {value.toFixed(metric.decimals)}
                              </text>
                            </g>
                          );
                        })}
                        <text
                          x={groupX + GROUP_W / 2}
                          y={BASE_Y + 16}
                          textAnchor="middle"
                          fontSize={8.5}
                          fill={C.text}
                        >
                          <tspan x={groupX + GROUP_W / 2}>{metric.label}</tspan>
                          <tspan x={groupX + GROUP_W / 2} dy={11} fill={C.muted}>
                            {metric.unit}
                          </tspan>
                        </text>
                      </g>
                    );
                  })}
                </svg>
              </div>
            </div>

            <p
              className="border-t px-4 py-3 text-[11px] leading-[1.6] sm:px-5"
              style={{ borderColor: C.border, color: C.muted }}
            >
              Each group is scaled to its own range so metrics with different units can share one
              axis. Actual values are printed above the bars.
            </p>
          </Card>
        </Reveal>

        <Reveal delay={160} className="min-w-0 lg:col-span-5">
          <div className="grid grid-cols-2 gap-3">
            {HIGHLIGHTS.map((item, index) => (
              <Card
                key={item.label}
                className={`p-4 ${index === HIGHLIGHTS.length - 1 ? 'col-span-2' : ''}`}
              >
                <div
                  className="text-[11px] font-semibold uppercase leading-[1.4] tracking-[0.08em]"
                  style={{ color: C.muted }}
                >
                  {item.label}
                </div>
                <div
                  className="mt-2 font-mono text-[20px] font-semibold leading-none tracking-[-0.02em] sm:text-[22px]"
                  style={{ color: C.forest }}
                >
                  {item.value}
                </div>
                <div className="mt-2 text-[11px] leading-[1.5]" style={{ color: C.muted }}>
                  {item.context}
                </div>
              </Card>
            ))}
          </div>
        </Reveal>
      </div>

      <Reveal delay={80}>
        <div className="mt-8 flex flex-col items-start gap-3">
          <PrimaryButton onClick={() => go('benchmark')}>Explore Benchmark Centre</PrimaryButton>
          <p className="max-w-2xl text-[11px] leading-[1.6]" style={{ color: C.muted }}>
            Fixture values from the demo scenario set. Benchmark Centre computes real comparisons
            when you run a benchmark.
          </p>
        </div>
      </Reveal>
    </Section>
  );
};
