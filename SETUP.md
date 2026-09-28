# Monsoon-X Setup & Configuration Guide

This guide explains how to set up and run the Monsoon-X Hyperlocal Agricultural Monsoon Intelligence platform.

---

## 1. Environment Variables

Create a `.env` file in the root directory (or configure your hosting provider's environment variables) based on `.env.example`:

```env
# Optional custom backend URL
VITE_API_BASE_URL=http://localhost:8000/api

# Supabase Project Credentials (client-side anonymous key only)
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

> **Security Note**: Never add the Supabase `service_role` key to the frontend application. Only the public `anon` key is used, safeguarded by Row Level Security (RLS) policies.

---

## 2. Supabase Database Setup

1. Create a free account and new project at [Supabase.com](https://supabase.com).
2. Go to the **SQL Editor** in your Supabase project dashboard.
3. Open `supabase/schema.sql` from this repository.
4. Copy and paste the entire script into the SQL editor and click **Run**.
5. The script automatically creates:
   - `profiles` table (farmer and officer roles)
   - `crops` master table with pre-seeded Kharif crops (Bajra, Jowar, Maize, Cotton, Soybean, Paddy)
   - `saved_locations` table for farmer field coordinates
   - `forecast_runs` table with live/cached/demo badges, risk probabilities, and bilingual advisories
   - `advisories` table for personalized recommendations
   - `alert_history` table for SMS/WhatsApp alert dispatch records
   - `block_risk_snapshots` table pre-seeded with Jaipur district regional block risks
   - Row Level Security (RLS) policies enforcing user data isolation and public read access for crops and regional snapshots.
6. Retrieve your **Project URL** and **anon / public key** from **Project Settings -> API** and add them to `.env`.

---

## 3. Demo / Offline Mode

If `VITE_SUPABASE_URL` or `VITE_SUPABASE_ANON_KEY` are not set, Monsoon-X automatically starts in **Demo Mode**:
- Full forecast and risk engine functionality remains operational using live Open-Meteo weather data.
- Search and interactive map use OpenStreetMap Nominatim.
- Local state handles location changes and advisory previews without requiring database credentials.
- Users can click **Continue as Demo** or switch between Farmer and Officer modes seamlessly.

---

## 4. Live Weather & Geocoding Sources

- **Weather Forecast**: Powered by Open-Meteo Forecast API (`https://api.open-meteo.com/v1/forecast`), providing live precipitation sum, rain probability, temperature, wind, and humidity. No API key required.
- **Geocoding & Reverse Geocoding**: Powered by OpenStreetMap Nominatim (`https://nominatim.openstreetmap.org`), providing administrative block and district hierarchy.
- **Tile Layer**: OpenStreetMap Standard cartography via Leaflet.

---

## 5. Local Development

```bash
# Install dependencies
npm install

# Start development server on port 3000
npm run dev

# Build for production
npm run build

# Run linter
npm run lint
```
