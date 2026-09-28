import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CloudRain, AlertCircle, Sun, Wind, ChevronDown, CheckCircle2 } from 'lucide-react';
import { useLocation } from '../context/LocationContext';
import { getForecast } from '../services/api';

const MetricCard = ({ title, probability, confidence, details, icon: Icon, colorClass, statusText }) => (
  <div className="glass-panel p-5 relative overflow-hidden group">
    <div className={`absolute top-0 right-0 w-32 h-32 opacity-5 rounded-full -mr-10 -mt-10 bg-current ${colorClass}`}></div>
    <div className="flex justify-between items-start mb-4">
      <div className="flex items-center gap-2">
        <Icon className={`w-5 h-5 ${colorClass}`} />
        <h3 className="font-semibold text-sm text-textMuted uppercase tracking-wider">{title}</h3>
      </div>
      <div className={`text-xs px-2 py-1 rounded border ${statusText === 'High' || statusText === 'Medium-High' ? 'bg-success/10 border-success/20 text-success' : 'bg-warning/10 border-warning/20 text-warning'}`}>
        Confidence: {confidence}
      </div>
    </div>
    
    <div className="mb-2">
      <span className="text-4xl font-bold tracking-tight">{probability}%</span>
      <span className="text-sm text-textMuted ml-2">probability</span>
    </div>
    
    <p className="text-sm text-textMuted">{details}</p>
    
    <button className="mt-4 text-xs text-primary flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
      View Explainability <ChevronDown className="w-3 h-3" />
    </button>
  </div>
);

const CommandCenter = () => {
  const { locationId, locationName } = useLocation();
  const [horizon, setHorizon] = useState('14 Days');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const h = parseInt(horizon.split(' ')[0]);
      const res = await getForecast(locationId, h);
      setData(res);
      setLoading(false);
    };
    fetchData();
  }, [locationId, horizon]);

  if (loading || !data) {
    return <div className="flex justify-center items-center h-64"><div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin"></div></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="heading-primary">Command Center</h2>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-sm text-textMuted">{locationName}</span>
            {data.isDemo && <span className="px-2 py-0.5 rounded-full bg-primary/20 text-primary text-[10px] font-bold uppercase tracking-wider">Demo Data Active</span>}
          </div>
        </div>
        
        <div className="glass-panel p-1 flex space-x-1">
          {['7 Days', '14 Days', '21 Days', '30 Days'].map(h => (
            <button
              key={h}
              onClick={() => setHorizon(h)}
              className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-colors ${horizon === h ? 'bg-primary text-white' : 'text-textMuted hover:text-white'}`}
            >
              {h}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard 
          title="Monsoon Onset"
          probability={data.onset.probability}
          confidence={data.onset.confidence}
          details={data.onset.details}
          icon={CloudRain}
          colorClass="text-primary"
          statusText={data.onset.probability > 70 ? "High" : "Medium"}
        />
        <MetricCard 
          title="False Onset Risk"
          probability={data.false_onset.risk_percentage}
          confidence="High"
          details={`Risk is ${data.false_onset.status}. Rainfall persistence indicators are evaluated.`}
          icon={CheckCircle2}
          colorClass={data.false_onset.risk_percentage > 50 ? "text-danger" : "text-success"}
          statusText="High"
        />
        <MetricCard 
          title="Monsoon Break"
          probability={data.break_risk.probability}
          confidence="Medium"
          details={`Expected duration: ${data.break_risk.expected_duration}.`}
          icon={Sun}
          colorClass="text-warning"
          statusText="Medium"
        />
        <MetricCard 
          title="Heavy Rain Risk"
          probability={data.heavy_rain.probability}
          confidence={data.heavy_rain.confidence}
          details="Indicators for extreme rainfall events in this horizon."
          icon={AlertCircle}
          colorClass="text-danger"
          statusText={data.heavy_rain.confidence}
        />
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 glass-panel p-6 min-h-[400px] flex flex-col justify-center items-center text-center">
          <Wind className="w-12 h-12 text-panelBorder mb-4" />
          <h3 className="text-lg font-medium text-textMuted">GIS Visualization Loading</h3>
          <p className="text-sm text-textMuted mt-2 max-w-sm">
            Map integration pending. This area will display hyperlocal risk maps, rainfall anomalies, and sowing suitability indices.
          </p>
        </div>
        
        <div className="glass-panel p-6 flex flex-col gap-4">
          <h3 className="font-semibold text-lg border-b border-panelBorder pb-3">Sowing Decision Support</h3>
          
          <div className="bg-panel border border-warning/30 rounded-lg p-4">
            <h4 className="font-medium text-warning flex items-center gap-2 mb-2">
              <AlertCircle className="w-4 h-4" /> Wait 7 Days
            </h4>
            <p className="text-sm text-textMuted mb-3">
              Current rainfall probability is moderate, but the model detects elevated dry-spell risk starting next week.
            </p>
            <button className="text-xs font-semibold text-white bg-warning/20 hover:bg-warning/30 px-3 py-1.5 rounded transition-colors w-full">
              Open Simulator
            </button>
          </div>
          
          <div className="mt-auto pt-4">
            <h4 className="text-xs uppercase tracking-widest text-textMuted mb-2">Climate Signals</h4>
            <div className="space-y-2">
              <div className="flex justify-between items-center text-sm">
                <span className="text-textMuted">ENSO State</span>
                <span className="text-success font-medium">Neutral</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-textMuted">IOD</span>
                <span className="text-warning font-medium">Positive (+0.4)</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-textMuted">MJO</span>
                <span className="text-primary font-medium">Phase 3</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommandCenter;
