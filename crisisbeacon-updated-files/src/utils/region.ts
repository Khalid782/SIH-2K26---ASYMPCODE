export type LatLng = [number, number];

export function inHyderabad(value: unknown): value is LatLng {
  return Array.isArray(value) && value.length === 2 &&
    value.every((n) => typeof n === 'number' && Number.isFinite(n)) &&
    value[0] >= 17.2 && value[0] <= 17.65 && value[1] >= 78.2 && value[1] <= 78.7;
}
