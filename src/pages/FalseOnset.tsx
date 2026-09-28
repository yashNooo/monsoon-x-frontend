import { useState, useEffect, useMemo } from 'react';
import { 
  AlertTriangle, 
  CloudRain, 
  Activity, 
  CheckCircle2, 
  Info,
  ArrowRight
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  ComposedChart, 
  Bar, 
  Line, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid 
} from 'recharts';
import { useLocation } from '../context/LocationContext';
import { fetchWeatherForecast, type DailyForecastDay } from '../services/weatherService';
import { getCropById } from '../data/agriculturalData';
import { computeHybridRisk } from '../services/riskEngine';
import { Link } from 'react-router-dom';

export const FalseOnset = () => {
  const { latitude, longitude, block, selectedCropId } = useLocation();
  const [dailyData, setDailyData] = useState<DailyForecastDay[]>([]);
  const [isLive, setIsLive] = useState(true);
  const [loading, setLoading] = useState(true);
  const [riskScore, setRiskScore] = useState(68);

  const crop = getCropById(selectedCropId);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const weather = await fetchWeatherForecast(latitude, longitude);
        setDailyData(weather.daily);
        setIsLive(weather.isLive);
        const risk = computeHybridRisk(weather, crop, 14);
        setRiskScore(risk.falseOnsetRisk);
      } catch (err) {
        console.warn('Failed loading weather for false onset:', err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [latitude, longitude, selectedCropId]);

  // Transform daily weather into chart format with cumulative rain & dry gap indicator
  const chartData = useMemo(() => {
    let runningTotal = 0;
    let consecutiveDry = 0;
    return dailyData.map((d) => {
      runningTotal += d.precipitationSumMm;
      if (d.precipitationSumMm < 2.5) {
        consecutiveDry++;
      } else {
        consecutiveDry = 0;
      }

      return {
        day: d.date.slice(5), // MM-DD
        rainfall: d.precipitationSumMm,
        cumulative: Number(runningTotal.toFixed(1)),
        dryStreak: consecutiveDry,
        prob: d.precipitationProbabilityMax,
      };
    });
  }, [dailyData]);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="glass-panel p-6 border-l-4 border-l-danger relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <AlertTriangle className="w-5 h-5 text-danger" />
              <h2 className="heading-primary text-2xl font-bold">False Onset Diagnostic Engine</h2>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded border uppercase ${isLive ? 'bg-success/15 border-success/30 text-success' : 'bg-warning/15 border-warning/30 text-warning'}`}>
                {isLive ? 'Live Meteo Feed' : 'Historical Sample Data'}
              </span>
            </div>
            <p className="subheading text-sm max-w-3xl">
              Distinguishing transient pre-monsoon convective thunderstorms from genuine synoptic monsoon surge. Protects farmers against seed scorching and catastrophic resowing expense.
            </p>
          </div>

          <div className="bg-panelBorder/30 p-4 rounded-xl border border-panelBorder flex flex-col items-center justify-center shrink-0 min-w-[160px]">
            <span className="text-xs text-textMuted uppercase font-semibold">False Onset Risk</span>
            <span className={`text-4xl font-extrabold ${riskScore >= 50 ? 'text-danger' : 'text-emerald-400'}`}>
              {riskScore}%
            </span>
            <span className="text-[10px] text-textMuted font-mono mt-0.5">
              {block} Block · {crop.localName}
            </span>
          </div>
        </div>
      </div>

      {/* Main Analysis Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Interactive Rainfall & Dry Spell Chart */}
        <div className="lg:col-span-2 glass-panel p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-panelBorder/50 pb-3">
            <div>
              <h3 className="font-bold text-base text-textMain flex items-center gap-2">
                <CloudRain className="w-4 h-4 text-primary" />
                14-Day Precipitation & Dry-Streak Distribution
              </h3>
              <p className="text-xs text-textMuted">
                Daily rainfall (bars, mm) compared against cumulative moisture accumulation (line, mm).
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="flex items-center gap-1 text-primary">
                <span className="w-2.5 h-2.5 rounded bg-primary"></span> Rain (mm)
              </span>
              <span className="flex items-center gap-1 text-emerald-400">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span> Cumulative
              </span>
            </div>
          </div>

          {/* Recharts Composed Chart */}
          <div className="h-72 w-full pt-2">
            {loading ? (
              <div className="h-full flex items-center justify-center text-xs text-textMuted">
                Loading precipitation sequence...
              </div>
            ) : chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e3a5f" opacity={0.3} />
                  <XAxis 
                    dataKey="day" 
                    stroke="#94a3b8" 
                    fontSize={11} 
                    tickLine={false} 
                  />
                  <YAxis 
                    yAxisId="left" 
                    stroke="#94a3b8" 
                    fontSize={11} 
                    tickLine={false} 
                    unit="mm" 
                  />
                  <YAxis 
                    yAxisId="right" 
                    orientation="right" 
                    stroke="#10b981" 
                    fontSize={11} 
                    tickLine={false} 
                    unit="mm" 
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#0a1426', 
                      borderColor: '#1e3c64', 
                      borderRadius: '8px', 
                      color: '#f8fafc',
                      fontSize: '12px'
                    }} 
                  />
                  <Bar 
                    yAxisId="left" 
                    dataKey="rainfall" 
                    name="Daily Rain (mm)" 
                    fill="#0ea5e9" 
                    radius={[4, 4, 0, 0]} 
                  />
                  <Line 
                    yAxisId="right" 
                    type="monotone" 
                    dataKey="cumulative" 
                    name="Cumulative Rain (mm)" 
                    stroke="#10b981" 
                    strokeWidth={2.5} 
                    dot={{ r: 3, fill: '#10b981' }} 
                  />
                </ComposedChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-textMuted">
                No precipitation sequence available.
              </div>
            )}
          </div>

          {/* Diagnostic interpretation */}
          <div className="p-3.5 bg-background/50 rounded-lg border border-panelBorder/40 text-xs text-textMuted space-y-1.5">
            <div className="font-semibold text-textMain flex items-center gap-1.5">
              <Info className="w-4 h-4 text-primary" />
              Agronomic Diagnosis for {block} Block:
            </div>
            <p className="leading-relaxed">
              When an initial rainfall spike occurs but is immediately succeeded by 4 or more dry days with under 2.5 mm precipitation, topsoil moisture evaporates rapidly under high summer solar radiation. Young {crop.localName} radicles cannot penetrate hardened crust, resulting in seed desiccation.
            </p>
          </div>
        </div>

        {/* Right Column: Diagnostic Checklist & Verification */}
        <div className="space-y-4">
          <div className="glass-panel p-5 space-y-3">
            <h3 className="font-bold text-base text-textMain flex items-center gap-2">
              <Activity className="w-4 h-4 text-primary" />
              Tri-Point Verification Checklist
            </h3>
            <p className="text-xs text-textMuted">
              Scientific criteria required to declare genuine monsoon onset vs false convective alarm.
            </p>

            <div className="space-y-2.5 pt-2">
              <div className="p-3 rounded-lg bg-panel/60 border border-panelBorder/50 flex items-start gap-3">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div className="text-xs">
                  <div className="font-semibold text-textMain">1. Rainfall Spatial Continuity</div>
                  <div className="text-textMuted text-[11px] mt-0.5">
                    Precipitation must cover &gt;60% of neighbouring stations for 2 consecutive days.
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-panel/60 border border-panelBorder/50 flex items-start gap-3">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div className="text-xs">
                  <div className="font-semibold text-textMain">2. Follow-Up Shower Probability</div>
                  <div className="text-textMuted text-[11px] mt-0.5">
                    Post-onset dry spell must not exceed 4 days in week 1.
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-panel/60 border border-panelBorder/50 flex items-start gap-3">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div className="text-xs">
                  <div className="font-semibold text-textMain">3. Soil Moisture Infiltration</div>
                  <div className="text-textMuted text-[11px] mt-0.5">
                    Subsurface wet front must reach 10-15 cm depth without dry intervening layers.
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Farmer Decision Card */}
          <div className="glass-panel p-5 space-y-3">
            <div className="text-xs font-semibold text-textMuted uppercase tracking-wider">
              Recommended Farmer Action
            </div>
            <div className="text-sm font-bold text-white">
              {riskScore >= 50
                ? 'Wait 7 Days for Sustained Synoptic Flow'
                : 'Safe Sowing Window Confirmed'}
            </div>
            <p className="text-xs text-textMuted leading-relaxed">
              {riskScore >= 50
                ? `Do not sow dryland ${crop.localName} immediately after first rain. Wait until follow-up showers guarantee root-zone moisture.`
                : `Rainfall distribution is stable. Proceed with land preparation and certified seed sowing.`}
            </p>
            <Link
              to="/simulator"
              className="btn-primary w-full py-2 text-xs flex items-center justify-center gap-1.5"
            >
              <span>Simulate Sowing Scenarios</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FalseOnset;
