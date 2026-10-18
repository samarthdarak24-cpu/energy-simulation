import React from 'react';
import { ArrowRight } from 'lucide-react';
import { Card, Chip, C, Reveal, Section, SectionHeading } from '../ui';

const SolarVisual: React.FC = () => (
  <svg
    viewBox="0 0 320 160"
    preserveAspectRatio="xMidYMid slice"
    className="h-full w-full"
    aria-hidden="true"
    focusable="false"
  >
    <circle cx="46" cy="34" r="16" fill={C.amber} opacity="0.14" />
    <circle cx="46" cy="34" r="8" fill={C.amber} opacity="0.45" />

    <path
      d="M112 42c2-9 10-15 20-15 8 0 15 4 18 11 7-3 15 1 17 8 2 6-2 12-9 12h-39c-6 0-9-4-9-9 0-3 1-5 2-7Z"
      fill="#FFFFFF"
      opacity="0.95"
    />
    <path
      d="M206 30c1-6 6-10 12-10 6 0 11 3 13 8 5-2 10 0 12 5 2 5-2 9-7 9h-25c-4 0-6-3-6-6 0-2 0-4 1-6Z"
      fill="#FFFFFF"
      opacity="0.7"
    />

    <line x1="18" y1="126" x2="302" y2="126" stroke="#CFE6D5" strokeWidth="1.5" />

    {[0, 1, 2].map((i) => (
      <g key={i} transform={`translate(${26 + i * 54}, ${56 + i * 8})`}>
        <polygon
          points="0,20 44,10 52,32 8,42"
          fill="#FFFFFF"
          stroke={C.brand}
          strokeWidth="1.2"
          strokeLinejoin="round"
        />
        <line x1="9" y1="30" x2="47" y2="21" stroke="#CFE6D5" strokeWidth="1" />
        <line x1="17" y1="38" x2="49" y2="30" stroke="#CFE6D5" strokeWidth="1" />
        <line x1="26" y1="24" x2="34" y2="40" stroke="#DCEADF" strokeWidth="1" />
        <line x1="12" y1="40" x2="12" y2="68" stroke={C.forest} strokeWidth="1.4" opacity="0.35" />
        <line x1="42" y1="33" x2="42" y2="68" stroke={C.forest} strokeWidth="1.4" opacity="0.35" />
      </g>
    ))}

    <rect x="190" y="78" width="112" height="58" rx="9" fill="#FFFFFF" opacity="0.96" stroke="#E4E9E4" />
    <rect x="238" y="86" width="30" height="42" fill={C.red} opacity="0.09" />
    <line x1="198" y1="124" x2="294" y2="124" stroke="#EDF2EE" strokeWidth="1" />
    <polyline
      points="198,104 212,100 226,102 238,110 248,122 260,118 274,108 292,102"
      fill="none"
      stroke={C.brand}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <circle cx="248" cy="122" r="2.6" fill={C.red} />
  </svg>
);

