interface WeatherHour {
  time: string;       // ISO string
  temp: number;       // °C
  precipProb: number; // 0-100
  weatherCode: number;
}

interface WeatherCache {
  location: string;
  hours: WeatherHour[];
  fetchedAt: number;
}

const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes
const weatherCache = new Map<number, WeatherCache>();

export const invalidateWeatherCache = (familyId: number): void => {
  weatherCache.delete(familyId);
};

export const getWeatherForFamily = async (
  familyId: number,
  locationName: string
): Promise<{ location: string; hours: WeatherHour[] }> => {
  const cached = weatherCache.get(familyId);
  if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
    return { location: cached.location, hours: cached.hours };
  }

  // Geocode location
  const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(locationName)}&count=1`;
  const geoRes = await fetch(geoUrl);
  if (!geoRes.ok) {
    throw new Error(`Geocoding request failed: ${geoRes.status}`);
  }
  const geoData = await geoRes.json() as {
    results?: { latitude: number; longitude: number; name: string; country?: string }[]
  };

  if (!geoData.results || geoData.results.length === 0) {
    throw new Error(`Location not found: ${locationName}`);
  }

  const { latitude, longitude, name, country } = geoData.results[0];
  const resolvedName = country ? `${name}, ${country}` : name;

  // Fetch hourly forecast
  const forecastUrl =
    `https://api.open-meteo.com/v1/forecast` +
    `?latitude=${latitude}&longitude=${longitude}` +
    `&hourly=temperature_2m,precipitation_probability,weathercode` +
    `&forecast_days=2&timezone=auto&temperature_unit=celsius`;

  const forecastRes = await fetch(forecastUrl);
  if (!forecastRes.ok) {
    throw new Error(`Forecast request failed: ${forecastRes.status}`);
  }
  const forecastData = await forecastRes.json() as {
    hourly: {
      time: string[];
      temperature_2m: number[];
      precipitation_probability: number[];
      weathercode: number[];
    }
  };

  const { time, temperature_2m, precipitation_probability, weathercode } = forecastData.hourly;

  // Find next 24 hours from now
  const now = Date.now();
  const hours: WeatherHour[] = [];
  for (let i = 0; i < time.length && hours.length < 24; i++) {
    const t = new Date(time[i]).getTime();
    if (t >= now) {
      hours.push({
        time: time[i],
        temp: Math.round(temperature_2m[i]),
        precipProb: precipitation_probability[i] ?? 0,
        weatherCode: weathercode[i],
      });
    }
  }

  const result: WeatherCache = { location: resolvedName, hours, fetchedAt: Date.now() };
  weatherCache.set(familyId, result);

  return { location: resolvedName, hours };
};
