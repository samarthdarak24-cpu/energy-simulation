import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  CloudSun,
  Sun,
  CloudRain,
  Wind,
  Thermometer,
  Eye,
  AlertTriangle,
  Play,
  RotateCcw,
  Sliders,
  Search,
  Key,
  ExternalLink,
  ShieldAlert,
  ShieldCheck,
  Zap,
  Activity,
  ArrowRight,
  TrendingDown,
  Info,
  CheckCircle2,
  RefreshCw,
  Globe,
  MapPin,
  Sparkles,
} from 'lucide-react';
import { useMicrogrid } from '../context/MicrogridContext';

interface PresetLocation {
  id: string;
  name: string;
  state: string;
  country: string;
  flag: string;
  lat: number;
  lon: number;
  query: string;
  climate: string;
  baseTempC: number;
  baseCloud: number;
  baseUv: number;
  baseGhi: number;
}

interface TriggeredAlert {
  type: string;
  severity: string;
  title: string;
  message: string;
  deficitKw: number;
}

interface SolarImpact {
  cloudPercent: number;
  ambientTempC: number;
  cellTempC: number;
  uvIndex: number;
  humidity: number;
  ghi: number;
  clearSkyGhi: number;
  nominalGenerationKw: number;
  actualGenerationKw: number;
  generationLossPercent: number;
  cloudLossKw: number;
  thermalLossKw: number;
  baselineDemandKw: number;
  netBalanceKw: number;
  powerDeficitKw: number;
  bufferBatteryKwh: number;
  status: string;
  statusColor: string;
  primarySeverity: string;
  isThresholdBreached: boolean;
  triggeredAlerts: TriggeredAlert[];
  equivalentFaultSeverity: number;
  calculatedAt: string;
}

interface WeatherResponse {
  source: string;
  isLive: boolean;
  location: {
    name: string;
    region?: string;
    country?: string;
    flag?: string;
    climate?: string;
    lat: number;
    lon: number;
    localtime: string;
  };
  weather: {
    tempC: number;
    tempF: number;
    cloud: number;
    naturalCloud: number;
    isCloudOverridden: boolean;
    uv: number;
    humidity: number;
    windKph: number;
    condition: string;
    conditionIcon: string;
  };
  solarImpact: SolarImpact;
}

interface PresetStatusItem {
  id: string;
  name: string;
  state: string;
  country: string;
  flag: string;
  climate: string;
  cloudPercent: number;
  tempC: number;
  uvIndex: number;
  ghi: number;
  actualGenerationKw: number;
  generationLossPercent: number;
  netBalanceKw: number;
  status: string;
  statusColor: string;
}

