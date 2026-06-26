export type BabyGender = "male" | "female";

export type WarmthPreference =
  | "runs_cold"
  | "slightly_cold"
  | "neutral"
  | "slightly_hot"
  | "runs_hot";

export const GENDER_OPTIONS: { value: BabyGender; label: string }[] = [
  { value: "male", label: "男孩" },
  { value: "female", label: "女孩" },
];

export const WARMTH_PREFERENCE_OPTIONS: {
  value: WarmthPreference;
  label: string;
  hint: string;
}[] = [
  { value: "runs_cold", label: "怕冷", hint: "建议多穿一层" },
  { value: "slightly_cold", label: "偏怕冷", hint: "略偏保暖" },
  { value: "neutral", label: "正常", hint: "按标准推荐" },
  { value: "slightly_hot", label: "偏怕热", hint: "略偏透气" },
  { value: "runs_hot", label: "怕热", hint: "建议少穿一层" },
];

export const WARMTH_OFFSET_BY_PREFERENCE: Record<WarmthPreference, number> = {
  runs_cold: 8,
  slightly_cold: 4,
  neutral: 0,
  slightly_hot: -4,
  runs_hot: -8,
};

export function warmthPreferenceLabel(value: WarmthPreference | string | null | undefined): string {
  return WARMTH_PREFERENCE_OPTIONS.find((o) => o.value === value)?.label ?? "正常";
}

export function genderLabel(value: BabyGender | string | null | undefined): string {
  if (value === "unknown" || value == null) return "—";
  return GENDER_OPTIONS.find((o) => o.value === value)?.label ?? "—";
}

export function isBabyGender(value: string): value is BabyGender {
  return GENDER_OPTIONS.some((o) => o.value === value);
}

export function isWarmthPreference(value: string): value is WarmthPreference {
  return WARMTH_PREFERENCE_OPTIONS.some((o) => o.value === value);
}

export const DEFAULT_BABY_AVATARS: Record<BabyGender, string> = {
  male: "/avatars/baby-boy-default.jpg",
  female: "/avatars/baby-girl-default.jpg",
};

export function resolveBabyAvatarUrl(
  avatarUrl?: string | null,
  gender?: BabyGender | string | null
): string {
  if (avatarUrl?.trim()) return avatarUrl.trim();
  if (gender === "female") return DEFAULT_BABY_AVATARS.female;
  return DEFAULT_BABY_AVATARS.male;
}
