/** Shared baby-clothing size tables — aligned with size_labels / 枚举.md §6.1 */

export const SIZE_LETTER_CODES = ["S", "M", "L", "XL", "2XL", "3XL", "4XL"] as const;

export const SIZE_HEIGHT_CODES = [
  "48",
  "52",
  "59",
  "66",
  "73",
  "80",
  "90",
  "100",
  "110",
  "120",
  "130",
  "140",
  "150",
  "160",
  "165",
] as const;

export const LETTER_TO_HEIGHT: Record<string, string> = {
  S: "110",
  M: "120",
  L: "130",
  XL: "140",
  "2XL": "150",
  "3XL": "160",
  "4XL": "165",
};

export type SizeAgeRange = { min: number; max: number };

/** Recommended age window per size code (months). */
export const SIZE_AGE_MONTHS: Record<string, SizeAgeRange> = {
  "48": { min: 0, max: 1 },
  "52": { min: 0, max: 1 },
  "59": { min: 1, max: 3 },
  "66": { min: 3, max: 6 },
  "73": { min: 6, max: 9 },
  "80": { min: 9, max: 12 },
  "90": { min: 12, max: 18 },
  "100": { min: 18, max: 24 },
  "110": { min: 24, max: 36 },
  "120": { min: 36, max: 48 },
  "130": { min: 48, max: 60 },
  "140": { min: 60, max: 72 },
  "150": { min: 72, max: 84 },
  "160": { min: 84, max: 96 },
  "165": { min: 96, max: 144 },
  S: { min: 48, max: 60 },
  M: { min: 60, max: 72 },
  L: { min: 72, max: 84 },
  XL: { min: 84, max: 96 },
  "2XL": { min: 96, max: 108 },
  "3XL": { min: 108, max: 120 },
  "4XL": { min: 120, max: 180 },
};

/** Median expected weight (kg) per height size — used for size bump when baby is heavier. */
export const SIZE_EXPECTED_WEIGHT_KG: Record<string, number> = {
  "48": 3,
  "52": 4,
  "59": 5,
  "66": 7.5,
  "73": 9,
  "80": 10,
  "90": 12,
  "100": 13,
  "110": 15,
  "120": 17,
  "130": 19,
  "140": 22,
  "150": 25,
  "160": 28,
  "165": 30,
};

/** Relative weight multiplier per size for clothing weight estimation. */
export const SIZE_WEIGHT_SCALE: Record<string, number> = {
  "48": 0.65,
  "52": 0.75,
  "59": 0.85,
  "66": 1.0,
  "73": 1.1,
  "80": 1.2,
  "90": 1.35,
  "100": 1.5,
  "110": 1.65,
  "120": 1.8,
  "130": 1.95,
  "140": 2.1,
  "150": 2.25,
  "160": 2.4,
  "165": 2.5,
  S: 1.65,
  M: 1.8,
  L: 1.95,
  XL: 2.1,
  "2XL": 2.25,
  "3XL": 2.4,
  "4XL": 2.5,
};

/** When actual weight exceeds expected × this ratio, suggest the next height size. */
export const SIZE_WEIGHT_BUMP_RATIO = 1.12;

export function isLetterSizeCode(code: string): boolean {
  return (SIZE_LETTER_CODES as readonly string[]).includes(code);
}

export function splitSizeCodes(codes: readonly string[]): {
  height: string[];
  letter: string[];
} {
  return {
    height: codes.filter((code) => !isLetterSizeCode(code)),
    letter: codes.filter((code) => isLetterSizeCode(code)),
  };
}

export function resolveSizeForWeight(sizeLabel: string): string {
  return LETTER_TO_HEIGHT[sizeLabel] ?? sizeLabel;
}

export function getSizeWeightScale(sizeLabel: string): number {
  const resolved = resolveSizeForWeight(sizeLabel);
  return SIZE_WEIGHT_SCALE[resolved] ?? SIZE_WEIGHT_SCALE[sizeLabel] ?? 1.0;
}
