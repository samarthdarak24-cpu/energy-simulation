import React, { useState } from 'react';
import { Building2, Bell, Database, KeyRound, Eye, EyeOff, Download, Check } from 'lucide-react';
import { PanelCard, TextField, SelectField, ToggleRow, SliderRow, Field, fieldInput } from './SettingsControls';
import { useMicrogrid } from '../../context/MicrogridContext';

export const SystemSettingsPanel: React.FC = () => {
  const { exportAuditCsv } = useMicrogrid();

  const [workspace, setWorkspace] = useState('GridHeal Research Lab');
  const [operator, setOperator] = useState('Samarth Darak');
  const [timezone, setTimezone] = useState('Asia/Kolkata (GMT+5:30)');
  const [currency, setCurrency] = useState('INR (₹)');
  const [locale, setLocale] = useState('English (India)');

  const [emailAlerts, setEmailAlerts] = useState(true);
  const [criticalOnly, setCriticalOnly] = useState(false);
  const [dailyDigest, setDailyDigest] = useState(true);

  const [retention, setRetention] = useState(90);
  const [apiVisible, setApiVisible] = useState(false);
  const [environment, setEnvironment] = useState('Production');
  const [copied, setCopied] = useState(false);

  const apiKey = 'gh_live_7f3a91c4d8e24b6a9f0c5e1d';
  const maskedKey = `${apiKey.slice(0, 8)}${'•'.repeat(12)}${apiKey.slice(-4)}`;

  const copyKey = async () => {
    try {
      await navigator.clipboard.writeText(apiKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <PanelCard title="Organisation" icon={Building2}>
        <div className="grid grid-cols-1 gap-3 text-xs sm:grid-cols-2">
          <TextField label="Workspace Name" value={workspace} onChange={setWorkspace} mono={false} />
          <TextField label="Primary Operator" value={operator} onChange={setOperator} mono={false} />
          <SelectField
            label="Timezone"
            value={timezone}
            onChange={setTimezone}
            options={['Asia/Kolkata (GMT+5:30)', 'UTC', 'Europe/London (GMT+0)', 'America/New_York (GMT-5)']}
          />
          <SelectField
            label="Currency"
            value={currency}
            onChange={setCurrency}
            options={['INR (₹)', 'USD ($)', 'EUR (€)', 'GBP (£)']}
          />
          <SelectField
            label="Locale"
            value={locale}
            onChange={setLocale}
            options={['English (India)', 'English (US)', 'English (UK)']}
          />
          <SelectField
            label="Environment"
            value={environment}
            onChange={setEnvironment}
            options={['Production', 'Staging', 'Sandbox']}
          />
        </div>
      </PanelCard>

      <PanelCard title="Notifications" icon={Bell}>
        <div className="divide-y divide-slate-100 text-xs">
          <ToggleRow
            label="Email alerts"
            description="Send fault and recovery notifications to the operator inbox"
            checked={emailAlerts}
            onChange={setEmailAlerts}
          />
          <ToggleRow
            label="Critical events only"
            description="Suppress medium and low severity notifications"
            checked={criticalOnly}
            onChange={setCriticalOnly}
          />
          <ToggleRow
            label="Daily digest"
            description="Summarise the previous 24 hours at 08:00 local time"
            checked={dailyDigest}
            onChange={setDailyDigest}
          />
        </div>
        <div className="mt-3 rounded-xl bg-slate-50 p-2.5 text-[10px] leading-snug text-slate-500">
          {emailAlerts
            ? criticalOnly
              ? 'Only critical events will be emailed.'
              : 'All severity levels will be emailed.'
            : 'Email delivery is disabled. Notifications stay in-app.'}
        </div>
      </PanelCard>

      <PanelCard title="Data & Storage" icon={Database}>
        <div className="space-y-4 text-xs">
          <SliderRow
            label="Audit log retention"
            value={retention}
            min={7}
            max={365}
            step={7}
            suffix=" days"
            onChange={setRetention}
          />
          <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-2.5">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-600">Telemetry store</span>
              <span className="font-mono font-bold text-slate-900">128 events · 4.2 MB</span>
            </div>
            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
              <div className="h-full w-1/3 rounded-full bg-emerald-500" />
            </div>
            <div className="mt-1 text-[10px] text-slate-400">
              Records older than {retention} days are purged automatically.
            </div>
          </div>
          <button
            onClick={exportAuditCsv}
            className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-slate-200 py-2 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50"
          >
            <Download className="h-3.5 w-3.5 text-slate-500" />
            <span>Export All Data (CSV)</span>
          </button>
        </div>
      </PanelCard>

      <PanelCard title="API Access" icon={KeyRound}>
        <div className="space-y-3 text-xs">
          <Field label="API Key" hint="Used by the Python + SQLite integration layer">
            <div className="flex items-center gap-1.5">
              <input
                type="text"
                readOnly
                value={apiVisible ? apiKey : maskedKey}
                className={`${fieldInput} flex-1`}
              />
              <button
                onClick={() => setApiVisible((prev) => !prev)}
                title={apiVisible ? 'Hide key' : 'Reveal key'}
                className="rounded-lg border border-slate-200 p-1.5 text-slate-500 hover:bg-slate-50"
              >
                {apiVisible ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
              </button>
              <button
                onClick={copyKey}
                title="Copy key"
                className="rounded-lg border border-slate-200 p-1.5 text-slate-500 hover:bg-slate-50"
              >
                {copied ? (
                  <Check className="h-3.5 w-3.5 text-emerald-600" />
                ) : (
                  <Download className="h-3.5 w-3.5 rotate-180" />
                )}
              </button>
            </div>
          </Field>

          <div className="rounded-xl border border-amber-100 bg-amber-50/50 p-2.5 text-[10px] leading-snug text-amber-900">
            Rotating the key invalidates any running integration. Store it in the Secrets panel, never
            in source control.
          </div>

          <div className="flex items-center justify-between rounded-xl bg-slate-50 p-2.5 text-[11px]">
            <span className="text-slate-600">Rate limit</span>
            <span className="font-mono font-bold text-slate-900">600 req / min</span>
          </div>
        </div>
      </PanelCard>
    </div>
  );
};
