import React from 'react';
import { Section, Reveal, Eyebrow, PrimaryButton, SecondaryButton, C, useGo } from '../ui';

const metrics = [
  { x: 104, label: 'Reserve', value: '76%' },
  { x: 238, label: 'Critical load', value: '412 kW' },
  { x: 372, label: 'Pipeline', value: '4 of 4' },
];

const pipeline = [
  { x: 104, n: '01', label: 'Simulate' },
  { x: 202, n: '02', label: 'Anticipate' },
  { x: 300, n: '03', label: 'Coordinate' },
  { x: 398, n: '04', label: 'Verify' },
];

export const FinalCtaSection: React.FC = () => {
  const go = useGo();

  return (
    <Section
      tone="forest"
      className="relative overflow-hidden"
      innerClassName="relative pt-20 pb-20 md:pt-28 md:pb-28"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 left-1/2 w-screen -translate-x-1/2 overflow-hidden"
      >
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              'linear-gradient(to right, rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.05) 1px, transparent 1px)',
            backgroundSize: '56px 56px',
            maskImage: 'radial-gradient(120% 100% at 50% 0%, #000 28%, transparent 84%)',
            WebkitMaskImage: 'radial-gradient(120% 100% at 50% 0%, #000 28%, transparent 84%)',
          }}
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(58% 72% at 82% 26%, rgba(62,152,74,0.2) 0%, rgba(16,61,43,0) 70%)',
          }}
        />
        <svg
          viewBox="0 0 1440 620"
          className="absolute left-0 top-0 h-auto w-full"
          fill="none"
          preserveAspectRatio="none"
        >
          <path
            d="M -60 470 C 220 470 260 240 520 240 C 760 240 790 400 1020 400 C 1230 400 1270 220 1500 220"
            stroke="#9FE1CB"
            strokeOpacity="0.22"
            strokeWidth="1.5"
            strokeDasharray="8 14"
            strokeLinecap="round"
            className="animate-flow-dash motion-reduce:animate-none"
            style={{ animationDuration: '10s' }}
          />
        </svg>
      </div>

      <div className="relative grid items-center gap-12 lg:grid-cols-12 lg:gap-10">
        <Reveal className="min-w-0 lg:col-span-7">
          <Eyebrow tone="light">Get started</Eyebrow>
          <h2 className="mt-5 max-w-[560px] text-[32px] font-semibold leading-[1.1] tracking-[-0.02em] text-white md:text-[46px]">
            Ready to see a microgrid recover?
          </h2>
          <p className="mt-5 max-w-[520px] text-[15px] leading-[1.7] text-[#BFDCC7]">
            Enter GridHeal Recovery Lab, simulate a disruption, observe autonomous resource
            coordination, and inspect the verified outcome.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <PrimaryButton
              onClick={() => go('overview')}
              className="border border-white/25 shadow-[0_14px_30px_-18px_rgba(0,0,0,0.65)]"
            >
              Launch Recovery Lab
            </PrimaryButton>
            <SecondaryButton light onClick={() => go('help')}>
              View Documentation
            </SecondaryButton>
          </div>
        </Reveal>

        <Reveal delay={160} className="min-w-0 lg:col-span-5">
          <div className="mx-auto w-full max-w-[420px] lg:max-w-none lg:translate-x-2 lg:rotate-[1.5deg]">
            <div className="overflow-hidden rounded-2xl border border-white/15 bg-white/5 shadow-[0_30px_60px_-30px_rgba(0,0,0,0.6)]">
              <svg
                viewBox="0 0 520 380"
                className="block h-auto w-full"
                role="img"
                aria-label="Dashboard preview with a sidebar, three metric tiles, a recovery curve, and a four-step pipeline"
              >
                <rect
                  x="1"
                  y="1"
                  width="518"
                  height="378"
                  rx="16"
                  fill={C.evergreen}
                  fillOpacity="0.55"
                  stroke="rgba(255,255,255,0.14)"
                />

                <circle cx="20" cy="18" r="3" fill="rgba(255,255,255,0.2)" />
                <circle cx="31" cy="18" r="3" fill="rgba(255,255,255,0.2)" />
                <circle cx="42" cy="18" r="3" fill="rgba(255,255,255,0.2)" />
                <text
                  x="60"
                  y="21"
                  fill="rgba(255,255,255,0.45)"
                  fontSize="7.5"
                  fontFamily="'JetBrains Mono', monospace"
                  letterSpacing="0.16em"
                >
                  RECOVERY LAB
                </text>
                <line x1="1" y1="34" x2="519" y2="34" stroke="rgba(255,255,255,0.12)" />

                <rect x="1" y="35" width="86" height="344" fill="rgba(255,255,255,0.04)" />
                <line x1="87" y1="35" x2="87" y2="379" stroke="rgba(255,255,255,0.12)" />

                <rect x="15" y="50" width="14" height="14" rx="4" fill="#9FE1CB" fillOpacity="0.8" />
                <rect x="36" y="53" width="34" height="4" rx="2" fill="rgba(255,255,255,0.3)" />
                <rect x="36" y="60" width="22" height="3" rx="1.5" fill="rgba(255,255,255,0.16)" />

                {[82, 110, 138, 166, 194].map((y, index) => (
                  <g key={`nav-${y}`}>
                    {index === 0 && (
                      <rect
                        x="12"
                        y={y - 4}
                        width="64"
                        height="24"
                        rx="7"
                        fill="rgba(255,255,255,0.09)"
                      />
                    )}
                    {index === 0 && (
                      <rect x="12" y={y - 2} width="2.5" height="20" rx="1.25" fill="#9FE1CB" />
                    )}
                    <rect
                      x="22"
                      y={y + 4}
                      width="8"
                      height="8"
                      rx="2"
                      fill={index === 0 ? '#9FE1CB' : 'rgba(255,255,255,0.2)'}
                    />
                    <rect
                      x="36"
                      y={y + 6}
                      width={index === 0 ? 30 : 26}
                      height="4"
                      rx="2"
                      fill={index === 0 ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.18)'}
                    />
                  </g>
                ))}

                <rect
                  x="12"
                  y="318"
                  width="64"
                  height="44"
                  rx="8"
                  fill="rgba(159,225,203,0.08)"
                  stroke="rgba(159,225,203,0.18)"
                />
                <circle cx="21" cy="330" r="2" fill="#9FE1CB" />
                <rect x="28" y="327" width="30" height="3" rx="1.5" fill="rgba(255,255,255,0.24)" />
                <rect x="28" y="333" width="22" height="3" rx="1.5" fill="rgba(255,255,255,0.14)" />
                <rect x="20" y="347" width="48" height="3" rx="1.5" fill="rgba(255,255,255,0.12)" />

                <text
                  x="104"
                  y="58"
                  fill="rgba(255,255,255,0.82)"
                  fontSize="10.5"
                  fontWeight="600"
                >
                  Microgrid overview
                </text>
                <rect x="104" y="66" width="96" height="3.5" rx="1.75" fill="rgba(255,255,255,0.16)" />
                <rect
                  x="418"
                  y="46"
                  width="72"
                  height="16"
                  rx="8"
                  fill="rgba(159,225,203,0.12)"
                  stroke="rgba(159,225,203,0.22)"
                />
                <text
                  x="430"
                  y="57"
                  fill="#9FE1CB"
                  fontSize="6.5"
                  fontFamily="'JetBrains Mono', monospace"
                  letterSpacing="0.1em"
                >
                  SIMULATION
                </text>

                {metrics.map((metric) => (
                  <g key={metric.label}>
                    <rect
                      x={metric.x}
                      y="84"
                      width="118"
                      height="50"
                      rx="8"
                      fill="rgba(255,255,255,0.05)"
                      stroke="rgba(255,255,255,0.12)"
                    />
                    <text x={metric.x + 12} y="102" fill="rgba(255,255,255,0.45)" fontSize="7">
                      {metric.label}
                    </text>
                    <text
                      x={metric.x + 12}
                      y="121"
                      fill="#9FE1CB"
                      fontSize="13"
                      fontWeight="600"
                      fontFamily="'JetBrains Mono', monospace"
                    >
                      {metric.value}
                    </text>
                  </g>
                ))}

                <rect
                  x="104"
                  y="146"
                  width="386"
                  height="126"
                  rx="10"
                  fill="rgba(255,255,255,0.04)"
                  stroke="rgba(255,255,255,0.1)"
                />
                <text x="116" y="162" fill="rgba(255,255,255,0.45)" fontSize="7.5">
                  Supply and demand
                </text>
                <circle cx="392" cy="158" r="2" fill="#9FE1CB" />
                <text x="398" y="161" fill="rgba(255,255,255,0.4)" fontSize="6.5">
                  Available
                </text>
                <circle cx="444" cy="158" r="2" fill="rgba(255,255,255,0.25)" />
                <text x="450" y="161" fill="rgba(255,255,255,0.4)" fontSize="6.5">
                  Load
                </text>

                {[178, 196, 214, 232, 250].map((y) => (
                  <line
                    key={`grid-${y}`}
                    x1="116"
                    y1={y}
                    x2="478"
                    y2={y}
                    stroke="rgba(255,255,255,0.07)"
                  />
                ))}

                <path
                  d="M 116 244 C 146 240 162 226 186 222 C 210 218 220 234 244 230 C 268 226 280 200 304 194 C 328 188 340 210 364 204 C 388 198 400 186 424 184 C 448 182 462 174 478 170 L 478 250 L 116 250 Z"
                  fill="#9FE1CB"
                  fillOpacity="0.1"
                />
                <path
                  d="M 116 238 C 160 236 200 230 240 226 C 300 220 380 208 478 196"
                  fill="none"
                  stroke="rgba(255,255,255,0.18)"
                  strokeWidth="1"
                  strokeDasharray="4 5"
                />
                <path
                  d="M 116 244 C 146 240 162 226 186 222 C 210 218 220 234 244 230 C 268 226 280 200 304 194 C 328 188 340 210 364 204 C 388 198 400 186 424 184 C 448 182 462 174 478 170"
                  fill="none"
                  stroke="#9FE1CB"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                />
                <circle cx="364" cy="204" r="6" fill="#9FE1CB" fillOpacity="0.15" />
                <circle cx="364" cy="204" r="2.5" fill="#9FE1CB" />

                <text x="116" y="262" fill="rgba(255,255,255,0.28)" fontSize="6">
                  00:00
                </text>
                <text x="216" y="262" fill="rgba(255,255,255,0.28)" fontSize="6">
                  06:00
                </text>
                <text x="316" y="262" fill="rgba(255,255,255,0.28)" fontSize="6">
                  12:00
                </text>
                <text x="416" y="262" fill="rgba(255,255,255,0.28)" fontSize="6">
                  18:00
                </text>

                {pipeline.map((step, index) => (
                  <g key={step.n}>
                    <rect
                      x={step.x}
                      y="288"
                      width="92"
                      height="48"
                      rx="8"
                      fill={index < 3 ? 'rgba(159,225,203,0.12)' : 'rgba(255,255,255,0.04)'}
                      stroke={
                        index < 3 ? 'rgba(159,225,203,0.3)' : 'rgba(255,255,255,0.14)'
                      }
                    />
                    <text
                      x={step.x + 10}
                      y="305"
                      fill="rgba(255,255,255,0.4)"
                      fontSize="6.5"
                      fontFamily="'JetBrains Mono', monospace"
                      letterSpacing="0.08em"
                    >
                      {step.n}
                    </text>
                    <circle
                      cx={step.x + 80}
                      cy="302"
                      r="2"
                      fill={index < 3 ? '#9FE1CB' : 'rgba(255,255,255,0.25)'}
                    />
                    <text x={step.x + 10} y="320" fill="rgba(255,255,255,0.8)" fontSize="7.5">
                      {step.label}
                    </text>
                    <rect
                      x={step.x + 10}
                      y="326"
                      width="40"
                      height="2.5"
                      rx="1.25"
                      fill="rgba(255,255,255,0.14)"
                    />
                  </g>
                ))}
              </svg>
            </div>
          </div>
        </Reveal>
      </div>
    </Section>
  );
};
