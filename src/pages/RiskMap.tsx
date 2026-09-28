import { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, CircleMarker, Marker, Popup, useMapEvents, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { 
  Layers, 
  Search, 
  Crosshair, 
  ArrowRight, 
  Bookmark, 
  Trash2, 
  MapPin, 
  Check, 
  Plus 
} from 'lucide-react';
import { useLocation } from '../context/LocationContext';
import { REGIONAL_BLOCKS, type BlockPanchayatInfo } from '../data/agriculturalData';
import { searchPlaces, reverseGeocode, type GeocodingResult } from '../services/geocodingService';
import { useNavigate } from 'react-router-dom';

// Custom Pin Icon for active selection
const pinIcon = L.divIcon({
  className: 'custom-map-pin',
  html: `<div style="
    background: #0ea5e9;
    border: 3px solid #ffffff;
    box-shadow: 0 0 15px rgba(14, 165, 233, 0.8);
    width: 22px;
    height: 22px;
    border-radius: 50%;
    transform: translate(-50%, -50%);
  "></div>`,
  iconSize: [22, 22],
  iconAnchor: [11, 11],
});

// Map event listener component for click-to-locate
const MapClickDetector = ({ onMapClick }: { onMapClick: (lat: number, lng: number) => void }) => {
  useMapEvents({
    click(e) {
      onMapClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
};

// Component to dynamically re-center map when coordinates change
const MapRecenter = ({ lat, lng }: { lat: number; lng: number }) => {
  const map = useMap();
  useEffect(() => {
    map.flyTo([lat, lng], map.getZoom(), { duration: 1 });
  }, [lat, lng, map]);
  return null;
};

export const RiskMap = () => {
  const navigate = useNavigate();
  const {
    latitude,
    longitude,
    block,
    panchayat,
    district,
    state,
    availablePanchayats,
    savedFarms,
    activeFarmId,
    setLocation,
    selectBlock,
    setPanchayat,
    saveCurrentLocationAsFarm,
    selectSavedFarm,
    deleteSavedFarm,
  } = useLocation();

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<GeocodingResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isGeolocating, setIsGeolocating] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [activeLayerFilter, setActiveLayerFilter] = useState<'All' | 'False Onset' | 'Break Risk' | 'Heavy Rain' | 'Safe'>('All');
  const [isSavingFarm, setIsSavingFarm] = useState(false);
  const [newFarmName, setNewFarmName] = useState('');
  const [showFarmsDrawer, setShowFarmsDrawer] = useState(false);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounced search
  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.trim().length < 3) {
      setSearchResults([]);
      return;
    }

    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);

    searchTimeoutRef.current = setTimeout(async () => {
      setIsSearching(true);
      const results = await searchPlaces(searchQuery);
      setSearchResults(results);
      setIsSearching(false);
    }, 400);

    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
  }, [searchQuery]);

  const handleSelectSearchResult = (res: GeocodingResult) => {
    setLocation({
      latitude: res.latitude,
      longitude: res.longitude,
      name: res.displayName,
      block: res.block,
      panchayat: res.panchayat,
      district: res.district,
      state: res.state,
    });
    setSearchQuery('');
    setSearchResults([]);
    setStatusMessage(`Located: ${res.block || res.displayName.split(',')[0]}`);
    setTimeout(() => setStatusMessage(null), 3500);
  };

  const handleMapClick = async (lat: number, lng: number) => {
    setStatusMessage('Resolving administrative boundaries...');
    const geo = await reverseGeocode(lat, lng);
    if (geo) {
      setLocation({
        latitude: lat,
        longitude: lng,
        name: geo.displayName,
        block: geo.block,
        panchayat: geo.panchayat,
        district: geo.district,
        state: geo.state,
      });
      setStatusMessage(`Selected: ${geo.block || 'Farm Point'} (${lat.toFixed(3)}, ${lng.toFixed(3)})`);
    } else {
      setLocation({
        latitude: lat,
        longitude: lng,
      });
      setStatusMessage(`Coordinates Set: ${lat.toFixed(3)}, ${lng.toFixed(3)}`);
    }
    setTimeout(() => setStatusMessage(null), 3000);
  };

  const handleUseMyLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }
    setIsGeolocating(true);
    setStatusMessage('Acquiring GPS fix...');

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        const geo = await reverseGeocode(lat, lng);
        setLocation({
          latitude: lat,
          longitude: lng,
          name: geo ? geo.displayName : 'My Farm Location',
          block: geo?.block || 'Current Block',
          panchayat: geo?.panchayat || 'Local Panchayat',
          district: geo?.district || 'District',
          state: geo?.state || 'State',
        });
        setIsGeolocating(false);
        setStatusMessage('GPS Location Acquired');
        setTimeout(() => setStatusMessage(null), 3000);
      },
      (err) => {
        setIsGeolocating(false);
        setStatusMessage(`Geolocation error: ${err.message}.`);
        setTimeout(() => setStatusMessage(null), 4000);
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  const handleConfirmSaveFarm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFarmName.trim()) return;
    const saved = saveCurrentLocationAsFarm(newFarmName);
    setNewFarmName('');
    setIsSavingFarm(false);
    setStatusMessage(`Saved &ldquo;${saved.name}&rdquo; to My Farms!`);
    setTimeout(() => setStatusMessage(null), 3500);
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'Safe Sowing':
        return '#10b981'; // green / success
      case 'Monitor':
        return '#f59e0b'; // yellow / warning
      case 'Break Risk':
        return '#f97316'; // orange
      case 'False Onset Risk':
      case 'Heavy Rain Risk':
        return '#ef4444'; // red / danger
      default:
        return '#0ea5e9';
    }
  };

  const filteredBlocks = REGIONAL_BLOCKS.filter(b => {
    if (activeLayerFilter === 'All') return true;
    if (activeLayerFilter === 'False Onset') return b.initialRisk === 'False Onset Risk';
    if (activeLayerFilter === 'Break Risk') return b.initialRisk === 'Break Risk';
    if (activeLayerFilter === 'Heavy Rain') return b.initialRisk === 'Heavy Rain Risk';
    if (activeLayerFilter === 'Safe') return b.initialRisk === 'Safe Sowing';
    return true;
  });

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] min-h-[620px] gap-3">
      {/* Top Controls Bar */}
      <div className="glass-panel p-3.5 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search Input with Nominatim Geocoder */}
        <div className="relative flex-1 max-w-md">
          <div className="relative">
            <Search className="w-4 h-4 text-textMuted absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search Indian village, block, tehsil, or district..."
              className="w-full bg-background border border-panelBorder rounded-lg pl-9 pr-8 py-2 text-xs sm:text-sm text-textMain placeholder-textMuted/60 focus:outline-none focus:border-primary"
            />
            {isSearching && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
            )}
          </div>

          {/* Autocomplete Dropdown */}
          {searchResults.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-background/95 backdrop-blur-md border border-panelBorder rounded-lg shadow-xl z-50 max-h-60 overflow-y-auto divide-y divide-panelBorder/40">
              {searchResults.map((res) => (
                <button
                  key={res.placeId}
                  onClick={() => handleSelectSearchResult(res)}
                  className="w-full text-left p-2.5 hover:bg-panel transition-colors text-xs space-y-0.5"
                >
                  <div className="font-semibold text-textMain truncate">
                    {res.block || res.displayName.split(',')[0]}
                  </div>
                  <div className="text-[11px] text-textMuted truncate">
                    {res.district}, {res.state}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* GPS Button, Fallback Dropdowns, and My Saved Farms Toggle */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleUseMyLocation}
            disabled={isGeolocating}
            className="btn-secondary py-1.5 px-2.5 text-xs flex items-center gap-1.5"
            title="Locate via GPS"
          >
            <Crosshair className={`w-3.5 h-3.5 text-primary ${isGeolocating ? 'animate-spin' : ''}`} />
            <span>{isGeolocating ? 'Locating...' : 'Use My GPS'}</span>
          </button>

          {/* Saved Farms Toggle Button */}
          <button
            onClick={() => setShowFarmsDrawer(!showFarmsDrawer)}
            className={`py-1.5 px-3 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors border ${
              showFarmsDrawer || activeFarmId
                ? 'bg-primary/20 text-white border-primary/50'
                : 'bg-panel border-panelBorder text-textMuted hover:text-white'
            }`}
          >
            <Bookmark className="w-3.5 h-3.5 text-primary" />
            <span>My Farms ({savedFarms.length})</span>
          </button>

          {/* Fallback Regional Block Dropdown */}
          <div className="flex items-center gap-1">
            <select
              value={block}
              onChange={(e) => selectBlock(e.target.value)}
              className="bg-background border border-panelBorder text-xs text-textMain rounded-lg px-2 py-1.5 focus:outline-none focus:border-primary"
            >
              {REGIONAL_BLOCKS.map(b => (
                <option key={b.id} value={b.block}>
                  {b.block} ({b.initialRisk})
                </option>
              ))}
            </select>
          </div>

          {/* Panchayat Dropdown */}
          <div className="flex items-center gap-1">
            <select
              value={panchayat}
              onChange={(e) => setPanchayat(e.target.value)}
              className="bg-background border border-panelBorder text-xs text-textMain rounded-lg px-2 py-1.5 focus:outline-none focus:border-primary max-w-[130px]"
            >
              {availablePanchayats.map(p => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Saved Farms Quick-Select Horizontal Bar */}
      {showFarmsDrawer && (
        <div className="glass-panel p-3 animate-in fade-in duration-150 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-wrap flex-1">
            <span className="text-[11px] font-bold text-textMuted uppercase tracking-wider">
              Saved Locations:
            </span>
            {savedFarms.map((farm) => {
              const isActive = activeFarmId === farm.id;
              return (
                <div
                  key={farm.id}
                  className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs transition-all border ${
                    isActive
                      ? 'bg-primary text-white border-primary shadow-sm'
                      : 'bg-background/80 text-textMuted hover:text-white border-panelBorder'
                  }`}
                >
                  <button
                    onClick={() => selectSavedFarm(farm.id)}
                    className="flex items-center gap-1 text-left font-medium"
                  >
                    <MapPin className="w-3 h-3 text-cyan-300" />
                    <span>{farm.name}</span>
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteSavedFarm(farm.id);
                    }}
                    className="text-textMuted hover:text-rose-400 p-0.5 ml-1 rounded"
                    title="Remove farm"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              );
            })}
          </div>

          {/* Add current pin as new farm button */}
          <button
            onClick={() => {
              setNewFarmName(`${block} Plot`);
              setIsSavingFarm(true);
            }}
            className="btn-primary py-1 px-3 text-xs flex items-center gap-1 shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Save Current Pin</span>
          </button>
        </div>
      )}

      {/* Modal / Popover to Name and Save New Farm */}
      {isSavingFarm && (
        <div className="glass-panel p-3 border-primary/50 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <Bookmark className="w-4 h-4 text-primary" />
            <span className="font-semibold text-textMain">Save Current Map Point to My Farms:</span>
          </div>
          <form onSubmit={handleConfirmSaveFarm} className="flex items-center gap-2 w-full sm:w-auto">
            <input
              type="text"
              required
              value={newFarmName}
              onChange={(e) => setNewFarmName(e.target.value)}
              placeholder="e.g. North Acre / Sanganer"
              className="bg-background border border-panelBorder px-2.5 py-1 rounded text-xs text-textMain focus:outline-none focus:border-primary flex-1 sm:w-56"
            />
            <button
              type="submit"
              className="btn-primary py-1 px-3 text-xs flex items-center gap-1"
            >
              <Check className="w-3 h-3" />
              <span>Save</span>
            </button>
            <button
              type="button"
              onClick={() => setIsSavingFarm(false)}
              className="btn-secondary py-1 px-2 text-xs"
            >
              Cancel
            </button>
          </form>
        </div>
      )}

      {/* Status indicator message if any */}
      {statusMessage && (
        <div className="bg-primary/10 border border-primary/30 px-3 py-1.5 rounded-lg text-xs text-primary flex items-center justify-between">
          <span>{statusMessage}</span>
          <span className="text-[10px] text-textMuted">Click anywhere on map to reposition pin</span>
        </div>
      )}

      {/* Main Map Canvas Area */}
      <div className="flex-1 relative rounded-xl overflow-hidden border border-panelBorder shadow-2xl">
        <MapContainer
          center={[latitude, longitude]}
          zoom={10}
          scrollWheelZoom={true}
          style={{ height: '100%', width: '100%', background: '#040b16' }}
          zoomControl={false}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />
          <MapClickDetector onMapClick={handleMapClick} />
          <MapRecenter lat={latitude} lng={longitude} />

          {/* Active Field Marker */}
          <Marker position={[latitude, longitude]} icon={pinIcon}>
            <Popup>
              <div className="p-1 space-y-1 text-slate-900">
                <div className="font-bold text-xs">{block} Block Field</div>
                <div className="text-[11px] text-slate-600">{panchayat} Panchayat</div>
                <div className="text-[10px] text-slate-500 font-mono">
                  {latitude.toFixed(4)}°N, {longitude.toFixed(4)}°E
                </div>
              </div>
            </Popup>
          </Marker>

          {/* Regional Jaipur District Block Risk Markers */}
          {filteredBlocks.map((b: BlockPanchayatInfo) => {
            const color = getRiskColor(b.initialRisk);
            return (
              <CircleMarker
                key={b.id}
                center={[b.latitude, b.longitude]}
                pathOptions={{
                  color,
                  fillColor: color,
                  fillOpacity: 0.35,
                  weight: 2,
                }}
                radius={16}
              >
                <Popup className="custom-popup">
                  <div className="p-2 space-y-2 text-slate-900 min-w-[210px]">
                    <div className="flex items-center justify-between border-b pb-1.5">
                      <span className="font-bold text-sm text-slate-900">{b.block} Block</span>
                      <span
                        className="text-[10px] font-bold px-1.5 py-0.5 rounded text-white"
                        style={{ backgroundColor: color }}
                      >
                        {b.initialRisk}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-1.5 text-[11px] py-1 bg-slate-100 p-1.5 rounded">
                      <div>Onset: <b>{b.onsetProbability}%</b></div>
                      <div>False Onset: <b>{b.falseOnsetRisk}%</b></div>
                      <div>Break: <b>{b.breakRisk}%</b></div>
                      <div>Heavy Rain: <b>{b.heavyRainRisk}%</b></div>
                    </div>

                    <div className="text-[11px] text-slate-700 bg-amber-50 border border-amber-200 p-1.5 rounded">
                      {b.advisoryHi}
                    </div>

                    <button
                      onClick={() => {
                        selectBlock(b.id);
                        navigate('/command-center');
                      }}
                      className="w-full mt-2 bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold py-1.5 px-3 rounded flex items-center justify-center gap-1 transition-colors"
                    >
                      <span>Analyze on Dashboard</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </Popup>
              </CircleMarker>
            );
          })}
        </MapContainer>

        {/* Floating Layer Filter Controls */}
        <div className="absolute top-4 right-4 z-[1000] glass-panel p-2 flex flex-col gap-1 text-xs">
          <div className="text-[10px] font-bold text-textMuted uppercase px-2 py-1 flex items-center gap-1">
            <Layers className="w-3 h-3 text-primary" /> Risk Layer
          </div>
          {(['All', 'False Onset', 'Break Risk', 'Heavy Rain', 'Safe'] as const).map((filter) => (
            <button
              key={filter}
              onClick={() => setActiveLayerFilter(filter)}
              className={`px-3 py-1.5 rounded text-left transition-colors font-medium ${
                activeLayerFilter === filter
                  ? 'bg-primary text-white'
                  : 'text-textMuted hover:bg-panel hover:text-white'
              }`}
            >
              {filter}
            </button>
          ))}
        </div>

        {/* Floating Bottom Card: Active Location & Actions */}
        <div className="absolute bottom-4 left-4 right-4 md:right-auto md:w-96 z-[1000] glass-panel p-4 space-y-3">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-[10px] text-primary uppercase font-mono tracking-wider">
                {activeFarmId ? 'Active Saved Farm' : 'Active Agro-Grid Point'}
              </div>
              <h3 className="font-bold text-textMain text-sm truncate max-w-[240px]">
                {block} Block · {panchayat}
              </h3>
              <p className="text-[11px] text-textMuted">
                {district}, {state} · ({latitude.toFixed(3)}°N, {longitude.toFixed(3)}°E)
              </p>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={() => {
                  setNewFarmName(`${block} Plot`);
                  setIsSavingFarm(true);
                }}
                className="btn-secondary py-1.5 px-2.5 text-xs flex items-center gap-1"
                title="Save current point to My Farms"
              >
                <Bookmark className="w-3 h-3" />
                <span className="hidden sm:inline">Save</span>
              </button>
              <button
                onClick={() => navigate('/command-center')}
                className="btn-primary py-1.5 px-3 text-xs flex items-center gap-1"
              >
                <span>Forecast</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* Color Risk Legend */}
          <div className="pt-2 border-t border-panelBorder/50 grid grid-cols-2 gap-1.5 text-[10px]">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0"></span>
              <span className="text-textMuted">Green: Safe Sowing</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0"></span>
              <span className="text-textMuted">Yellow: Monitor</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-orange-500 shrink-0"></span>
              <span className="text-textMuted">Orange: Break/Dry-Spell</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shrink-0"></span>
              <span className="text-textMuted">Red: False Onset / Flood</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RiskMap;
