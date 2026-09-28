import { useState, useEffect } from 'react';
import { 
  Activity, 
  ShieldCheck, 
  Droplet,
  ArrowRight
} from 'lucide-react';
import { useLocation } from '../context/LocationContext';
import { getForecastAnalysis, runSimulatorScenarios, type SimulationResult } from '../services/forecastService';
import { CROPS_CATALOG } from '../data/agriculturalData';
import { Link } from 'react-router-dom';

export const Simulator = () => {
  const { latitude, longitude, block, selectedCropId, setSelectedCropId } = useLocation();
  const [selectedScenario, setSelectedScenario] = useState<'Sow Today' | 'Wait 7 Days' | 'Wait 14 Days'>('Wait 7 Days');
  const [simResults, setSimResults] = useState<SimulationResult[]>([]);
  const [loading, setLoading] = useState(true);

  const crop = CROPS_CATALOG.find(c => c.id === selectedCropId) || CROPS_CATALOG[0];

  useEffect(() => {
    const runSim = async () => {
      setLoading(true);
      try {
        const analysis = await getForecastAnalysis(latitude, longitude, selectedCropId, 14);
        const scenarios = runSimulatorScenarios(analysis);
        setSimResults(scenarios);
      } catch (err) {
        console.warn('Simulation failed:', err);
      } finally {
        setLoading(false);
      }
    };
    runSim();
  }, [latitude, longitude, selectedCropId]);

  const activeResult = simResults.find(s => s.scenario === selectedScenario) || simResults[0];

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="glass-panel p-6 border-l-4 border-l-primary relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Activity className="w-5 h-5 text-primary" />
              <h2 className="heading-primary text-2xl font-bold">Dynamic Sowing Window Simulator</h2>
            </div>
            <p className="subheading text-sm max-w-3xl">
              Model seedling emergence, water availability, and false-onset vulnerability across time intervals. Test scenarios before committing expensive seed and fertilizer inputs.
            </p>
          </div>

          {/* Crop Selector inside Simulator */}
          <div className="flex items-center gap-2 bg-background/80 border border-panelBorder p-2 rounded-xl shrink-0">
            <span className="text-xs text-textMuted uppercase font-semibold">Simulate Crop:</span>
            <select
              value={selectedCropId}
              onChange={(e) => setSelectedCropId(e.target.value)}
              className="bg-transparent text-sm font-bold text-textMain focus:outline-none cursor-pointer"
            >
              {CROPS_CATALOG.map((c) => (
                <option key={c.id} value={c.id} className="bg-background text-textMain">
                  {c.localName} ({c.name})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Scenario Selection Buttons */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {(['Sow Today', 'Wait 7 Days', 'Wait 14 Days'] as const).map((sc) => {
          const res = simResults.find(s => s.scenario === sc);
          const isSelected = selectedScenario === sc;

          return (
            <button
              key={sc}
              onClick={() => setSelectedScenario(sc)}
              className={`glass-panel p-4 text-left transition-all relative overflow-hidden ${
                isSelected
                  ? 'border-primary ring-1 ring-primary bg-primary/10 shadow-lg shadow-primary/10'
                  : 'hover:border-primary/40'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs uppercase font-mono text-textMuted font-bold">Strategy Option</span>
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-panelBorder/50 text-textMain">
                  {res?.confidence || 'High'} Conf.
                </span>
              </div>
              <h3 className="text-lg font-bold text-textMain">{sc}</h3>
              <p className="text-xs text-textMuted mt-1">
                {sc === 'Sow Today' && 'Immediate planting with existing topsoil moisture'}
                {sc === 'Wait 7 Days' && 'Defer until follow-up rain confirms monsoon front'}
                {sc === 'Wait 14 Days' && 'Extended deferral to avoid early season break'}
              </p>

              {res && (
                <div className="mt-3 pt-3 border-t border-panelBorder/40 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-textMuted text-[11px] block">Onset Prob:</span>
                    <span className="font-bold text-emerald-400">{res.onsetProbability}%</span>
                  </div>
                  <div>
                    <span className="text-textMuted text-[11px] block">Break Risk:</span>
                    <span className="font-bold text-amber-400">{res.breakRisk}%</span>
                  </div>
                  <div>
                    <span className="text-textMuted text-[11px] block">Expected Rain:</span>
                    <span className="font-bold text-textMain">{res.expectedRainfallMm} mm</span>
                  </div>
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Detailed Simulation Outcome View */}
      {loading || !activeResult ? (
        <div className="glass-panel p-12 text-center text-textMuted">
          <div className="inline-block animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full mb-3"></div>
          <p className="text-sm">Recalculating agro-meteorological simulation...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Scenario Details */}
          <div className="lg:col-span-2 glass-panel p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-panelBorder/50 pb-4">
              <div>
                <span className="text-xs uppercase font-mono text-primary font-bold">
                  Simulation Outcome &middot; {block} Block
                </span>
                <h3 className="text-xl font-extrabold text-white mt-0.5">
                  Scenario: {activeResult.scenario} for {crop.name}
                </h3>
              </div>
              <div className="text-right">
                <span className="text-xs text-textMuted block">Agronomic Suitability</span>
                <span className={`text-2xl font-bold ${activeResult.suitabilityScore >= 70 ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {activeResult.suitabilityScore}/100
                </span>
              </div>
            </div>

            {/* Metrics Breakdown */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-background/60 p-3 rounded-lg border border-panelBorder/40">
                <span className="text-[11px] text-textMuted uppercase block">Sustained Moisture</span>
                <span className="text-xl font-bold text-emerald-400">{activeResult.onsetProbability}%</span>
                <span className="text-[10px] text-textMuted block mt-0.5">Probabilistic</span>
              </div>
              <div className="bg-background/60 p-3 rounded-lg border border-panelBorder/40">
                <span className="text-[11px] text-textMuted uppercase block">Dry Break Risk</span>
                <span className={`text-xl font-bold ${activeResult.breakRisk > 50 ? 'text-amber-400' : 'text-textMain'}`}>
                  {activeResult.breakRisk}%
                </span>
                <span className="text-[10px] text-textMuted block mt-0.5">Seedling stress</span>
              </div>
              <div className="bg-background/60 p-3 rounded-lg border border-panelBorder/40">
                <span className="text-[11px] text-textMuted uppercase block">False Onset Hazard</span>
                <span className={`text-xl font-bold ${activeResult.falseOnsetRisk > 50 ? 'text-rose-400' : 'text-textMain'}`}>
                  {activeResult.falseOnsetRisk}%
                </span>
                <span className="text-[10px] text-textMuted block mt-0.5">Desiccation threat</span>
              </div>
              <div className="bg-background/60 p-3 rounded-lg border border-panelBorder/40">
                <span className="text-[11px] text-textMuted uppercase block">Rainfall Window</span>
                <span className="text-xl font-bold text-cyan-400">{activeResult.expectedRainfallMm} mm</span>
                <span className="text-[10px] text-textMuted block mt-0.5">Req: {crop.minimumRainfallMm}mm</span>
              </div>
            </div>

            {/* Bilingual Recommendation */}
            <div className="space-y-2.5 pt-2">
              <div className="p-3.5 rounded-lg bg-primary/10 border border-primary/30">
                <div className="text-xs font-bold text-primary mb-1 uppercase font-mono">
                  [किसान सलाह]:
                </div>
                <div className="text-sm text-textMain leading-relaxed font-medium">
                  {activeResult.recommendationHi}
                </div>
              </div>

              <div className="p-3 rounded-lg bg-panel/50 border border-panelBorder/40 text-xs text-textMuted leading-relaxed">
                <span className="font-semibold text-textMain mr-1">English Advisory:</span>
                {activeResult.recommendationEn}
              </div>
            </div>

            {/* Scientific disclaimer */}
            <div className="p-3 rounded-lg bg-panel/30 border border-panelBorder/30 text-[11px] text-textMuted flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-primary shrink-0" />
              <span>
                All simulated outcomes represent probabilistic distributions derived from Open-Meteo ensemble feeds and crop moisture parameters. No simulation constitutes an unconditional crop guarantee.
              </span>
            </div>
          </div>

          {/* Right Column: Agronomic Profile & Notes */}
          <div className="glass-panel p-5 space-y-4">
            <h3 className="font-bold text-base text-textMain flex items-center gap-2">
              <Droplet className="w-4 h-4 text-primary" />
              Agronomic Specifications
            </h3>
            
            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-lg bg-background/50 border border-panelBorder/40">
                <div className="text-textMuted text-[11px]">Crop & Variety</div>
                <div className="font-bold text-textMain text-sm">{crop.name} ({crop.localName})</div>
                <div className="text-[11px] font-mono text-primary mt-0.5">{crop.scientificName}</div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="p-2.5 rounded-lg bg-background/50 border border-panelBorder/40">
                  <div className="text-textMuted text-[10px] uppercase">Min Moisture</div>
                  <div className="font-bold text-sm text-textMain">{crop.minimumRainfallMm} mm</div>
                </div>
                <div className="p-2.5 rounded-lg bg-background/50 border border-panelBorder/40">
                  <div className="text-textMuted text-[10px] uppercase">Dry Tolerance</div>
                  <div className="font-bold text-sm text-textMain">{crop.drySpellToleranceDays} days</div>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-background/50 border border-panelBorder/40 space-y-1">
                <div className="text-textMuted text-[11px] font-semibold">Agronomist Sowing Notes:</div>
                <div className="text-textMuted text-[11px] leading-relaxed">
                  {crop.sowingNotes}
                </div>
              </div>
            </div>

            <Link
              to="/command-center"
              className="btn-primary w-full py-2 text-xs flex items-center justify-center gap-1.5"
            >
              <span>Back to Command Center</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default Simulator;