const DemandVisual: React.FC = () => (
  <svg
    viewBox="0 0 320 160"
    preserveAspectRatio="xMidYMid slice"
    className="h-full w-full"
    aria-hidden="true"
    focusable="false"
  >
    <line x1="16" y1="126" x2="304" y2="126" stroke="#DCE7DC" strokeWidth="1.5" />

    <g transform="translate(38, 54)">
      <rect x="0" y="0" width="24" height="66" rx="6" fill="#FFFFFF" stroke="#BFD9C6" />
      <rect x="5" y="8" width="14" height="17" rx="2" fill={C.soft} />
      <circle cx="12" cy="36" r="2.6" fill={C.brand} />
      <line x1="6" y1="48" x2="18" y2="48" stroke="#DCEADF" strokeWidth="2" strokeLinecap="round" />
      <path d="M24 44c12 0 12 12 24 12" fill="none" stroke={C.forest} strokeWidth="2" opacity="0.45" />
    </g>

    <g transform="translate(88, 62)">
      <rect x="0" y="0" width="22" height="58" rx="6" fill="#FFFFFF" stroke="#BFD9C6" />
      <rect x="5" y="7" width="12" height="14" rx="2" fill={C.soft} />
      <circle cx="11" cy="32" r="2.4" fill={C.amber} />
      <line x1="6" y1="43" x2="16" y2="43" stroke="#DCEADF" strokeWidth="2" strokeLinecap="round" />
    </g>

    <line
      x1="216"
      y1="62"
      x2="302"
      y2="62"
      stroke={C.amber}
      strokeWidth="1"
      strokeDasharray="3 4"
      opacity="0.5"
    />

    <rect x="150" y="104" width="16" height="22" rx="3" fill="#CFE6D5" />
    <rect x="176" y="92" width="16" height="34" rx="3" fill="#CFE6D5" />
    <rect x="202" y="100" width="16" height="26" rx="3" fill="#CFE6D5" />
    <rect x="228" y="70" width="16" height="56" rx="3" fill={C.amber} opacity="0.9" />
    <rect x="254" y="88" width="16" height="38" rx="3" fill="#CFE6D5" />
    <rect x="280" y="108" width="16" height="18" rx="3" fill="#CFE6D5" />
  </svg>
);

const FaultVisual: React.FC = () => (
  <svg
    viewBox="0 0 320 160"
    preserveAspectRatio="xMidYMid slice"
    className="h-full w-full"
    aria-hidden="true"
    focusable="false"
  >
    <line x1="16" y1="128" x2="304" y2="128" stroke="#DDE5E9" strokeWidth="1.5" />

    <g stroke={C.forest} strokeWidth="1.4" fill="none" opacity="0.5">
      <path d="M56 128 L74 42 L92 128" />
      <line x1="42" y1="58" x2="106" y2="58" />
      <line x1="50" y1="76" x2="98" y2="76" />
      <line x1="62" y1="110" x2="86" y2="110" />
      <line x1="67" y1="94" x2="81" y2="94" />
      <line x1="62" y1="110" x2="81" y2="94" />
      <line x1="86" y1="110" x2="67" y2="94" />
    </g>
    <circle cx="42" cy="58" r="2" fill={C.forest} opacity="0.45" />
    <circle cx="106" cy="58" r="2" fill={C.forest} opacity="0.45" />

    <rect x="126" y="82" width="118" height="44" rx="5" fill="#FFFFFF" stroke="#BFD9C6" />
    <rect x="132" y="88" width="106" height="4" rx="2" fill={C.soft} />
    <line x1="150" y1="98" x2="150" y2="120" stroke="#E4E9E4" strokeWidth="1.2" />
    <line x1="174" y1="98" x2="174" y2="120" stroke="#E4E9E4" strokeWidth="1.2" />
    <line x1="198" y1="98" x2="198" y2="120" stroke="#E4E9E4" strokeWidth="1.2" />
    <line x1="222" y1="98" x2="222" y2="120" stroke="#E4E9E4" strokeWidth="1.2" />
    <circle cx="134" cy="116" r="2.4" fill={C.brand} />

    <rect x="176" y="24" width="116" height="26" rx="13" fill="#FFFFFF" stroke="#F3C7CD" />
    <circle cx="192" cy="37" r="3.5" fill={C.red} />
    <text x="202" y="41" fontSize="10.5" fontWeight="600" fill="#A31F2C">
      Fault detected
    </text>

    <line
      x1="234"
      y1="50"
      x2="234"
      y2="82"
      stroke={C.red}
      strokeWidth="1.4"
      strokeDasharray="3 4"
      opacity="0.4"
    />
  </svg>
);

const Hint: React.FC<{ className?: string }> = ({ className = 'mt-4' }) => (
  <span className={`inline-flex items-center gap-1.5 text-[12px] font-medium text-[#5B6B62] ${className}`}>
    Read the failure mode
    <ArrowRight className="h-3.5 w-3.5 text-[#3E984A]" />
  </span>
);

