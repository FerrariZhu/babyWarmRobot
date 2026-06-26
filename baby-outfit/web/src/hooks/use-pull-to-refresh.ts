"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const PULL_THRESHOLD = 64;
const MAX_PULL = 88;

type PullState = "idle" | "pulling" | "refreshing";

export function usePullToRefresh(onRefresh: () => Promise<void>, enabled = true) {
  const [pullDistance, setPullDistance] = useState(0);
  const [state, setState] = useState<PullState>("idle");

  const pullDistanceRef = useRef(0);
  const touchStartYRef = useRef(0);
  const isTrackingRef = useRef(false);
  const refreshingRef = useRef(false);
  const onRefreshRef = useRef(onRefresh);

  useEffect(() => {
    onRefreshRef.current = onRefresh;
  }, [onRefresh]);

  const resetPull = useCallback(() => {
    pullDistanceRef.current = 0;
    setPullDistance(0);
    if (!refreshingRef.current) setState("idle");
  }, []);

  const runRefresh = useCallback(async () => {
    if (refreshingRef.current) return;
    refreshingRef.current = true;
    setState("refreshing");
    pullDistanceRef.current = PULL_THRESHOLD;
    setPullDistance(PULL_THRESHOLD);
    try {
      await onRefreshRef.current();
    } finally {
      refreshingRef.current = false;
      resetPull();
    }
  }, [resetPull]);

  useEffect(() => {
    if (!enabled) return;

    const canStartPull = () => window.scrollY <= 0 && !refreshingRef.current;

    const onTouchStart = (event: TouchEvent) => {
      if (!canStartPull() || event.touches.length !== 1) return;
      touchStartYRef.current = event.touches[0].clientY;
      isTrackingRef.current = true;
    };

    const onTouchMove = (event: TouchEvent) => {
      if (!isTrackingRef.current) return;
      if (!canStartPull()) {
        isTrackingRef.current = false;
        resetPull();
        return;
      }

      const delta = event.touches[0].clientY - touchStartYRef.current;
      if (delta <= 0) {
        resetPull();
        return;
      }

      const distance = Math.min(delta * 0.45, MAX_PULL);
      pullDistanceRef.current = distance;
      setPullDistance(distance);
      setState("pulling");

      if (distance > 8) event.preventDefault();
    };

    const onTouchEnd = () => {
      if (!isTrackingRef.current) return;
      isTrackingRef.current = false;

      if (pullDistanceRef.current >= PULL_THRESHOLD) {
        void runRefresh();
        return;
      }
      resetPull();
    };

    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: false });
    window.addEventListener("touchend", onTouchEnd);
    window.addEventListener("touchcancel", onTouchEnd);

    return () => {
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd);
      window.removeEventListener("touchcancel", onTouchEnd);
    };
  }, [enabled, resetPull, runRefresh]);

  const releaseToRefresh = pullDistance >= PULL_THRESHOLD;
  const hint =
    state === "refreshing"
      ? "正在刷新定位与天气…"
      : releaseToRefresh
        ? "松开刷新"
        : "下拉刷新定位与天气";

  return {
    pullDistance,
    state,
    hint,
    releaseToRefresh,
    isActive: pullDistance > 0 || state === "refreshing",
  };
}
