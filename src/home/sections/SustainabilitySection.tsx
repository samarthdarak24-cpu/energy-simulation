import React from 'react';
import { Section, SectionHeading, Reveal, C } from '../ui';

type SdgTone = 'green' | 'clay' | 'mint' | 'amber';

interface Sdg {
  number: string;
  title: string;
  description: string;
  tone: SdgTone;
}

const sdgs: Sdg[] = [
  {
    number: '7',
    title: 'Affordable and clean energy',
    description: 'Experiment with higher renewable utilization.',
    tone: 'green',
  },
  {
    number: '9',
    title: 'Industry, innovation and infrastructure',
    description: 'Test resilient infrastructure control logic.',
    tone: 'clay',
  },
  {
    number: '11',
    title: 'Sustainable cities and communities',
    description: 'Keep critical urban services running.',
    tone: 'mint',
  },
  {
    number: '13',
    title: 'Climate action',
    description: 'Reduce reliance on carbon-intensive backup supply.',
    tone: 'amber',
  },
];

const badgeTones: Record<SdgTone, { bg: string; fg: string }> = {
  green: { bg: '#EAF5EC', fg: '#1B5E36' },
  clay: { bg: '#F6E7DD', fg: '#9A4F2C' },
  mint: { bg: '#E7F1E9', fg: '#103D2B' },
  amber: { bg: '#FDF4E3', fg: '#8A5D0A' },
};

const facadeWindows = (
  prefix: string,
  x: number,
  y: number,
  cols: number,
  rows: number,
  w: number,
  h: number,
  gapX: number,
  gapY: number
): React.ReactNode[] =>
  Array.from({ length: rows }).flatMap((_, row) =>
    Array.from({ length: cols }).map((_, col) => (
      <rect
        key={`${prefix}-${row}-${col}`}
        x={x + col * (w + gapX)}
        y={y + row * (h + gapY)}
        width={w}
        height={h}
        rx={1.5}
        fill="#F8FBF9"
        opacity={0.92}
      />
    ))
  );

const trees = [
  { x: 30, r: 14 },
  { x: 148, r: 16 },
  { x: 272, r: 13 },
  { x: 366, r: 15 },
  { x: 500, r: 14 },
];

const chargePosts = [306, 346];

