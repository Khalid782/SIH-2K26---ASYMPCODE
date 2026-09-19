// ---------------------------------------------------------------------------
// CRISISBEACON facility lookup: GET /api/facilities
// One cached, Hyderabad-bounded Overpass query feeding the Green-zone module.
// Mounted by server.ts for local dev and by Vercel as a serverless function.
// ---------------------------------------------------------------------------
import type { Request, Response } from 'express';
import { parseFacilities, FALLBACK_FACILITIES, type Facility } from '../src/utils/facilities';

const CACHE_MS = 3_600_000;

let cache: { fetchedAt: string; facilities: Facility[] } | undefined;
let pending: Promise<void> | undefined;

async function refresh(): Promise<void> {
  const bounds = '(17.2,78.2,17.65,78.7)';
  const query =
    '[out:json][timeout:12];(' +
    'nwr["amenity"="hospital"]' +
    bounds +
    ';nwr["healthcare"="hospital"]' +
    bounds +
    ';nwr["office"="ngo"]' +
    bounds +
    ';);out center tags;';

  const response = await fetch('https://overpass-api.de/api/interpreter', {
    method: 'POST',
    body: new URLSearchParams({ data: query }),
    signal: AbortSignal.timeout(15_000),
  });

  if (!response.ok) throw new Error('Facility provider unavailable');

  cache = {
    facilities: parseFacilities(await response.json()),
    fetchedAt: new Date().toISOString(),
  };
}

export default async function handler(req: Request, res: Response) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Use GET' });
  }

  try {
    if (!cache || Date.now() - Date.parse(cache.fetchedAt) > CACHE_MS) {
      pending ??= refresh().finally(() => {
        pending = undefined;
      });
      await pending;
    }
    res.setHeader('Cache-Control', 'public, s-maxage=3600');
    return res.json({ ...cache, source: 'OpenStreetMap / Overpass', stale: false });
  } catch {
    res.setHeader('Cache-Control', 'no-store');
    if (cache) {
      return res.json({
        ...cache,
        stale: true,
        error: 'Refresh unavailable; cached facility locations shown.',
      });
    }
    // Never hand the map an empty green zone. Overpass is free and fair-use, so
    // rate-limits are normal; degrade to the built-in list and label it clearly.
    return res.json({
      facilities: FALLBACK_FACILITIES,
      fetchedAt: new Date().toISOString(),
      source: 'Built-in fallback list',
      fallback: true,
      stale: true,
      error:
        'OpenStreetMap is unavailable right now, so the built-in list of major facilities is shown. Those locations are approximate.',
    });
  }
}
