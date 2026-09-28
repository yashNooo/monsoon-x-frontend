import { useState, useEffect } from 'react';
import { 
  Users, 
  ShieldAlert, 
  Send, 
  Download, 
  AlertTriangle, 
  X, 
  MessageSquare, 
  Search 
} from 'lucide-react';
import { REGIONAL_BLOCKS, type BlockPanchayatInfo, CROPS_CATALOG } from '../data/agriculturalData';
import { getSavedAlerts, saveAlertLog, type SavedAlertLog } from '../services/localStorageService';

export const OfficerDashboard = () => {
  const [blocks] = useState<BlockPanchayatInfo[]>(REGIONAL_BLOCKS);
  const [selectedBlockForAlert, setSelectedBlockForAlert] = useState<BlockPanchayatInfo | null>(null);
  const [selectedCrop, setSelectedCrop] = useState<string>('bajra');
  const [alertChannel, setAlertChannel] = useState<'SMS' | 'WhatsApp'>('SMS');
  const [customMessage, setCustomMessage] = useState<string>('');
  const [isAlertModalOpen, setIsAlertModalOpen] = useState(false);
  const [dispatchStatus, setDispatchStatus] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [recentAlerts, setRecentAlerts] = useState<SavedAlertLog[]>([]);

  useEffect(() => {
    setRecentAlerts(getSavedAlerts());
  }, []);

  const openAlertModal = (b: BlockPanchayatInfo) => {
    setSelectedBlockForAlert(b);
    const cropObj = CROPS_CATALOG.find(c => c.id === selectedCrop) || CROPS_CATALOG[0];
    setCustomMessage(
      `[MONSOON-X KRISHI ALERT] ${b.block} ब्लॉक के किसान ध्यान दें: ${b.advisoryHi} ${cropObj.localName} बुवाई से पूर्व कृषि विभाग के दिशानिर्देशों का पालन करें।`
    );
    setIsAlertModalOpen(true);
  };

  const handleSendAlert = async () => {
    if (!selectedBlockForAlert) return;
    setDispatchStatus('Dispatching...');

    const newAlert = saveAlertLog({
      block_name: selectedBlockForAlert.block,
      crop_name: selectedCrop,
      channel: alertChannel,
      status: 'Preview (Local Log)',
      message: customMessage,
    });

    setRecentAlerts([newAlert, ...recentAlerts.slice(0, 9)]);

    setDispatchStatus('Alert Logged (Demo Mode)');
    setTimeout(() => {
      setDispatchStatus(null);
      setIsAlertModalOpen(false);
    }, 1800);
  };

  // Export current block matrix to CSV
  const handleExportCSV = () => {
    const headers = [
      'Block',
      'District',
      'State',
      'Latitude',
      'Longitude',
      'Onset Probability (%)',
      'False Onset Risk (%)',
      'Break Risk (%)',
      'Heavy Rain Risk (%)',
      'Risk Classification',
      'Hindi Advisory'
    ];

    const rows = blocks.map(b => [
      `"${b.block}"`,
      `"${b.district}"`,
      `"${b.state}"`,
      b.latitude,
      b.longitude,
      b.onsetProbability,
      b.falseOnsetRisk,
      b.breakRisk,
      b.heavyRainRisk,
      `"${b.initialRisk}"`,
      `"${b.advisoryHi.replace(/"/g, '""')}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Monsoon-X_Jaipur_District_Risk_Report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredBlocks = blocks.filter(b => 
    b.block.toLowerCase().includes(searchTerm.toLowerCase()) ||
    b.initialRisk.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="glass-panel p-6 border-l-4 border-l-secondary flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Users className="w-5 h-5 text-secondary" />
            <h2 className="heading-primary text-2xl font-bold">Agricultural Officer Command Terminal</h2>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-primary/20 text-primary border border-primary/40 font-bold uppercase">
              District: Jaipur (Rajasthan)
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/30 font-bold uppercase">
              Demo Mode
            </span>
          </div>
          <p className="subheading text-sm max-w-2xl">
            Block-level agricultural surveillance, false-onset hotspot mitigation, and broadcast advisory coordination.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleExportCSV}
            className="btn-secondary py-2 px-3 text-xs flex items-center gap-1.5"
            title="Download CSV report"
          >
            <Download className="w-4 h-4 text-primary" />
            <span>Download Report (CSV)</span>
          </button>
        </div>
      </div>

      {/* Surveillance Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-panel p-4 space-y-1">
          <span className="text-xs text-textMuted uppercase font-semibold">Total Surveillance Blocks</span>
          <div className="text-2xl font-bold text-textMain">{blocks.length} Blocks</div>
          <div className="text-[11px] text-textMuted">Jaipur Agro-Climatic Zone III-A</div>
        </div>

        <div className="glass-panel p-4 space-y-1 border-l-2 border-l-danger">
          <span className="text-xs text-textMuted uppercase font-semibold">False Onset Hotspots</span>
          <div className="text-2xl font-bold text-danger">
            {blocks.filter(b => b.initialRisk === 'False Onset Risk').length} Blocks
          </div>
          <div className="text-[11px] text-danger/80">Sanganer, Chaksu, Shahpura</div>
        </div>

        <div className="glass-panel p-4 space-y-1 border-l-2 border-l-amber-500">
          <span className="text-xs text-textMuted uppercase font-semibold">Dry Break Alert</span>
          <div className="text-2xl font-bold text-amber-400">
            {blocks.filter(b => b.initialRisk === 'Break Risk').length} Blocks
          </div>
          <div className="text-[11px] text-amber-400/80">Phagi, Govindgarh</div>
        </div>

        <div className="glass-panel p-4 space-y-1 border-l-2 border-l-emerald-500">
          <span className="text-xs text-textMuted uppercase font-semibold">Safe Sowing Windows</span>
          <div className="text-2xl font-bold text-emerald-400">
            {blocks.filter(b => b.initialRisk === 'Safe Sowing').length} Blocks
          </div>
          <div className="text-[11px] text-emerald-400/80">Bassi, Jamwa Ramgarh</div>
        </div>
      </div>

      {/* Block Table with Search and Action */}
      <div className="glass-panel p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="font-bold text-base text-textMain flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-primary" />
              Block Vulnerability &amp; Risk Matrix
            </h3>
            <p className="text-xs text-textMuted">
              Click &ldquo;Dispatch Alert&rdquo; on any vulnerable block to broadcast tailored farmer SMS or WhatsApp.
            </p>
          </div>

          <div className="relative max-w-xs w-full">
            <Search className="w-4 h-4 text-textMuted absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Filter blocks or risk..."
              className="w-full bg-background border border-panelBorder rounded-lg pl-9 pr-3 py-1.5 text-xs text-textMain focus:outline-none focus:border-primary"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border border-panelBorder/50 rounded-lg overflow-hidden">
            <thead className="bg-panelBorder/30 text-textMuted uppercase text-[10px]">
              <tr>
                <th className="p-3">Block Name</th>
                <th className="p-3">Risk Category</th>
                <th className="p-3">Onset Prob</th>
                <th className="p-3">False Onset</th>
                <th className="p-3">Break Risk</th>
                <th className="p-3">Heavy Rain</th>
                <th className="p-3">Hindi Advisory Summary</th>
                <th className="p-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-panelBorder/30 text-textMain">
              {filteredBlocks.map((b) => (
                <tr key={b.id} className="hover:bg-panel/50 transition-colors">
                  <td className="p-3 font-bold text-textMain whitespace-nowrap">
                    {b.block}
                  </td>
                  <td className="p-3 whitespace-nowrap">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        b.initialRisk === 'Safe Sowing'
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : b.initialRisk === 'Break Risk'
                          ? 'bg-orange-500/20 text-orange-400'
                          : b.initialRisk === 'False Onset Risk'
                          ? 'bg-rose-500/20 text-rose-400'
                          : 'bg-amber-500/20 text-amber-400'
                      }`}
                    >
                      {b.initialRisk}
                    </span>
                  </td>
                  <td className="p-3 font-mono text-emerald-400">{b.onsetProbability}%</td>
                  <td className="p-3 font-mono text-rose-400">{b.falseOnsetRisk}%</td>
                  <td className="p-3 font-mono text-amber-400">{b.breakRisk}%</td>
                  <td className="p-3 font-mono text-cyan-400">{b.heavyRainRisk}%</td>
                  <td className="p-3 text-textMuted max-w-xs truncate" title={b.advisoryHi}>
                    {b.advisoryHi}
                  </td>
                  <td className="p-3 text-right whitespace-nowrap">
                    <button
                      onClick={() => openAlertModal(b)}
                      className="btn-primary py-1 px-2.5 text-[11px] inline-flex items-center gap-1"
                    >
                      <Send className="w-3 h-3" />
                      <span>Dispatch Alert</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Dispatched Alerts History */}
      {recentAlerts.length > 0 && (
        <div className="glass-panel p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-textMain flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-primary" />
              Recent Broadcast Dispatches (Alert Log)
            </h3>
            <span className="text-[10px] text-textMuted font-mono">
              Saved to alert_history
            </span>
          </div>

          <div className="space-y-2">
            {recentAlerts.slice(0, 5).map((a, i) => (
              <div key={a.id || i} className="p-2.5 bg-background/50 rounded-lg border border-panelBorder/40 text-xs flex items-center justify-between gap-3">
                <div>
                  <span className="font-bold text-textMain mr-2">{a.block_name} Block</span>
                  <span className="text-[10px] font-mono text-primary uppercase mr-2">[{a.channel}]</span>
                  <span className="text-textMuted truncate inline-block max-w-md align-bottom">
                    {a.message}
                  </span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[10px] text-textMuted font-mono">
                    {a.status || 'Preview'}
                  </span>
                  <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Alert Dispatch Modal */}
      {isAlertModalOpen && selectedBlockForAlert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          <div className="glass-panel w-full max-w-lg p-6 relative border-panelBorder shadow-2xl animate-in fade-in zoom-in-95">
            <button
              onClick={() => setIsAlertModalOpen(false)}
              className="absolute top-4 right-4 text-textMuted hover:text-white p-1 rounded-lg"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="mb-4">
              <div className="flex items-center gap-2 mb-1">
                <Send className="w-5 h-5 text-primary" />
                <h3 className="text-lg font-bold text-textMain">
                  Broadcast Farmer Advisory &middot; {selectedBlockForAlert.block} Block
                </h3>
              </div>
              <p className="text-xs text-textMuted">
                Review message preview before dispatching to enrolled district farmer numbers.
              </p>
            </div>

            <div className="space-y-3">
              {/* Channel and Crop Selector */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-textMuted block mb-1">Broadcast Channel</label>
                  <select
                    value={alertChannel}
                    onChange={(e) => setAlertChannel(e.target.value as any)}
                    className="w-full bg-background border border-panelBorder rounded-lg px-3 py-2 text-xs text-textMain focus:outline-none focus:border-primary"
                  >
                    <option value="SMS">SMS Gateway (Govt DLT)</option>
                    <option value="WhatsApp">WhatsApp Business API</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-textMuted block mb-1">Target Crop Focus</label>
                  <select
                    value={selectedCrop}
                    onChange={(e) => setSelectedCrop(e.target.value)}
                    className="w-full bg-background border border-panelBorder rounded-lg px-3 py-2 text-xs text-textMain focus:outline-none focus:border-primary"
                  >
                    {CROPS_CATALOG.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.localName} ({c.name})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Message text area */}
              <div>
                <label className="text-xs text-textMuted block mb-1">Bilingual SMS / WhatsApp Preview:</label>
                <textarea
                  rows={4}
                  value={customMessage}
                  onChange={(e) => setCustomMessage(e.target.value)}
                  className="w-full bg-background border border-panelBorder rounded-lg p-3 text-xs text-textMain focus:outline-none focus:border-primary font-mono leading-relaxed"
                />
              </div>

              {/* Clear notice regarding preview status */}
              <div className="p-2.5 rounded-lg bg-panelBorder/30 border border-panelBorder/40 text-[11px] text-textMuted flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                <span>
                  <strong>Alert Preview Mode:</strong> Telephony gateway integration pending. Dispatches will be safely recorded in the <code className="text-primary font-mono">alert_history</code> table.
                </span>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAlertModalOpen(false)}
                  className="btn-secondary py-2 px-4 text-xs"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSendAlert}
                  disabled={Boolean(dispatchStatus)}
                  className="btn-primary py-2 px-5 text-xs flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{dispatchStatus || 'Confirm & Dispatch'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OfficerDashboard;
