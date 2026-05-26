import { fetchWeather, type WeatherFetch, type WeatherResult } from "@baby-outfit/core";
import type { DbProfile } from "@/lib/db/types";

/** 无 profile 坐标时的默认：北京 */
export const DEFAULT_WEATHER_LOCATION = {
  latitude: 39.9042,
  longitude: 116.4074,
  city: "北京",
} as const;

/** Next.js 服务端缓存 30 分钟，避免频繁打 Open-Meteo */
const cachedFetch: WeatherFetch = (input, init) =>
  fetch(input, { ...init, next: { revalidate: 1800 } });

export interface ProfileWeatherInput {
  city?: string | null;
  latitude?: number | null;
  longitude?: number | null;
}

/** 从 profile 解析位置并拉取天气，失败返回 null */
export async function getWeatherForProfile(
  profile: Pick<DbProfile, "city" | "latitude" | "longitude"> | null | undefined
): Promise<WeatherResult | null> {
  const hasCoords =
    profile?.latitude != null &&
    profile?.longitude != null &&
    !Number.isNaN(Number(profile.latitude)) &&
    !Number.isNaN(Number(profile.longitude));

  try {
    if (hasCoords || profile?.city?.trim()) {
      return await fetchWeather(
        {
          latitude: hasCoords ? Number(profile!.latitude) : null,
          longitude: hasCoords ? Number(profile!.longitude) : null,
          city: profile?.city,
        },
        cachedFetch
      );
    }

    return await fetchWeather(
      {
        latitude: DEFAULT_WEATHER_LOCATION.latitude,
        longitude: DEFAULT_WEATHER_LOCATION.longitude,
        city: DEFAULT_WEATHER_LOCATION.city,
      },
      cachedFetch
    );
  } catch (error) {
    console.error("[getWeatherForProfile]", error);
    return null;
  }
}

/** 供 /api/weather 使用：支持 query 或 profile 回退 */
export async function getWeatherFromQuery(
  params: { city?: string | null; latitude?: number | null; longitude?: number | null },
  profile?: ProfileWeatherInput | null
): Promise<WeatherResult> {
  const lat = params.latitude ?? profile?.latitude;
  const lng = params.longitude ?? profile?.longitude;
  const city = params.city ?? profile?.city;

  const hasCoords =
    lat != null && lng != null && !Number.isNaN(Number(lat)) && !Number.isNaN(Number(lng));

  if (hasCoords || city?.trim()) {
    return fetchWeather(
      {
        latitude: hasCoords ? Number(lat) : null,
        longitude: hasCoords ? Number(lng) : null,
        city,
      },
      cachedFetch
    );
  }

  return fetchWeather(
    {
      latitude: DEFAULT_WEATHER_LOCATION.latitude,
      longitude: DEFAULT_WEATHER_LOCATION.longitude,
      city: DEFAULT_WEATHER_LOCATION.city,
    },
    cachedFetch
  );
}

export function weatherCityLabel(
  profile: Pick<DbProfile, "city"> | null | undefined,
  weather: WeatherResult | null
): string | null {
  if (profile?.city?.trim()) return profile.city.trim();
  if (weather?.location.name) return weather.location.name;
  return null;
}
