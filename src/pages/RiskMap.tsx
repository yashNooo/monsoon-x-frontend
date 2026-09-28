import { useState } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, ZoomControl } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { Layers, AlertTriangle, CloudRain, Sun, Info } from 'lucide-react';

const demoLocations = [
  { id: '1', name: 'Sanganer', lat: 26.82, lng: 75.78, risk: 'High', type: 'False Onset', value: 78 },
  { id: '2', name: 'Phagi', lat: 26.58, lng: 75.56, risk: 'Moderate', type: 'Break', value: 62 },
  { id: '3', name: 'Bassi', lat: 26.83, lng: 76.04, risk: 'Low', type: 'Onset', value: 85 },
  { id: '4', name: 'Chaksu', lat: 26.60, lng: 75.94, risk: 'High', type: 'Heavy Rain', value: 27 },
];

const getRiskColor = (risk) => {
  switch(risk) {
    case 'High': return '#ef4444'; // danger
    case 'Moderate': return '#f59e0b'; // warning
    case 'Low': return '#10b981'; // success
    default: return '#0ea5e9'; // primary
  }
};

const RiskMap = () => {
  const [activeLayer, setActiveLayer] = useState('False Onset');
  const [selectedBlock, setSelectedBlock] = useState(null);

  return (
    <div className="flex flex-col h-[calc(100vh-100px)]">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="heading-primary">Hyperlocal Risk Map</h2>
          <p className="text-sm text-textMuted flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-full bg-primary/20 text-primary text-[10px] font-bold uppercase tracking-wider">Demo Visualization</span>
            Showing probabilistic risk across Jaipur District blocks
          </p>
        </div>
      </div>

      <div className="flex flex-1 gap-6 relative">
        <div className="w-64 flex flex-col gap-4">
          <div className="glass-panel p-4 flex flex-col gap-2">
            <h3 className="font-semibold text-sm uppercase tracking-wider text-textMuted mb-2 flex items-center gap-2">
              <Layers className="w-4 h-4" /> Map Layers
            </h3>
            
            {['False Onset Risk', 'Break Risk', 'Heavy Rain Risk', 'Monsoon Onset Prob'].map(layer => {
              const baseName = layer.replace(' Risk', '').replace(' Prob', '');
              return (
                <button
                  key={layer}
                  onClick={() => setActiveLayer(baseName)}
                  className={`text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${activeLayer === baseName ? 'bg-primary/20 text-primary border border-primary/30' : 'hover:bg-panelBorder/50 text-textMuted'}`}
                >
                  {layer}
                </button>
              )
            })}
          </div>

          <div className="glass-panel p-4">
            <h3 className="font-semibold text-sm uppercase tracking-wider text-textMuted mb-3 flex items-center gap-2">
              <Info className="w-4 h-4" /> Legend
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-danger"></div> High Risk</div>
              <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-warning"></div> Moderate Risk</div>
              <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-success"></div> Low Risk</div>
            </div>
          </div>
        </div>

        <div className="flex-1 glass-panel overflow-hidden relative">
          <MapContainer 
            center={[26.7, 75.8]} 
            zoom={10} 
            style={{ height: '100%', width: '100%', background: '#0a1426' }}
            zoomControl={false}
          >
            <TileLayer
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
            />
            <ZoomControl position="topright" />
            
            {demoLocations.map(loc => (
              <CircleMarker
                key={loc.id}
                center={[loc.lat, loc.lng]}
                pathOptions={{ 
                  color: getRiskColor(loc.risk), 
                  fillColor: getRiskColor(loc.risk),
                  fillOpacity: 0.6,
                  weight: 2
                }}
                radius={loc.id === selectedBlock?.id ? 15 : 10}
                eventHandlers={{
                  click: () => setSelectedBlock(loc),
                }}
              >
                <Popup className="custom-popup">
                  <div className="font-sans text-gray-900 font-medium">
                    <strong className="block text-lg border-b pb-1 mb-2">{loc.name} Block</strong>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                      <span className="text-gray-500">Onset Prob:</span> <span className="font-bold">78%</span>
                      <span className="text-gray-500">Break Risk:</span> <span className="font-bold">62%</span>
                      <span className="text-gray-500">False Onset:</span> <span className="font-bold text-red-600">High</span>
                    </div>
                  </div>
                </Popup>
              </CircleMarker>
            ))}
          </MapContainer>
        </div>
        
        {selectedBlock && (
          <div className="absolute right-4 top-4 bottom-4 w-72 glass-panel p-5 z-[1000] flex flex-col animate-in slide-in-from-right shadow-2xl">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-xl font-bold">{selectedBlock.name} Block</h3>
              <button onClick={() => setSelectedBlock(null)} className="text-textMuted hover:text-white">&times;</button>
            </div>
            
            <div className="space-y-4">
              <div className="bg-panelBorder/30 p-3 rounded-lg border border-panelBorder">
                <span className="text-xs uppercase text-textMuted font-bold tracking-wider">Onset Probability</span>
                <div className="text-2xl font-bold text-primary mt-1">78%</div>
                <div className="w-full bg-panelBorder h-1.5 mt-2 rounded-full overflow-hidden">
                  <div className="bg-primary h-full" style={{ width: '78%' }}></div>
                </div>
              </div>
              
              <div className="bg-panelBorder/30 p-3 rounded-lg border border-danger/20">
                <span className="text-xs uppercase text-textMuted font-bold tracking-wider">False Onset Risk</span>
                <div className="text-2xl font-bold text-danger mt-1 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5" /> High
                </div>
                <p className="text-xs text-textMuted mt-1">Strong indication of dry spell following initial rains.</p>
              </div>

              <div className="bg-panelBorder/30 p-3 rounded-lg border border-warning/20">
                <span className="text-xs uppercase text-textMuted font-bold tracking-wider">Break Probability</span>
                <div className="text-2xl font-bold text-warning mt-1">62%</div>
                <div className="w-full bg-panelBorder h-1.5 mt-2 rounded-full overflow-hidden">
                  <div className="bg-warning h-full" style={{ width: '62%' }}></div>
                </div>
              </div>
            </div>
            
            <button className="mt-auto btn-primary w-full py-3">View Full Block Profile</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default RiskMap;
