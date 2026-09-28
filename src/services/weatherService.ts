export interface DailyForecastDay {
  date: string;
  dayName: string;
  precipitationSumMm: number;
  precipitationProbabilityMax: number;
  temperatureMaxC: number;
  temperatureMinC: number;
  windSpeedMaxKmh: number;
  relativeHumidityAvg: number;
  weatherCode: number;
  weatherDescription: string;
  isRainyDay: boolean; // IMD definition: >= 2.5 mm in 24h
}

export interface WeatherForecastResponse {
  source: 'LIVE' | 'CACHED' | 'DEMO';
  isLive: boolean;
  latitude: number;
  longitude: number;
  timezone: string;
  fetchedAt: string; // ISO String
  daily: DailyForecastDay[];
  summary: {
    totalRainfall7dMm: number;
    totalRainfall14dMm: number;
    rainyDays7d: number;
    rainyDays14d: number;
    maxSingleDayRainMm: number;
    maxDrySpellGapDays: number;
    averageMaxTempC: number;
    averageHumidity: number;
  };
  rawWeatherJson?: any;
}

const getWeatherDescription = (code: number): string => {
  if (code === 0) return 'Clear sky (साफ आसमान)';
  if (code === 1 || code === 2) return 'Partly cloudy (हल्के बादल)';
  if (code === 3) return 'Overcast (घने बादल)';
  if (code >= 45 && code <= 48) return 'Fog / Mist (कोहरा / धुंध)';
  if (code >= 51 && code <= 55) return 'Light Drizzle (हल्की बूंदाबांदी)';
  if (code >= 61 && code <= 63) return 'Moderate Rain (मध्यम वर्षा)';
  if (code >= 65) return 'Heavy Rain (भारी वर्षा)';
  if (code >= 80 && code <= 82) return 'Rain Showers (तेज बौछारें)';
  if (code >= 95) return 'Thunderstorm (गरज के साथ वर्षा)';
  return 'Cloudy (बादल छाए रहेंगे)';
};

// Generate realistic demo weather for Sanganer/Jaipur if completely offline or rate-limited
const generateDemoWeather = (lat: number, lon: number): WeatherForecastResponse => {
  const dates: DailyForecastDay[] = [];
  const today = new Date();

  // Pattern: Day 1-2 moderate rain, then 5 dry days (classic false onset pattern for demo)
  const pattern = [
    { rain: 18.5, prob: 75, tMax: 34, tMin: 25, code: 63, hum: 78, wind: 18 },
    { rain: 12.0, prob: 65, tMax: 33, tMin: 24, code: 61, hum: 75, wind: 16 },
    { rain: 1.2,  prob: 25, tMax: 36, tMin: 26, code: 2,  hum: 52, wind: 12 },
    { rain: 0.0,  prob: 10, tMax: 38, tMin: 27, code: 1,  hum: 45, wind: 14 },
    { rain: 0.0,  prob: 15, tMax: 39, tMin: 27, code: 0,  hum: 42, wind: 15 },
    { rain: 0.4,  prob: 20, tMax: 38, tMin: 26, code: 2,  hum: 48, wind: 11 },
    { rain: 0.0,  prob: 15, tMax: 37, tMin: 25, code: 1,  hum: 46, wind: 13 },
    { rain: 4.5,  prob: 45, tMax: 35, tMin: 25, code: 51, hum: 60, wind: 14 },
    { rain: 16.0, prob: 70, tMax: 32, tMin: 23, code: 63, hum: 80, wind: 19 },
    { rain: 22.0, prob: 80, tMax: 30, tMin: 22, code: 65, hum: 85, wind: 22 },
    { rain: 8.5,  prob: 55, tMax: 31, tMin: 23, code: 61, hum: 74, wind: 15 },
    { rain: 1.0,  prob: 30, tMax: 33, tMin: 24, code: 2,  hum: 62, wind: 12 },
    { rain: 0.0,  prob: 15, tMax: 35, tMin: 25, code: 1,  hum: 50, wind: 11 },
    { rain: 0.0,  prob: 10, tMax: 36, tMin: 26, code: 0,  hum: 48, wind: 10 },
  ];

  for (let i = 0; i < pattern.length; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    const item = pattern[i];
    dates.push({
      date: d.toISOString().split('T')[0],
      dayName: d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
      precipitationSumMm: item.rain,
      precipitationProbabilityMax: item.prob,
      temperatureMaxC: item.tMax,
      temperatureMinC: item.tMin,
      windSpeedMaxKmh: item.wind,
      relativeHumidityAvg: item.hum,
      weatherCode: item.code,
      weatherDescription: getWeatherDescription(item.code),
      isRainyDay: item.rain >= 2.5,
    });
  }

  const rain7 = dates.slice(0, 7).reduce((acc, c) => acc + c.precipitationSumMm, 0);
  const rain14 = dates.reduce((acc, c) => acc + c.precipitationSumMm, 0);

  return {
    source: 'DEMO',
    isLive: false,
    latitude: lat,
    longitude: lon,
    timezone: 'Asia/Kolkata',
    fetchedAt: new Date().toISOString(),
    daily: dates,
    summary: {
      totalRainfall7dMm: Number(rain7.toFixed(1)),
      totalRainfall14dMm: Number(rain14.toFixed(1)),
      rainyDays7d: dates.slice(0, 7).filter(d => d.isRainyDay).length,
      rainyDays14d: dates.filter(d => d.isRainyDay).length,
      maxSingleDayRainMm: 22.0,
      maxDrySpellGapDays: 5,
      averageMaxTempC: 35.2,
      averageHumidity: 61,
    }
  };
};

