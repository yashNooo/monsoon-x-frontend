import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { REGIONAL_BLOCKS, type BlockPanchayatInfo } from '../data/agriculturalData';
import { 
  getSavedFarms, 
  saveFarm as saveFarmToStorage, 
  deleteFarm as deleteFarmFromStorage, 
  type SavedFarm 
} from '../services/localStorageService';

export interface LocationState {
  locationId: string;
  locationName: string;
  latitude: number;
  longitude: number;
  state: string;
  district: string;
  block: string;
  panchayat: string;
  selectedCropId: string;
  availablePanchayats: string[];
  savedFarms: SavedFarm[];
  activeFarmId: string | null;
}

interface LocationContextType extends LocationState {
  setLocationId: (id: string) => void;
  setSelectedCropId: (cropId: string) => void;
  setLocation: (loc: {
    latitude: number;
    longitude: number;
    name?: string;
    state?: string;
    district?: string;
    block?: string;
    panchayat?: string;
  }) => void;
  selectBlock: (blockIdOrName: string) => void;
  setPanchayat: (panchayat: string) => void;
  saveCurrentLocationAsFarm: (farmName: string) => SavedFarm;
  selectSavedFarm: (farmId: string) => void;
  deleteSavedFarm: (farmId: string) => void;
}

const defaultBlock: BlockPanchayatInfo = REGIONAL_BLOCKS[0]; // Sanganer

const LocationContext = createContext<LocationContextType | undefined>(undefined);

