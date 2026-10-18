import React, { useState } from 'react';
import { Clock, Sliders, Gauge } from 'lucide-react';
import {
  PanelCard,
  SelectField,
  TextField,
  ToggleRow,
  SliderRow,
  Field,
  fieldInput,
} from './SettingsControls';

const DURATION_HOURS: Record<string, number> = {
  '24 hours': 24,
  '48 hours': 48,
  '72 hours': 72,
  '7 days': 168,
};

const STEP_MINUTES: Record<string, number> = {
  '5 minutes': 5,
  '15 minutes': 15,
  '30 minutes': 30,
  '60 minutes': 60,
};

export const SimulationSettingsPanel: React.FC = () => {
  const [timeStep, setTimeStep] = useState('15 minutes');
  const [duration, setDuration] = useState('24 hours');
  const [startAt, setStartAt] = useState('May 4, 2025 12:00 AM');
  const [weather, setWeather] = useState('Mixed (Realistic)');
  const [unitSystem, setUnitSystem] = useState('Metric (kW, kWh, °C)');
  const [randomSeed, setRandomSeed] = useState(42);

  const [realTimeSync, setRealTimeSync] = useState(true);
  const [autoRun, setAutoRun] = useState(false);
  const [maxIterations, setMaxIterations] = useState(500);
  const [solverTolerance, setSolverTolerance] = useState(0.001);
  const [logVerbosity, setLogVerbosity] = useState('Standard');

  const totalHours = DURATION_HOURS[duration] ?? 24;
  const stepMinutes = STEP_MINUTES[timeStep] ?? 15;
  const intervals = Math.round((totalHours * 60) / stepMinutes);
  const ticks = Math.min(48, intervals);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <PanelCard title="Simulation Timeline" icon={Clock}>
          <div className="grid grid-cols-1 gap-3 text-xs sm:grid-cols-2">
            <SelectField
              label="Time Step"
              value={timeStep}
              onChange={setTimeStep}
              options={Object.keys(STEP_MINUTES)}
              hint="Resolution of each solver interval"
            />
            <SelectField
              label="Simulation Duration"
              value={duration}
              onChange={setDuration}
              options={Object.keys(DURATION_HOURS)}
              hint="Total horizon to simulate"
            />
            <TextField label="Start Date & Time" value={startAt} onChange={setStartAt} />
            <SelectField
              label="Weather Scenario"
              value={weather}
              onChange={setWeather}
              options={['Mixed (Realistic)', 'Clear Sky', 'Overcast', 'Storm Front']}
            />
            <SelectField
              label="Unit System"
              value={unitSystem}
              onChange={setUnitSystem}
              options={['Metric (kW, kWh, °C)', 'Imperial (BTU, °F)']}
            />
            <Field label="Random Seed" hint="Reproducible stochastic weather">
              <input
                type="number"
                value={randomSeed}
                onChange={(e) => setRandomSeed(Number(e.target.value))}
                className={fieldInput}
              />
            </Field>
          </div>
        </PanelCard>

        <PanelCard title="Execution & Performance" icon={Gauge}>
          <div className="divide-y divide-slate-100">
            <ToggleRow
              label="Real-time synchronisation"
              description="Stream telemetry at wall-clock speed instead of instant solve"
              checked={realTimeSync}
              onChange={setRealTimeSync}
            />
            <ToggleRow
              label="Auto-run on load"
              description="Start the simulation as soon as the workspace opens"
              checked={autoRun}
              onChange={setAutoRun}
            />
            <div className="pt-3">
              <SliderRow
                label="Max solver iterations"
                value={maxIterations}
                min={100}
                max={2000}
                step={100}
                onChange={setMaxIterations}
              />
            </div>
            <div className="pt-3">
              <SliderRow
                label="Solver tolerance"
                value={solverTolerance}
                min={0.0001}
                max={0.01}
                step={0.0001}
                onChange={setSolverTolerance}
              />
            </div>
            <div className="pt-3">
              <SelectField
                label="Log Verbosity"
                value={logVerbosity}
                onChange={setLogVerbosity}
                options={['Minimal', 'Standard', 'Verbose', 'Debug']}
              />
            </div>
          </div>
        </PanelCard>
      </div>

      <PanelCard title="Simulation Timeline Preview" icon={Sliders}>
        <div className="flex flex-wrap items-end justify-between gap-3 pb-2">
          <div className="flex gap-6 text-xs">
            <div>
              <div className="text-[10px] text-slate-400">Intervals</div>
              <div className="font-mono font-bold text-slate-900">{intervals.toLocaleString()}</div>
            </div>
            <div>
              <div className="text-[10px] text-slate-400">Step</div>
              <div className="font-mono font-bold text-slate-900">{stepMinutes} min</div>
            </div>
            <div>
              <div className="text-[10px] text-slate-400">Horizon</div>
              <div className="font-mono font-bold text-slate-900">{totalHours} h</div>
            </div>
            <div>
              <div className="text-[10px] text-slate-400">Seed</div>
              <div className="font-mono font-bold text-slate-900">{randomSeed}</div>
            </div>
          </div>
          <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
            {weather}
          </span>
        </div>

        <div className="flex h-16 items-end gap-0.5 rounded-lg border border-slate-100 bg-slate-50/60 p-2">
          {Array.from({ length: ticks }).map((_, i) => {
            const phase = Math.sin((i / Math.max(ticks - 1, 1)) * Math.PI);
            return (
              <div
                key={i}
                className="flex-1 rounded-t-sm bg-emerald-500"
                style={{ height: `${30 + phase * 65}%`, opacity: 0.45 + phase * 0.5 }}
                title={`Interval ${i + 1}`}
              />
            );
          })}
        </div>
        <div className="mt-1 flex justify-between font-mono text-[8px] text-slate-400">
          <span>Start</span>
          <span>{startAt}</span>
          <span>End</span>
        </div>
      </PanelCard>
    </div>
  );
};
