import { babyAgeInMonths } from "@warmrobot/core";
import { normalizeCategoryCode } from "@/lib/clothing-categories";
import {
  isLetterSizeCode,
  SIZE_AGE_MONTHS,
  SIZE_HEIGHT_CODES,
  splitSizeCodes,
} from "@/lib/size-standards";

export interface BabySizeProfile {
  birthDate?: string | null;
  /** @deprecated 尺码仅按年龄推荐，身高不再参与计算 */
  heightCm?: number | null;
  /** @deprecated 尺码仅按年龄推荐，体重不再参与计算 */
  weightKg?: number | null;
}

export { babyAgeInMonths };

function pickByAgeMonths(codes: readonly string[], months: number): string | null {
  const matches = codes.filter((code) => {
    const range = SIZE_AGE_MONTHS[code];
    return range && months >= range.min && months <= range.max;
  });
  if (matches.length === 0) return null;

  return matches.reduce<string | null>((best, code) => {
    if (!best) return code;
    const bestRange = SIZE_AGE_MONTHS[best]!;
    const range = SIZE_AGE_MONTHS[code]!;
    const bestMid = (bestRange.min + bestRange.max) / 2;
    const mid = (range.min + range.max) / 2;
    const bestDiff = Math.abs(bestMid - months);
    const diff = Math.abs(mid - months);
    if (diff < bestDiff) return code;
    if (diff === bestDiff && Number(code) > Number(best)) return code;
    return best;
  }, null);
}

function allowsLetterSizesByAge(category: string, ageMonths: number): boolean {
  const normalized = normalizeCategoryCode(category);
  if (!normalized) return false;
  if (normalized.startsWith("bodysuit_")) return false;
  // 与 enums.md 一致：毛衣小码以身高码为主，2 岁前不推荐字母码
  if (normalized === "sweater" && ageMonths < 24) return false;
  return true;
}

/**
 * 根据宝宝月龄在类别允许的白名单内推荐尺码（仅年龄，不看身高/体重）。
 */
export function suggestSizeForCategory(
  category: string,
  allowedCodes: readonly string[],
  baby: BabySizeProfile
): string | null {
  if (allowedCodes.length === 0) return null;

  const ageMonths = baby.birthDate ? babyAgeInMonths(baby.birthDate) : null;
  if (ageMonths == null) return null;

  const { height: heightCodes, letter: letterCodes } = splitSizeCodes(allowedCodes);
  const heightPool = heightCodes.length > 0 ? heightCodes : allowedCodes;

  const byAge = pickByAgeMonths(heightPool, ageMonths);
  if (byAge) return byAge;

  if (letterCodes.length > 0 && allowsLetterSizesByAge(category, ageMonths)) {
    const byLetterAge = pickByAgeMonths(letterCodes, ageMonths);
    if (byLetterAge) return byLetterAge;
  }

  return allowedCodes[0] ?? null;
}

/** 根据宝宝生日推算当前穿着码（衣柜扫描、商品识别、同步 babies.current_size_label）。 */
export function suggestBabyCurrentSize(baby: Pick<BabySizeProfile, "birthDate">): string | null {
  return suggestSizeForCategory("bodysuit_long", SIZE_HEIGHT_CODES, baby);
}