export const LocationProvider = ({ children }: { children: ReactNode }) => {
  const [savedFarms, setSavedFarms] = useState<SavedFarm[]>(() => getSavedFarms());
  const [activeFarmId, setActiveFarmId] = useState<string | null>(() => {
    const farms = getSavedFarms();
    return farms.length > 0 ? farms[0].id : null;
  });

  const initialFarm = savedFarms.length > 0 ? savedFarms[0] : null;

  const [locationId, setLocationId] = useState(initialFarm ? initialFarm.id : defaultBlock.id);
  const [locationName, setLocationName] = useState(
    initialFarm ? initialFarm.name : `${defaultBlock.block} Block, ${defaultBlock.district}, ${defaultBlock.state}`
  );
  const [latitude, setLatitude] = useState(initialFarm ? initialFarm.latitude : defaultBlock.latitude);
  const [longitude, setLongitude] = useState(initialFarm ? initialFarm.longitude : defaultBlock.longitude);
  const [state, setState] = useState(initialFarm ? initialFarm.state : defaultBlock.state);
  const [district, setDistrict] = useState(initialFarm ? initialFarm.district : defaultBlock.district);
  const [block, setBlock] = useState(initialFarm ? initialFarm.block : defaultBlock.block);
  const [panchayat, setPanchayatState] = useState(initialFarm ? initialFarm.panchayat : defaultBlock.panchayats[0] || 'Central');
  const [selectedCropId, setSelectedCropId] = useState(initialFarm?.defaultCropId || 'bajra');

  const initialBlockInfo = REGIONAL_BLOCKS.find(b => b.block.toLowerCase() === (initialFarm?.block || defaultBlock.block).toLowerCase());
  const [availablePanchayats, setAvailablePanchayats] = useState<string[]>(initialBlockInfo ? initialBlockInfo.panchayats : defaultBlock.panchayats);

  useEffect(() => {
    const loaded = getSavedFarms();
    setSavedFarms(loaded);
  }, []);

  const selectSavedFarm = (farmId: string) => {
    const farm = savedFarms.find(f => f.id === farmId);
    if (!farm) return;

    setActiveFarmId(farm.id);
    setLocationId(farm.id);
    setLocationName(farm.name);
    setLatitude(farm.latitude);
    setLongitude(farm.longitude);
    setBlock(farm.block);
    setPanchayatState(farm.panchayat);
    setDistrict(farm.district);
    setState(farm.state);
    if (farm.defaultCropId) {
      setSelectedCropId(farm.defaultCropId);
    }

    const matched = REGIONAL_BLOCKS.find(b => b.block.toLowerCase() === farm.block.toLowerCase());
    if (matched) {
      setAvailablePanchayats(matched.panchayats);
    }
  };

  const saveCurrentLocationAsFarm = (farmName: string): SavedFarm => {
    const newFarm = saveFarmToStorage({
      name: farmName.trim() || `${block} Farm`,
      block,
      panchayat,
      district,
      state,
      latitude,
      longitude,
      defaultCropId: selectedCropId,
    });

    const updated = getSavedFarms();
    setSavedFarms(updated);
    setActiveFarmId(newFarm.id);
    setLocationName(newFarm.name);
    return newFarm;
  };

  const deleteSavedFarm = (farmId: string) => {
    const updated = deleteFarmFromStorage(farmId);
    setSavedFarms(updated);
    if (activeFarmId === farmId) {
      if (updated.length > 0) {
        selectSavedFarm(updated[0].id);
      } else {
        setActiveFarmId(null);
      }
    }
  };

  const selectBlock = (blockIdOrName: string) => {
    const found = REGIONAL_BLOCKS.find(
      b => b.id.toLowerCase() === blockIdOrName.toLowerCase() || b.block.toLowerCase() === blockIdOrName.toLowerCase()
    ) || REGIONAL_BLOCKS[0];

    setActiveFarmId(null);
    setLocationId(found.id);
    setBlock(found.block);
    setDistrict(found.district);
    setState(found.state);
    setLatitude(found.latitude);
    setLongitude(found.longitude);
    setAvailablePanchayats(found.panchayats);
    setPanchayatState(found.panchayats[0] || 'Central');
    setLocationName(`${found.block} Block (${found.panchayats[0] || 'Central'}), ${found.district}`);
  };

  const setLocation = (loc: {
    latitude: number;
    longitude: number;
    name?: string;
    state?: string;
    district?: string;
    block?: string;
    panchayat?: string;
  }) => {
    setActiveFarmId(null);
    setLatitude(loc.latitude);
    setLongitude(loc.longitude);
    if (loc.state) setState(loc.state);
    if (loc.district) setDistrict(loc.district);
    if (loc.block) {
      setBlock(loc.block);
      const matched = REGIONAL_BLOCKS.find(b => b.block.toLowerCase() === loc.block?.toLowerCase());
      if (matched) {
        setAvailablePanchayats(matched.panchayats);
      }
    }
    if (loc.panchayat) setPanchayatState(loc.panchayat);
    if (loc.name) {
      setLocationName(loc.name);
    } else {
      setLocationName(`${loc.block || 'Selected Field'}, ${loc.district || 'Rajasthan'} (${loc.latitude.toFixed(3)}, ${loc.longitude.toFixed(3)})`);
    }
    setLocationId(`custom_${loc.latitude.toFixed(2)}_${loc.longitude.toFixed(2)}`);
  };

  const setPanchayat = (newPanchayat: string) => {
    setPanchayatState(newPanchayat);
    setLocationName(`${block} Block (${newPanchayat}), ${district}`);
  };

  return (
    <LocationContext.Provider
      value={{
        locationId,
        setLocationId,
        locationName,
        latitude,
        longitude,
        state,
        district,
        block,
        panchayat,
        selectedCropId,
        availablePanchayats,
        savedFarms,
        activeFarmId,
        setSelectedCropId,
        setLocation,
        selectBlock,
        setPanchayat,
        saveCurrentLocationAsFarm,
        selectSavedFarm,
        deleteSavedFarm,
      }}
    >
      {children}
    </LocationContext.Provider>
  );
};

export const useLocation = () => {
  const context = useContext(LocationContext);
  if (context === undefined) {
    throw new Error('useLocation must be used within a LocationProvider');
  }
  return context;
};
