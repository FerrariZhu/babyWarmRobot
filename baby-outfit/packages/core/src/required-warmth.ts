import type { ActivityLevel, BabyProfile, Scenario, TimeSlot, WeatherSnapshot } from "./types";

function mapFeelsLikeToWarmth(feelsLike: number): number {
  if (feelsLike >= 28) return 10;
  if (feelsLike >= 22) return 20;
  if (feelsLike >= 18) return 35;
  if (feelsLike >= 12) return 50;
  if (feelsLike >= 5) return 65;
  if (feelsLike >= 0) return 75;
  if (feelsLike >= -5) return 85;
  return 95;
}

function ageInMonths(birthDate: string, ref = new Date()): number {
  const birth = new Date(birthDate);
  return (
    (ref.getFullYear() - birth.getFullYear()) * 12 +
    (ref.getMonth() - birth.getMonth())
  );
}

export interface RequiredWarmthInput {
  weather: WeatherSnapshot;
  baby: Pick<BabyProfile, "birthDate" | "activityLevel" | "warmthOffset">;
  scenario: Scenario;
  timeSlot?: TimeSlot;
  variant?: "default" | "warmer" | "cooler";
}

export function calcRequiredWarmth(input: RequiredWarmthInput): number {
  const { weather, baby, scenario, timeSlot = "morning", variant = "default" } = input;
  let score = mapFeelsLikeToWarmth(weather.feelsLike);

  if (weather.humidity > 80) score += 5;
  else if (weather.humidity < 30) score -= 3;

  if (weather.windSpeed > 5) {
    score += Math.min(10, Math.round(weather.windSpeed * 1.5));
  }

  if (weather.precipProbability && weather.precipProbability > 50) {
    score += 3;
  }

  const months = ageInMonths(baby.birthDate);
  if (months < 3) score += 8;
  else if (months < 6) score += 4;

  const activityAdjust: Record<ActivityLevel, number> = {
    low: 3,
    medium: 0,
    high: -5,
  };
  score += activityAdjust[baby.activityLevel];

  if (scenario === "indoor") score -= 10;
  else if (scenario === "sleep") score -= 5;
  else if (scenario === "outdoor") score += 5;

  const slotAdjust: Record<TimeSlot, number> = {
    morning: 2,
    afternoon: 0,
    evening: 3,
    night: 5,
  };
  score += slotAdjust[timeSlot];

  if (variant === "warmer") score += 10;
  if (variant === "cooler") score -= 10;

  score += baby.warmthOffset ?? 0;

  return Math.min(100, Math.max(0, Math.round(score)));
}
