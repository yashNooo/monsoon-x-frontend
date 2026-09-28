import { useState, useEffect } from 'react';
import { Activity, ArrowRight, CloudRain, Sun, Calendar, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { useLocation } from '../context/LocationContext';
import { getSimulator } from '../services/api';

const Simulator = () => {
  const { locationId, locationName } = useLocation();
  const [sowingDate, setSowingDate] = useState('Wait 7 Days');
  const [crop, setCrop] = useState('Pearl Millet (Bajra)');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const res = await getSimulator(locationId, crop, sowingDate);
      setData(res);
      setLoading(false);
    };
    fetchData();
  }, [locationId, crop, sowingDate]);
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="heading-primary flex items-center gap-3">
            <Activity className="text-primary w-8 h-8" />
            What-If Sowing Simulator
          </h2>
          <p className="text-sm text-textMuted mt-1">
            Evaluate agricultural decisions against probabilistic climate scenarios.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1 glass-panel p-6 flex flex-col gap-6">
          <div>
            <h3 className="font-semibold text-sm uppercase tracking-wider text-textMuted mb-3">Location & Crop</h3>
            <div className="space-y-3">
              <div className="w-full bg-panelBorder/20 border border-panelBorder rounded-lg p-2 text-sm text-textMuted select-none">
                {locationName}
              </div>
              <select value={crop} onChange={e => setCrop(e.target.value)} className="w-full bg-panelBorder/50 border border-panelBorder rounded-lg p-2 text-sm text-textMain outline-none focus:border-primary/50">
                <option>Pearl Millet (Bajra)</option>
                <option>Sorghum (Jowar)</option>
                <option>Green Gram (Moong)</option>
              </select>
            </div>
          </div>
          
          <div>
            <h3 className="font-semibold text-sm uppercase tracking-wider text-textMuted mb-3">Simulated Action</h3>
            <div className="space-y-2">
              {['Sow Today', 'Wait 7 Days', 'Wait 14 Days'].map(option => (
                <button
                  key={option}
                  onClick={() => setSowingDate(option)}
                  className={`w-full text-left px-4 py-3 rounded-lg text-sm font-medium transition-all ${sowingDate === option ? 'bg-primary text-white shadow-md shadow-primary/20' : 'bg-panelBorder/30 text-textMuted hover:bg-panelBorder/50'}`}
                >
                  <div className="flex items-center justify-between">
                    <span>{option}</span>
                    {sowingDate === option && <CheckCircle2 className="w-4 h-4" />}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-3 glass-panel p-6 relative min-h-[400px]">
          {loading ? (
            <div className="absolute inset-0 flex justify-center items-center"><div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin"></div></div>
          ) : data && (
            <>
              <div className="flex items-center justify-between border-b border-panelBorder pb-4 mb-6">
                <h3 className="text-xl font-bold">Simulation Results: <span className="text-primary">{sowingDate}</span></h3>
                <div className="flex gap-2">
                  {data.isDemo && <span className="px-3 py-1 rounded bg-primary/20 text-xs font-semibold uppercase tracking-widest text-primary">Demo</span>}
                  <span className="px-3 py-1 rounded bg-panelBorder/50 text-xs font-semibold uppercase tracking-widest text-textMuted">Confidence: High</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <div className="bg-panelBorder/30 rounded-xl p-4 border border-panelBorder">
                  <div className="flex items-center gap-2 mb-2 text-textMuted">
                    <CloudRain className="w-4 h-4" /> <span className="text-sm font-semibold uppercase tracking-wider">Onset Probability</span>
                  </div>
                  <div className="text-3xl font-bold text-textMain">{data.onset_probability}%</div>
                </div>
                <div className={`bg-panelBorder/30 rounded-xl p-4 border ${data.break_risk > 50 ? 'border-danger/30' : 'border-panelBorder'}`}>
                  <div className="flex items-center gap-2 mb-2 text-textMuted">
                    <Sun className="w-4 h-4" /> <span className="text-sm font-semibold uppercase tracking-wider">Break Risk</span>
                  </div>
                  <div className={`text-3xl font-bold ${data.break_risk > 50 ? 'text-danger' : data.break_risk > 30 ? 'text-warning' : 'text-success'}`}>
                    {data.break_risk}%
                  </div>
                </div>
                <div className="bg-panelBorder/30 rounded-xl p-4 border border-panelBorder">
                  <div className="flex items-center gap-2 mb-2 text-textMuted">
                    <Calendar className="w-4 h-4" /> <span className="text-sm font-semibold uppercase tracking-wider">Rainfall Outlook</span>
                  </div>
                  <div className="text-xl font-bold text-textMain mt-2">
                    {data.rainfall_outlook}
                  </div>
                </div>
              </div>

              <div className="bg-panelBorder/20 rounded-xl p-6 border border-primary/20 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-primary"></div>
                <h4 className="text-lg font-bold text-primary mb-3">Decision Support Advisory</h4>
                
                {sowingDate === 'Sow Today' && (
                  <div className="space-y-4">
                    <p className="text-textMain">Sowing today carries significant risk. While initial moisture is present, there is a high probability ({data.break_risk}%) of a subsequent 7-10 day dry spell starting next week.</p>
                    <div className="flex items-start gap-3 bg-danger/10 p-3 rounded border border-danger/20 text-sm">
                      <AlertTriangle className="w-5 h-5 text-danger shrink-0" />
                      <p className="text-danger font-medium">Likely Outcome: High risk of seedling mortality due to moisture stress during early vegetative stage.</p>
                    </div>
                  </div>
                )}
                
                {sowingDate === 'Wait 7 Days' && (
                  <div className="space-y-4">
                    <p className="text-textMain">Waiting 7 days aligns with a higher-confidence rainfall window under the current forecast scenario. MJO indicators become significantly more favorable.</p>
                    <div className="flex items-start gap-3 bg-success/10 p-3 rounded border border-success/20 text-sm">
                      <CheckCircle2 className="w-5 h-5 text-success shrink-0" />
                      <p className="text-success font-medium">Likely Outcome: Favorable soil moisture for germination and lower risk of immediate dry spells.</p>
                    </div>
                  </div>
                )}
                
                {sowingDate === 'Wait 14 Days' && (
                  <div className="space-y-4">
                    <p className="text-textMain">Waiting 14 days offers the highest onset probability, but may delay the crop cycle unnecessarily.</p>
                    <div className="flex items-start gap-3 bg-warning/10 p-3 rounded border border-warning/20 text-sm">
                      <Sun className="w-5 h-5 text-warning shrink-0" />
                      <p className="text-warning font-medium">Consideration: Very safe from false onset, but monitor for potential late-season moisture stress if the monsoon withdraws early.</p>
                    </div>
                  </div>
                )}
                
                <div className="mt-6 pt-4 border-t border-panelBorder/50">
                  <p className="text-xs text-textMuted italic">Note: This is a probabilistic simulation based on current atmospheric conditions and historical data. Consult local agricultural extension services for field-specific decisions.</p>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Simulator;
