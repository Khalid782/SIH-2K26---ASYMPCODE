import {
  buffer,
  point,
  featureCollection,
  union,
  booleanIntersects,
  booleanPointInPolygon,
  lineString,
  distance,
} from '@turf/turf';
import type { Feature, Polygon, MultiPolygon, Position } from 'geojson';
import type { Incident } from '../types';
import { inHyderabad, type LatLng } from './region';
import type { Facility } from './facilities';

type Mask = Feature<Polygon | MultiPolygon>;

/** Buffer radius per severity band, in kilometres. */
const CRITICAL_BUFFER_KM = 0.6;
const HIGH_BUFFER_KM = 0.35;

export interface Hazard {
  incident: Incident;
  /** Verified/Actioned reports form the merged mask; Pending ones only block routes. */
  confirmed: boolean;
  polygon: Mask;
}

/**
 * Block 1 — Hazard mask.
 * Buffers every Critical/High incident inside Hyderabad and unions the confirmed
 * ones into a single polygon. False alarms and duplicates never become hazards.
 */
export function buildHazards(incidents: Incident[]): { hazards: Hazard[]; mask: Mask | null } {
  const hazards = incidents
    .filter(
      (i) =>
        inHyderabad(i.coordinates) &&
        ['Critical', 'High'].includes(i.severity) &&
        !['False Alarm', 'Duplicate'].includes(i.status)
    )
    .map((incident) => ({
      incident,
      confirmed: ['Verified', 'Actioned'].includes(incident.status),
      polygon: buffer(
        point([incident.coordinates[1], incident.coordinates[0]]),
        incident.severity === 'Critical' ? CRITICAL_BUFFER_KM : HIGH_BUFFER_KM,
        { units: 'kilometers', steps: 32 }
      ) as Mask,
    }));

  const confirmed = hazards.filter((h) => h.confirmed).map((h) => h.polygon);
  const mask = confirmed.length > 1 ? union(featureCollection(confirmed)) : confirmed[0] || null;

  return { hazards, mask };
}

/**
 * A route may only be shown when every vertex sits inside Hyderabad/the served region and
 * the line never occupies a hazard buffer — with one deliberate exception.
 *
 * Escape routing: the start point is expected to be *inside* a red/orange buffer, because
 * getting people out of one is the whole purpose. A route may therefore occupy a prefix of
 * the buffers its start sits in (`startHazards`), but it must leave them and never re-enter.
 * Every other hazard must be avoided outright.
 * Fails closed: unusable geometry is never treated as "clear".
 */
export function routeClear(
  coordinates: unknown,
  hazards: Hazard[],
  startHazards: Hazard[] = []
): boolean {
  if (
    !Array.isArray(coordinates) ||
    coordinates.length < 2 ||
    !coordinates.every((p) => Array.isArray(p) && inHyderabad([p[1], p[0]]))
  ) {
    return false;
  }

  const positions = coordinates as Position[];
  const line = lineString(positions);

  for (const hazard of hazards) {
    if (!booleanIntersects(line, hazard.polygon)) continue;

    // A buffer the route did not start inside has to be avoided completely.
    if (!startHazards.includes(hazard)) return false;

    // Started inside this one: it must exit, and it must never come back.
    const exit = positions.findIndex((p) => !booleanPointInPolygon(point(p), hazard.polygon));
    if (exit < 0) return false;
    const tail = positions.slice(exit);
    if (tail.length >= 2 && booleanIntersects(lineString(tail), hazard.polygon)) return false;
  }

  return true;
}

export interface PreviewRoute {
  coordinates: LatLng[];
  distance: number;
  duration: number;
  destination: string;
  destinationCoordinates: LatLng;
  sourceUrl: string;
  kind: string;
}

/**
 * Live re-routing guard (FR5.5).
 * Answers one question: is a route that was already drawn still valid now that the
 * hazard mask has shifted? Returns an operator-facing reason when it is not, or null
 * when it stays clear. It never draws anything — the caller decides what to do.
 */
