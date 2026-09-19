export type LatLng = [number, number];

/**
 * Region guard for Green-zone routing (Module 5).
 * Any point that falls outside the Hyderabad operating box is rejected, so a
 * bad geocode can never pull a hazard buffer or a route across the map.
 */
export function inHyderabad(value: unknown): value is LatLng {
  return (
    Array.isArray(value) &&
    value.length === 2 &&
    value.every((n) => typeof n === 'number' && Number.isFinite(n)) &&
    value[0] >= 17.2 &&
    value[0] <= 17.65 &&
    value[1] >= 78.2 &&
    value[1] <= 78.7
  );
}