export const DEFAULT_PRESETS: PresetLocation[] = [
  {
    id: 'in_jodhpur',
    name: 'Jodhpur (Bhadla Solar Hub)',
    state: 'Rajasthan',
    country: 'India',
    flag: '🇮🇳',
    lat: 27.53,
    lon: 71.91,
    query: 'Jodhpur,Rajasthan,India',
    climate: 'Arid Desert (High DNI)',
    baseTempC: 35.2,
    baseCloud: 8,
    baseUv: 9.4,
    baseGhi: 980,
  },
  {
    id: 'in_patan',
    name: 'Charanka Solar Park',
    state: 'Gujarat',
    country: 'India',
    flag: '🇮🇳',
    lat: 23.90,
    lon: 71.20,
    query: 'Patan,Gujarat,India',
    climate: 'Semi-Arid & Coastal Haze',
    baseTempC: 33.5,
    baseCloud: 22,
    baseUv: 8.4,
    baseGhi: 880,
  },
  {
    id: 'in_pavagada',
    name: 'Pavagada Solar Park',
    state: 'Karnataka',
    country: 'India',
    flag: '🇮🇳',
    lat: 14.10,
    lon: 77.27,
    query: 'Tumkur,Karnataka,India',
    climate: 'Deccan Plateau (Scattered Clouds)',
    baseTempC: 30.5,
    baseCloud: 38,
    baseUv: 7.5,
    baseGhi: 770,
  },
  {
    id: 'in_pune',
    name: 'Pune Microgrid Cluster',
    state: 'Maharashtra',
    country: 'India',
    flag: '🇮🇳',
    lat: 18.52,
    lon: 73.85,
    query: 'Pune,Maharashtra,India',
    climate: 'Western Ghats (Monsoon Cloud Passage)',
    baseTempC: 27.8,
    baseCloud: 62,
    baseUv: 5.6,
    baseGhi: 590,
  },
  {
    id: 'in_leh',
    name: 'Leh High-Altitude PV Facility',
    state: 'Ladakh',
    country: 'India',
    flag: '🇮🇳',
    lat: 34.15,
    lon: 77.57,
    query: 'Leh,Ladakh,India',
    climate: 'Cold High Altitude (High UV Boost)',
    baseTempC: 13.5,
    baseCloud: 14,
    baseUv: 10.8,
    baseGhi: 920,
  },
  {
    id: 'in_kamuthi',
    name: 'Kamuthi Solar Plant',
    state: 'Tamil Nadu',
    country: 'India',
    flag: '🇮🇳',
    lat: 9.35,
    lon: 78.39,
    query: 'Ramanathapuram,Tamil Nadu,India',
    climate: 'Tropical Coastal Insolation',
    baseTempC: 32.2,
    baseCloud: 28,
    baseUv: 8.1,
    baseGhi: 830,
  },
  {
    id: 'us_mojave',
    name: 'Mojave Desert (Bakersfield)',
    state: 'California',
    country: 'USA',
    flag: '🇺🇸',
    lat: 35.01,
    lon: -118.17,
    query: 'Mojave,California,USA',
    climate: 'Mediterranean Desert (Clear Sky)',
    baseTempC: 28.5,
    baseCloud: 6,
    baseUv: 8.9,
    baseGhi: 960,
  },
  {
    id: 'us_phoenix',
    name: 'Phoenix Metropolitan Grid',
    state: 'Arizona',
    country: 'USA',
    flag: '🇺🇸',
    lat: 33.44,
    lon: -112.07,
    query: 'Phoenix,Arizona,USA',
    climate: 'Sonoran Desert (High Heat Derating)',
    baseTempC: 39.8,
    baseCloud: 11,
    baseUv: 9.7,
    baseGhi: 970,
  },
  {
    id: 'us_austin',
    name: 'Austin ERCOT Hybrid Hub',
    state: 'Texas',
    country: 'USA',
    flag: '🇺🇸',
    lat: 30.26,
    lon: -97.74,
    query: 'Austin,Texas,USA',
    climate: 'Subtropical Variable Cloud Fronts',
    baseTempC: 31.0,
    baseCloud: 48,
    baseUv: 6.7,
    baseGhi: 700,
  },
  {
    id: 'us_albany',
    name: 'Albany NYISO Microgrid',
    state: 'New York',
    country: 'USA',
    flag: '🇺🇸',
    lat: 42.65,
    lon: -73.75,
    query: 'Albany,New York,USA',
    climate: 'Humid Continental (Heavy Cloud Inversion)',
    baseTempC: 18.5,
    baseCloud: 74,
    baseUv: 4.1,
    baseGhi: 460,
  },
  {
    id: 'ae_dubai',
    name: 'MBR Solar Park',
    state: 'Dubai',
    country: 'UAE',
    flag: '🇦🇪',
    lat: 24.75,
    lon: 55.37,
    query: 'Dubai,UAE',
    climate: 'Hyper-Arid Insolation & Sand Dust',
    baseTempC: 37.8,
    baseCloud: 5,
    baseUv: 9.9,
    baseGhi: 980,
  },
  {
    id: 'sa_riyadh',
    name: 'Sudair Solar Project',
    state: 'Riyadh',
    country: 'Saudi Arabia',
    flag: '🇸🇦',
    lat: 25.60,
    lon: 45.85,
    query: 'Riyadh,Saudi Arabia',
    climate: 'Arabian Desert Intense Irradiance',
    baseTempC: 41.2,
    baseCloud: 4,
    baseUv: 10.2,
    baseGhi: 995,
  },
  {
    id: 'au_alice',
    name: 'Desert Knowledge Solar',
    state: 'Northern Territory',
    country: 'Australia',
    flag: '🇦🇺',
    lat: -23.70,
    lon: 133.88,
    query: 'Alice Springs,Australia',
    climate: 'Red Centre High DNI',
    baseTempC: 31.5,
    baseCloud: 9,
    baseUv: 9.1,
    baseGhi: 940,
  },
  {
    id: 'de_freiburg',
    name: 'Freiburg Solar Region',
    state: 'Baden-Württemberg',
    country: 'Germany',
    flag: '🇩🇪',
    lat: 47.99,
    lon: 7.85,
    query: 'Freiburg,Germany',
    climate: 'Temperate Maritime (Frequent Overcast)',
    baseTempC: 16.8,
    baseCloud: 69,
    baseUv: 3.9,
    baseGhi: 490,
  },
  {
    id: 'es_seville',
    name: 'PS10 Solar Field',
    state: 'Andalusia',
    country: 'Spain',
    flag: '🇪🇸',
    lat: 37.44,
    lon: -6.25,
    query: 'Seville,Spain',
    climate: 'Mediterranean High Yield',
    baseTempC: 33.0,
    baseCloud: 14,
    baseUv: 8.6,
    baseGhi: 905,
  },
  {
    id: 'jp_fukushima',
    name: 'Fukushima Energy Park',
    state: 'Tohoku',
    country: 'Japan',
    flag: '🇯🇵',
    lat: 37.75,
    lon: 140.46,
    query: 'Fukushima,Japan',
    climate: 'Pacific Transients & Moisture',
    baseTempC: 21.5,
    baseCloud: 56,
    baseUv: 5.2,
    baseGhi: 625,
  },
];

