# Monsoon-X: Hyperlocal Agricultural Monsoon Intelligence

> **Probabilistic Agro-Climatic Advisory**: Distinguishing genuine synoptic monsoon onset from false convective showers and predicting 7–30 day break risks to protect agricultural investments.

---

## 🌟 Key Features

1. **Hyperlocal Geocoded Location Selection**:
   - Interactive Leaflet map with OpenStreetMap tiles.
   - Live location searching via OpenStreetMap Nominatim with debouncing.
   - GPS &ldquo;Use My Location&rdquo; browser geolocation.
   - Reverse geocoding determining State, District, Block, and Panchayat.
   - Quick-select block/panchayat selector for Jaipur Agro-Climatic Zone III-A.

2. **Live Open-Meteo Forecast Integration**:
   - Fetches live 16-day daily precipitation sums, rain probability, max/min temperatures, wind speed, relative humidity, and weather codes directly from the Open-Meteo Forecast API (`Asia/Kolkata` timezone).
   - Resilient client-side caching with clear `LIVE`, `CACHED`, or `DEMO` indicators.

3. **Transparent Hybrid Risk Engine**:
   - **Onset Probability (0–100%)**: Evaluates cumulative 7-day rainfall against crop-specific physiological thresholds, rainy-day consistency (&ge;2.5 mm IMD standard), and rain probability.
   - **False Onset Risk (0–100%)**: Triggers when early convective showers (&ge;12 mm) are followed by a 5–7 day dry spell, warning against early planting that risks seed scorching.
   - **Break Risk (0–100%)**: Detects consecutive low-rainfall days exceeding crop-specific drought tolerance.
   - **Heavy Rain / Flood Risk (0–100%)**: Flags single-day downpours exceeding IMD heavy rainfall criteria (&ge;64.5 mm) or 3-day cumulative surges (&ge;100 mm).
   - **Horizon Confidence**: Clearly demarcated as High (1–7 days), Medium (8–14 days), and Low / Climatological (15–30 days).

4. **Agronomic Kharif Catalog**:
   - Pre-configured agronomic constraints for 6 key crops: **Bajra (बाजरा)**, **Jowar (ज्वार)**, **Maize (मक्का)**, **Cotton (कपास)**, **Soybean (सोयाबीन)**, and **Paddy (धान / चावल)**.

5. **Farmer-Centric Advisory & Sowing Simulator**:
   - Prominent Hindi farmer advisory with clear agronomic reasoning.
   - Dynamic simulation comparing &ldquo;Sow Today&rdquo;, &ldquo;Wait 7 Days&rdquo;, and &ldquo;Wait 14 Days&rdquo;.
   - Full explainability breakdown detailing exact rainfall totals, rainy-day counts, dry gaps, and rule triggers.

6. **Agricultural Officer Terminal**:
   - Regional surveillance matrix across Jaipur district blocks (Sanganer, Phagi, Bassi, Chaksu, Jamwa Ramgarh, Amber, Govindgarh, Jhotwara, Shahpura, Kotputli, etc.).
   - Broadcast alert preview and dispatch recorder for SMS and WhatsApp channels.
   - One-click CSV risk report export.

7. **Supabase Cloud Persistence & Demo Sandbox**:
   - Supports user accounts, saved farmer locations, historical forecast runs, and dispatch logs via Supabase RLS.
   - Seamless zero-configuration Demo Mode if Supabase environment variables are omitted.

8. **Gemini Agro-Climatic Voice & Chat Advisor**:
   - Conversational assistant powered by **Gemini 3.8** (`gemini-3.8-flash`).
   - Automatically synchronizes with the active farm location selected on the Risk Map (block, panchayat, district, coordinates) and active crop requirements.
   - **Voice Input**: Real-time microphone speech-to-text recognition supporting Hindi (`hi-IN`) and English.
   - **Voice Output**: Text-to-speech voice playback using Gemini TTS (`gemini-3.8-flash-lite-tts`) with browser speech synthesis fallback.
   - **Real-Time Live Voice Conversations**: Integrated with **Gemini 3.8 Live API** (`gemini-3.8-live`) via bidirectional WebSocket audio streaming.
   - Available via both a persistent floating assistant widget on every screen and a dedicated `/advisor` command page.

---

## 🚀 Local Run Instructions

### 1. Prerequisites
- Node.js 18+ (tested on Node.js 22)
- npm 9+

### 2. Installation
```bash
# Clone the repository
git clone https://github.com/yashNooo/monsoon-x-frontend.git
cd monsoon-x-frontend

# Install dependencies
npm install
```

### 3. Environment Configuration
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

To enable Supabase database persistence, provide:
```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```
*(If left empty, the application runs automatically in full Demo Mode with local persistence).*

### 4. Database Setup (Supabase)
1. In your Supabase dashboard, open the **SQL Editor**.
2. Run the script in `supabase/schema.sql`.
3. Copy your project URL and `anon` key into `.env`.

### 5. Start the Development Server
```bash
npm run dev
```
The app runs at `http://localhost:3000`.

### 6. Production Build
```bash
npm run build
npm run preview
```

---

## 🛰️ Live Feeds vs Demo Data

| Component | Status | Details |
| :--- | :--- | :--- |
| **Precipitation & Temperature** | **Truly LIVE** | Fetched from Open-Meteo Forecast API (`api.open-meteo.com/v1/forecast`) for any coordinates globally. |
| **Search & Geocoding** | **Truly LIVE** | Powered by OpenStreetMap Nominatim with debounced requests. |
| **Map Cartography** | **Truly LIVE** | OpenStreetMap Standard tile server via Leaflet. |
| **Risk Calculations** | **Truly LIVE** | Computed deterministically by the client-side Hybrid Risk Engine using actual forecast values. |
| **ENSO & IOD Indicators** | **Contextual** | Reflects current neutral phase observations. |
| **MJO Indicator** | **Contextual** | Marked as &ldquo;Data source connection pending&rdquo; with prepared adapter interface. |
| **SMS / WhatsApp Dispatch** | **Preview Mode** | Simulates and logs alert dispatches in `alert_history` table (pending SMS gateway credentials). |

---

## ⚠️ API Limitations & Notes

- **Open-Meteo Forecast Limit**: Deterministic forecasts are reliable up to 14 days. Days 15–30 use broader climatological distributions and are labeled with &ldquo;Low Confidence&rdquo;.
- **Nominatim Usage Policy**: Geocoding queries are throttled with a 400ms debounce to respect the OpenStreetMap Nominatim usage policy (1 request/second).
- **Probabilistic Disclaimers**: All outputs are calibrated probabilistic risk estimates for agricultural planning and do not constitute absolute meteorological guarantees.