export function routeConflict(
  route: LatLng[],
  incidents: Incident[],
  destination?: LatLng
): string | null {
  if (route.length < 2) return 'The drawn route is no longer usable.';

  const { hazards } = buildHazards(incidents);
  const positions = route.map(([lat, lng]) => [lng, lat] as Position);

  // The route legitimately begins inside the buffer it is escaping, so that one stays
  // allowed. Everything else follows the same rules as the initial check.
  const startHazards = hazards.filter((h) => booleanIntersects(point(positions[0]), h.polygon));

  if (!routeClear(positions, hazards.filter((h) => h.confirmed), startHazards)) {
    return 'A confirmed hazard buffer now crosses this route.';
  }
  if (!routeClear(positions, hazards.filter((h) => !h.confirmed), startHazards)) {
    return 'An unverified report now crosses this route.';
  }
  if (
    destination &&
    hazards.some((h) => booleanIntersects(point([destination[1], destination[0]]), h.polygon))
  ) {
    return 'The destination is now inside a hazard buffer.';
  }

  return null;
}

/**
 * Blocks 2 + 3 — Green zone and safe routing.
 * Keeps only facilities outside every reported hazard buffer, sorts them by
 * straight-line distance, then asks OSRM for driving alternatives. Each returned
 * geometry (plus its snapped start/end connectors) is re-checked with Turf before
 * it is offered. No straight-line fallback is ever drawn.
 */
export async function findGreenRoute(
  origin: LatLng,
  incidents: Incident[],
  facilities: Facility[],
  signal: AbortSignal
): Promise<PreviewRoute> {
  if (!inHyderabad(origin)) throw new Error('Select a start point within Hyderabad.');

  const { hazards } = buildHazards(incidents);
  const start = point([origin[1], origin[0]]);

  // Escape routing: a start inside a hazard buffer is the expected case, not an error —
  // the red/orange zone is exactly where someone needs a way out. The route is allowed to
  // cross the buffers this start sits in, but must leave them and stay clear of the rest.
  const startHazards = hazards.filter((h) => booleanIntersects(start, h.polygon));

  const destinations = facilities
    .filter(
      (d) =>
        !hazards.some((h) => booleanIntersects(point([d.coordinates[1], d.coordinates[0]]), h.polygon))
    )
    .sort(
      (a, b) =>
        distance(start, point([a.coordinates[1], a.coordinates[0]])) -
        distance(start, point([b.coordinates[1], b.coordinates[0]]))
    );

  if (!destinations.length) {
    throw new Error('No loaded hospitals or NGOs are outside reported hazard buffers.');
  }

  for (const destination of destinations.slice(0, 3)) {
    signal.throwIfAborted();

    const end = destination.coordinates;
    const response = await fetch(
      'https://router.project-osrm.org/route/v1/driving/' +
        origin[1] +
        ',' +
        origin[0] +
        ';' +
        end[1] +
        ',' +
        end[0] +
        '?alternatives=true&overview=full&geometries=geojson&radiuses=100;100',
      { signal }
    );

    if (!response.ok) {
      throw new Error('Road routing service unavailable. No route has been drawn.');
    }

    const data = await response.json();
    const options = data.code === 'Ok' && Array.isArray(data.routes) ? data.routes : [];

    const route = options
      .filter(
        (r: any) =>
          Number.isFinite(r.distance) &&
          Number.isFinite(r.duration) &&
          routeClear(r.geometry?.coordinates, hazards, startHazards)
      )
      .sort((a: any, b: any) => a.distance - b.distance)[0];

    if (!route) continue;

    const coords = route.geometry.coordinates;
    // Check the short snapped-road connectors too; never bridge a hazard silently.
    const fullLine = [[origin[1], origin[0]], ...coords, [end[1], end[0]]];
    if (!routeClear(fullLine, hazards, startHazards)) continue;

    return {
      coordinates: coords.map((p: number[]) => [p[1], p[0]] as LatLng),
      distance: route.distance,
      duration: route.duration,
      destination: destination.name,
      destinationCoordinates: end,
      sourceUrl: destination.sourceUrl,
      kind: destination.kind,
    };
  }

  throw new Error(
    'No road alternative to the nearest three candidates clears every reported hazard, including unverified reports. Operator review is required. No route has been drawn.'
  );
}
