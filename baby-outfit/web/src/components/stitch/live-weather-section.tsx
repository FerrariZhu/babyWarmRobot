"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { WeatherResult } from "@baby-outfit/core";
import { DeviceLocationError, getDeviceLocation } from "@/lib/device-location";
import { usePullToRefresh } from "@/hooks/use-pull-to-refresh";
import { WeatherWidget } from "@/components/stitch/weather-widget";
import { MaterialIcon } from "@/components/stitch/material-icon";

type WeatherView = {
  temp: number;
  feelsLike: number;
  humidity: number;
  windSpeed: number;
  text: string;
  precipProbability?: number;
  uvIndex?: number;
};

function toWeatherView(result: WeatherResult): WeatherView {
  return {
    temp: result.temp,
    feelsLike: result.feelsLike,
    humidity: result.humidity,
    windSpeed: result.windSpeed,
    text: result.text,
    precipProbability: result.precipProbability,
    uvIndex: result.uvIndex,
  };
}

function WeatherWidgetSkeleton({ message }: { message: string }) {
  return (
    <section className="relative flex flex-col items-center overflow-hidden rounded-[2rem] bg-primary-fixed p-6 text-center cloud-shadow">
      <div className="absolute -top-10 -right-10 h-32 w-32 rounded-full bg-primary-fixed-dim opacity-50 blur-xl" />
      <MaterialIcon name="my_location" className="mb-3 animate-pulse text-[40px] text-primary" />
      <p className="font-body-md text-on-primary-fixed">{message}</p>
      <p className="font-label-caps mt-2 text-on-primary-fixed-variant">正在获取当地天气…</p>
    </section>
  );
}

export function LiveWeatherSection({
  fallbackWeather,
  fallbackCity,
}: {
  fallbackWeather?: WeatherView | null;
  fallbackCity?: string | null;
}) {
  const router = useRouter();
  const hasFallback = Boolean(fallbackWeather);
  const [weather, setWeather] = useState<WeatherView | null>(fallbackWeather ?? null);
  const [city, setCity] = useState<string | null>(fallbackCity ?? null);
  const [status, setStatus] = useState<"locating" | "ready" | "error">(
    hasFallback ? "ready" : "locating"
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  const fallbackWeatherRef = useRef(fallbackWeather);
  const fallbackCityRef = useRef(fallbackCity);
  const syncingRef = useRef(false);
  const autoSyncedRef = useRef(false);

  useEffect(() => {
    fallbackWeatherRef.current = fallbackWeather;
    fallbackCityRef.current = fallbackCity;
  }, [fallbackCity, fallbackWeather]);

  const syncFromDevice = useCallback(
    async (options?: { background?: boolean; refreshPage?: boolean }) => {
      if (syncingRef.current) return;
      syncingRef.current = true;

      const background = options?.background ?? false;
      const refreshPage = options?.refreshPage ?? !background;
      setErrorMessage(null);

      if (background) {
        setIsSyncing(true);
      } else {
        setStatus("locating");
      }

      try {
        const coords = await getDeviceLocation();
        const res = await fetch("/api/profile/location", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            latitude: coords.latitude,
            longitude: coords.longitude,
          }),
        });

        const data = (await res.json()) as WeatherResult & { error?: string };
        if (!res.ok) {
          throw new Error(data.error ?? "天气同步失败");
        }

        setWeather(toWeatherView(data));
        setCity(data.location.name);
        setStatus("ready");

        if (refreshPage) {
          router.refresh();
        }
      } catch (error) {
        if (error instanceof DeviceLocationError && error.code === "denied") {
          setErrorMessage(error.message);
        } else {
          const message = error instanceof Error ? error.message : "定位或天气获取失败";
          setErrorMessage(message);
        }

        const fbWeather = fallbackWeatherRef.current;
        const fbCity = fallbackCityRef.current;
        if (fbWeather) {
          setWeather(fbWeather);
          setCity(fbCity ?? null);
          setStatus("ready");
        } else {
          setStatus("error");
        }
      } finally {
        syncingRef.current = false;
        setIsSyncing(false);
      }
    },
    [router]
  );

  // 仅在组件首次挂载时自动定位一次（空依赖，避免 router.refresh 引发循环）
  useEffect(() => {
    if (autoSyncedRef.current) return;
    autoSyncedRef.current = true;
    void syncFromDevice({
      background: Boolean(fallbackWeatherRef.current),
      refreshPage: false,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handlePullRefresh = useCallback(
    () =>
      syncFromDevice({
        background: true,
        refreshPage: true,
      }),
    [syncFromDevice]
  );

  const { pullDistance, state: pullState, hint, isActive } = usePullToRefresh(
    handlePullRefresh,
    status === "ready"
  );

  if (status === "locating") {
    return <WeatherWidgetSkeleton message="正在获取你的位置" />;
  }

  if (!weather) {
    return (
      <section className="rounded-xl bg-surface-container-lowest p-6 text-center cloud-shadow">
        <p className="font-body-md text-on-surface-variant">
          {errorMessage ?? "无法获取天气，请检查定位权限与网络。"}
        </p>
        <button
          type="button"
          onClick={() => void syncFromDevice({ refreshPage: true })}
          className="font-label-caps mt-4 inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-on-primary"
        >
          <MaterialIcon name="my_location" />
          允许定位并重试
        </button>
      </section>
    );
  }

  return (
    <>
      {isActive && (
        <div
          className="pointer-events-none fixed inset-x-0 top-0 z-50 flex justify-center"
          style={{ transform: `translateY(${Math.max(pullDistance, 0)}px)` }}
          aria-live="polite"
        >
          <div className="mt-3 flex items-center gap-2 rounded-full bg-surface-container-lowest px-4 py-2 cloud-shadow">
            <span
              className={pullState === "refreshing" ? "inline-flex animate-spin" : "inline-flex"}
              style={
                pullState === "pulling"
                  ? { transform: `rotate(${Math.min(pullDistance * 2.5, 180)}deg)` }
                  : undefined
              }
            >
              <MaterialIcon name="refresh" className="text-[18px] text-primary" />
            </span>
            <span className="font-label-caps text-on-surface-variant">{hint}</span>
          </div>
        </div>
      )}
      <div className="flex flex-col gap-3">
        <WeatherWidget city={city} weather={weather} />
        {isSyncing && (
          <p className="font-label-caps text-center text-outline">正在更新当前位置天气…</p>
        )}
        {errorMessage && (
          <div className="flex flex-col items-center gap-2 rounded-xl bg-surface-container-low px-4 py-3 text-center">
            <p className="font-body-md text-on-surface-variant">{errorMessage}</p>
            <button
              type="button"
              onClick={() => void syncFromDevice({ refreshPage: true })}
              className="font-label-caps inline-flex items-center gap-1 text-primary hover:underline"
            >
              <MaterialIcon name="my_location" className="text-[16px]" />
              使用当前位置
            </button>
          </div>
        )}
      </div>
    </>
  );
}
