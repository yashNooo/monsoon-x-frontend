import { useState, useEffect, useCallback } from 'react';
import { 
  CloudRain, 
  AlertCircle, 
  Sun, 
  Wind, 
  ChevronDown, 
  Save, 
  RefreshCw, 
  Compass, 
  Droplet,
  MapPin,
  ExternalLink
} from 'lucide-react';
import { useLocation } from '../context/LocationContext';
import { useAuth } from '../context/AuthContext';
import { getForecastAnalysis, type FullForecastResult, saveForecastToDatabase } from '../services/forecastService';
import { CROPS_CATALOG } from '../data/agriculturalData';
import { Link } from 'react-router-dom';

interface MetricCardProps {
  title: string;
  probability: number;
  confidence: string;
  details: string;
  icon: any;
  colorClass: string;
  thresholdInfo: string;
}

const MetricCard = ({ 
  title, 
  probability, 
  confidence, 
  details, 
  icon: Icon, 
  colorClass, 
  thresholdInfo
}: MetricCardProps) => (
  <div className="glass-panel p-5 relative overflow-hidden group hover:border-primary/40 transition-all">
    <div className={`absolute top-0 right-0 w-32 h-32 opacity-5 rounded-full -mr-10 -mt-10 bg-current ${colorClass}`}></div>
    <div className="flex justify-between items-start mb-3">
      <div>
        <span className="text-xs font-semibold text-textMuted uppercase tracking-wider">{title}</span>
        <div className="flex items-baseline gap-2 mt-1">
          <span className={`text-3xl font-extrabold ${colorClass}`}>
            {probability}%
          </span>
          <span className="text-[11px] text-textMuted font-mono">probabilistic</span>
        </div>
      </div>
      <div className={`p-2.5 rounded-lg bg-panelBorder/30 ${colorClass}`}>
        <Icon className="w-5 h-5" />
      </div>
    </div>
    
    <div className="text-xs text-textMuted mb-3 min-h-[32px] leading-relaxed">
      {details}
    </div>

    <div className="pt-2.5 border-t border-panelBorder/40 flex items-center justify-between text-[11px]">
      <span className="text-textMuted truncate max-w-[130px]">{thresholdInfo}</span>
      <span className="font-semibold text-textMain bg-panelBorder/40 px-2 py-0.5 rounded font-mono">
        {confidence} Conf.
      </span>
    </div>
  </div>
);

