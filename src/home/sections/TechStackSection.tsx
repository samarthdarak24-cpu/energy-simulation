import React, { useState } from 'react';
import { Section, SectionHeading, Reveal, Card, Chip, C } from '../ui';

const MONO = 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace';

interface Layer {
  index: string;
  name: string;
  tech: string[];
  responsibility: string;
}

const LAYERS: Layer[] = [
  {
    index: '01',
    name: 'Experience',
    tech: ['React', 'TypeScript', 'Tailwind CSS', 'GSAP'],
    responsibility: 'Interface, interaction, and animation.',
  },
  {
    index: '02',
    name: 'API & Communication',
    tech: ['FastAPI', 'REST APIs', 'WebSockets'],
    responsibility: 'Streams simulation state to the client.',
  },
  {
    index: '03',
    name: 'Digital Twin',
    tech: ['NumPy', 'Pandas', 'pandapower'],
    responsibility: 'Power-flow and state evolution.',
  },
  {
    index: '04',
    name: 'Intelligence',
    tech: ['StatsForecast', 'XGBoost', 'SciPy', 'HiGHS'],
    responsibility: 'Forecasting and constrained optimization.',
  },
  {
    index: '05',
    name: 'Persistence',
    tech: ['SQLAlchemy', 'SQLite'],
    responsibility: 'Experiment, event, and benchmark storage.',
  },
];

const BOX_X = 52;
const BOX_W = 216;
const BOX_H = 52;
const BOX_GAP = 20;
const START_Y = 22;
const STEP = BOX_H + BOX_GAP;
const FLOW_X = BOX_X + BOX_W / 2;

const boxY = (index: number): number => START_Y + index * STEP;

