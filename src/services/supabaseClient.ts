import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(
  supabaseUrl && 
  supabaseAnonKey && 
  supabaseUrl.trim() !== '' && 
  supabaseAnonKey.trim() !== '' &&
  !supabaseUrl.includes('your-project-id')
);

// If configured, initialize real Supabase client; otherwise provide a safe mock client
export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null;

// Local demo storage helpers for Demo mode persistence
const DEMO_STORAGE_KEYS = {
  FORECASTS: 'monsoonx_demo_forecast_runs',
  LOCATIONS: 'monsoonx_demo_locations',
  ALERTS: 'monsoonx_demo_alerts',
  ADVISORIES: 'monsoonx_demo_advisories',
};

export const getDemoForecasts = () => {
  try {
    const raw = localStorage.getItem(DEMO_STORAGE_KEYS.FORECASTS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

export const saveDemoForecast = (forecast: any) => {
  try {
    const existing = getDemoForecasts();
    const updated = [
      {
        id: `demo_${Date.now()}`,
        generated_at: new Date().toISOString(),
        ...forecast,
      },
      ...existing,
    ].slice(0, 50);
    localStorage.setItem(DEMO_STORAGE_KEYS.FORECASTS, JSON.stringify(updated));
    return updated[0];
  } catch {
    return null;
  }
};

export const getDemoAlerts = () => {
  try {
    const raw = localStorage.getItem(DEMO_STORAGE_KEYS.ALERTS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

export const saveDemoAlert = (alert: any) => {
  try {
    const existing = getDemoAlerts();
    const updated = [
      {
        id: `alert_${Date.now()}`,
        sent_at: new Date().toISOString(),
        ...alert,
      },
      ...existing,
    ];
    localStorage.setItem(DEMO_STORAGE_KEYS.ALERTS, JSON.stringify(updated));
    return updated[0];
  } catch {
    return null;
  }
};
