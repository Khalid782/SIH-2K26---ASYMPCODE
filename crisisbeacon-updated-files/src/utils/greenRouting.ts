import { buffer, point, featureCollection, union, booleanIntersects, lineString, distance } from '@turf/turf';
import type { Feature, Polygon, MultiPolygon } from 'geojson';
import type { Incident } from '../types';
import { inHyderabad, type LatLng } from './region';

import type { Facility } from './facilities';

type Mask = Feature<Polygon | MultiPolygon>;
export function buildHazards(incidents: Incident[]) {
  const hazards = incidents.filter((i) => inHyderabad(i.coordinates) &&
    ['Critical', 'High'].includes(i.severity) && !['False Alarm', 'Duplicate'].includes(i.status))
    .map((i) => ({
      incident: i,
      confirmed: ['Verified', 'Actioned'].includes(i.status),
      polygon: buffer(point([i.coordinates[1], i.coordinates[0]]), i.severity === 'Critical' ? 0.6 : 0.35, { units: 'kilometers', steps: 32 }) as Mask,
    }));
  const confirmed = hazards.filter((h) => h.confirmed).map((h) => h.polygon);
  const mask = confirmed.length > 1 ? union(featureCollection(confirmed)) : confirmed[0] || null;
  return { hazards, mask };
}

export function routeClear(coordinates: unknown, mask: Mask | null): boolean {
  if (!Array.isArray(coordinates) || coordinates.length < 2 ||
      !coordinates.every((p) => Array.isArray(p) && inHyderabad([p[1], p[0]]))) return false;
  return !mask || !booleanIntersects(lineString(coordinates), mask);
}

export interface PreviewRoute { coordinates: LatLng[]; distance: number; duration: number; destination: string; sourceUrl: string; kind: string }
export async function findGreenRoute(origin: LatLng, incidents: Incident[], facilities: Facility[], signal: AbortSignal): Promise<PreviewRoute> {
  if (!inHyderabad(origin)) throw new Error('Select a start point within Hyderabad.');
  const { mask, hazards } = buildHazards(incidents);
  const start = point([origin[1], origin[0]]);
  if (mask && booleanIntersects(start, mask)) throw new Error('Start is inside a reported hazard buffer. No route preview can be offered.');
  const destinations = facilities.filter((d) => !hazards.some((h) =>
    booleanIntersects(point([d.coordinates[1], d.coordinates[0]]), h.polygon)))
    .sort((a, b) => distance(start, point([...a.coordinates].reverse())) - distance(start, point([...b.coordinates].reverse())));
  if (!destinations.length) throw new Error('No loaded hospitals or NGOs are outside reported hazard buffers.');
  for (const destination of destinations.slice(0, 3)) {
    signal.throwIfAborted();
    const end = destination.coordinates;
    const response = await fetch('https://router.project-osrm.org/route/v1/driving/' +
      origin[1] + ',' + origin[0] + ';' + end[1] + ',' + end[0] +
      '?alternatives=true&overview=full&geometries=geojson&radiuses=100;100', { signal });
    if (!response.ok) throw new Error('Road routing service unavailable. No route has been drawn.');
    const data = await response.json();
    const options = (data.code === 'Ok' && Array.isArray(data.routes)) ? data.routes : [];
    const route = options.filter((r: any) => Number.isFinite(r.distance) && Number.isFinite(r.duration) && routeClear(r.geometry?.coordinates, mask))
      .sort((a: any, b: any) => a.distance - b.distance)[0];
    if (route) {
      const coords = route.geometry.coordinates;
      // Check the short snapped-road connectors too; never bridge a hazard silently.
      if (!routeClear([[origin[1], origin[0]], ...coords, [end[1], end[0]]], mask)) continue;
      if (hazards.some((h) => !h.confirmed && booleanIntersects(lineString([[origin[1], origin[0]], ...coords, [end[1], end[0]]]), h.polygon))) continue;
      return { coordinates: coords.map((p: number[]) => [p[1], p[0]]), distance: route.distance, duration: route.duration, destination: destination.name, sourceUrl: destination.sourceUrl, kind: destination.kind };
    }
  }
  throw new Error('No road alternative to the nearest three candidates clears all reported hazards. Operator review is required. No route has been drawn.');
}
