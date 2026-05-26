export type ActivityLevel = "low" | "medium" | "high";
export type Scenario = "indoor" | "outdoor" | "sleep";
export type TimeSlot = "morning" | "afternoon" | "evening" | "night";
export type Variant = "default" | "warmer" | "cooler";

export type ClothingCategory =
  | "bodysuit"
  | "inner"
  | "mid"
  | "outer"
  | "pants"
  | "sleepwear"
  | "hat"
  | "socks"
  | "gloves"
  | "scarf"
  | "other";

export interface WeatherSnapshot {
  temp: number;
  feelsLike: number;
  humidity: number;
  windSpeed: number;
  pressure: number;
  text: string;
  precipProbability?: number;
  uvIndex?: number;
}

export interface BabyProfile {
  id: string;
  name: string;
  birthDate: string;
  activityLevel: ActivityLevel;
  currentSizeLabel?: string | null;
  warmthOffset?: number;
}

export interface WardrobeItem {
  id: string;
  name: string;
  category: ClothingCategory;
  warmthScore: number;
  sizeLabel?: string | null;
  imageUrl?: string | null;
  isAvailable?: boolean;
}

export interface RecommendInput {
  weather: WeatherSnapshot;
  baby: BabyProfile;
  wardrobe: WardrobeItem[];
  scenario: Scenario;
  timeSlot?: TimeSlot;
  variant?: Variant;
}

export interface RecommendedPiece {
  item: WardrobeItem;
  layerOrder: number;
}

export interface RecommendResult {
  requiredWarmth: number;
  actualWarmth: number;
  pieces: RecommendedPiece[];
  reason: string;
  variant: Variant;
}
