import React, { useState } from 'react';
import { Sliders, ShieldCheck, Gauge } from 'lucide-react';
import { PanelCard, SelectField, ToggleRow, SliderRow } from './SettingsControls';

export const ControlOptimizationPanel: React.FC = () => {
  const [weightCost, setWeightCost] = useState(0.4);
  const [weightEmissions, setWeightEmissions] = useState(0.3);
  const [weightReliability, setWeightReliability] = useState(0.3);

  const [autoRecovery, setAutoRecovery] = useState(true);
  const [allowIslanding, setAllowIslanding] = useState(true);
  const [recoveryWindow, setRecoveryWindow] = useState(15);
  const [batteryCycleLimit, setBatteryCycleLimit] = useState(2);
  const [evPolicy, setEvPolicy] = useState('Defer non-urgent charging');
  const [criticalPriority, setCriticalPriority] = useState('Absolute (never shed)');

  const [voltageTolerance, setVoltageTolerance] = useState(5);
  const [frequencyTolerance, setFrequencyTolerance] = useState(0.5);
  const [socGuard, setSocGuard] = useState(20);

  const sum = weightCost + weightEmissions + weightReliability || 1;
  const pct = (value: number) => Math.round((value / sum) * 100);

  const segments = [
    { label: 'Cost', value: weightCost, color: '#3B82F6' },
    { label: 'Emissions', value: weightEmissions, color: '#10B981' },
    { label: 'Reliability', value: weightReliability, color: '#F59E0B' },
  ];

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <PanelCard title="Objective Weights" icon={Sliders}>
        <div className="space-y-4 text-xs">
          <SliderRow
            label="Cost"
            value={weightCost}
            min={0}
            max={1}
            step={0.05}
            onChange={setWeightCost}
          />
          <SliderRow
            label="Emissions"
            value={weightEmissions}
            min={0}
            max={1}
            step={0.05}
            onChange={setWeightEmissions}
          />
          <SliderRow
            label="Reliability"
            value={weightReliability}
            min={0}
            max={1}
            step={0.05}
            onChange={setWeightReliability}
          />

          <div className="pt-2">
            <div className="mb-1 flex justify-between text-[10px] text-slate-400">
              <span>Normalised objective</span>
              <span className="font-mono">{sum.toFixed(2)} total</span>
            </div>
            <div className="flex h-3 w-full overflow-hidden rounded-full bg-slate-100">
              {segments.map((segment) => (
                <div
                  key={segment.label}
                  style={{ width: `${pct(segment.value)}%`, backgroundColor: segment.color }}
                  title={`${segment.label} ${pct(segment.value)}%`}
                />
              ))}
            </div>
            <div className="mt-2 space-y-1 font-mono text-[10px] text-slate-600">
              {segments.map((segment) => (
                <div key={segment.label} className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{ backgroundColor: segment.color }}
                    />
                    <span className="font-sans">{segment.label}</span>
                  </span>
                  <span>{pct(segment.value)}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </PanelCard>

      <PanelCard title="Recovery Policy" icon={ShieldCheck}>
        <div className="divide-y divide-slate-100 text-xs">
          <ToggleRow
            label="Autonomous recovery"
            description="Let the controller act without operator approval"
            checked={autoRecovery}
            onChange={setAutoRecovery}
          />
          <ToggleRow
            label="Permit islanding"
            description="Allow intentional disconnection from the utility grid"
            checked={allowIslanding}
            onChange={setAllowIslanding}
          />
          <div className="pt-3">
            <SliderRow
              label="Recovery window"
              value={recoveryWindow}
              min={5}
              max={60}
              step={5}
              suffix=" min"
              onChange={setRecoveryWindow}
            />
          </div>
          <div className="pt-3">
            <SliderRow
              label="Battery cycle limit / day"
              value={batteryCycleLimit}
              min={1}
              max={6}
              step={1}
              onChange={setBatteryCycleLimit}
            />
          </div>
          <div className="pt-3">
            <SelectField
              label="EV deferral policy"
              value={evPolicy}
              onChange={setEvPolicy}
              options={[
                'Defer non-urgent charging',
                'Defer all charging',
                'Never defer charging',
                'Vehicle-to-grid enabled',
              ]}
            />
          </div>
          <div className="pt-3">
            <SelectField
              label="Critical load priority"
              value={criticalPriority}
              onChange={setCriticalPriority}
              options={[
                'Absolute (never shed)',
                'High (shed after reserve)',
                'Weighted by penalty',
              ]}
            />
          </div>
        </div>
      </PanelCard>

      <PanelCard title="Constraint Thresholds" icon={Gauge}>
        <div className="space-y-4 text-xs">
          <SliderRow
            label="Voltage tolerance"
            value={voltageTolerance}
            min={1}
            max={10}
            step={1}
            suffix=" %"
            onChange={setVoltageTolerance}
          />
          <SliderRow
            label="Frequency tolerance"
            value={frequencyTolerance}
            min={0.1}
            max={2}
            step={0.1}
            suffix=" Hz"
            onChange={setFrequencyTolerance}
          />
          <SliderRow
            label="Minimum SoC guard"
            value={socGuard}
            min={5}
            max={50}
            step={5}
            suffix=" %"
            onChange={setSocGuard}
          />

          <div className="rounded-xl border border-emerald-100 bg-emerald-50/50 p-2.5">
            <span className="block text-[10px] font-bold text-emerald-950">Active envelope</span>
            <p className="mt-1 text-[11px] leading-snug text-slate-600">
              {voltageTolerance}% voltage band, ±{frequencyTolerance} Hz, SoC floor at {socGuard}%.
              Actions breaching any limit are rejected by the verifier.
            </p>
          </div>
        </div>
      </PanelCard>
    </div>
  );
};