export const SustainabilitySection: React.FC = () => {
  return (
    <Section id="sustainability" tone="white">
      <Reveal>
        <SectionHeading
          eyebrow="Sustainability"
          title="Building smarter pathways toward resilient, cleaner energy."
          description="GridHeal provides a digital environment for experimenting with renewable-energy coordination, critical-service reliability, and resource optimization."
        />
      </Reveal>

      <div className="mt-10 grid items-center gap-10 lg:mt-14 lg:grid-cols-12">
        <Reveal delay={80} className="min-w-0 lg:col-span-6">
          <div
            className="relative overflow-hidden rounded-2xl border"
            style={{ backgroundColor: C.mint, borderColor: C.border }}
          >
            <svg
              viewBox="0 0 560 420"
              className="block h-auto w-full"
              role="img"
              aria-label="Flat illustration of a city district with rooftop solar panels, trees, overhead distribution lines, and two electric-vehicle charging posts"
            >
              <rect width="560" height="420" fill={C.mint} />
              <circle cx="452" cy="88" r="72" fill={C.soft} opacity="0.55" />
              <circle cx="452" cy="88" r="50" fill={C.soft} />

              <rect y="304" width="560" height="116" fill="#EDF5EF" />
              <line x1="0" y1="304" x2="560" y2="304" stroke="#D8E6DB" strokeWidth="1" />

              <ellipse cx="98" cy="305" rx="54" ry="4" fill="#DCE9DF" />
              <ellipse cx="216" cy="305" rx="62" ry="4" fill="#DCE9DF" />
              <ellipse cx="321" cy="305" rx="46" ry="4" fill="#DCE9DF" />
              <ellipse cx="420" cy="305" rx="56" ry="4" fill="#DCE9DF" />

              <rect x="54" y="196" width="88" height="108" fill="#E4F0E7" stroke="#CFE6D5" />
              <line x1="54" y1="196" x2="142" y2="196" stroke="#BFD9C6" strokeWidth="1.5" />
              {facadeWindows('a', 66, 212, 3, 3, 14, 16, 10, 12)}

              <rect x="164" y="148" width="104" height="156" fill="#DCEDE1" stroke="#CFE6D5" />
              <line x1="164" y1="148" x2="268" y2="148" stroke="#BFD9C6" strokeWidth="1.5" />
              {facadeWindows('b', 176, 168, 3, 4, 18, 18, 8, 12)}

              <rect x="284" y="214" width="74" height="90" fill="#E9F3EB" stroke="#CFE6D5" />
              <line x1="284" y1="214" x2="358" y2="214" stroke="#BFD9C6" strokeWidth="1.5" />
              {facadeWindows('c', 294, 230, 2, 2, 14, 16, 12, 12)}

              <rect x="374" y="176" width="92" height="128" fill="#DFEEE3" stroke="#CFE6D5" />
              <line x1="374" y1="176" x2="466" y2="176" stroke="#BFD9C6" strokeWidth="1.5" />
              {facadeWindows('d', 386, 192, 2, 3, 14, 16, 14, 12)}

              <g fill={C.forest} stroke={C.evergreen} strokeWidth="0.6" opacity="0.92">
                <polygon points="62,193 78,185 96,185 80,193" />
                <polygon points="100,193 116,185 134,185 118,193" />
                <polygon points="172,145 188,137 206,137 190,145" />
                <polygon points="210,145 226,137 244,137 228,145" />
                <polygon points="290,211 304,204 328,204 314,211" />
                <polygon points="382,173 396,166 420,166 406,173" />
                <polygon points="410,173 424,166 448,166 434,173" />
              </g>

              <g fill="none" stroke="#A9C3B2" strokeWidth="1.1" strokeLinecap="round">
                <path d="M 70 186 C 108 178 138 162 168 140" />
                <path d="M 232 140 C 258 160 274 190 292 208" />
                <path d="M 340 208 C 360 196 384 184 402 168" />
              </g>
              <g fill="#8FB29A">
                <circle cx="70" cy="186" r="1.8" />
                <circle cx="168" cy="140" r="1.8" />
                <circle cx="232" cy="140" r="1.8" />
                <circle cx="292" cy="208" r="1.8" />
                <circle cx="340" cy="208" r="1.8" />
                <circle cx="402" cy="168" r="1.8" />
              </g>

              {trees.map((tree) => (
                <g key={`tree-${tree.x}`}>
                  <rect
                    x={tree.x - 1.5}
                    y={310}
                    width={3}
                    height={28}
                    rx={1.5}
                    fill="#9BAF9F"
                  />
                  <circle cx={tree.x} cy={298} r={tree.r} fill={C.brand} opacity="0.9" />
                  <circle
                    cx={tree.x - tree.r * 0.32}
                    cy={298 - tree.r * 0.3}
                    r={tree.r * 0.55}
                    fill="#5FB06B"
                    opacity="0.35"
                  />
                </g>
              ))}

              <rect y="342" width="560" height="34" fill="#E7EFEA" />
              <line x1="0" y1="342" x2="560" y2="342" stroke="#D3E0D6" strokeWidth="1.5" />
              <line
                x1="0"
                y1="359"
                x2="560"
                y2="359"
                stroke="#C6D5CB"
                strokeWidth="1.4"
                strokeDasharray="16 12"
              />

              {chargePosts.map((x) => (
                <g key={`post-${x}`}>
                  <rect x={x - 3} y={316} width={6} height={26} rx={2} fill={C.forest} />
                  <rect x={x - 6.5} y={306} width={13} height={11} rx={3} fill={C.brand} />
                  <rect x={x - 4} y={309} width={8} height={3} rx={1} fill={C.soft} />
                  <path
                    d={`M ${x + 6} 311 C ${x + 11} 316 ${x + 11} 324 ${x + 8} 334`}
                    fill="none"
                    stroke={C.forest}
                    strokeWidth="1.2"
                    strokeLinecap="round"
                  />
                </g>
              ))}

              <rect y="376" width="560" height="44" fill="#E9F2EC" />
              <line x1="0" y1="376" x2="560" y2="376" stroke="#D8E6DB" strokeWidth="1" />
            </svg>

            <div
              className="absolute bottom-3 left-3 right-3 max-w-[240px] rounded-xl border bg-white px-3.5 py-3 shadow-[0_14px_30px_-18px_rgba(16,61,43,0.45)] sm:bottom-4 sm:left-4"
              style={{ borderColor: C.border }}
            >
              <div className="flex items-center gap-2">
                <span
                  className="h-1.5 w-1.5 shrink-0 rounded-full"
                  style={{ backgroundColor: C.brand }}
                />
                <span className="text-[12px] font-semibold" style={{ color: C.text }}>
                  Critical services maintained
                </span>
              </div>
              <div
                className="mt-1 font-mono text-[12px] font-semibold"
                style={{ color: C.forest }}
              >
                100% in the demo scenario
              </div>
            </div>
          </div>
        </Reveal>

        <div className="min-w-0 space-y-3 lg:col-span-6">
          {sdgs.map((sdg, index) => {
            const tone = badgeTones[sdg.tone];
            return (
              <Reveal key={sdg.number} delay={index * 80}>
                <div
                  className="flex items-start gap-3.5 rounded-xl border border-[#E4E9E4] bg-white p-4 transition-all duration-200 hover:border-[#BFD9C6] hover:shadow-[0_12px_28px_-22px_rgba(16,61,43,0.45)]"
                >
                  <div
                    className="flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-xl"
                    style={{ backgroundColor: tone.bg }}
                  >
                    <span
                      className="font-mono text-[7px] font-semibold tracking-[0.12em] opacity-70"
                      style={{ color: tone.fg }}
                    >
                      SDG
                    </span>
                    <span
                      className="font-mono text-[15px] font-bold leading-none"
                      style={{ color: tone.fg }}
                    >
                      {sdg.number}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <div
                      className="text-[14.5px] font-semibold leading-snug tracking-[-0.01em]"
                      style={{ color: C.text }}
                    >
                      {sdg.title}
                    </div>
                    <p
                      className="mt-0.5 text-[12.5px] leading-[1.55]"
                      style={{ color: C.muted }}
                    >
                      {sdg.description}
                    </p>
                  </div>
                </div>
              </Reveal>
            );
          })}

          <p className="pt-1 text-[11.5px] leading-[1.6]" style={{ color: C.muted }}>
            GridHeal is a simulation platform. Sustainability outcomes depend on the scenario and
            configuration tested.
          </p>
        </div>
      </div>
    </Section>
  );
};
