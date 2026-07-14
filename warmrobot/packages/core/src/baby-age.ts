/** Whole months since birth, with day-of-month adjustment (same calendar-day logic as web UI). */
export function babyAgeInMonths(birthDate: string, ref = new Date()): number {
  const birth = new Date(birthDate);
  let months =
    (ref.getFullYear() - birth.getFullYear()) * 12 +
    (ref.getMonth() - birth.getMonth());
  if (ref.getDate() < birth.getDate()) months -= 1;
  return Math.max(0, months);
}
