import React, { useEffect, useState } from 'react';
import { Menu, X, ArrowRight, LogOut } from 'lucide-react';
import { useGo, C } from './ui';
import { useMicrogrid } from '../context/MicrogridContext';

const NAV_LINKS = [
  { label: 'Platform', href: '#platform' },
  { label: 'How It Works', href: '#how-it-works' },
  { label: 'Features', href: '#features' },
  { label: 'Technology', href: '#technology' },
  { label: 'Impact', href: '#impact' },
];

export const GridHealLogo: React.FC<{ size?: number; tone?: 'dark' | 'light' }> = ({
  size = 34,
  tone = 'dark',
}) => (
  <svg width={size} height={size} viewBox="0 0 40 40" fill="none" aria-hidden="true">
    <rect width="40" height="40" rx="11" fill={tone === 'dark' ? C.soft : 'rgba(255,255,255,0.14)'} />
    <path
      d="M20 9.5a10.5 10.5 0 0 1 10.5 10.5c0 4-2.3 7.6-5.8 9.4l-4.7 3.3v-8.1h-2.4A10.5 10.5 0 0 1 9.5 20"
      stroke={tone === 'dark' ? C.forest : '#EAF5EC'}
      strokeWidth="2.1"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M21.4 10.5 17 21.2h4.4L19.2 29"
      stroke={tone === 'dark' ? C.brand : '#9FE1CB'}
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <circle cx="29.4" cy="12.2" r="2.1" fill={tone === 'dark' ? C.brand : '#9FE1CB'} />
  </svg>
);

export const Navbar: React.FC = () => {
  const go = useGo();
  const { currentUser, signOut } = useMicrogrid();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  const signedIn = Boolean(currentUser);
  const handleSignOut = () => {
    setOpen(false);
    signOut();
  };

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'border-b border-[#E4E9E4] bg-white/95 backdrop-blur-md shadow-[0_6px_24px_-18px_rgba(16,61,43,0.45)]'
          : 'border-b border-transparent bg-transparent'
      }`}
    >
      <div className="mx-auto flex h-16 w-full max-w-[1240px] items-center justify-between px-5 sm:px-6">
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="flex items-center gap-2.5"
          aria-label="GridHeal home"
        >
          <GridHealLogo />
          <span className="text-[17px] font-bold tracking-[-0.01em] text-[#172535]">
            GridHeal
          </span>
          <span className="hidden rounded-md border border-[#CFE6D5] bg-[#EAF5EC] px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[#1B5E36] sm:inline">
            Recovery Lab
          </span>
        </button>

        <nav className="hidden items-center gap-7 lg:flex" aria-label="Primary">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-[13px] font-medium text-[#4A5A52] transition-colors hover:text-[#1B5E36]"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          <button
            onClick={() => go('help')}
            className="text-[13px] font-medium text-[#4A5A52] transition-colors hover:text-[#1B5E36]"
          >
            Documentation
          </button>
          {signedIn ? (
            <button
              onClick={handleSignOut}
              className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-[13px] font-semibold text-[#9B2C2C] transition-colors hover:bg-[#FDF2F2]"
            >
              <LogOut className="h-3.5 w-3.5" />
              Sign Out
            </button>
          ) : (
            <button
              onClick={() => go('login')}
              className="rounded-lg px-3 py-2 text-[13px] font-semibold text-[#172535] transition-colors hover:bg-[#F3EFE9]"
            >
              Sign In
            </button>
          )}
          <button
            onClick={() => go('overview')}
            className="group inline-flex items-center gap-1.5 rounded-lg bg-[#1B5E36] px-4 py-2.5 text-[13px] font-semibold text-white transition-all hover:bg-[#103D2B] hover:-translate-y-0.5"
          >
            {signedIn ? 'Open Recovery Lab' : 'Launch Recovery Lab'}
            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
          </button>
        </div>

        <button
          onClick={() => setOpen(true)}
          className="rounded-lg border border-[#E4E9E4] bg-white p-2 text-[#172535] lg:hidden"
          aria-label="Open menu"
          aria-expanded={open}
        >
          <Menu className="h-5 w-5" />
        </button>
      </div>

      {/* Mobile drawer */}
      <div
        className={`fixed inset-0 z-50 lg:hidden ${open ? 'pointer-events-auto' : 'pointer-events-none'}`}
        aria-hidden={!open}
      >
        <div
          onClick={() => setOpen(false)}
          className={`absolute inset-0 bg-[#103D2B]/30 transition-opacity duration-300 ${
            open ? 'opacity-100' : 'opacity-0'
          }`}
        />
        <div
          className={`absolute right-0 top-0 flex h-full w-[86%] max-w-sm flex-col bg-white transition-transform duration-300 ${
            open ? 'translate-x-0' : 'translate-x-full'
          }`}
        >
          <div className="flex h-16 items-center justify-between border-b border-[#E4E9E4] px-5">
            <div className="flex items-center gap-2">
              <GridHealLogo size={28} />
              <span className="text-[15px] font-bold text-[#172535]">GridHeal</span>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="rounded-lg border border-[#E4E9E4] p-2 text-[#172535]"
              aria-label="Close menu"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <nav className="flex-1 space-y-1 overflow-y-auto p-4" aria-label="Mobile">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="block rounded-lg px-3 py-3 text-sm font-medium text-[#324339] hover:bg-[#F7F5F0]"
              >
                {link.label}
              </a>
            ))}
            <button
              onClick={() => {
                setOpen(false);
                go('help');
              }}
              className="block w-full rounded-lg px-3 py-3 text-left text-sm font-medium text-[#324339] hover:bg-[#F7F5F0]"
            >
              Documentation
            </button>
          </nav>

          <div className="space-y-2 border-t border-[#E4E9E4] p-4">
            {signedIn && (
              <p className="px-1 pb-1 text-[11px] text-[#7A8794]">
                Signed in as {currentUser?.email}
              </p>
            )}
            <button
              onClick={() => {
                setOpen(false);
                if (signedIn) {
                  signOut();
                } else {
                  go('login');
                }
              }}
              className={`w-full rounded-lg border px-4 py-2.5 text-sm font-semibold ${
                signedIn
                  ? 'border-[#F3C6C6] bg-[#FDF2F2] text-[#9B2C2C]'
                  : 'border-[#E4E9E4] text-[#172535]'
              }`}
            >
              {signedIn ? 'Sign Out' : 'Sign In'}
            </button>
            <button
              onClick={() => {
                setOpen(false);
                go('overview');
              }}
              className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-[#1B5E36] px-4 py-2.5 text-sm font-semibold text-white"
            >
              {signedIn ? 'Open Recovery Lab' : 'Launch Recovery Lab'}
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
