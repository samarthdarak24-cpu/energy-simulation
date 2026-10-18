import React, { useEffect, useRef, useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { useMicrogrid, NavigationPage } from '../context/MicrogridContext';

export const C = {
  forest: '#1B5E36',
  brand: '#3E984A',
  evergreen: '#103D2B',
  soft: '#EAF5EC',
  mint: '#F1F8F2',
  bg: '#F7F5F0',
  card: '#FFFFFF',
  text: '#172535',
  muted: '#5B6B62',
  border: '#E4E9E4',
  amber: '#E9A12B',
  red: '#DC3545',
  blue: '#3E6B4E',
} as const;

export const useGo = () => {
  const { requestPage } = useMicrogrid();
  // Route every page request through the auth gate: public pages (home/login)
  // and already-authenticated users pass through; everything else lands on the
  // sign-in screen with the requested page saved as `pendingPage`.
  return requestPage;
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
  variant?: 'up' | 'blur' | 'scale';
  className?: string;
  as?: 'div' | 'li' | 'section' | 'article';
}> = ({ children, delay = 0, variant = 'up', className = '', as = 'div' }) => {
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
    // Safety net: never let content stay invisible if the observer is delayed
    // or never fires. Long enough not to interfere with scroll-driven reveals
    // during normal reading; only matters on an observer failure.
    const fallback = window.setTimeout(() => setShown(true), 4000);
    return () => {
      io.disconnect();
      window.clearTimeout(fallback);
    };
  }, []);

  const variantClass =
    variant === 'blur' ? 'gh-reveal--blur' : variant === 'scale' ? 'gh-reveal--scale' : '';
  const Tag = as as React.ElementType;

  return (
    <Tag
      ref={ref}
      className={`gh-reveal ${variantClass} ${shown ? 'is-visible' : ''} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </Tag>
  );
};

export const Eyebrow: React.FC<{ children: React.ReactNode; tone?: 'green' | 'light' }> = ({
  children,
  tone = 'green',
}) => (
  <span className={`gh-eyebrow ${tone === 'light' ? 'gh-eyebrow--light' : ''}`}>
    <span className="gh-dot" aria-hidden="true" />
    {children}
  </span>
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
      className={`gh-display text-[30px] leading-[1.08] font-semibold sm:text-[38px] md:text-[46px] ${
        tone === 'dark' ? 'text-[#16241E]' : 'text-white'
      }`}
    >
      {title}
    </h2>
    {description && (
      <p
        className={`mt-4 max-w-2xl text-[15.5px] leading-[1.75] ${
          align === 'center' ? 'mx-auto' : ''
        } ${tone === 'dark' ? 'text-[#5B6B62]' : 'text-[#BFDCC7]'}`}
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
  <button onClick={onClick} className={`gh-btn gh-btn-primary px-5 py-3 text-sm ${className}`}>
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
    className={`gh-btn ${light ? 'gh-btn-ghost' : 'gh-btn-secondary'} px-5 py-3 text-sm ${className}`}
  >
    {children}
  </button>
);

export const Card: React.FC<{
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
}> = ({ children, className = '', hover = false }) => (
  <div className={`${hover ? 'gh-card' : 'rounded-2xl border border-[#E4E9E4] bg-white'} ${className}`}>
    {children}
  </div>
);

export const Chip: React.FC<{
  children: React.ReactNode;
  tone?: 'green' | 'amber' | 'red' | 'blue' | 'slate' | 'clay';
}> = ({ children, tone = 'green' }) => {
  const map = {
    green: 'bg-[#EAF5EC] text-[#1B5E36] border-[#CFE6D5]',
    amber: 'bg-[#FDF4E3] text-[#8A5D0A] border-[#F2DFB8]',
    red: 'bg-[#FCECEE] text-[#A31F2C] border-[#F3C7CD]',
    blue: 'bg-[#E6F1EA] text-[#1F6B43] border-[#C9E2D2]',
    slate: 'bg-[#F3EFE9] text-[#5C6B62] border-[#E4DECF]',
    clay: 'bg-[#F6E7DD] text-[#9A4F2C] border-[#EBD3C2]',
  } as const;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[11px] font-semibold ${map[tone]}`}
    >
      {children}
    </span>
  );
};
