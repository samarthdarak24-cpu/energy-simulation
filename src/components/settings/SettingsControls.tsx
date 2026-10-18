import React from 'react';
import { ChevronDown } from 'lucide-react';

export const fieldInput =
  'w-full rounded-lg border border-slate-200 p-1.5 font-mono text-xs text-slate-800 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500';

export const fieldSelect =
  'w-full appearance-none rounded-lg border border-slate-200 bg-white p-1.5 pr-7 text-xs text-slate-800 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500';

export const PanelCard: React.FC<{
  title: string;
  icon?: React.ElementType;
  children: React.ReactNode;
  className?: string;
}> = ({ title, icon: Icon, children, className = '' }) => (
  <div className={`rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs ${className}`}>
    <div className="mb-3 flex items-center gap-2">
      {Icon && <Icon className="h-4 w-4 text-emerald-600" />}
      <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900">{title}</h2>
    </div>
    {children}
  </div>
);

export const Field: React.FC<{
  label: string;
  hint?: string;
  children: React.ReactNode;
}> = ({ label, hint, children }) => (
  <div>
    <label className="mb-0.5 block text-[10px] font-semibold text-slate-500">{label}</label>
    {children}
    {hint && <span className="mt-0.5 block text-[10px] text-slate-400">{hint}</span>}
  </div>
);

export const SelectField: React.FC<{
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
  hint?: string;
}> = ({ label, value, options, onChange, hint }) => (
  <Field label={label} hint={hint}>
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={fieldSelect}
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
    </div>
  </Field>
);

export const TextField: React.FC<{
  label: string;
  value: string;
  onChange: (value: string) => void;
  hint?: string;
  mono?: boolean;
}> = ({ label, value, onChange, hint, mono = true }) => (
  <Field label={label} hint={hint}>
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`w-full rounded-lg border border-slate-200 p-1.5 text-xs text-slate-800 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 ${
        mono ? 'font-mono' : ''
      }`}
    />
  </Field>
);

export const ToggleRow: React.FC<{
  label: string;
  description?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}> = ({ label, description, checked, onChange }) => (
  <div className="flex items-start justify-between gap-3 py-2">
    <div className="min-w-0">
      <div className="text-[11px] font-semibold text-slate-800">{label}</div>
      {description && <div className="mt-0.5 text-[10px] leading-tight text-slate-400">{description}</div>}
    </div>
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`relative mt-0.5 h-5 w-9 shrink-0 rounded-full transition-colors ${
        checked ? 'bg-emerald-600' : 'bg-slate-300'
      }`}
    >
      <span
        className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-all ${
          checked ? 'left-4.5' : 'left-0.5'
        }`}
      />
    </button>
  </div>
);

export const SliderRow: React.FC<{
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  suffix?: string;
  onChange: (value: number) => void;
}> = ({ label, value, min, max, step, suffix = '', onChange }) => (
  <div>
    <div className="mb-1 flex items-center justify-between text-[11px]">
      <span className="text-slate-600">{label}</span>
      <span className="font-mono font-bold text-slate-900">
        {value}
        {suffix}
      </span>
    </div>
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      className="w-full accent-emerald-600"
      aria-label={label}
    />
  </div>
);

export const CheckboxRow: React.FC<{
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}> = ({ label, checked, onChange }) => (
  <label className="flex cursor-pointer items-center gap-2 py-1 text-[11px] text-slate-700">
    <input
      type="checkbox"
      checked={checked}
      onChange={(e) => onChange(e.target.checked)}
      className="rounded accent-emerald-600"
    />
    <span>{label}</span>
  </label>
);