const cardShell =
  'group flex flex-col transition-all duration-300 hover:border-[#BFD9C6] hover:shadow-[0_20px_44px_-28px_rgba(16,61,43,0.35)]';

export const ProblemSection: React.FC = () => {
  return (
    <Section tone="white">
      <SectionHeading
        align="left"
        eyebrow="The challenge"
        title="Renewable energy is dynamic. Grid reliability must be smarter."
        description="Intermittent generation, rising EV demand, storage limitations, and grid faults create operating challenges that require coordinated decisions."
      />

      <div className="mt-10 grid items-start gap-6 md:mt-12 md:grid-cols-3">
        <Reveal delay={0}>
          <Card className={cardShell}>
            <div className="h-40 overflow-hidden rounded-t-2xl" style={{ backgroundColor: C.soft }}>
              <div className="h-full w-full transition-transform duration-300 group-hover:scale-[1.03]">
                <SolarVisual />
              </div>
            </div>
            <div className="flex flex-1 flex-col p-5">
              <div>
                <Chip tone="green">Generation</Chip>
              </div>
              <h3 className="mt-3 text-[17px] font-semibold text-[#172535]">
                Unpredictable solar generation
              </h3>
              <p className="mt-2 text-[13px] leading-relaxed text-[#5B6B62]">
                Solar output can fall suddenly and create a supply-demand imbalance.
              </p>
              <div className="mt-auto pt-5">
                <Hint className="" />
              </div>
            </div>
          </Card>
        </Reveal>

        <Reveal delay={90}>
          <Card className={cardShell}>
            <div className="h-44 overflow-hidden rounded-t-2xl" style={{ backgroundColor: C.mint }}>
              <div className="h-full w-full transition-transform duration-300 group-hover:scale-[1.03]">
                <DemandVisual />
              </div>
            </div>
            <div className="flex flex-1 flex-col p-5">
              <div>
                <Chip tone="amber">Demand</Chip>
              </div>
              <h3 className="mt-3 text-[17px] font-semibold text-[#172535]">
                Rising and flexible demand
              </h3>
              <p className="mt-2 text-[13px] leading-relaxed text-[#5B6B62]">
                Vehicle charging and shifting consumer demand can create temporary peaks.
              </p>
            </div>
            <div className="mt-5 flex items-center justify-between border-t border-[#EEF2F4] px-5 py-3">
              <Hint className="" />
              <span className="text-[11px] font-medium text-[#8AA395]">02</span>
            </div>
          </Card>
        </Reveal>

        <Reveal delay={180}>
          <Card className={cardShell}>
            <div className="h-40 overflow-hidden rounded-t-2xl" style={{ backgroundColor: C.bg }}>
              <div className="h-full w-full transition-transform duration-300 group-hover:scale-[1.03]">
                <FaultVisual />
              </div>
            </div>
            <div className="flex flex-1 flex-col p-5">
              <div className="flex items-center justify-between">
                <Chip tone="red">Reliability</Chip>
                <span className="text-[11px] font-medium text-[#8AA395]">03</span>
              </div>
              <h3 className="mt-3 text-[17px] font-semibold text-[#172535]">
                Unexpected disruptions
              </h3>
              <p className="mt-2 text-[13px] leading-relaxed text-[#5B6B62]">
                Grid outages, unavailable batteries, and communication failures can threaten
                critical services.
              </p>
              <div className="mt-auto border-t border-[#EEF2F4] pt-4">
                <Hint className="" />
              </div>
            </div>
          </Card>
        </Reveal>
      </div>

      <Reveal delay={260}>
        <div className="mt-12 max-w-3xl border-t border-[#E4E9E4] pt-8 md:mt-14">
          <p className="text-[16px] font-medium leading-relaxed text-[#172535]">
            Detecting the problem is only the beginning. The real challenge is choosing and
            verifying the right response.
          </p>
        </div>
      </Reveal>
    </Section>
  );
};
