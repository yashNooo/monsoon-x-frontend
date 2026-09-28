import { FileText, Database, GitMerge, CheckCircle, ShieldAlert } from 'lucide-react';

const Methodology = () => {
  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-12">
      <div className="text-center mb-10">
        <h2 className="text-4xl font-extrabold tracking-tight mb-4 text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">System Methodology & Architecture</h2>
        <p className="text-textMuted text-lg max-w-2xl mx-auto">
          Transparency in predictive modeling. How MONSOON-X translates global climate signals into hyperlocal agricultural decisions.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="glass-panel p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 rounded-xl bg-primary/10 text-primary">
              <Database className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold">Data Sources & Features</h3>
          </div>
          <div className="space-y-4">
            <p className="text-sm text-textMuted leading-relaxed">
              Our models rely on a combination of global macroeconomic climate drivers and localized historical weather patterns, engineered to prevent data leakage.
            </p>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-2 border-b border-panelBorder/50 pb-2">
                <span className="font-semibold text-textMain min-w-[120px]">Climate Signals:</span>
                <span className="text-textMuted">Madden-Julian Oscillation (MJO) Phase/Amplitude, ENSO Anomalies, Indian Ocean Dipole (IOD).</span>
              </li>
              <li className="flex items-start gap-2 border-b border-panelBorder/50 pb-2">
                <span className="font-semibold text-textMain min-w-[120px]">Temporal Features:</span>
                <span className="text-textMuted">Lag (1,3,7,14 days) and Rolling Mean (3,7,14 days) strictly using left-closed windows to prevent future-data contamination.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-semibold text-textMain min-w-[120px]">Local Drivers:</span>
                <span className="text-textMuted">Rainfall anomalies, temperature, humidity, pressure, and soil moisture indices.</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="glass-panel p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 rounded-xl bg-primary/10 text-primary">
              <GitMerge className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold">Hybrid ML Architecture</h3>
          </div>
          <div className="space-y-4">
            <p className="text-sm text-textMuted leading-relaxed">
              We employ an ensemble approach. XGBoost serves as the core probabilistic engine, outperforming standard Climatology and Persistence baselines.
            </p>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-2 border-b border-panelBorder/50 pb-2">
                <span className="font-semibold text-textMain min-w-[120px]">Onset Engine:</span>
                <span className="text-textMuted">Outputs probabilities for 7/14/30-day horizons.</span>
              </li>
              <li className="flex items-start gap-2 border-b border-panelBorder/50 pb-2">
                <span className="font-semibold text-textMain min-w-[120px]">False-Onset Engine:</span>
                <span className="text-textMuted">Identifies isolated convective events lacking atmospheric support (e.g., MJO phase mismatch + low persistence).</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-semibold text-textMain min-w-[120px]">Break Engine:</span>
                <span className="text-textMuted">Predicts dry-spell risk dynamically, overriding traditional 1-day threshold limitations.</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div className="glass-panel p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 rounded-xl bg-success/10 text-success">
            <CheckCircle className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold">Validation & Evaluation (Prototype)</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-panelBorder text-xs uppercase tracking-wider text-textMuted">
                <th className="pb-3 pr-4 font-semibold">Model</th>
                <th className="pb-3 px-4 font-semibold">Brier Score (Lower is better)</th>
                <th className="pb-3 px-4 font-semibold">ROC-AUC (Higher is better)</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              <tr className="border-b border-panelBorder/50">
                <td className="py-3 pr-4 font-medium text-textMain">Climatology Baseline</td>
                <td className="py-3 px-4 text-textMuted">0.25</td>
                <td className="py-3 px-4 text-textMuted">0.50</td>
              </tr>
              <tr className="border-b border-panelBorder/50">
                <td className="py-3 pr-4 font-medium text-textMain">Persistence Baseline</td>
                <td className="py-3 px-4 text-textMuted">0.22</td>
                <td className="py-3 px-4 text-textMuted">0.58</td>
              </tr>
              <tr className="bg-primary/5">
                <td className="py-3 pr-4 font-bold text-primary">XGBoost (Hybrid)</td>
                <td className="py-3 px-4 text-primary font-bold">0.12</td>
                <td className="py-3 px-4 text-primary font-bold">0.84</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="text-xs text-textMuted italic mt-4">
          Note: Current metrics are derived from a prototype simulation. Evaluation on full historical datasets is pending real dataset integration.
        </p>
      </div>

      <div className="bg-panelBorder/20 border border-panelBorder rounded-xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <ShieldAlert className="w-5 h-5 text-warning" />
          <h4 className="font-bold text-lg">Limitations & Disclaimers</h4>
        </div>
        <ul className="list-disc list-inside space-y-2 text-sm text-textMuted">
          <li><strong>Probabilistic Nature:</strong> Models provide likelihoods and confidence intervals. We do not claim 100% prediction accuracy or zero error.</li>
          <li><strong>Not Official IMD Data:</strong> This system is a proof-of-concept built for SIH. The values displayed are <strong>Prototype Simulations</strong> and do not represent official India Meteorological Department (IMD) forecasts.</li>
          <li><strong>Agronomic Decisions:</strong> Recommendations from the Sowing Window Engine are rule-based prototypes. Final field-specific decisions must consult local agricultural extension services.</li>
        </ul>
      </div>
    </div>
  );
};

export default Methodology;
