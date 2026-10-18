import React, { useState } from 'react';
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Eye,
  EyeOff,
  KeyRound,
  Lock,
  Mail,
  Radar,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { useMicrogrid, DEMO_CREDENTIALS, NavigationPage } from '../context/MicrogridContext';
import { GridHealLogo } from '../home/Navbar';

const POINTS = [
  {
    icon: Radar,
    title: 'Detect',
    text: 'Fault and anomaly detection across solar, storage, load and grid assets.',
  },
  {
    icon: Zap,
    title: 'Reallocate',
    text: 'Battery dispatch and EV deferral coordinated automatically, in seconds.',
  },
  {
    icon: ShieldCheck,
    title: 'Verify',
    text: 'Every recovery action verified and written to the audit trail.',
  },
];

const PAGE_LABELS: Partial<Record<NavigationPage, string>> = {
  overview: 'the Recovery Lab overview',
  twin: 'the Microgrid Digital Twin',
  faults: 'the Fault Simulation Studio',
  prediction: 'the Prediction Centre',
  recovery: 'the Recovery Control Centre',
  benchmark: 'the Benchmark Centre',
  logs: 'Event & Audit Logs',
  settings: 'Settings',
  help: 'Help & Support',
};

// Natural renewable landscape (network-loaded; forest gradient base shows if unavailable).
const BRAND_PHOTO =
  'https://images.unsplash.com/photo-1466611653911-95081537e5b7?auto=format&fit=crop&w=1280&q=72';

