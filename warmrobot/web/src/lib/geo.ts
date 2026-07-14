export function hasValidCoordinates(
  latitude?: number | string | null,
  longitude?: number | string | null
): boolean {
  if (latitude == null || longitude == null) return false;
  const lat = Number(latitude);
  const lng = Number(longitude);
  return Number.isFinite(lat) && Number.isFinite(lng);
}
