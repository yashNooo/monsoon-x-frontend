import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
});

// Fallback Demo Data if backend is down
const isBackendAvailable = async () => {
  try {
    await api.get('/health');
    return true;
  } catch (error) {
    return false;
  }
};

export const getForecast = async (locationId: string, horizon: number) => {
  try {
    const response = await api.get(`/forecast?location_id=${locationId}&horizon=${horizon}`);
    return response.data;
  } catch (error) {
    console.warn("Backend unavailable. Using DEMO data.");
    return {
      location: locationId,
      horizon_days: horizon,
      isDemo: true,
      onset: { probability: 82, confidence: "Medium-High", details: "Expected within 4-6 days." },
      false_onset: { risk_percentage: 18, status: "Low" },
      break_risk: { probability: 61, expected_duration: "7-10 days" },
      heavy_rain: { probability: 28, confidence: "Low" }
    };
  }
};

export const getSimulator = async (locationId: string, crop: string, scenario: string) => {
  // Simulate POST request
  try {
    const response = await api.post('/simulator', { location_id: locationId, crop, scenario });
    return response.data;
  } catch (error) {
    console.warn("Backend unavailable for Simulator. Using DEMO data.");
    return {
      onset_probability: scenario === 'Wait 7 Days' ? 84 : 62,
      break_risk: scenario === 'Wait 7 Days' ? 32 : 69,
      rainfall_outlook: scenario === 'Wait 7 Days' ? 'Moderate / Stable' : 'Low / Erratic',
      isDemo: true
    };
  }
};