export const TechStackSection: React.FC = () => {
  const [activeLayer, setActiveLayer] = useState('03');

  return (
    <Section id="technology" tone="gray">
      <Reveal>
        <SectionHeading
          eyebrow="Technology"
          title="Engineered for simulation. Designed for intelligent control."
          description="A layered stack that keeps the simulation engine, the optimization layer, and the interface independent."
        />
      </Reveal>

      <div className="mt-10 grid items-start gap-8 lg:mt-14 lg:grid-cols-12">
        <Reveal delay={80} className="min-w-0 lg:col-span-7">
          <Card className="overflow-hidden">
            {LAYERS.map((layer, index) => {
              const isActive = layer.index === activeLayer;
              return (
                <button
                  key={layer.index}
                  type="button"
                  aria-expanded={isActive}
                  onMouseEnter={() => setActiveLayer(layer.index)}
                  onFocus={() => setActiveLayer(layer.index)}
                  onClick={() => setActiveLayer(layer.index)}
                  className={`relative block w-full px-4 py-4 text-left outline-none transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#3E984A] sm:px-5 ${
                    index < LAYERS.length - 1 ? 'border-b' : ''
                  }`}
                  style={{
                    borderColor: C.border,
                    backgroundColor: isActive ? C.mint : 'transparent',
                  }}
                >
                  <span
                    aria-hidden="true"
                    className="absolute bottom-3 left-0 top-3 w-[3px] rounded-full transition-colors duration-200"
                    style={{ backgroundColor: isActive ? C.brand : 'transparent' }}
                  />
                  <span className="flex items-baseline gap-3">
                    <span
                      className="font-mono text-[11px] tracking-[0.16em]"
                      style={{ color: isActive ? C.brand : C.muted }}
                    >
                      {layer.index}
                    </span>
                    <span
                      className="text-[16px] font-semibold tracking-[-0.01em]"
                      style={{ color: C.text }}
                    >
                      {layer.name}
                    </span>
                  </span>

                  <span className="mt-2.5 flex flex-wrap gap-1.5">
                    {layer.tech.map((tech) => (
                      <Chip key={tech} tone={isActive ? 'green' : 'slate'}>
                        {tech}
                      </Chip>
                    ))}
                  </span>

                  <span
                    className={`block overflow-hidden transition-all duration-300 ${
                      isActive ? 'max-h-24 opacity-100' : 'max-h-24 opacity-100 lg:max-h-0 lg:opacity-0'
                    }`}
                  >
                    <span
                      className="block pt-2.5 text-[12.5px] leading-[1.6]"
                      style={{ color: C.muted }}
                    >
                      {layer.responsibility}
                    </span>
                  </span>
                </button>
              );
            })}
          </Card>
        </Reveal>

        <Reveal delay={160} className="min-w-0 lg:col-span-5">
          <Card className="p-4 sm:p-5">
            <div
              className="text-[10px] font-semibold uppercase tracking-[0.14em]"
              style={{ color: C.muted }}
            >
              Data flow
            </div>
            <svg
              viewBox="0 0 320 380"
              className="mx-auto mt-2 h-auto w-full max-w-[320px]"
              role="img"
              aria-label="Stack diagram with five layers flowing downward from experience to persistence and a state return path back to experience."
            >
              <defs>
                <marker
                  id="tech-flow-down"
                  viewBox="0 0 8 8"
                  refX="7"
                  refY="4"
                  markerWidth="7"
                  markerHeight="7"
                  markerUnits="userSpaceOnUse"
                  orient="auto"
                >
                  <path d="M0,0 L8,4 L0,8 Z" fill="#CBD5E1" />
                </marker>
                <marker
                  id="tech-flow-state"
                  viewBox="0 0 8 8"
                  refX="7"
                  refY="4"
                  markerWidth="7"
                  markerHeight="7"
                  markerUnits="userSpaceOnUse"
                  orient="auto"
                >
                  <path d="M0,0 L8,4 L0,8 Z" fill="#94A3B8" />
                </marker>
              </defs>

              {LAYERS.map((layer, index) => {
                if (index === LAYERS.length - 1) return null;
                const y1 = boxY(index) + BOX_H;
                const y2 = boxY(index + 1);
                return (
                  <line
                    key={`flow-${layer.index}`}
                    x1={FLOW_X}
                    y1={y1}
                    x2={FLOW_X}
                    y2={y2 - 1}
                    stroke="#CBD5E1"
                    strokeWidth={1.4}
                    markerEnd="url(#tech-flow-down)"
                  />
                );
              })}

              <path
                d={`M ${BOX_X} ${boxY(4) + BOX_H / 2} H 26 V ${boxY(0) + BOX_H / 2} H ${
                  BOX_X - 4
                }`}
                fill="none"
                stroke="#94A3B8"
                strokeWidth={1.4}
                strokeDasharray="5 4"
                markerEnd="url(#tech-flow-state)"
              />
              <text
                transform={`rotate(-90 17 ${boxY(2) + BOX_H / 2})`}
                x={17}
                y={boxY(2) + BOX_H / 2}
                textAnchor="middle"
                fontSize={8}
                fontFamily={MONO}
                letterSpacing="0.12em"
                fill="#94A3B8"
              >
                state
              </text>

              {LAYERS.map((layer, index) => {
                const y = boxY(index);
                const isActive = layer.index === activeLayer;
                return (
                  <g key={`box-${layer.index}`}>
                    <rect
                      x={BOX_X}
                      y={y}
                      width={BOX_W}
                      height={BOX_H}
                      rx={9}
                      fill={isActive ? C.soft : C.card}
                      stroke={isActive ? C.forest : C.border}
                      strokeWidth={isActive ? 1.6 : 1}
                    />
                    <text
                      x={BOX_X + 14}
                      y={y + 20}
                      fontSize={8}
                      fontFamily={MONO}
                      letterSpacing="0.14em"
                      fill={isActive ? C.forest : C.muted}
                    >
                      {layer.index}
                    </text>
                    <text
                      x={BOX_X + 14}
                      y={y + 37}
                      fontSize={11.5}
                      fontWeight={600}
                      fill={isActive ? C.evergreen : C.text}
                    >
                      {layer.name}
                    </text>
                    <circle
                      cx={BOX_X + BOX_W - 14}
                      cy={y + BOX_H / 2}
                      r={3}
                      fill={isActive ? C.brand : '#CBD5E1'}
                    />
                  </g>
                );
              })}
            </svg>
            <p className="mt-3 text-[11px] leading-[1.6]" style={{ color: C.muted }}>
              Simulation → intelligence → interface, with state persisted between cycles.
            </p>
          </Card>
        </Reveal>
      </div>
    </Section>
  );
};
