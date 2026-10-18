import React, { useEffect, useRef, useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { useMicrogrid, NavigationPage } from '../context/MicrogridContext';

export const C = {
  forest: '#1B5E36',
  brand: '#3E984A',
  evergreen: '#103D2B',
  soft: '#EAF5EC',
  mint: '#F1F8F2',
  bg: '#F6F8F9',
  card: '#FFFFFF',
  text: '#172535',
  muted: '#64748B',
  border: '#E2E8EB',
  amber: '#E9A12B',
  red: '#DC3545',
  blue: '#3D79D8',
} as const;

export const useGo = () => {
  const { setActivePage } = useMicrogrid();
  return (page: NavigationPage) => {
    setActivePage(page);
    window.scrollTo({ top: 0 });
  };
};

export const useReducedMotion = () => {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduced(mq.matches);
    const handler = () => setReduced(mq.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);
  return reduced;
};

export const Section: React.FC<{
  id?: string;
  tone?: 'white' | 'gray' | 'mint' | 'forest';
  className?: string;
  innerClassName?: string;
  children: React.ReactNode;
}> = ({ id, tone = 'white', className = '', innerClassName = '', children }) => {
  const bg =
    tone === 'gray' ? C.bg : tone === 'mint' ? C.mint : tone === 'forest' ? C.evergreen : '#FFFFFF';
  return (
    <section id={id} style={{ backgroundColor: bg }} className={`w-full ${className}`}>
      <div className={`mx-auto w-full max-w-[1240px] px-5 py-16 sm:px-6 md:py-24 ${innerClassName}`}>
        {children}
      </div>
    </section>
  );
};

export const Reveal: React.FC<{
  children: React.ReactNode;
  delay?: number;
  className?: string;
}> = ({ children, delay = 0, className = '' }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setShown(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setShown(true);
          io.disconnect();
        }
      },
      { threshold: 0.12, rootMargin: '0px 0px -60px 0px' }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: shown ? 1 : 0,
        transform: shown ? 'none' : 'translateY(22px)',
        transition: `opacity 700ms cubic-bezier(.16,1,.3,1) ${delay}ms, transform 700ms cubic-bezier(.16,1,.3,1) ${delay}ms`,
      }}
    >
      {children}
    </div>
  );
};

export const Eyebrow: React.FC<{ children: React.ReactNode; tone?: 'green' | 'light' }> = ({
  children,
  tone = 'green',
}) => (
  <div
    className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] ${
      tone === 'green'
        ? 'border-[#CFE6D5] bg-[#EAF5EC] text-[#1B5E36]'
        : 'border-white/25 bg-white/10 text-[#D7F0DD]'
    }`}
  >
    <span className="relative flex h-1.5 w-1.5">
      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#3E984A] opacity-70" />
      <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[#3E984A]" />
    </span>
    {children}
  </div>
);

export const SectionHeading: React.FC<{
  eyebrow?: string;
  title: React.ReactNode;
  description?: React.ReactNode;
  align?: 'left' | 'center';
  tone?: 'dark' | 'light';
  className?: string;
}> = ({ eyebrow, title, description, align = 'left', tone = 'dark', className = '' }) => (
  <div
    className={`${align === 'center' ? 'mx-auto max-w-3xl text-center' : 'max-w-3xl'} ${className}`}
  >
    {eyebrow && (
      <div className="mb-4">
        <Eyebrow tone={tone === 'dark' ? 'green' : 'light'}>{eyebrow}</Eyebrow>
      </div>
    )}
    <h2
      className={`text-[28px] leading-[1.12] font-semibold tracking-[-0.02em] sm:text-[36px] md:text-[42px] ${
        tone === 'dark' ? 'text-[#172535]' : 'text-white'
      }`}
    >
      {title}
    </h2>
    {description && (
      <p
        className={`mt-4 max-w-2xl text-[15px] leading-[1.7] ${
          align === 'center' ? 'mx-auto' : ''
        } ${tone === 'dark' ? 'text-[#64748B]' : 'text-[#BFDCC7]'}`}
      >
        {description}
      </p>
    )}
  </div>
);

export const PrimaryButton: React.FC<{
  onClick?: () => void;
  children: React.ReactNode;
  arrow?: boolean;
  className?: string;
}> = ({ onClick, children, arrow = true, className = '' }) => (
  <button
    onClick={onClick}
    className={`group inline-flex items-center justify-center gap-2 rounded-xl bg-[#1B5E36] px-5 py-3 text-sm font-semibold text-white transition-all duration-200 hover:bg-[#103D2B] hover:-translate-y-0.5 active:translate-y-0 ${className}`}
  >
    <span>{children}</span>
    {arrow && (
      <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
    )}
  </button>
);

export const SecondaryButton: React.FC<{
  onClick?: () => void;
  children: React.ReactNode;
  className?: string;
  light?: boolean;
}> = ({ onClick, children, className = '', light = false }) => (
  <button
    onClick={onClick}
    className={`inline-flex items-center justify-center gap-2 rounded-xl border px-5 py-3 text-sm font-semibold transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 ${
      light
        ? 'border-white/30 bg-white/5 text-white hover:bg-white/10'
        : 'border-[#E2E8EB] bg-white text-[#172535] hover:border-[#C6D3D9] hover:bg-[#F6F8F9]'
    } ${className}`}
  >
    {children}
  </button>
);

export const Card: React.FC<{
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
}> = ({ children, className = '', hover = false }) => (
  <div
    className={`rounded-2xl border border-[#E2E8EB] bg-white ${
      hover
        ? 'transition-all duration-300 hover:-translate-y-1 hover:border-[#BFD9C6] hover:shadow-[0_18px_40px_-24px_rgba(16,61,43,0.35)]'
        : ''
    } ${className}`}
  >
    {children}
  </div>
);

export const Chip: React.FC<{ children: React.ReactNode; tone?: 'green' | 'amber' | 'red' | 'blue' | 'slate' }> = ({
  children,
  tone = 'green',
}) => {
  const map = {
    green: 'bg-[#EAF5EC] text-[#1B5E36] border-[#CFE6D5]',
    amber: 'bg-[#FDF4E3] text-[#8A5D0A] border-[#F2DFB8]',
    red: 'bg-[#FCECEE] text-[#A31F2C] border-[#F3C7CD]',
    blue: 'bg-[#ECF2FC] text-[#25508F] border-[#C9DBF5]',
    slate: 'bg-[#F1F4F6] text-[#475569] border-[#E2E8EB]',
  } as const;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[11px] font-semibold ${map[tone]}`}
    >
      {children}
    </span>
  );
};
