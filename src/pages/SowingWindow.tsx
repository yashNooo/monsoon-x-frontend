import { Calendar, CheckCircle2, AlertTriangle, CloudRain, Wind, Activity } from 'lucide-react';

const SowingWindow = () => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="heading-primary flex items-center gap-3">
            <Calendar className="text-primary w-8 h-8" />
            Hyperlocal Sowing Window
          </h2>
          <p className="text-sm text-textMuted mt-1">
            Dynamic crop-specific sowing recommendations based on probabilistic weather outlooks.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 glass-panel p-6">
          <h3 className="font-semibold text-sm uppercase tracking-wider text-textMuted mb-4">Input Parameters</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-textMuted mb-1">Crop Type</label>
              <select className="w-full bg-panelBorder/50 border border-panelBorder rounded-lg p-2 text-sm text-textMain outline-none">
                <option>Pearl Millet (Bajra)</option>
                <option>Sorghum (Jowar)</option>
                <option>Green Gram (Moong)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-textMuted mb-1">Soil Type</label>
              <select className="w-full bg-panelBorder/50 border border-panelBorder rounded-lg p-2 text-sm text-textMain outline-none">
                <option>Sandy Loam</option>
                <option>Clay Loam</option>
                <option>Alluvial</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-textMuted mb-1">Location</label>
              <select className="w-full bg-panelBorder/50 border border-panelBorder rounded-lg p-2 text-sm text-textMain outline-none">
                <option>Sanganer Block</option>
              </select>
            </div>
            
            <button className="btn-primary w-full mt-4 py-2 text-sm">Calculate Window</button>
          </div>
        </div>

        <div className="lg:col-span-2 glass-panel p-6 border-success/30 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-6 opacity-5">
            <CheckCircle2 className="w-48 h-48 text-success" />
          </div>
          
          <h3 className="text-xl font-bold text-textMain mb-2">Recommended Window: <span className="text-success">8–14 July</span></h3>
          <div className="inline-flex items-center gap-2 px-2 py-1 rounded bg-success/10 border border-success/20 text-success text-xs font-bold uppercase tracking-wider mb-6">
            Confidence: 82%
          </div>

          <div className="space-y-6">
            <div>
              <h4 className="font-semibold text-sm text-textMuted mb-3 border-b border-panelBorder pb-2">Why this window?</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-success mt-0.5 shrink-0" />
                  <div>
                    <span className="text-sm font-medium">Rainfall Persistence</span>
                    <p className="text-xs text-textMuted">High probability of sustained rain following July 8th.</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-success mt-0.5 shrink-0" />
                  <div>
                    <span className="text-sm font-medium">Onset Confidence</span>
                    <p className="text-xs text-textMuted">MJO transitions to Phase 4 (favorable) by July 9th.</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-success mt-0.5 shrink-0" />
                  <div>
                    <span className="text-sm font-medium">Low Break Risk</span>
                    <p className="text-xs text-textMuted">Dry spell probability drops below 30%.</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-success mt-0.5 shrink-0" />
                  <div>
                    <span className="text-sm font-medium">Soil Moisture</span>
                    <p className="text-xs text-textMuted">Sandy loam requires consistent early moisture.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-warning/10 border border-warning/30 rounded-lg p-4">
              <h4 className="font-medium text-warning text-sm flex items-center gap-2 mb-2">
                <AlertTriangle className="w-4 h-4" /> Why not today?
              </h4>
              <p className="text-sm text-textMain">
                Current rainfall probability is moderate, but the model detects elevated false-onset and dry-spell risk over the next 5 days. Sowing today risks critical moisture stress during the germination phase.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SowingWindow;
