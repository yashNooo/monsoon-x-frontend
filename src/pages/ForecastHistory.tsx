import { useState, useEffect, useCallback } from 'react';
import { 
  History, 
  Calendar, 
  CloudRain, 
  ShieldCheck, 
  AlertTriangle, 
  ArrowRight, 
  Trash2, 
  Search, 
  MapPin 
} from 'lucide-react';
import { 
  getSavedAdvisories, 
  deleteAdvisoryRecord, 
  clearAllAdvisories, 
  type SavedAdvisoryRecord 
} from '../services/localStorageService';
import { Link } from 'react-router-dom';

export const ForecastHistory = () => {
  const [history, setHistory] = useState<SavedAdvisoryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const loadHistory = useCallback(() => {
    setLoading(true);
    try {
      const records = getSavedAdvisories();
      setHistory(records);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const handleDelete = (id: string) => {
    const updated = deleteAdvisoryRecord(id);
    setHistory(updated);
  };

  const handleClearAll = () => {
    if (window.confirm('Are you sure you want to clear all saved advisory history from local storage?')) {
      clearAllAdvisories();
      setHistory([]);
    }
  };

  const filteredHistory = history.filter((item) => {
    const query = searchTerm.toLowerCase();
    const crop = (item.crop_name || '').toLowerCase();
    const loc = `${item.location?.block || ''} ${item.location?.district || ''} ${item.location?.name || ''}`.toLowerCase();
    return crop.includes(query) || loc.includes(query);
  });

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-panel p-5">
        <div>
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <History className="w-5 h-5 text-primary" />
            <h2 className="heading-primary text-xl sm:text-2xl font-bold">
              Farmer Advisory History
            </h2>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/30 font-bold uppercase">
              Demo Mode &middot; Saved in Local Storage
            </span>
          </div>
          <p className="subheading text-xs sm:text-sm">
            Auditable record of probabilistic agro-meteorological advisories saved on your device
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {history.length > 0 && (
            <button
              onClick={handleClearAll}
              className="btn-secondary py-1.5 px-3 text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear History</span>
            </button>
          )}

          <Link
            to="/command-center"
            className="btn-primary py-1.5 px-4 text-xs flex items-center gap-1.5"
          >
            <span>Run New Forecast</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Filter search bar if history exists */}
      {history.length > 0 && (
        <div className="relative max-w-md">
          <Search className="w-4 h-4 text-textMuted absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Filter by crop name or block location..."
            className="w-full bg-background border border-panelBorder rounded-lg pl-9 pr-3 py-2 text-xs text-textMain focus:outline-none focus:border-primary"
          />
        </div>
      )}

      {loading ? (
        <div className="glass-panel p-12 text-center text-textMuted">
          <div className="inline-block animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full mb-3"></div>
          <p className="text-sm">Loading saved advisories from localStorage...</p>
        </div>
      ) : history.length === 0 ? (
        <div className="glass-panel p-12 text-center space-y-4">
          <CloudRain className="w-12 h-12 text-textMuted mx-auto opacity-50" />
          <div>
            <h3 className="text-lg font-semibold text-textMain">No Saved Advisories Yet</h3>
            <p className="text-xs text-textMuted max-w-md mx-auto mt-1">
              Analyze a crop on the Monsoon Command Center and click &ldquo;Save Advisory&rdquo; to store and track your farm&rsquo;s monsoon risks locally.
            </p>
          </div>
          <Link to="/command-center" className="btn-primary py-2 px-6 text-sm inline-flex items-center gap-2">
            Go to Command Center
          </Link>
        </div>
      ) : filteredHistory.length === 0 ? (
        <div className="glass-panel p-8 text-center text-textMuted text-xs">
          No saved advisories match &ldquo;{searchTerm}&rdquo;.
        </div>
      ) : (
        <div className="space-y-4">
          {filteredHistory.map((item) => {
            const dateStr = item.generated_at
              ? new Date(item.generated_at).toLocaleString('en-IN', {
                  timeZone: 'Asia/Kolkata',
                  dateStyle: 'medium',
                  timeStyle: 'short',
                })
              : 'Recent';

            return (
              <div key={item.id} className="glass-panel p-5 transition-all hover:border-primary/40 relative group">
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-3 mb-3">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-textMain text-base">
                        {item.crop_name}
                      </span>
                      <span className="text-xs text-textMuted">&middot;</span>
                      <span className="text-xs text-textMuted flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-primary" /> {dateStr} (IST)
                      </span>
                      <span className="text-xs text-textMuted">&middot;</span>
                      <span className="text-xs font-mono text-primary bg-primary/10 px-2 py-0.5 rounded">
                        {item.horizon_days}D Horizon
                      </span>
                    </div>

                    <div className="text-xs text-textMuted mt-1 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-primary" />
                      <span>{item.location?.block} Block</span>
                      {item.location?.panchayat && (
                        <span>({item.location.panchayat} Panchayat)</span>
                      )}
                      <span>&middot; {item.location?.district}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-mono px-2 py-0.5 rounded border uppercase bg-success/15 border-success/30 text-success">
                      {item.source}
                    </span>
                    <span className="text-[11px] text-textMuted font-mono px-2 py-0.5 rounded bg-panelBorder/40">
                      Conf: {item.confidence}
                    </span>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="p-1.5 text-textMuted hover:text-rose-400 rounded-lg hover:bg-rose-500/10 transition-colors ml-1"
                      title="Delete saved advisory"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* 4 Risk Metrics Bar */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 my-3 bg-background/50 p-2.5 rounded-lg border border-panelBorder/40">
                  <div>
                    <div className="text-[10px] text-textMuted uppercase font-semibold">Onset Prob</div>
                    <div className="text-sm font-bold text-emerald-400">{item.onset_probability}%</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-textMuted uppercase font-semibold">False Onset</div>
                    <div className={`text-sm font-bold ${Number(item.false_onset_risk) >= 50 ? 'text-rose-400' : 'text-textMain'}`}>
                      {item.false_onset_risk}%
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-textMuted uppercase font-semibold">Break Risk</div>
                    <div className={`text-sm font-bold ${Number(item.break_risk) >= 50 ? 'text-amber-400' : 'text-textMain'}`}>
                      {item.break_risk}%
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-textMuted uppercase font-semibold">Heavy Rain</div>
                    <div className="text-sm font-bold text-cyan-400">{item.heavy_rain_risk}%</div>
                  </div>
                </div>

                {/* Advisories */}
                <div className="space-y-1.5 mt-3 text-xs">
                  {item.advisory_hi && (
                    <div className="p-2.5 rounded bg-primary/5 border border-primary/20 text-textMain font-medium leading-relaxed">
                      <span className="text-primary font-semibold mr-1.5">[किसान सलाह]:</span>
                      {item.advisory_hi}
                    </div>
                  )}
                  {item.advisory_en && (
                    <div className="text-textMuted text-[11px] leading-relaxed pl-1">
                      {item.advisory_en}
                    </div>
                  )}
                </div>

                {/* Footer status */}
                <div className="mt-3 pt-2 border-t border-panelBorder/30 text-[10px] text-textMuted flex items-center justify-between">
                  <span className="flex items-center gap-1 text-primary">
                    <ShieldCheck className="w-3 h-3" />
                    Recommended Strategy: <strong>{item.best_decision || 'Wait 7 Days'}</strong>
                  </span>
                  <span className="flex items-center gap-1 text-amber-400">
                    <AlertTriangle className="w-3 h-3" />
                    Probabilistic advisory (not a guarantee)
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