export const fetchWeatherForecast = async (lat: number, lon: number): Promise<WeatherForecastResponse> => {
  const cacheKey = `monsoonx_weather_${lat.toFixed(3)}_${lon.toFixed(3)}`;
  
  // Check local cache (valid for 30 minutes)
  try {
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      const parsed = JSON.parse(cached);
      const ageMinutes = (Date.now() - new Date(parsed.fetchedAt).getTime()) / (1000 * 60);
      if (ageMinutes < 30) {
        return {
          ...parsed,
          source: 'CACHED',
          isLive: true,
        };
      }
    }
  } catch (err) {
    console.warn('Cache read error:', err);
  }

  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=precipitation_sum,precipitation_probability_max,temperature_2m_max,temperature_2m_min,wind_speed_10m_max,weather_code&hourly=relative_humidity_2m&timezone=Asia%2FKolkata&forecast_days=16`;
    
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`Open-Meteo HTTP ${res.status}`);
    }

    const data = await res.json();
    const dailyRaw = data.daily;
    if (!dailyRaw || !dailyRaw.time) {
      throw new Error('Malformed daily weather structure');
    }

    const hourlyHumidity: number[] = data.hourly?.relative_humidity_2m || [];

    const daily: DailyForecastDay[] = dailyRaw.time.map((t: string, idx: number) => {
      const d = new Date(t);
      const rain = dailyRaw.precipitation_sum?.[idx] ?? 0;
      
      // Calculate 24h average humidity for this day from hourly blocks (24 entries per day)
      const dayHumiditySlice = hourlyHumidity.slice(idx * 24, (idx + 1) * 24);
      const avgHum = dayHumiditySlice.length > 0
        ? Math.round(dayHumiditySlice.reduce((a, b) => a + b, 0) / dayHumiditySlice.length)
        : 60;

      const code = dailyRaw.weather_code?.[idx] ?? 0;

      return {
        date: t,
        dayName: d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
        precipitationSumMm: Number(rain.toFixed(1)),
        precipitationProbabilityMax: dailyRaw.precipitation_probability_max?.[idx] ?? 0,
        temperatureMaxC: Math.round(dailyRaw.temperature_2m_max?.[idx] ?? 32),
        temperatureMinC: Math.round(dailyRaw.temperature_2m_min?.[idx] ?? 24),
        windSpeedMaxKmh: Math.round(dailyRaw.wind_speed_10m_max?.[idx] ?? 15),
        relativeHumidityAvg: avgHum,
        weatherCode: code,
        weatherDescription: getWeatherDescription(code),
        isRainyDay: rain >= 2.5,
      };
    });

    const rain7 = daily.slice(0, 7).reduce((acc, c) => acc + c.precipitationSumMm, 0);
    const rain14 = daily.slice(0, 14).reduce((acc, c) => acc + c.precipitationSumMm, 0);
    const rainyDays7 = daily.slice(0, 7).filter(d => d.isRainyDay).length;
    const rainyDays14 = daily.slice(0, 14).filter(d => d.isRainyDay).length;

    let maxSingleDay = 0;
    daily.forEach(d => {
      if (d.precipitationSumMm > maxSingleDay) maxSingleDay = d.precipitationSumMm;
    });

    // Calculate maximum consecutive dry spell days (< 2.5 mm)
    let currentDry = 0;
    let maxDry = 0;
    daily.forEach(d => {
      if (d.precipitationSumMm < 2.5) {
        currentDry++;
        if (currentDry > maxDry) maxDry = currentDry;
      } else {
        currentDry = 0;
      }
    });

    const avgMaxTemp = Math.round(daily.reduce((a, b) => a + b.temperatureMaxC, 0) / daily.length);
    const avgHumidity = Math.round(daily.reduce((a, b) => a + b.relativeHumidityAvg, 0) / daily.length);

    const result: WeatherForecastResponse = {
      source: 'LIVE',
      isLive: true,
      latitude: lat,
      longitude: lon,
      timezone: data.timezone || 'Asia/Kolkata',
      fetchedAt: new Date().toISOString(),
      daily,
      summary: {
        totalRainfall7dMm: Number(rain7.toFixed(1)),
        totalRainfall14dMm: Number(rain14.toFixed(1)),
        rainyDays7d: rainyDays7,
        rainyDays14d: rainyDays14,
        maxSingleDayRainMm: Number(maxSingleDay.toFixed(1)),
        maxDrySpellGapDays: maxDry,
        averageMaxTempC: avgMaxTemp,
        averageHumidity: avgHumidity,
      },
      rawWeatherJson: data,
    };

    // Save to cache
    try {
      localStorage.setItem(cacheKey, JSON.stringify(result));
    } catch (e) {
      console.warn('Failed to cache weather:', e);
    }

    return result;
  } catch (err) {
    console.warn('Live Open-Meteo weather fetch failed, serving demo fallback:', err);
    return generateDemoWeather(lat, lon);
  }
};