export const CommandCenter = () => {
  const { 
    latitude, 
    longitude, 
    block, 
    panchayat, 
    district, 
    state, 
    locationName,
    selectedCropId, 
    setSelectedCropId,
    savedFarms,
    activeFarmId,
    selectSavedFarm,
  } = useLocation();
  const { user } = useAuth();

  const [horizon, setHorizon] = useState<number>(14);
  const [analysis, setAnalysis] = useState<FullForecastResult | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);
  const [showEvidence, setShowEvidence] = useState<boolean>(false);

  const fetchForecast = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getForecastAnalysis(latitude, longitude, selectedCropId, horizon, {
        name: locationName,
        block,
        panchayat,
        district,
        state,
      });
      setAnalysis(result);
    } catch (err) {
      console.warn('Forecast fetch failed:', err);
    } finally {
      setLoading(false);
    }
  }, [latitude, longitude, selectedCropId, horizon, locationName, block, panchayat, district, state]);

  useEffect(() => {
    fetchForecast();
  }, [fetchForecast]);

  const handleSaveAdvisory = async () => {
    if (!analysis) return;
    setSaveStatus('Saving...');
    try {
      const res = await saveForecastToDatabase(analysis, user?.id);
      if (res.success) {
        setSaveStatus('Saved to History!');
      } else {
        setSaveStatus('Failed to save');
      }
    } catch {
      setSaveStatus('Saved locally');
    }
    setTimeout(() => setSaveStatus(null), 3500);
  };

  const getDecisionBadge = (decision: string) => {
    switch (decision) {
      case 'Sow Today':
        return {
          bg: 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400',
          title: 'Favorable Sowing Window Detected',
          sub: 'Soil moisture sequence satisfies seed hydration and seedling emergence.',
        };
      case 'Wait 7 Days':
        return {
          bg: 'bg-amber-500/10 border-amber-500/40 text-amber-400',
          title: 'Postpone Sowing by 7 Days',
          sub: 'Sub-threshold moisture or early false-onset gap hazard. Delay recommended.',
        };
      case 'Wait 14 Days':
        return {
          bg: 'bg-orange-500/10 border-orange-500/40 text-orange-400',
          title: 'Postpone Sowing by 14 Days',
          sub: 'Extended monsoon break predicted. Wait for synoptic rainfall revival.',
        };
      default:
        return {
          bg: 'bg-rose-500/10 border-rose-500/40 text-rose-400',
          title: 'Avoid Sowing - Torrential Rain Alert',
          sub: 'Heavy precipitation (>65mm) forecast threatens seed displacement and crusting.',
        };
    }
  };

  const lastUpdatedIST = analysis?.weather.fetchedAt
    ? new Date(analysis.weather.fetchedAt).toLocaleTimeString('en-IN', {
        timeZone: 'Asia/Kolkata',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      })
    : '--:--';

  const selectedCrop = CROPS_CATALOG.find(c => c.id === selectedCropId) || CROPS_CATALOG[0];
  const decisionBadge = analysis ? getDecisionBadge(analysis.assessment.bestDecision) : null;

  return (
    <div className="space-y-6">
      {/* Top Banner & Control Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-panel p-4 sm:p-5">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="heading-primary text-xl sm:text-2xl font-bold text-textMain">
              Monsoon Command Center
            </h2>
            {/* Demo Mode Badge */}
            <span className="text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase tracking-wider border bg-primary/10 border-primary/30 text-primary">
              Demo Mode
            </span>
            {/* Live/Cached/Demo Source Badge */}
            {analysis && (
              <span
                className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase tracking-wider border ${
                  analysis.weather.source === 'LIVE'
                    ? 'bg-success/15 border-success/40 text-success'
                    : analysis.weather.source === 'CACHED'
                    ? 'bg-primary/15 border-primary/40 text-primary'
                    : 'bg-warning/15 border-warning/40 text-warning'
                }`}
              >
                ● {analysis.weather.source} METEO FEED
              </span>
            )}
            <span className="text-xs text-textMuted">
              IST: {lastUpdatedIST}
            </span>
          </div>

          <div className="flex items-center gap-2 mt-1.5 text-xs text-textMuted flex-wrap">
            {/* Farm Selector Dropdown */}
            {savedFarms.length > 0 && (
              <div className="flex items-center gap-1 bg-background/80 border border-panelBorder rounded px-2 py-0.5 text-xs">
                <span className="text-[10px] uppercase font-semibold text-textMuted">Farm:</span>
                <select
                  value={activeFarmId || ''}
                  onChange={(e) => {
                    if (e.target.value) selectSavedFarm(e.target.value);
                  }}
                  className="bg-transparent text-textMain font-semibold focus:outline-none cursor-pointer"
                >
                  {savedFarms.map((f) => (
                    <option key={f.id} value={f.id} className="bg-background text-textMain">
                      {f.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <span className="flex items-center gap-1 text-textMain font-medium">
              <MapPin className="w-3.5 h-3.5 text-primary" />
              {block} Block · {panchayat} ({district})
            </span>
            <span className="hidden sm:inline">·</span>
            <span className="text-[11px] font-mono">
              ({latitude.toFixed(3)}°N, {longitude.toFixed(3)}°E)
            </span>
            <Link to="/map" className="text-primary hover:underline text-xs ml-1 flex items-center gap-0.5">
              Change on Map <ExternalLink className="w-3 h-3" />
            </Link>
          </div>
        </div>

        {/* Crop Selector & Horizon Tabs */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {/* Crop Selector */}
          <div className="flex items-center gap-1.5 bg-background/80 border border-panelBorder rounded-lg px-2.5 py-1.5">
            <span className="text-[11px] text-textMuted uppercase font-semibold">Crop:</span>
            <select
              value={selectedCropId}
              onChange={(e) => setSelectedCropId(e.target.value)}
              className="bg-transparent text-xs font-semibold text-textMain focus:outline-none cursor-pointer"
            >
              {CROPS_CATALOG.map((c) => (
                <option key={c.id} value={c.id} className="bg-background text-textMain">
                  {c.localName} ({c.name})
                </option>
              ))}
            </select>
          </div>

          {/* Horizon Selector (7, 14, 21, 30 days) */}
          <div className="flex items-center bg-background/80 border border-panelBorder rounded-lg p-1">
            {[7, 14, 21, 30].map((days) => (
              <button
                key={days}
                onClick={() => setHorizon(days)}
                className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                  horizon === days
                    ? 'bg-primary text-white shadow-sm'
                    : 'text-textMuted hover:text-white'
                }`}
              >
                {days}D
              </button>
            ))}
          </div>

          {/* Refresh & Save Buttons */}
          <button
            onClick={fetchForecast}
            disabled={loading}
            className="btn-secondary py-1.5 px-2.5 text-xs flex items-center gap-1"
            title="Refresh live meteo feed"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={handleSaveAdvisory}
            disabled={!analysis}
            className="btn-primary py-1.5 px-3 text-xs flex items-center gap-1"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{saveStatus || 'Save Advisory'}</span>
          </button>

          <Link
            to="/history"
            className="btn-secondary py-1.5 px-2.5 text-xs flex items-center gap-1"
            title="View saved advisories history"
          >
            <span>History</span>
          </Link>
        </div>
      </div>

      {loading && !analysis ? (
        <div className="glass-panel p-16 text-center text-textMuted space-y-3">
          <div className="inline-block animate-spin w-8 h-8 border-3 border-primary border-t-transparent rounded-full"></div>
          <p className="text-sm font-medium">Computing hybrid agro-climatic risk models from Open-Meteo feed...</p>
        </div>
      ) : analysis ? (
        <>
          {/* Best Sowing Decision Banner */}
          {decisionBadge && (
            <div className={`p-4 sm:p-5 rounded-xl border ${decisionBadge.bg} flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all shadow-lg`}>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs uppercase font-mono tracking-widest px-2 py-0.5 rounded bg-current/10 font-bold">
                    Agronomic Recommendation ({analysis.crop.localName})
                  </span>
                  <span className="text-xs opacity-90 font-mono">
                    Model Confidence: {analysis.assessment.confidence}
                  </span>
                </div>
                <h3 className="text-xl sm:text-2xl font-extrabold text-white">
                  {decisionBadge.title} ({analysis.assessment.bestDecisionHi})
                </h3>
                <p className="text-xs sm:text-sm text-textMain/90 max-w-2xl">
                  {decisionBadge.sub}
                </p>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <Link
                  to="/simulator"
                  className="btn-primary py-2 px-4 text-xs font-semibold flex items-center gap-1.5 bg-primary hover:bg-secondary text-white shadow"
                >
                  <span>Test in Simulator</span>
                </Link>
                <Link
                  to="/sowing-window"
                  className="btn-secondary py-2 px-3 text-xs font-semibold"
                >
                  Sowing Calendar
                </Link>
              </div>
            </div>
          )}

          {/* Prominent Hindi Farmer Advisory Card */}
          <div className="glass-panel p-5 border-l-4 border-l-primary relative overflow-hidden bg-gradient-to-r from-panel via-panel to-primary/5">
            <div className="flex items-start justify-between gap-3 mb-2">
              <div className="flex items-center gap-2">
                <span className="text-primary font-bold text-sm sm:text-base font-serif">
                  किसान मौसम परामर्श (Farmer Hindi Advisory)
                </span>
                <span className="text-[10px] text-textMuted uppercase font-mono bg-panelBorder/40 px-2 py-0.5 rounded">
                  {selectedCrop.localName} विशिष्ट
                </span>
              </div>
              <span className="text-[10px] text-textMuted font-mono">
                {horizon}-Day Horizon
              </span>
            </div>

            <p className="text-sm sm:text-base text-textMain leading-relaxed font-normal py-1">
              &ldquo;{analysis.assessment.advisoryHi}&rdquo;
            </p>

            <div className="mt-3 pt-3 border-t border-panelBorder/40 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-textMuted">
              <div>
                <span className="font-semibold text-textMain mr-1">English Translation:</span>
                <span>{analysis.assessment.advisoryEn}</span>
              </div>
            </div>
          </div>

          {/* 4 Probabilistic Risk Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard
              title="Monsoon Onset Prob"
              probability={analysis.assessment.onsetProbability}
              confidence={analysis.assessment.confidence}
              details={`${analysis.assessment.onsetProbability >= 65 ? 'Favorable synoptic rain front' : 'Sub-threshold rain flow'} with ${analysis.weather.summary.totalRainfall7dMm}mm over next 7 days.`}
              icon={CloudRain}
              colorClass="text-emerald-400"
              thresholdInfo={`Threshold: ${analysis.crop.minimumRainfallMm}mm`}
            />

            <MetricCard
              title="False Onset Risk"
              probability={analysis.assessment.falseOnsetRisk}
              confidence={analysis.assessment.confidence}
              details={
                analysis.assessment.falseOnsetRisk >= 50
                  ? `High hazard: Initial shower followed by ${analysis.assessment.longestDryGapDays} dry days, risking seed drying.`
                  : 'Continuous rain sequence forecast. Low threat of early seedling loss.'
              }
              icon={AlertCircle}
              colorClass={analysis.assessment.falseOnsetRisk >= 50 ? 'text-rose-400' : 'text-textMain'}
              thresholdInfo="Early Rain + Dry Streak"
            />

            <MetricCard
              title="Monsoon Break Risk"
              probability={analysis.assessment.breakRisk}
              confidence={analysis.assessment.confidence}
              details={
                analysis.assessment.breakRisk >= 50
                  ? `Prolonged dry gap of ${analysis.assessment.longestDryGapDays} days exceeds tolerance (${analysis.crop.drySpellToleranceDays}d).`
                  : `Dry gaps remain within ${analysis.crop.name} safety margins (${analysis.crop.drySpellToleranceDays} days max).`
              }
              icon={Sun}
              colorClass={analysis.assessment.breakRisk >= 50 ? 'text-amber-400' : 'text-textMain'}
              thresholdInfo={`Crop Limit: ${analysis.crop.drySpellToleranceDays}d`}
            />

            <MetricCard
              title="Heavy Rain / Flood Risk"
              probability={analysis.assessment.heavyRainRisk}
              confidence={analysis.assessment.confidence}
              details={
                analysis.assessment.heavyRainRisk >= 50
                  ? `Peak downpour ${analysis.weather.summary.maxSingleDayRainMm}mm approaches IMD heavy threshold (64.5mm).`
                  : `Max 24h shower ${analysis.weather.summary.maxSingleDayRainMm}mm. Safe drainage rate anticipated.`
              }
              icon={Droplet}
              colorClass={analysis.assessment.heavyRainRisk >= 50 ? 'text-rose-400' : 'text-cyan-400'}
              thresholdInfo="IMD Benchmark: 64.5mm"
            />
          </div>

          {/* Explainability & Evidence Section */}
          <div className="glass-panel p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base text-textMain flex items-center gap-2">
                  <Compass className="w-4 h-4 text-primary" />
                  Why This Recommendation? (Explainable Rule-Based Evidence)
                </h3>
                <p className="text-xs text-textMuted mt-0.5">
                  Calculated deterministically from actual meteorological aggregates and {selectedCrop.name} agronomy.
                </p>
              </div>
              <button
                onClick={() => setShowEvidence(!showEvidence)}
                className="btn-secondary py-1.5 px-3 text-xs flex items-center gap-1"
              >
                <span>{showEvidence ? 'Collapse Rules' : 'Inspect All Rules'}</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showEvidence ? 'rotate-180' : ''}`} />
              </button>
            </div>

            {/* Quick Metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-background/50 p-3 rounded-lg border border-panelBorder/40 text-xs">
              <div>
                <span className="text-textMuted block text-[11px]">7-Day Cumulative Rain</span>
                <span className="text-base font-bold text-textMain">{analysis.weather.summary.totalRainfall7dMm} mm</span>
                <span className="text-[10px] text-textMuted block">Req: {selectedCrop.minimumRainfallMm} mm</span>
              </div>
              <div>
                <span className="text-textMuted block text-[11px]">Rainy Days Count (&ge;2.5mm)</span>
                <span className="text-base font-bold text-textMain">{analysis.weather.summary.rainyDays7d} of 7 days</span>
                <span className="text-[10px] text-textMuted block">Min 2 days recommended</span>
              </div>
              <div>
                <span className="text-textMuted block text-[11px]">Longest Dry Gap</span>
                <span className="text-base font-bold text-textMain">{analysis.assessment.longestDryGapDays} days</span>
                <span className="text-[10px] text-textMuted block">Tolerance: {selectedCrop.drySpellToleranceDays} days</span>
              </div>
              <div>
                <span className="text-textMuted block text-[11px]">Peak 24h Rainfall</span>
                <span className="text-base font-bold text-textMain">{analysis.weather.summary.maxSingleDayRainMm} mm</span>
                <span className="text-[10px] text-textMuted block">Flood mark: 64.5 mm</span>
              </div>
            </div>

            {/* Expanded Detailed Rules Table */}
            {showEvidence && (
              <div className="space-y-3 pt-2">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border border-panelBorder/50 rounded-lg overflow-hidden">
                    <thead className="bg-panelBorder/30 text-textMuted text-[11px] uppercase">
                      <tr>
                        <th className="p-2.5">Agro-Meteorological Factor</th>
                        <th className="p-2.5">Observed Value</th>
                        <th className="p-2.5">Agronomic Rule</th>
                        <th className="p-2.5">Crop Impact</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-panelBorder/30 text-textMain">
                      {analysis.assessment.evidenceList.map((ev, i) => (
                        <tr key={i} className="hover:bg-panel/50">
                          <td className="p-2.5 font-semibold text-textMain">{ev.metric}</td>
                          <td className="p-2.5 font-mono">{ev.observedValue}</td>
                          <td className="p-2.5 text-textMuted">{ev.benchmarkRule}</td>
                          <td className="p-2.5">
                            <span className={ev.status === 'positive' ? 'text-emerald-400' : ev.status === 'danger' ? 'text-rose-400' : 'text-amber-400'}>
                              {ev.implication}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Triggered Decision Rules List */}
                <div className="p-3 bg-panel/40 rounded-lg border border-panelBorder/50 space-y-1.5">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-primary">
                    Triggered Decision Rules:
                  </div>
                  <ul className="list-disc list-inside space-y-1 text-xs text-textMuted">
                    {analysis.assessment.triggeredRules.map((rule, idx) => (
                      <li key={idx} className="leading-relaxed">
                        <span className="text-textMain">{rule}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>

          {/* Macro Climate Context Indicators (ENSO, IOD, MJO) */}
          <div className="glass-panel p-5 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
              <div>
                <h3 className="font-bold text-base text-textMain flex items-center gap-2">
                  <Wind className="w-4 h-4 text-primary" />
                  Macro-Scale Climate Context Indicators
                </h3>
                <p className="text-xs text-textMuted">
                  Large-scale teleconnections modulating regional monsoon surge (Indian Ocean & Pacific).
                </p>
              </div>
              <span className="text-[10px] text-textMuted font-mono">
                Regional Driver Analysis
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 pt-1">
              {analysis.assessment.climateSignals.map((sig, i) => (
                <div key={i} className="p-3.5 rounded-lg bg-panel/60 border border-panelBorder/60 space-y-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="font-bold text-xs text-textMain block">{sig.indexName}</span>
                      <span className="text-[11px] text-textMuted">{sig.fullName}</span>
                    </div>
                    <span
                      className={`text-[9px] font-mono px-1.5 py-0.5 rounded border uppercase ${
                        sig.sourceStatus === 'Connected'
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                          : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                      }`}
                    >
                      {sig.sourceStatus}
                    </span>
                  </div>

                  <div className="text-xs font-mono text-primary font-medium">
                    {sig.phase}
                  </div>

                  <p className="text-[11px] text-textMuted leading-relaxed">
                    {sig.impactSummary}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
};

export default CommandCenter;
