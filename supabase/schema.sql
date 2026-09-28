-- ============================================================================
-- MONSOON-X DATABASE SCHEMA
-- Hybrid Hyperlocal Monsoon Intelligence & Agricultural Advisory
-- ============================================================================

-- 1. Profiles Table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  phone TEXT,
  language TEXT DEFAULT 'hi', -- 'hi' for Hindi, 'en' for English
  role TEXT DEFAULT 'farmer' CHECK (role IN ('farmer', 'officer', 'admin')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Crops Master Table
CREATE TABLE IF NOT EXISTS public.crops (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  local_name TEXT NOT NULL,
  minimum_rainfall_mm NUMERIC NOT NULL,
  dry_spell_tolerance_days INT NOT NULL,
  sowing_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Saved Locations Table
CREATE TABLE IF NOT EXISTS public.saved_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  state TEXT NOT NULL DEFAULT 'Rajasthan',
  district TEXT NOT NULL DEFAULT 'Jaipur',
  block TEXT NOT NULL,
  panchayat TEXT,
  latitude NUMERIC(9, 6) NOT NULL,
  longitude NUMERIC(9, 6) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Forecast Runs Table
CREATE TABLE IF NOT EXISTS public.forecast_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  location_id UUID REFERENCES public.saved_locations(id) ON DELETE SET NULL,
  crop_name TEXT,
  generated_at TIMESTAMPTZ DEFAULT NOW(),
  horizon_days INT NOT NULL DEFAULT 14,
  source TEXT NOT NULL DEFAULT 'LIVE' CHECK (source IN ('LIVE', 'CACHED', 'DEMO')),
  is_live BOOLEAN NOT NULL DEFAULT true,
  confidence TEXT NOT NULL CHECK (confidence IN ('High', 'Medium', 'Low')),
  onset_probability NUMERIC(5, 2) NOT NULL,
  false_onset_risk NUMERIC(5, 2) NOT NULL,
  break_risk NUMERIC(5, 2) NOT NULL,
  heavy_rain_risk NUMERIC(5, 2) NOT NULL,
  total_forecast_rainfall_mm NUMERIC(7, 2) NOT NULL,
  advisory_en TEXT NOT NULL,
  advisory_hi TEXT NOT NULL,
  raw_weather_json JSONB
);

-- 5. Advisories Table
CREATE TABLE IF NOT EXISTS public.advisories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  location_id UUID REFERENCES public.saved_locations(id) ON DELETE SET NULL,
  crop_name TEXT NOT NULL,
  language TEXT NOT NULL DEFAULT 'hi',
  message TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'moderate' CHECK (severity IN ('low', 'moderate', 'high', 'critical')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Alert History Table
CREATE TABLE IF NOT EXISTS public.alert_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  advisory_id UUID REFERENCES public.advisories(id) ON DELETE SET NULL,
  block_name TEXT,
  crop_name TEXT,
  channel TEXT NOT NULL DEFAULT 'SMS' CHECK (channel IN ('SMS', 'WhatsApp', 'AppNotification')),
  status TEXT NOT NULL DEFAULT 'Sent' CHECK (status IN ('Sent', 'Delivered', 'Failed', 'Preview')),
  message TEXT NOT NULL,
  sent_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Block Risk Snapshots (Public / Regional View)
CREATE TABLE IF NOT EXISTS public.block_risk_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  block TEXT NOT NULL,
  district TEXT NOT NULL DEFAULT 'Jaipur',
  state TEXT NOT NULL DEFAULT 'Rajasthan',
  latitude NUMERIC(9, 6) NOT NULL,
  longitude NUMERIC(9, 6) NOT NULL,
  onset_probability NUMERIC(5, 2) NOT NULL,
  false_onset_risk NUMERIC(5, 2) NOT NULL,
  break_risk NUMERIC(5, 2) NOT NULL,
  heavy_rain_risk NUMERIC(5, 2) NOT NULL,
  status_category TEXT NOT NULL DEFAULT 'Monitor',
  advisory_hi TEXT,
  generated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crops ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forecast_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.advisories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alert_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.block_risk_snapshots ENABLE ROW LEVEL SECURITY;

-- Crops: Anyone can view crop specifications
CREATE POLICY "Public read access for crops"
  ON public.crops FOR SELECT
  USING (true);

-- Block Risk Snapshots: Anyone can view regional block risks
CREATE POLICY "Public read access for block_risk_snapshots"
  ON public.block_risk_snapshots FOR SELECT
  USING (true);

-- Profiles: Users can read and update their own profile
CREATE POLICY "Users can read own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- Saved Locations: Users can only manage their own saved locations
CREATE POLICY "Users can manage own locations"
  ON public.saved_locations FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Forecast Runs: Users can view their own runs (or public runs without user_id)
CREATE POLICY "Users can view own forecast runs"
  ON public.forecast_runs FOR SELECT
  USING (user_id IS NULL OR auth.uid() = user_id);

CREATE POLICY "Users can insert own forecast runs"
  ON public.forecast_runs FOR INSERT
  WITH CHECK (user_id IS NULL OR auth.uid() = user_id);

-- Advisories: Users can view their own advisories
CREATE POLICY "Users can view own advisories"
  ON public.advisories FOR SELECT
  USING (user_id IS NULL OR auth.uid() = user_id);

CREATE POLICY "Users can insert own advisories"
  ON public.advisories FOR INSERT
  WITH CHECK (user_id IS NULL OR auth.uid() = user_id);

-- Alert History: Users can view and create alerts
CREATE POLICY "Users can view own alerts"
  ON public.alert_history FOR SELECT
  USING (user_id IS NULL OR auth.uid() = user_id);

CREATE POLICY "Users can insert alerts"
  ON public.alert_history FOR INSERT
  WITH CHECK (user_id IS NULL OR auth.uid() = user_id);

-- ============================================================================
-- SEED DATA
-- ============================================================================

-- Seed Standard Crops
INSERT INTO public.crops (id, name, local_name, minimum_rainfall_mm, dry_spell_tolerance_days, sowing_notes)
VALUES
  ('bajra', 'Bajra (Pearl Millet)', 'बाजरा', 25.0, 14, 'Drought-tolerant crop. Needs moist seedbed of 25-30mm cumulative rain to sow. Can withstand 10-14 days dry spell.'),
  ('jowar', 'Jowar (Sorghum)', 'ज्वार', 35.0, 10, 'Requires moderate moisture. Avoid waterlogged soil. Optimal sowing after 35mm cumulative precipitation.'),
  ('maize', 'Maize (Corn)', 'मक्का', 45.0, 7, 'Sensitive to early dry spells and heavy waterlogging. Requires consistent moisture (45mm+) in root zone.'),
  ('cotton', 'Cotton', 'कपास', 50.0, 12, 'Deep-rooted crop. Requires 50mm steady rain before sowing. Highly vulnerable to seedling rots under excess rainfall.'),
  ('soybean', 'Soybean', 'सोयाबीन', 60.0, 6, 'Requires uniform soil moisture (60mm+). Seed germination fails if dry spell exceeds 6 days post-sowing.'),
  ('paddy', 'Paddy (Rice)', 'धान / चावल', 100.0, 4, 'High water requirement (100mm+). Nursery preparation requires sustained monsoon flow; highly susceptible to breaks.')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  local_name = EXCLUDED.local_name,
  minimum_rainfall_mm = EXCLUDED.minimum_rainfall_mm,
  dry_spell_tolerance_days = EXCLUDED.dry_spell_tolerance_days,
  sowing_notes = EXCLUDED.sowing_notes;

-- Seed Jaipur District Block Risk Snapshots
INSERT INTO public.block_risk_snapshots (block, district, state, latitude, longitude, onset_probability, false_onset_risk, break_risk, heavy_rain_risk, status_category, advisory_hi)
VALUES
  ('Sanganer', 'Jaipur', 'Rajasthan', 26.8200, 75.7800, 42.0, 68.0, 35.0, 15.0, 'False Onset Risk', 'शुरुआती बौछार के बाद 6 दिन का सूखा अंतराल संभव। बाजरा बुवाई 7 दिन टालें।'),
  ('Phagi', 'Jaipur', 'Rajasthan', 26.5800, 75.5600, 58.0, 32.0, 64.0, 12.0, 'Break Risk', 'सक्रिय मानसून के बाद 7 दिन का ड्राई स्पेल अनुमानित। नमी संरक्षण उपाय अपनाएं।'),
  ('Bassi', 'Jaipur', 'Rajasthan', 26.8300, 76.0400, 84.0, 18.0, 22.0, 20.0, 'Safe Sowing', 'समान वितरण वाली बारिश। बाजरा व ज्वार की बुवाई के लिए अनुकूल खिड़की।'),
  ('Chaksu', 'Jaipur', 'Rajasthan', 26.6000, 75.9500, 38.0, 72.0, 40.0, 10.0, 'False Onset Risk', 'नकली मानसून (False Onset) का उच्च जोखिम। केवल संरक्षित सिंचाई में ही बुवाई करें।'),
  ('Jamwa Ramgarh', 'Jaipur', 'Rajasthan', 27.0200, 76.0100, 78.0, 25.0, 28.0, 35.0, 'Safe Sowing', 'पहाड़ी प्रभाव से अच्छी वर्षा। सामान्य बुवाई जारी रखें, जल निकासी सुनिश्चित करें।'),
  ('Amber', 'Jaipur', 'Rajasthan', 26.9800, 75.8500, 65.0, 30.0, 35.0, 45.0, 'Monitor', 'मध्यम से भारी बारिश के आसार। मिट्टी की नमी जांचने के उपरांत ही बुवाई करें।'),
  ('Govindgarh', 'Jaipur', 'Rajasthan', 27.2300, 75.6800, 35.0, 55.0, 70.0, 10.0, 'Break Risk', 'कम वर्षा व लम्बा सूखा अंतराल। मक्का बुवाई से बचें, केवल बाजरा पर विचार करें।'),
  ('Jhotwara', 'Jaipur', 'Rajasthan', 26.9400, 75.7500, 62.0, 38.0, 30.0, 18.0, 'Monitor', 'संतुलित स्थितियां। 48 घंटे के मौसम अपडेट की निगरानी करें।'),
  ('Shahpura', 'Jaipur', 'Rajasthan', 27.3800, 75.9600, 48.0, 62.0, 45.0, 25.0, 'False Onset Risk', 'क्षणिक वर्षा के बाद शुष्क दौर। शीघ्र बुवाई में बीज बर्बाद होने की आशंका।'),
  ('Kotputli', 'Jaipur', 'Rajasthan', 27.7000, 76.2000, 72.0, 20.0, 25.0, 55.0, 'Heavy Rain Risk', 'भारी वर्षा का संकेत। निचले खेतों में जलभराव की रोकथाम करें।'),
  ('Sambhar', 'Jaipur', 'Rajasthan', 26.9100, 75.1800, 30.0, 40.0, 78.0, 8.0, 'Break Risk', 'शुष्क मौसम बना रहेगा। बारिश की पुष्टि होने तक बुवाई स्थगित रखें।'),
  ('Dudu', 'Jaipur', 'Rajasthan', 26.6800, 75.2400, 45.0, 58.0, 52.0, 15.0, 'False Onset Risk', 'अनियमित वर्षा। बुवाई से पूर्व मिट्टी में कम से कम 5 इंच नमी का परीक्षण करें।');
