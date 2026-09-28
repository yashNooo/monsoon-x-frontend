import { Users, AlertTriangle, ShieldAlert, FileText, Send } from 'lucide-react';

const OfficerDashboard = () => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="heading-primary flex items-center gap-3">
            <Users className="text-primary w-8 h-8" />
            Extension Officer Dashboard
          </h2>
          <p className="text-sm text-textMuted mt-1">
            District-level risk monitoring and advisory distribution.
          </p>
        </div>
        <button className="btn-primary py-2 text-sm flex items-center gap-2">
          <FileText className="w-4 h-4" /> Download Report
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="glass-panel p-4">
          <span className="text-xs font-semibold uppercase tracking-wider text-textMuted block mb-1">Monitored Blocks</span>
          <span className="text-3xl font-bold text-textMain">13</span>
        </div>
        <div className="glass-panel p-4 border-danger/30">
          <span className="text-xs font-semibold uppercase tracking-wider text-textMuted block mb-1">High Risk Blocks</span>
          <span className="text-3xl font-bold text-danger">3</span>
        </div>
        <div className="glass-panel p-4 border-warning/30">
          <span className="text-xs font-semibold uppercase tracking-wider text-textMuted block mb-1">Break Risk Zones</span>
          <span className="text-3xl font-bold text-warning">5</span>
        </div>
        <div className="glass-panel p-4 border-success/30">
          <span className="text-xs font-semibold uppercase tracking-wider text-textMuted block mb-1">Safe Sowing Zones</span>
          <span className="text-3xl font-bold text-success">5</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 glass-panel p-6">
          <h3 className="font-semibold text-lg mb-4">Risk Distribution Table</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-panelBorder text-xs uppercase tracking-wider text-textMuted">
                  <th className="pb-3 pr-4 font-semibold">Block</th>
                  <th className="pb-3 px-4 font-semibold">Onset Prob</th>
                  <th className="pb-3 px-4 font-semibold">False Onset Risk</th>
                  <th className="pb-3 pl-4 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                <tr className="border-b border-panelBorder/50 hover:bg-panelBorder/20 transition-colors">
                  <td className="py-3 pr-4 font-medium text-textMain">Sanganer</td>
                  <td className="py-3 px-4 text-textMain">78%</td>
                  <td className="py-3 px-4 text-danger font-bold">High</td>
                  <td className="py-3 pl-4"><span className="px-2 py-1 bg-danger/10 text-danger rounded text-xs font-bold uppercase">Delay Sowing</span></td>
                </tr>
                <tr className="border-b border-panelBorder/50 hover:bg-panelBorder/20 transition-colors">
                  <td className="py-3 pr-4 font-medium text-textMain">Phagi</td>
                  <td className="py-3 px-4 text-textMain">62%</td>
                  <td className="py-3 px-4 text-warning font-bold">Moderate</td>
                  <td className="py-3 pl-4"><span className="px-2 py-1 bg-warning/10 text-warning rounded text-xs font-bold uppercase">Monitor</span></td>
                </tr>
                <tr className="hover:bg-panelBorder/20 transition-colors">
                  <td className="py-3 pr-4 font-medium text-textMain">Bassi</td>
                  <td className="py-3 px-4 text-textMain">85%</td>
                  <td className="py-3 px-4 text-success font-bold">Low</td>
                  <td className="py-3 pl-4"><span className="px-2 py-1 bg-success/10 text-success rounded text-xs font-bold uppercase">Clear</span></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div className="glass-panel p-6 flex flex-col">
          <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-primary" /> Alert Center
          </h3>
          
          <div className="flex-1">
            <label className="block text-xs font-medium text-textMuted mb-1">Target Audience</label>
            <select className="w-full bg-panelBorder/50 border border-panelBorder rounded-lg p-2 text-sm text-textMain outline-none mb-4">
              <option>Sanganer - All Registered Farmers</option>
              <option>Jaipur District - High Risk Zones</option>
            </select>

            <label className="block text-xs font-medium text-textMuted mb-1">Language</label>
            <select className="w-full bg-panelBorder/50 border border-panelBorder rounded-lg p-2 text-sm text-textMain outline-none mb-4">
              <option>Hindi</option>
              <option>English</option>
            </select>

            <label className="block text-xs font-medium text-textMuted mb-1">Message Preview</label>
            <div className="w-full bg-panelBorder/30 border border-panelBorder rounded-lg p-3 text-sm text-textMain mb-4 h-24 whitespace-pre-wrap font-mono text-xs">
              "अगले 7 दिनों में वर्षा की संभावना मध्यम है। एकल वर्षा घटना के बाद संभावित शुष्क अवधि को देखते हुए बुवाई से पहले अगले कुछ दिनों की स्थिति पर ध्यान दें।"
            </div>
          </div>

          <button className="btn-secondary w-full flex items-center justify-center gap-2 py-2 mt-auto">
            <Send className="w-4 h-4" /> Send SMS / WhatsApp Alert
          </button>
        </div>
      </div>
    </div>
  );
};

export default OfficerDashboard;