export const LoginPage: React.FC = () => {
  const { signIn, requestPage, pendingPage } = useMicrogrid();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fillDemo = () => {
    setEmail(DEMO_CREDENTIALS.email);
    setPassword(DEMO_CREDENTIALS.password);
    setError('');
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (submitting) return;
    setError('');

    if (!email.trim() || !password) {
      setError('Enter both your email address and password.');
      return;
    }

    setSubmitting(true);
    // Small deliberate delay so the authenticated transition reads clearly.
    window.setTimeout(() => {
      const result = signIn(email, password);
      if (!result.ok) {
        setError(result.error ?? 'Unable to sign in. Please try again.');
        setSubmitting(false);
      }
    }, 420);
  };

  const targetLabel = pendingPage ? PAGE_LABELS[pendingPage] : undefined;

  return (
    <div className="relative min-h-screen bg-[#F7F5F0] lg:grid lg:grid-cols-[1.05fr_1fr]">
      <div className="gh-grain" aria-hidden="true" />
      {/* Brand panel */}
      <aside className="relative hidden overflow-hidden bg-[#103D2B] lg:flex lg:flex-col lg:justify-between lg:p-10 xl:p-14">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0">
          <div className="gh-photo h-full w-full" style={{ backgroundImage: `url('${BRAND_PHOTO}')` }} />
          <div
            className="absolute inset-0"
            style={{
              background:
                'linear-gradient(155deg, rgba(11,42,29,0.62) 0%, rgba(27,94,54,0.34) 45%, rgba(15,45,30,0.82) 100%)',
              mixBlendMode: 'multiply',
            }}
          />
          <div className="gh-aurora gh-aurora--slow opacity-50" />
        </div>

        <div className="relative flex items-center gap-2.5">
          <GridHealLogo tone="light" />
          <span className="text-[16px] font-bold tracking-[-0.01em] text-white">GridHeal</span>
          <span className="rounded-md border border-white/20 bg-white/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[#D7F0DD]">
            Recovery Lab
          </span>
        </div>

        <div className="relative max-w-[430px]">
          <h2 className="gh-display text-[32px] font-semibold leading-[1.1] tracking-[-0.02em] text-white xl:text-[40px]">
            The self-healing microgrid recovery lab.
          </h2>
          <p className="mt-4 text-[14px] leading-[1.75] text-[#CDE5D3]">
            A predictive digital twin that detects disruption, reallocates available resources
            automatically, and verifies recovery against a complete audit trail.
          </p>
          <ul className="mt-8 space-y-4">
            {POINTS.map((point, i) => (
              <li
                key={point.title}
                className="flex gap-3.5"
                style={{ opacity: 0, animation: `gh-rise 600ms cubic-bezier(.16,1,.3,1) ${i * 120 + 120}ms forwards` }}
              >
                <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/15 bg-white/10 text-[#9FE1CB]">
                  <point.icon className="h-4 w-4" />
                </span>
                <span className="min-w-0">
                  <span className="block text-[13.5px] font-semibold text-white">{point.title}</span>
                  <span className="mt-0.5 block text-[12.5px] leading-relaxed text-[#A9C9B4]">
                    {point.text}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className="relative">
          <div className="flex flex-wrap items-center gap-2">
            {['PS4 project', 'UN SDG 7 · Clean Energy', 'UN SDG 13 · Climate Action'].map((chip) => (
              <span
                key={chip}
                className="rounded-full border border-white/20 bg-white/10 px-2.5 py-1 text-[10.5px] font-semibold text-[#D7F0DD]"
              >
                {chip}
              </span>
            ))}
          </div>
          <p className="mt-3 text-[11px] leading-relaxed text-[#8FB79C]">
            Software-only demonstration. All telemetry, assets and recovery events are simulated.
          </p>
        </div>
      </aside>

      {/* Form panel */}
      <main className="flex min-h-screen flex-col px-5 py-7 sm:px-8">
        <div className="flex items-center justify-between">
          <button
            onClick={() => requestPage('home')}
            className="group inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-[13px] font-semibold text-[#4A5A52] transition-colors hover:bg-[#EFEFE8] hover:text-[#1B5E36]"
          >
            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
            Back to home
          </button>
          <div className="flex items-center gap-2 lg:hidden">
            <GridHealLogo size={28} />
            <span className="text-[14px] font-bold text-[#16241E]">GridHeal</span>
          </div>
        </div>

        <div className="flex flex-1 items-center justify-center py-10">
          <div className="w-full max-w-[408px]">
            <h1 className="gh-display text-[28px] font-semibold leading-[1.15] tracking-[-0.02em] text-[#16241E] sm:text-[33px]">
              Sign in to the Recovery Lab
            </h1>
            <p className="mt-2.5 text-[13.5px] leading-relaxed text-[#5B6B62]">
              Access the microgrid digital twin, fault simulation studio and verification dashboard.
            </p>

            {targetLabel && (
              <div className="mt-5 flex items-start gap-2 rounded-xl border border-[#CFE6D5] bg-[#EAF5EC] px-3.5 py-2.5 text-[12.5px] font-medium leading-relaxed text-[#1B5E36]">
                <KeyRound className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                <span>Sign in to continue to {targetLabel}.</span>
              </div>
            )}

            <form onSubmit={handleSubmit} noValidate className="mt-6 space-y-4">
              <div>
                <label htmlFor="login-email" className="block text-[12px] font-semibold text-[#324339]">
                  Work email
                </label>
                <div className="relative mt-1.5">
                  <Mail
                    aria-hidden="true"
                    className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8AA395]"
                  />
                  <input
                    id="login-email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(event) => {
                      setEmail(event.target.value);
                      if (error) setError('');
                    }}
                    placeholder="operator@gridheal.lab"
                    aria-invalid={Boolean(error)}
                    aria-describedby={error ? 'login-error' : undefined}
                    className="w-full rounded-xl border border-[#DDE4DE] bg-white py-2.5 pl-10 pr-3 text-sm text-[#16241E] placeholder-[#A7B2AB] transition-all duration-200 focus:border-[#3E984A] focus:bg-[#FBFEFB] focus:outline-none focus:ring-4 focus:ring-[#3E984A]/15"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <label htmlFor="login-password" className="block text-[12px] font-semibold text-[#324339]">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowPassword((value) => !value)}
                    className="rounded-md px-1.5 py-0.5 text-[11.5px] font-semibold text-[#1B5E36] transition-colors hover:bg-[#EAF5EC]"
                  >
                    {showPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
                <div className="relative mt-1.5">
                  <Lock
                    aria-hidden="true"
                    className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8AA395]"
                  />
                  <input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    value={password}
                    onChange={(event) => {
                      setPassword(event.target.value);
                      if (error) setError('');
                    }}
                    placeholder="Enter your password"
                    aria-invalid={Boolean(error)}
                    aria-describedby={error ? 'login-error' : undefined}
                    className="w-full rounded-xl border border-[#DDE4DE] bg-white py-2.5 pl-10 pr-11 text-sm text-[#16241E] placeholder-[#A7B2AB] transition-all duration-200 focus:border-[#3E984A] focus:bg-[#FBFEFB] focus:outline-none focus:ring-4 focus:ring-[#3E984A]/15"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((value) => !value)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-[#8AA395] transition-colors hover:bg-[#EFEFE8] hover:text-[#324339]"
                  >
                    {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between pt-0.5">
                <label className="flex items-center gap-2 text-[12px] font-medium text-[#4A5A52]">
                  <input
                    type="checkbox"
                    checked={remember}
                    onChange={(event) => setRemember(event.target.checked)}
                    className="h-3.5 w-3.5 rounded border-[#C9D3CC] text-[#1B5E36] focus:ring-[#3E984A]/40"
                  />
                  Remember this workspace
                </label>
                <button
                  type="button"
                  onClick={fillDemo}
                  className="rounded-md px-1.5 py-0.5 text-[12px] font-semibold text-[#1B5E36] transition-colors hover:bg-[#EAF5EC]"
                >
                  Use demo access
                </button>
              </div>

              {error && (
                <div
                  id="login-error"
                  role="alert"
                  className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-[12.5px] font-medium leading-relaxed text-rose-800"
                >
                  <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="gh-btn gh-btn-primary mt-1 w-full px-5 py-3 text-sm"
              >
                {submitting ? (
                  <>
                    <span
                      aria-hidden="true"
                      className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white"
                    />
                    Signing in...
                  </>
                ) : (
                  <>
                    Sign in
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-7 rounded-2xl border border-[#D8E7DC] bg-[#F4FAF5] p-4">
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-md bg-[#EAF5EC] text-[#1B5E36]">
                  <KeyRound className="h-3.5 w-3.5" />
                </span>
                <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#1B5E36]">
                  Demo workspace
                </span>
              </div>
              <p className="mt-2 text-[12px] leading-relaxed text-[#4A5A52]">
                GridHeal runs entirely in the browser with simulated telemetry. Sign in with these mock
                credentials — no account is created and nothing leaves your device.
              </p>
              <div className="mt-3 space-y-2">
                <div className="flex items-center justify-between gap-3 rounded-xl border border-[#DCEADF] bg-white px-3 py-2">
                  <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#8AA395]">
                    Email
                  </span>
                  <code className="font-mono text-[12px] font-semibold text-[#16241E]">
                    {DEMO_CREDENTIALS.email}
                  </code>
                </div>
                <div className="flex items-center justify-between gap-3 rounded-xl border border-[#DCEADF] bg-white px-3 py-2">
                  <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#8AA395]">
                    Password
                  </span>
                  <code className="font-mono text-[12px] font-semibold text-[#16241E]">
                    {DEMO_CREDENTIALS.password}
                  </code>
                </div>
              </div>
              <button
                type="button"
                onClick={fillDemo}
                className="gh-btn gh-btn-secondary mt-3 w-full px-4 py-2.5 text-[12.5px]"
              >
                Autofill demo credentials
              </button>
            </div>
          </div>
        </div>

        <footer className="text-center text-[11px] text-[#8AA395]">
          Simulated demonstration data · Software-only prototype
        </footer>
      </main>
    </div>
  );
};
