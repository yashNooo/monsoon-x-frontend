import { fetchWeatherForecast, type WeatherForecastResponse } from './weatherService';
import { getCropById, type CropData } from '../data/agriculturalData';
import { computeHybridRisk, type HybridRiskAssessment } from './riskEngine';
import { 
  getSavedAdvisories, 
  saveAdvisoryRecord, 
  deleteAdvisoryRecord, 
  clearAllAdvisories,
  type SavedAdvisoryRecord 
} from './localStorageService';

export interface FullForecastResult {
  weather: WeatherForecastResponse;
  crop: CropData;
  assessment: HybridRiskAssessment;
  location: {
    name: string;
    block: string;
    panchayat?: string;
    district: string;
    state: string;
    latitude: number;
    longitude: number;
  };
  horizonDays: number;
  generatedAt: string;
}

export interface SimulationResult {
  scenario: 'Sow Today' | 'Wait 7 Days' | 'Wait 14 Days';
  onsetProbability: number;
  breakRisk: number;
  falseOnsetRisk: number;
  expectedRainfallMm: number;
  confidence: 'High' | 'Medium' | 'Low';
  recommendationEn: string;
  recommendationHi: string;
  suitabilityScore: number; // 0-100
}

export const getForecastAnalysis = async (
  latitude: number,
  longitude: number,
  cropId: string = 'bajra',
  horizonDays: number = 14,
  locationDetails?: {
    name?: string;
    block?: string;
    panchayat?: string;
    district?: string;
    state?: string;
  }
): Promise<FullForecastResult> => {
  const weather = await fetchWeatherForecast(latitude, longitude);
  const crop = getCropById(cropId);
  const assessment = computeHybridRisk(weather, crop, horizonDays);

  const location = {
    name: locationDetails?.name || `${latitude.toFixed(2)}, ${longitude.toFixed(2)}`,
    block: locationDetails?.block || 'Sanganer',
    panchayat: locationDetails?.panchayat || 'Central',
    district: locationDetails?.district || 'Jaipur',
    state: locationDetails?.state || 'Rajasthan',
    latitude,
    longitude,
  };

  return {
    weather,
    crop,
    assessment,
    location,
    horizonDays,
    generatedAt: new Date().toISOString(),
  };
};

export const runSimulatorScenarios = (
  analysis: FullForecastResult
): SimulationResult[] => {
  const { weather, crop } = analysis;

  // Scenario 1: Sow Today (Days 0 to 7)
  const sowTodayAssessment = computeHybridRisk(weather, crop, 7);
  const sowTodayRain = weather.daily.slice(0, 7).reduce((acc, d) => acc + d.precipitationSumMm, 0);

  // Scenario 2: Wait 7 Days (Days 7 to 14)
  const futureWeather7: WeatherForecastResponse = {
    ...weather,
    daily: weather.daily.slice(7),
  };
  const wait7Assessment = computeHybridRisk(futureWeather7, crop, 7);
  const wait7Rain = weather.daily.slice(7, 14).reduce((acc, d) => acc + d.precipitationSumMm, 0);

  // Scenario 3: Wait 14 Days (Extended outlook)
  const wait14Rain = Number((weather.summary.totalRainfall14dMm * 0.9).toFixed(1));

  return [
    {
      scenario: 'Sow Today',
      onsetProbability: sowTodayAssessment.onsetProbability,
      breakRisk: sowTodayAssessment.breakRisk,
      falseOnsetRisk: sowTodayAssessment.falseOnsetRisk,
      expectedRainfallMm: Number(sowTodayRain.toFixed(1)),
      confidence: 'High',
      suitabilityScore: sowTodayAssessment.bestDecision === 'Sow Today' ? 88 : 42,
      recommendationEn: sowTodayAssessment.bestDecision === 'Sow Today'
        ? 'Favorable window: Soil moisture is building, low break risk in upcoming 7 days.'
        : 'High caution: False onset / dry break risk detected. Germination failure risk is elevated.',
      recommendationHi: sowTodayAssessment.bestDecision === 'Sow Today'
        ? 'अनुकूल खिड़की: मिट्टी में नमी पर्याप्त रहेगी, 7 दिनों में कम सूखा जोखिम।'
        : 'सावधानी: नकली मानसून या सूखे की आशंका। बीज खराब होने का जोखिम अधिक।',
    },
    {
      scenario: 'Wait 7 Days',
      onsetProbability: wait7Assessment.onsetProbability,
      breakRisk: wait7Assessment.breakRisk,
      falseOnsetRisk: wait7Assessment.falseOnsetRisk,
      expectedRainfallMm: Number(wait7Rain.toFixed(1)),
      confidence: 'Medium',
      suitabilityScore: wait7Assessment.bestDecision === 'Sow Today' ? 85 : 65,
      recommendationEn: 'Waiting allows first irregular convective showers to settle soil and verifies synoptic monsoon continuity.',
      recommendationHi: '7 दिन प्रतीक्षा करने से शुरुआती छिटपुट बौछारों के बाद असली मानसून प्रवाह की पुष्टि हो सकेगी।',
    },
    {
      scenario: 'Wait 14 Days',
      onsetProbability: 60,
      breakRisk: 45,
      falseOnsetRisk: 25,
      expectedRainfallMm: wait14Rain,
      confidence: 'Low',
      suitabilityScore: 50,
      recommendationEn: 'Late sowing option. Avoids early false onset hazards but reduces growing degree days for late vegetative stage.',
      recommendationHi: 'देरी से बुवाई का विकल्प। शुरुआती नकली मानसून से बचाव होगा, परंतु फसल अवधि छोटी रह जाएगी।',
    }
  ];
};

export const saveForecastToDatabase = async (analysis: FullForecastResult, _userId?: string | null) => {
  const saved = saveAdvisoryRecord({
    crop_name: analysis.crop.name,
    crop_id: analysis.crop.id,
    horizon_days: analysis.horizonDays,
    source: analysis.weather.source,
    confidence: analysis.assessment.confidence,
    onset_probability: analysis.assessment.onsetProbability,
    false_onset_risk: analysis.assessment.falseOnsetRisk,
    break_risk: analysis.assessment.breakRisk,
    heavy_rain_risk: analysis.assessment.heavyRainRisk,
    total_forecast_rainfall_mm: analysis.assessment.forecastRainfallMm,
    advisory_en: analysis.assessment.advisoryEn,
    advisory_hi: analysis.assessment.advisoryHi,
    best_decision: analysis.assessment.bestDecision,
    location: {
      name: analysis.location.name,
      block: analysis.location.block,
      panchayat: analysis.location.panchayat || 'Central',
      district: analysis.location.district,
      latitude: analysis.location.latitude,
      longitude: analysis.location.longitude,
    },
  });

  return { success: true, id: saved.id, source: 'local' };
};

export const fetchForecastHistory = async (_userId?: string | null): Promise<SavedAdvisoryRecord[]> => {
  return getSavedAdvisories();
};

export const removeAdvisory = (id: string): SavedAdvisoryRecord[] => {
  return deleteAdvisoryRecord(id);
};

export const removeAllAdvisories = (): void => {
  clearAllAdvisories();
};
