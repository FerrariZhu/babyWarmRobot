import type { WeatherSnapshot } from "./types";

const FORECAST_URL = "https://api.open-meteo.com/v1/forecast";
const GEOCODING_URL = "https://geocoding-api.open-meteo.com/v1/search";
const REVERSE_GEOCODE_URL =
  "https://api.bigdatacloud.net/data/reverse-geocode-client";

/** WMO weather interpretation codes → 中文 */
const WMO_TEXT: Record<number, string> = {
  0: "晴",
  1: "多云",
  2: "阴",
  3: "阴",
  45: "雾",
  48: "雾",
  51: "小雨",
  53: "中雨",
  55: "大雨",
  56: "冻雨",
  57: "冻雨",
  61: "小雨",
  63: "中雨",
  65: "大雨",
  66: "冻雨",
  67: "冻雨",
  71: "小雪",
  73: "中雪",
  75: "大雪",
  77: "雪粒",
  80: "阵雨",
  81: "阵雨",
  82: "暴雨",
  85: "阵雪",
  86: "阵雪",
  95: "雷雨",
  96: "雷雨",
  99: "雷雨",
};

export interface GeoLocation {
  latitude: number;
  longitude: number;
  name: string;
  country?: string;
  admin1?: string;
}

export interface WeatherLocationInput {
  latitude?: number | null;
  longitude?: number | null;
  city?: string | null;
}

export interface WeatherResult extends WeatherSnapshot {
  location: GeoLocation;
  fetchedAt: string;
}

export type WeatherFetch = (
  input: RequestInfo | URL,
  init?: RequestInit
) => Promise<Response>;

function hasValidCoords(lat?: number | null, lng?: number | null): lat is number {
  return lat != null && lng != null && !Number.isNaN(lat) && !Number.isNaN(lng);
}

function locationLabel(hit: {
  name: string;
  admin1?: string;
  country?: string;
}): string {
  if (hit.admin1 && hit.admin1 !== hit.name) {
    return `${hit.name}（${hit.admin1}）`;
  }
  return hit.name;
}

function pickCityName(data: {
  city?: string;
  locality?: string;
  principalSubdivision?: string;
}): string {
  const city = data.city?.trim() || data.locality?.trim();
  if (!city) return "当前位置";

  const region = data.principalSubdivision?.trim();
  if (region && region !== city && !city.includes(region.replace(/(省|市|自治区)$/, ""))) {
    const shortRegion = region.replace(/(省|市|自治区|特别行政区)$/, "");
    return `${city}（${shortRegion}）`;
  }
  return city;
}

/** 经纬度 → 城市名（BigDataCloud 免费逆地理编码，无需 Key） */
export async function reverseGeocode(
  latitude: number,
  longitude: number,
  fetchImpl: WeatherFetch = fetch
): Promise<GeoLocation> {
  const url = new URL(REVERSE_GEOCODE_URL);
  url.searchParams.set("latitude", String(latitude));
  url.searchParams.set("longitude", String(longitude));
  url.searchParams.set("localityLanguage", "zh");

  const res = await fetchImpl(url.toString());
  if (!res.ok) {
    throw new Error(`Reverse geocoding failed: ${res.status}`);
  }

  const data = (await res.json()) as {
    city?: string;
    locality?: string;
    principalSubdivision?: string;
    countryName?: string;
  };

  return {
    latitude,
    longitude,
    name: pickCityName(data),
    country: data.countryName,
    admin1: data.principalSubdivision,
  };
}

/** 城市名 → 经纬度（Open-Meteo Geocoding，免费无需 Key） */
export async function geocodeCity(
  city: string,
  fetchImpl: WeatherFetch = fetch
): Promise<GeoLocation> {
  const query = city.trim();
  if (!query) {
    throw new Error("城市名不能为空");
  }

  const url = new URL(GEOCODING_URL);
  url.searchParams.set("name", query);
  url.searchParams.set("count", "1");
  url.searchParams.set("language", "zh");
  url.searchParams.set("format", "json");

  const res = await fetchImpl(url.toString());
  if (!res.ok) {
    throw new Error(`Geocoding API failed: ${res.status}`);
  }

  const data = (await res.json()) as {
    results?: Array<{
      name: string;
      latitude: number;
      longitude: number;
      country?: string;
      admin1?: string;
    }>;
  };

  const hit = data.results?.[0];
  if (!hit) {
    throw new Error(`未找到城市：${query}`);
  }

  return {
    latitude: hit.latitude,
    longitude: hit.longitude,
    name: locationLabel(hit),
    country: hit.country,
    admin1: hit.admin1,
  };
}

/** 经纬度 → 当前天气（Open-Meteo Forecast，免费无需 Key） */
export async function fetchWeatherByCoords(
  latitude: number,
  longitude: number,
  fetchImpl: WeatherFetch = fetch
): Promise<WeatherSnapshot> {
  const url = new URL(FORECAST_URL);
  url.searchParams.set("latitude", String(latitude));
  url.searchParams.set("longitude", String(longitude));
  url.searchParams.set(
    "current",
    [
      "temperature_2m",
      "relative_humidity_2m",
      "apparent_temperature",
      "wind_speed_10m",
      "surface_pressure",
      "weather_code",
      "precipitation_probability",
      "uv_index",
    ].join(",")
  );
  url.searchParams.set("timezone", "auto");

  const res = await fetchImpl(url.toString());
  if (!res.ok) {
    throw new Error(`Weather API failed: ${res.status}`);
  }

  const data = (await res.json()) as {
    current?: {
      temperature_2m: number;
      apparent_temperature: number;
      relative_humidity_2m: number;
      wind_speed_10m: number;
      surface_pressure: number;
      weather_code: number;
      precipitation_probability?: number;
      uv_index?: number;
    };
  };

  const c = data.current;
  if (!c) {
    throw new Error("Weather API returned no current data");
  }

  return {
    temp: c.temperature_2m,
    feelsLike: c.apparent_temperature,
    humidity: c.relative_humidity_2m,
    windSpeed: c.wind_speed_10m,
    pressure: c.surface_pressure,
    text: WMO_TEXT[c.weather_code] ?? "未知",
    precipProbability: c.precipitation_probability,
    uvIndex: c.uv_index,
  };
}

/**
 * 统一入口：优先用经纬度，否则按城市 geocode，再拉 forecast。
 */
export async function fetchWeather(
  input: WeatherLocationInput,
  fetchImpl: WeatherFetch = fetch
): Promise<WeatherResult> {
  let location: GeoLocation;

  if (hasValidCoords(input.latitude, input.longitude)) {
    const lat = Number(input.latitude);
    const lng = Number(input.longitude);
    location = input.city?.trim()
      ? { latitude: lat, longitude: lng, name: input.city.trim() }
      : await reverseGeocode(lat, lng, fetchImpl);
  } else if (input.city?.trim()) {
    location = await geocodeCity(input.city, fetchImpl);
  } else {
    throw new Error("请提供经纬度或城市名");
  }

  const snapshot = await fetchWeatherByCoords(
    location.latitude,
    location.longitude,
    fetchImpl
  );

  return {
    ...snapshot,
    location,
    fetchedAt: new Date().toISOString(),
  };
}

/** @deprecated 使用 fetchWeatherByCoords */
export async function fetchWeatherOpenMeteo(params: {
  latitude: number;
  longitude: number;
}): Promise<WeatherSnapshot> {
  return fetchWeatherByCoords(params.latitude, params.longitude);
}
