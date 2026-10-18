import React, { useState } from 'react';
import { TrendingUp, Layers, Target } from 'lucide-react';
import { PanelCard, SelectField, SliderRow, CheckboxRow } from './SettingsControls';

const FEATURES = [
  'Solar irradiance (GHI)',
  'Ambient temperature',
  'Historical load profile',
  'Numerical weather forecast',
  'Calendar & holiday effects',
  'EV arrival schedule',
];

export const ForecastingSettingsPanel: React.FC = () => {
  const [horizon, setHorizon] = useState('7 days');
  const [interval, setInterval] = useState('1 hour');
  const [model, setModel] = useState('Hybrid (Time Series + ML)');
  const [confidence, setConfidence] = useState(90);
  const [retrain, setRetrain] = useState('Weekly');
  const [seasonality, setSeasonality] = useState('Daily + Weekly');

  const [features, setFeatures] = useState<Record<string, boolean>>(
    FEATURES.reduce((acc, feature) => ({ ...acc, [feature]: true }), {})
  );

  const activeFeatures = Object.values(features).filter(Boolean).length;

  const accuracy = [
    { metric: 'MAE', current: 4.2, target: 5.0, unit: '%' },
    { metric: 'RMSE', current: 7.9, target: 9.0, unit: '%' },
    { metric: 'MAPE', current: 4.8, target: 6.0, unit: '%' },
    { metric: 'Coverage', current: 94, target: 90, unit: '%' },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <PanelCard title="Model Configuration" icon={TrendingUp}>
          <div className="grid grid-cols-1 gap-3 text-xs sm:grid-cols-2">
            <SelectField
              label="Forecast Horizon"
              value={horizon}
              onChange={setHorizon}
              options={['24 hours', '7 days', '14 days', '30 days']}
            />
            <SelectField
              label="Prediction Interval"
              value={interval}
              onChange={setInterval}
              options={['15 minutes', '1 hour', '4 hours', '1 day']}
            />
            <SelectField
              label="Model Type"
              value={model}
              onChange={setModel}
              options={[
                'Hybrid (Time Series + ML)',
                'Deep LSTM',
                'ARIMA Baseline',
                'Physics-informed',
              ]}
            />
            <SelectField
              label="Retrain Cadence"
              value={retrain}
              onChange={setRetrain}
              options={['Daily', 'Weekly', 'Monthly', 'Manual']}
            />
            <SelectField
              label="Seasonality"
              value={seasonality}
              onChange={setSeasonality}
              options={['Daily only', 'Daily + Weekly', 'Daily + Weekly + Seasonal']}
            />
            <div className="pt-1">
              <SliderRow
                label="Confidence level"
                value={confidence}
                min={50}
                max={99}
                step={1}
                suffix=" %"
                onChange={setConfidence}
              />
            </div>
          </div>
        </PanelCard>

        <PanelCard title="Input Features" icon={Layers}>
          <div className="flex items-center justify-between pb-2 text-[11px]">
            <span className="text-slate-500">Features fed into the model</span>
            <span className="rounded-md bg-emerald-50 px-2 py-0.5 font-bold text-emerald-700">
              {activeFeatures} / {FEATURES.length} active
            </span>
          </div>
          <div className="divide-y divide-slate-100">
            {FEATURES.map((feature) => (
              <CheckboxRow
                key={feature}
                label={feature}
                checked={features[feature]}
                onChange={(checked) => setFeatures((prev) => ({ ...prev, [feature]: checked }))}
              />
            ))}
          </div>
          <div className="mt-3 rounded-xl bg-slate-50 p-2.5 text-[10px] leading-snug text-slate-500">
            Disabling a feature reduces compute cost but typically widens the forecast confidence
            band. {activeFeatures === 0 && 'At least one feature is required to run a forecast.'}
          </div>
        </PanelCard>
      </div>

      <PanelCard title="Accuracy Targets" icon={Target}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {accuracy.map((item) => {
            const onTarget = item.metric === 'Coverage' ? item.current >= item.target : item.current <= item.target;
            const ratio = Math.min(100, (item.current / item.target) * 100);
            return (
              <div key={item.metric} className="rounded-xl border border-slate-100 bg-slate-50/60 p-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-semibold text-slate-500">{item.metric}</span>
                  <span
                    className={`rounded-md px-1.5 py-0.5 text-[9px] font-bold ${
                      onTarget ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                    }`}
                  >
                    {onTarget ? 'On target' : 'Off target'}
                  </span>
                </div>
                <div className="mt-1 font-mono text-lg font-bold text-slate-900">
                  {item.current}
                  {item.unit}
                </div>
                <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
                  <div
                    className={`h-full rounded-full ${onTarget ? 'bg-emerald-500' : 'bg-amber-500'}`}
                    style={{ width: `${ratio}%` }}
                  />
                </div>
                <div className="mt-1 text-[10px] text-slate-400">
                  Target {item.metric === 'Coverage' ? '≥' : '≤'} {item.target}
                  {item.unit}
                </div>
              </div>
            );
          })}
        </div>
      </PanelCard>
    </div>
  );
};
