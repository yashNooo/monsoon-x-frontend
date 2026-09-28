// Local Storage Database & State Management for Monsoon-X Demo Mode
// Works completely offline / browser-side with zero required API keys.

export interface SavedFarm {
  id: string;
  name: string;
  block: string;
  panchayat: string;
  district: string;
  state: string;
  latitude: number;
  longitude: number;
  defaultCropId?: string;
  createdAt: string;
}

export interface UserProfileData {
  id: string;
  fullName: string;
  phone: string;
  language: 'hi' | 'en';
  role: 'farmer' | 'officer';
  villageOrBlock: string;
  district: string;
}

const STORAGE_KEYS = {
  FARMS: 'monsoonx_saved_farms_v1',
  ADVISORIES: 'monsoonx_advisory_history_v1',
  PROFILE: 'monsoonx_user_profile_v1',
  ALERTS: 'monsoonx_alerts_log_v1',
};

// Default seed farms for instant usability
const DEFAULT_SEED_FARMS: SavedFarm[] = [
  {
    id: 'farm_sanganer_01',
    name: 'Home Plot (Sanganer)',
    block: 'Sanganer',
    panchayat: 'Vatika',
    district: 'Jaipur',
    state: 'Rajasthan',
    latitude: 26.8200,
    longitude: 75.7800,
    defaultCropId: 'bajra',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'farm_bassi_02',
    name: 'Eastern Farm (Bassi)',
    block: 'Bassi',
    panchayat: 'Toonga',
    district: 'Jaipur',
    state: 'Rajasthan',
    latitude: 26.8300,
    longitude: 76.0400,
    defaultCropId: 'jowar',
    createdAt: new Date().toISOString(),
  },
];

const DEFAULT_PROFILE: UserProfileData = {
  id: 'farmer_local_01',
  fullName: 'Kailash Choudhary (कैलाश चौधरी)',
  phone: '+91 98290 12345',
  language: 'hi',
  role: 'farmer',
  villageOrBlock: 'Sanganer Block',
  district: 'Jaipur',
};

// --- FARMS MANAGEMENT ---

export const getSavedFarms = (): SavedFarm[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.FARMS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.FARMS, JSON.stringify(DEFAULT_SEED_FARMS));
      return DEFAULT_SEED_FARMS;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_SEED_FARMS;
  } catch {
    return DEFAULT_SEED_FARMS;
  }
};

export const saveFarm = (farm: Omit<SavedFarm, 'id' | 'createdAt'>): SavedFarm => {
  try {
    const farms = getSavedFarms();
    const newFarm: SavedFarm = {
      ...farm,
      id: `farm_${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    const updated = [newFarm, ...farms.filter(f => f.name !== farm.name)].slice(0, 20);
    localStorage.setItem(STORAGE_KEYS.FARMS, JSON.stringify(updated));
    return newFarm;
  } catch {
    return {
      ...farm,
      id: `farm_${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
  }
};

export const deleteFarm = (id: string): SavedFarm[] => {
  try {
    const farms = getSavedFarms();
    const filtered = farms.filter(f => f.id !== id);
    localStorage.setItem(STORAGE_KEYS.FARMS, JSON.stringify(filtered));
    return filtered;
  } catch {
    return [];
  }
};

// --- USER PROFILE ---

export const getUserProfile = (): UserProfileData => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.PROFILE);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(DEFAULT_PROFILE));
      return DEFAULT_PROFILE;
    }
    return JSON.parse(raw);
  } catch {
    return DEFAULT_PROFILE;
  }
};

export const saveUserProfile = (profile: Partial<UserProfileData>): UserProfileData => {
  try {
    const current = getUserProfile();
    const updated = { ...current, ...profile };
    localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(updated));
    return updated;
  } catch {
    return DEFAULT_PROFILE;
  }
};

// --- ADVISORY HISTORY ---

export interface SavedAdvisoryRecord {
  id: string;
  generated_at: string;
  crop_name: string;
  crop_id?: string;
  horizon_days: number;
  source: 'LIVE' | 'CACHED' | 'DEMO';
  confidence: 'High' | 'Medium' | 'Low';
  onset_probability: number;
  false_onset_risk: number;
  break_risk: number;
  heavy_rain_risk: number;
  total_forecast_rainfall_mm: number;
  advisory_en: string;
  advisory_hi: string;
  best_decision: string;
  location: {
    name: string;
    block: string;
    panchayat: string;
    district: string;
    latitude: number;
    longitude: number;
  };
}

export const getSavedAdvisories = (): SavedAdvisoryRecord[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.ADVISORIES);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

export const saveAdvisoryRecord = (advisory: Omit<SavedAdvisoryRecord, 'id' | 'generated_at'>): SavedAdvisoryRecord => {
  try {
    const current = getSavedAdvisories();
    const newRecord: SavedAdvisoryRecord = {
      id: `adv_${Date.now()}`,
      generated_at: new Date().toISOString(),
      ...advisory,
    };
    const updated = [newRecord, ...current].slice(0, 50);
    localStorage.setItem(STORAGE_KEYS.ADVISORIES, JSON.stringify(updated));
    return newRecord;
  } catch {
    return {
      id: `adv_${Date.now()}`,
      generated_at: new Date().toISOString(),
      ...advisory,
    };
  }
};

export const deleteAdvisoryRecord = (id: string): SavedAdvisoryRecord[] => {
  try {
    const current = getSavedAdvisories();
    const filtered = current.filter(a => a.id !== id);
    localStorage.setItem(STORAGE_KEYS.ADVISORIES, JSON.stringify(filtered));
    return filtered;
  } catch {
    return [];
  }
};

export const clearAllAdvisories = (): void => {
  try {
    localStorage.removeItem(STORAGE_KEYS.ADVISORIES);
  } catch {
    // ignore
  }
};

// --- ALERTS LOG ---

export interface SavedAlertLog {
  id: string;
  block_name: string;
  crop_name: string;
  channel: 'SMS' | 'WhatsApp';
  status: string;
  message: string;
  sent_at: string;
}

export const getSavedAlerts = (): SavedAlertLog[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.ALERTS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

export const saveAlertLog = (alert: Omit<SavedAlertLog, 'id' | 'sent_at'>): SavedAlertLog => {
  try {
    const current = getSavedAlerts();
    const newAlert: SavedAlertLog = {
      id: `alert_${Date.now()}`,
      sent_at: new Date().toISOString(),
      ...alert,
    };
    const updated = [newAlert, ...current].slice(0, 50);
    localStorage.setItem(STORAGE_KEYS.ALERTS, JSON.stringify(updated));
    return newAlert;
  } catch {
    return {
      id: `alert_${Date.now()}`,
      sent_at: new Date().toISOString(),
      ...alert,
    };
  }
};
