import { motion } from 'framer-motion';
import { AlertTriangle, CloudRain, Wind, Activity, CheckCircle2, ChevronRight } from 'lucide-react';

const FalseOnset = () => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="heading-primary flex items-center gap-3">
            <AlertTriangle className="text-warning w-8 h-8" />
            False Onset Intelligence
          </h2>
          <p className="text-sm text-textMuted mt-1">
            Evaluating the trustworthiness of initial rainfall events.
          </p>
        </div>
        <div className="px-4 py-2 bg-danger/10 border border-danger/20 rounded-lg flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-danger animate-pulse"></div>
          <span className="text-sm font-bold text-danger uppercase tracking-wider">High Risk Detected</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="glass-panel p-6 border-danger/30 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-6 opacity-5">
              <AlertTriangle className="w-48 h-48 text-danger" />
            </div>
            
            <h3 className="text-xl font-bold text-textMain mb-4 border-b border-panelBorder pb-4">
              Event Analysis: 12-14 July Rainfall
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-6">
              <div>
                <h4 className="text-sm uppercase tracking-wider text-textMuted font-semibold mb-2">Initial Indicators</h4>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-textMain flex items-center gap-2"><CloudRain className="w-4 h-4 text-primary" /> Rainfall Intensity</span>
                    <span className="text-success font-bold">Adequate (25mm)</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-textMain flex items-center gap-2"><Wind className="w-4 h-4 text-primary" /> Wind Direction</span>
                    <span className="text-warning font-bold">Marginal</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-textMain flex items-center gap-2"><Activity className="w-4 h-4 text-primary" /> Soil Moisture</span>
                    <span className="text-success font-bold">Improving</span>
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="text-sm uppercase tracking-wider text-textMuted font-semibold mb-2">Stability Indicators</h4>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-textMain">Rainfall Persistence</span>
                    <span className="text-danger font-bold">Low (1-2 days)</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-textMain">Subsequent Dry Spell</span>
                    <span className="text-danger font-bold">High Prob (7+ days)</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-textMain">MJO Favorable Phase</span>
                    <span className="text-danger font-bold">Exiting Phase</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-danger/10 border border-danger/30 rounded-lg p-5">
              <h4 className="font-bold text-danger text-lg mb-2">Conclusion: Likely False Onset</h4>
              <p className="text-sm text-textMain leading-relaxed">
                While the rainfall event on July 12th meets basic intensity criteria, our probabilistic models indicate a <strong>71% chance of a subsequent dry spell lasting 7-10 days</strong>. 
                Sowing immediately after this event carries significant risk of moisture stress before the monsoon fully establishes.
              </p>
            </div>
          </div>
          
          <div className="glass-panel p-6">
            <h3 className="font-bold text-lg mb-4">Historical False Onset Comparison</h3>
            <div className="h-64 flex items-end justify-between gap-2 border-b border-l border-panelBorder p-4">
              {/* Mock bar chart */}
              {[2018, 2019, 2020, 2021, 2022, 2023].map((year, i) => (
                <div key={year} className="flex flex-col items-center gap-2 w-full group relative">
                  <div className="w-full bg-primary/20 rounded-t-sm hover:bg-primary/40 transition-colors relative" style={{ height: `${Math.random() * 60 + 20}%` }}>
                    {i === 2 && (
                      <div className="absolute -top-3 w-full flex justify-center">
                        <AlertTriangle className="w-4 h-4 text-danger" />
                      </div>
                    )}
                  </div>
                  <span className="text-xs text-textMuted">{year}</span>
                </div>
              ))}
            </div>
            <p className="text-xs text-textMuted mt-4 text-center">
              Comparing current atmospheric conditions to historical false-onset signatures. Current pattern closely matches the 2020 false onset event.
            </p>
          </div>
        </div>
        
        <div className="space-y-6">
          <div className="glass-panel p-6">
            <h3 className="font-bold text-lg mb-4">What makes a False Onset?</h3>
            <ul className="space-y-4">
              <li className="flex gap-3">
                <div className="mt-1"><CheckCircle2 className="w-5 h-5 text-primary" /></div>
                <div>
                  <h4 className="font-semibold text-sm">Isolated Convection</h4>
                  <p className="text-xs text-textMuted mt-1">Pre-monsoon showers often mimic onset rainfall but lack sustained atmospheric support.</p>
                </div>
              </li>
              <li className="flex gap-3">
                <div className="mt-1"><CheckCircle2 className="w-5 h-5 text-primary" /></div>
                <div>
                  <h4 className="font-semibold text-sm">Wind Regime Failure</h4>
                  <p className="text-xs text-textMuted mt-1">Failure of cross-equatorial flow to establish and maintain moisture transport.</p>
                </div>
              </li>
              <li className="flex gap-3">
                <div className="mt-1"><CheckCircle2 className="w-5 h-5 text-primary" /></div>
                <div>
                  <h4 className="font-semibold text-sm">Large Scale Forcing</h4>
                  <p className="text-xs text-textMuted mt-1">Unfavorable MJO phase transition immediately following the initial rainfall event.</p>
                </div>
              </li>
            </ul>
          </div>
          
          <div className="glass-panel p-6 border-warning/30 bg-warning/5">
            <h3 className="font-bold text-lg mb-2">Agricultural Impact</h3>
            <p className="text-sm text-textMuted mb-4">
              Premature sowing during a false onset leads to seed mortality or stunted early growth due to the subsequent dry spell.
            </p>
            <button className="btn-secondary w-full flex items-center justify-center gap-2">
              View Sowing Alternatives <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FalseOnset;