export const WeatherIntelligenceView: React.FC = () => {
  const { injectFault, setActivePage, activeFault } = useMicrogrid();

  // Selected preset or custom query
  const [selectedLocationId, setSelectedLocationId] = useState<string>('in_jodhpur');
  const [customSearch, setCustomSearch] = useState<string>('');
  const [regionFilter, setRegionFilter] = useState<'all' | 'india' | 'usa' | 'global'>('all');

  // Simulation controls
  const [cloudOverride, setCloudOverride] = useState<number | null>(null);
  const [cloudThreshold, setCloudThreshold] = useState<number>(45);
  const [solarLossThreshold, setSolarLossThreshold] = useState<number>(30);
  const [heatThreshold, setHeatThreshold] = useState<number>(38);

  // Data states
  const [weatherData, setWeatherData] = useState<WeatherResponse | null>(null);
  const [presets, setPresets] = useState<PresetLocation[]>(DEFAULT_PRESETS);
  const [allPresetsStatus, setAllPresetsStatus] = useState<PresetStatusItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [apiConfig, setApiConfig] = useState<{ isConfigured: boolean; maskedApiKey: string | null }>({
    isConfigured: false,
    maskedApiKey: null,
  });

  // API Key config modal
  const [showConfigModal, setShowConfigModal] = useState<boolean>(false);
  const [apiKeyInput, setApiKeyInput] = useState<string>('');
  const [savingKey, setSavingKey] = useState<boolean>(false);
  const [keySaveMessage, setKeySaveMessage] = useState<string | null>(null);

  // Fetch presets and config once
  useEffect(() => {
    fetch('http://localhost:8000/api/weather/presets')
      .then((res) => res.json())
      .then((data) => setPresets(data))
      .catch(() => {});

    fetch('http://localhost:8000/api/weather/config')
      .then((res) => res.json())
      .then((data) => setApiConfig({ isConfigured: data.isConfigured, maskedApiKey: data.maskedApiKey }))
      .catch(() => {});

    fetch('http://localhost:8000/api/weather/all-presets-status')
      .then((res) => res.json())
      .then((data) => setAllPresetsStatus(data))
      .catch(() => {});
  }, []);

  // Fetch weather data for selected location or query
  const fetchCurrentWeather = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('location', customSearch.trim() || selectedLocationId);
      if (cloudOverride !== null) {
        params.append('cloudOverride', cloudOverride.toString());
      }
      params.append('cloudThreshold', cloudThreshold.toString());
      params.append('irradianceDropThreshold', solarLossThreshold.toString());
      params.append('heatThreshold', heatThreshold.toString());

      const res = await fetch(`http://localhost:8000/api/weather/current?${params.toString()}`);
      if (res.ok) {
        const data: WeatherResponse = await res.json();
        setWeatherData(data);
      }
    } catch {
      // Fallback handled gracefully
    } finally {
      setLoading(false);
    }
  }, [selectedLocationId, customSearch, cloudOverride, cloudThreshold, solarLossThreshold, heatThreshold]);

  useEffect(() => {
    fetchCurrentWeather();
  }, [fetchCurrentWeather]);

  // Handle saving API key
  const handleSaveApiKey = async () => {
    if (!apiKeyInput.trim()) return;
    setSavingKey(true);
    setKeySaveMessage(null);
    try {
      const res = await fetch('http://localhost:8000/api/weather/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey: apiKeyInput.trim() }),
      });
      if (res.ok) {
        setKeySaveMessage('WeatherAPI key activated successfully!');
        setApiConfig({ isConfigured: true, maskedApiKey: `${apiKeyInput.slice(0, 4)}...${apiKeyInput.slice(-4)}` });
        setTimeout(() => {
          setShowConfigModal(false);
          setKeySaveMessage(null);
          fetchCurrentWeather();
        }, 1200);
      }
    } catch {
      setKeySaveMessage('Failed to connect to backend.');
    } finally {
      setSavingKey(false);
    }
  };

  // Filter presets by region tab
  const filteredPresets = useMemo(() => {
    if (regionFilter === 'india') return presets.filter((p) => p.country === 'India');
    if (regionFilter === 'usa') return presets.filter((p) => p.country === 'USA');
    if (regionFilter === 'global') return presets.filter((p) => p.country !== 'India' && p.country !== 'USA');
    return presets;
  }, [presets, regionFilter]);

  // Handle injecting the weather deficit into microgrid twin
  const handleApplyDeficitToTwin = () => {
    if (!weatherData) return;
    const severity = weatherData.solarImpact.equivalentFaultSeverity;
    injectFault('solar_drop', severity);
    setActivePage('overview');
  };

  // Quick weather simulation presets
  const handleApplyPresetScenario = (cloud: number) => {
    setCloudOverride(cloud);
  };

  const handleResetSimulation = () => {
    setCloudOverride(null);
  };

  return (
    <div className="space-y-6 animate-in fade-in pb-12">
      {/* Hero Header */}
      <div className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-2xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/15 text-amber-700 shadow-2xs">
                <CloudSun className="h-5 w-5" />
              </div>
              <h1 className="text-xl font-bold tracking-tight text-slate-900">
                Solar & Weather Intelligence
              </h1>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-800">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                {apiConfig.isConfigured ? 'Live WeatherAPI Active' : 'Physics Simulation Engine'}
              </span>
            </div>
            <p className="text-xs text-slate-500 max-w-2xl">
              Real-time atmospheric modeling powered by WeatherAPI. Monitor irradiance, cloud attenuation, and thermal derating across multiple states and global solar hubs with automated microgrid resilience triggers.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 self-start lg:self-center shrink-0">
            <button
              onClick={() => setShowConfigModal(true)}
              className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:border-amber-300 hover:bg-amber-50/40 transition-all shadow-xs"
              title="Configure WeatherAPI Key"
            >
              <Key className="h-3.5 w-3.5 text-amber-600" />
              <span>{apiConfig.isConfigured ? 'WeatherAPI Connected' : 'Connect WeatherAPI Key'}</span>
            </button>

            <button
              onClick={fetchCurrentWeather}
              disabled={loading}
              className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-all shadow-xs disabled:opacity-50"
            >
              <RefreshCw className={`h-3.5 w-3.5 text-slate-600 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>
        </div>
      </div>

      {/* Threshold Alert Banner (The Core Requirement!) */}
      {weatherData && weatherData.solarImpact.isThresholdBreached && (
        <div className={`rounded-2xl border p-4.5 shadow-2xs transition-all animate-in fade-in ${
          weatherData.solarImpact.primarySeverity === 'Critical'
            ? 'border-rose-300 bg-rose-50/80'
            : 'border-amber-300 bg-amber-50/80'
        }`}>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className={`flex h-11 w-11 items-center justify-center rounded-xl shrink-0 mt-0.5 shadow-2xs ${
                weatherData.solarImpact.primarySeverity === 'Critical'
                  ? 'bg-rose-100 text-rose-600'
                  : 'bg-amber-100 text-amber-700'
              }`}>
                <ShieldAlert className="h-6 w-6 animate-pulse" />
              </div>
              <div className="space-y-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                    weatherData.solarImpact.primarySeverity === 'Critical'
                      ? 'bg-rose-200 text-rose-900'
                      : 'bg-amber-200 text-amber-900'
                  }`}>
                    {weatherData.solarImpact.primarySeverity} Threshold Breached
                  </span>
                  <span className="text-sm font-bold text-slate-900">
                    Solar Output Derated to {weatherData.solarImpact.actualGenerationKw} kW (-{weatherData.solarImpact.generationLossPercent}% Deficit)
                  </span>
                </div>

                <div className="text-xs text-slate-700 space-y-0.5">
                  {weatherData.solarImpact.triggeredAlerts.map((alert, idx) => (
                    <p key={idx} className="flex items-center gap-1.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-rose-500 shrink-0" />
                      <span>{alert.message}</span>
                    </p>
                  ))}
                </div>

                <div className="pt-1 flex flex-wrap items-center gap-4 text-xs font-semibold">
                  <span className="text-rose-800">
                    Load Deficit: <strong className="font-mono text-sm">{weatherData.solarImpact.powerDeficitKw} kW</strong>
                  </span>
                  <span className="text-slate-600">
                    Recommended BESS Buffer: <strong className="font-mono">{weatherData.solarImpact.bufferBatteryKwh} kWh</strong>
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2.5 shrink-0 self-end md:self-center">
              <button
                onClick={handleApplyDeficitToTwin}
                className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-all flex items-center gap-2 active:scale-[0.98]"
              >
                <Zap className="h-3.5 w-3.5 fill-current" />
                <span>Apply Deficit to Twin & Auto-Recover</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Atmospheric Derating Simulator (Cloud Passage & Heat Controls) */}
      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Sliders className="h-4 w-4 text-emerald-600" />
            <span className="text-sm font-bold text-slate-900">
              Atmospheric Cloud Passage Simulator
            </span>
            <span className="text-[11px] text-slate-400">
              (Simulate instantaneous weather shifts across any state or country)
            </span>
          </div>

          <div className="flex items-center gap-2 text-xs">
            {cloudOverride !== null && (
              <button
                onClick={handleResetSimulation}
                className="flex items-center gap-1 text-slate-600 hover:text-slate-900 underline text-[11px] font-semibold"
              >
                <RotateCcw className="h-3 w-3" />
                Reset to Natural Weather
              </button>
            )}
          </div>
        </div>

        {/* Cloud Passage Slider */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-700 flex items-center gap-1.5">
              <span>Cloud Cover Density</span>
              {cloudOverride !== null && (
                <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200">
                  Simulated Override Active
                </span>
              )}
            </span>
            <span className="font-mono text-sm font-black text-slate-900">
              {cloudOverride !== null ? cloudOverride : weatherData?.weather.cloud ?? 0}%
            </span>
          </div>

          <input
            type="range"
            min={0}
            max={100}
            step={1}
            value={cloudOverride !== null ? cloudOverride : weatherData?.weather.cloud ?? 0}
            onChange={(e) => setCloudOverride(Number(e.target.value))}
            className="w-full accent-emerald-600 cursor-pointer h-2 bg-slate-200 rounded-lg"
          />

          <div className="flex justify-between text-[10px] font-medium text-slate-400">
            <span>0% (Clear Sky / 100% Insolation)</span>
            <span>45% (Threshold Limit)</span>
            <span>75% (Dense Overcast)</span>
            <span>100% (Severe Storm)</span>
          </div>
        </div>

        {/* Quick Simulation Presets */}
        <div className="pt-2 flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-semibold text-slate-500 mr-1">Quick Scenarios:</span>
          <button
            onClick={() => handleApplyPresetScenario(0)}
            className="px-2.5 py-1.5 rounded-lg border border-slate-200 hover:border-amber-300 hover:bg-amber-50/50 text-xs font-semibold text-slate-700 transition-colors flex items-center gap-1"
          >
            <Sun className="h-3.5 w-3.5 text-amber-500" />
            <span>Clear Sky (0%)</span>
          </button>
          <button
            onClick={() => handleApplyPresetScenario(40)}
            className="px-2.5 py-1.5 rounded-lg border border-slate-200 hover:border-blue-300 hover:bg-blue-50/50 text-xs font-semibold text-slate-700 transition-colors flex items-center gap-1"
          >
            <CloudSun className="h-3.5 w-3.5 text-blue-500" />
            <span>Scattered Strata (40%)</span>
          </button>
          <button
            onClick={() => handleApplyPresetScenario(78)}
            className="px-2.5 py-1.5 rounded-lg border border-slate-200 hover:border-rose-300 hover:bg-rose-50/50 text-xs font-semibold text-slate-700 transition-colors flex items-center gap-1"
          >
            <CloudRain className="h-3.5 w-3.5 text-rose-500" />
            <span>Monsoon Overcast (78%)</span>
          </button>
          <button
            onClick={() => handleApplyPresetScenario(95)}
            className="px-2.5 py-1.5 rounded-lg border border-slate-200 hover:border-purple-300 hover:bg-purple-50/50 text-xs font-semibold text-slate-700 transition-colors flex items-center gap-1"
          >
            <AlertTriangle className="h-3.5 w-3.5 text-purple-600" />
            <span>Severe Squall (95%)</span>
          </button>
        </div>
      </div>

      {/* Main Telemetry & Metrics Row */}
      {weatherData && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Card 1: Solar Irradiance */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4.5 shadow-2xs flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">Global Irradiance (GHI)</span>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
                <Sun className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-black font-mono tracking-tight text-slate-900">
                {weatherData.solarImpact.ghi}{' '}
                <span className="text-xs font-normal text-slate-500">W/m²</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
                <span>Clear Sky: {weatherData.solarImpact.clearSkyGhi} W/m²</span>
              </p>
            </div>
          </div>

          {/* Card 2: Estimated PV Generation */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4.5 shadow-2xs flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">Effective PV Output</span>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                <Zap className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-black font-mono tracking-tight text-emerald-700">
                {weatherData.solarImpact.actualGenerationKw}{' '}
                <span className="text-xs font-normal text-slate-500">kW</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Nominal: {weatherData.solarImpact.nominalGenerationKw} kW ({weatherData.solarImpact.generationLossPercent}% loss)
              </p>
            </div>
          </div>

          {/* Card 3: Cloud Cover */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4.5 shadow-2xs flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">Cloud Coverage</span>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                <CloudSun className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-black font-mono tracking-tight text-slate-900">
                {weatherData.weather.cloud}%
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Loss Attenuation: -{weatherData.solarImpact.cloudLossKw} kW
              </p>
            </div>
          </div>

          {/* Card 4: Temperature & Cell Derating */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4.5 shadow-2xs flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">Ambient & Cell Temp</span>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-50 text-rose-600">
                <Thermometer className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-black font-mono tracking-tight text-slate-900">
                {weatherData.weather.tempC}°C
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Cell: {weatherData.solarImpact.cellTempC}°C (-{weatherData.solarImpact.thermalLossKw} kW thermal loss)
              </p>
            </div>
          </div>

          {/* Card 5: Microgrid Net Balance */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4.5 shadow-2xs flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">Load Deficit (vs 105 kW)</span>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-50 text-purple-600">
                <Activity className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className={`text-2xl font-black font-mono tracking-tight ${
                weatherData.solarImpact.powerDeficitKw > 0 ? 'text-rose-600' : 'text-emerald-600'
              }`}>
                {weatherData.solarImpact.powerDeficitKw > 0
                  ? `-${weatherData.solarImpact.powerDeficitKw} kW`
                  : `+${Math.abs(weatherData.solarImpact.netBalanceKw)} kW surplus`}
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                {weatherData.solarImpact.powerDeficitKw > 0 ? 'BESS Dispatch Required' : 'Grid-Stable Margin'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Multi-State & Multi-Country Presets Selector */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-2xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Multi-State & Global Solar Clusters
            </h3>
            <p className="text-xs text-slate-500">
              Select key industrial solar clusters across India, the United States, and international hubs to simulate regional microgrid yield.
            </p>
          </div>

          {/* Region Tabs */}
          <div className="flex items-center gap-1 rounded-xl bg-slate-100 p-1 text-xs font-semibold">
            <button
              onClick={() => setRegionFilter('all')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                regionFilter === 'all' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Hubs ({presets.length})
            </button>
            <button
              onClick={() => setRegionFilter('india')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                regionFilter === 'india' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              🇮🇳 India States
            </button>
            <button
              onClick={() => setRegionFilter('usa')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                regionFilter === 'usa' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              🇺🇸 USA States
            </button>
            <button
              onClick={() => setRegionFilter('global')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                regionFilter === 'global' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              🌐 Global Hubs
            </button>
          </div>
        </div>

        {/* Custom Location Search */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search custom city or state (e.g. Jaipur, Dubai, Austin, Melbourne)..."
              value={customSearch}
              onChange={(e) => setCustomSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchCurrentWeather()}
              className="w-full rounded-xl border border-slate-200 pl-10 pr-4 py-2 text-xs focus:border-emerald-500 focus:outline-none"
            />
          </div>
          <button
            onClick={fetchCurrentWeather}
            className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-xs"
          >
            Search
          </button>
        </div>

        {/* Location Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {filteredPresets.map((loc) => {
            const isSelected = selectedLocationId === loc.id && !customSearch;
            return (
              <button
                key={loc.id}
                onClick={() => {
                  setSelectedLocationId(loc.id);
                  setCustomSearch('');
                  setCloudOverride(null);
                }}
                className={`text-left p-3.5 rounded-2xl border transition-all ${
                  isSelected
                    ? 'border-emerald-500 bg-emerald-50/60 ring-2 ring-emerald-400/30 shadow-2xs'
                    : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/70'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-lg">{loc.flag}</span>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    {loc.country}
                  </span>
                </div>
                <div className="mt-2">
                  <div className="text-xs font-bold text-slate-900 truncate">{loc.name}</div>
                  <div className="text-[11px] text-slate-500">{loc.state}</div>
                </div>
                <div className="mt-3 flex items-center justify-between text-[11px] text-slate-600 font-mono">
                  <span>{loc.baseTempC}°C</span>
                  <span className="flex items-center gap-1 text-slate-500 font-sans">
                    <CloudSun className="h-3 w-3 text-slate-400" />
                    {loc.baseCloud}% cloud
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Threshold Configuration Controls */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-2xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Custom Anomaly Threshold Trigger Settings
            </h3>
            <p className="text-xs text-slate-500">
              Define the sensitivity thresholds for cloud attenuation, irradiance loss, and heat derating that trigger proactive microgrid alarms.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Threshold 1: Cloud Limit */}
          <div className="space-y-2 rounded-2xl border border-slate-100 bg-slate-50/60 p-4">
            <div className="flex justify-between items-center text-xs">
              <span className="font-semibold text-slate-700">Cloud Attenuation Limit</span>
              <span className="font-mono font-bold text-emerald-700">{cloudThreshold}%</span>
            </div>
            <input
              type="range"
              min={15}
              max={85}
              value={cloudThreshold}
              onChange={(e) => setCloudThreshold(Number(e.target.value))}
              className="w-full accent-emerald-600 h-1.5 bg-slate-200 rounded-lg cursor-pointer"
            />
            <p className="text-[10px] text-slate-500">
              Triggers cloud deficit warning when cover exceeds this percentage.
            </p>
          </div>

          {/* Threshold 2: Generation Drop Limit */}
          <div className="space-y-2 rounded-2xl border border-slate-100 bg-slate-50/60 p-4">
            <div className="flex justify-between items-center text-xs">
              <span className="font-semibold text-slate-700">Solar Generation Loss Limit</span>
              <span className="font-mono font-bold text-amber-700">{solarLossThreshold}%</span>
            </div>
            <input
              type="range"
              min={10}
              max={70}
              value={solarLossThreshold}
              onChange={(e) => setSolarLossThreshold(Number(e.target.value))}
              className="w-full accent-amber-600 h-1.5 bg-slate-200 rounded-lg cursor-pointer"
            />
            <p className="text-[10px] text-slate-500">
              Triggers generation alarm when output drops by more than this percentage from nominal.
            </p>
          </div>

          {/* Threshold 3: Heat Derating Limit */}
          <div className="space-y-2 rounded-2xl border border-slate-100 bg-slate-50/60 p-4">
            <div className="flex justify-between items-center text-xs">
              <span className="font-semibold text-slate-700">Extreme Heat Thermal Limit</span>
              <span className="font-mono font-bold text-rose-700">{heatThreshold}°C</span>
            </div>
            <input
              type="range"
              min={30}
              max={50}
              value={heatThreshold}
              onChange={(e) => setHeatThreshold(Number(e.target.value))}
              className="w-full accent-rose-600 h-1.5 bg-slate-200 rounded-lg cursor-pointer"
            />
            <p className="text-[10px] text-slate-500">
              Triggers PV module thermal derating alarm above this ambient temperature.
            </p>
          </div>
        </div>
      </div>

      {/* All Presets Comparison Table */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-2xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Multi-Region Real-Time Solar Yield Matrix
            </h3>
            <p className="text-xs text-slate-500">
              Comparative live baseline across all monitored states and international solar clusters.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 font-semibold text-[11px]">
                <th className="pb-3 pl-2">Location & Cluster</th>
                <th className="pb-3">State / Country</th>
                <th className="pb-3">Cloud %</th>
                <th className="pb-3">Temp</th>
                <th className="pb-3">GHI (W/m²)</th>
                <th className="pb-3">Effective Solar (kW)</th>
                <th className="pb-3">Loss %</th>
                <th className="pb-3">Status</th>
                <th className="pb-3 text-right pr-2">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {allPresetsStatus.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3 pl-2 font-semibold text-slate-900 flex items-center gap-2">
                    <span>{item.flag}</span>
                    <span>{item.name}</span>
                  </td>
                  <td className="py-3 text-slate-600">{item.state}, {item.country}</td>
                  <td className="py-3 font-mono">{item.cloudPercent}%</td>
                  <td className="py-3 font-mono">{item.tempC}°C</td>
                  <td className="py-3 font-mono">{item.ghi}</td>
                  <td className="py-3 font-mono font-bold text-emerald-700">{item.actualGenerationKw} kW</td>
                  <td className="py-3 font-mono text-rose-600">-{item.generationLossPercent}%</td>
                  <td className="py-3">
                    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                      item.statusColor === 'emerald'
                        ? 'bg-emerald-50 text-emerald-800'
                        : item.statusColor === 'rose'
                        ? 'bg-rose-50 text-rose-800'
                        : 'bg-amber-50 text-amber-800'
                    }`}>
                      {item.status}
                    </span>
                  </td>
                  <td className="py-3 text-right pr-2">
                    <button
                      onClick={() => {
                        setSelectedLocationId(item.id);
                        setCustomSearch('');
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className="px-2.5 py-1 rounded-lg border border-slate-200 hover:bg-slate-100 text-[11px] font-semibold text-slate-700"
                    >
                      Simulate
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* WeatherAPI Key Configuration Modal */}
      {showConfigModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
                  <Key className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">WeatherAPI.com Integration</h3>
                  <p className="text-[11px] text-slate-500">Connect your free WeatherAPI key</p>
                </div>
              </div>
            </div>

            <div className="space-y-3 text-xs text-slate-600">
              <p>
                GridHeal integrates with <strong>WeatherAPI.com</strong> for real-time irradiance, cloud opacity, UV index, and atmospheric forecast telemetry.
              </p>
              <div className="rounded-xl border border-blue-100 bg-blue-50/70 p-3 text-[11px] text-blue-900 space-y-1">
                <p className="font-semibold flex items-center gap-1">
                  <Info className="h-3.5 w-3.5 text-blue-600 shrink-0" />
                  <span>Free Tier: 100,000 calls / month</span>
                </p>
                <p>
                  Sign up for free at{' '}
                  <a
                    href="https://www.weatherapi.com/"
                    target="_blank"
                    rel="noreferrer"
                    className="underline font-bold text-blue-700 inline-flex items-center gap-0.5"
                  >
                    weatherapi.com <ExternalLink className="h-2.5 w-2.5" />
                  </a>{' '}
                  and paste your API key below.
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-slate-700">API Key</label>
                <input
                  type="password"
                  placeholder="Paste your WeatherAPI key here..."
                  value={apiKeyInput}
                  onChange={(e) => setApiKeyInput(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 p-2.5 font-mono text-xs focus:border-emerald-500 focus:outline-none"
                />
              </div>

              {keySaveMessage && (
                <p className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 p-2 rounded-lg">
                  {keySaveMessage}
                </p>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setShowConfigModal(false)}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveApiKey}
                disabled={savingKey || !apiKeyInput.trim()}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-colors disabled:opacity-50"
              >
                {savingKey ? 'Connecting...' : 'Save & Connect'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
