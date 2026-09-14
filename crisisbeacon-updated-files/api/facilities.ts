import type { Request, Response } from 'express';
import { parseFacilities, type Facility } from '../src/utils/facilities.js';
let cache: { fetchedAt: string; facilities: Facility[] } | undefined;
let pending: Promise<void> | undefined;
async function refresh() {
  const bounds = '(17.2,78.2,17.65,78.7)';
  const query = '[out:json][timeout:12];(nwr["amenity"="hospital"]' + bounds +
    ';nwr["healthcare"="hospital"]' + bounds + ';nwr["office"="ngo"]' + bounds + ';);out center tags;';
  const response = await fetch('https://overpass-api.de/api/interpreter', {
    method: 'POST', body: new URLSearchParams({ data: query }),
    signal: AbortSignal.timeout(15000),
  });
  if (!response.ok) throw new Error('Facility provider unavailable');
  cache = { facilities: parseFacilities(await response.json()), fetchedAt: new Date().toISOString() };
}
export default async function handler(req: Request, res: Response) {
  if (req.method !== 'GET') { res.setHeader('Allow', 'GET'); return res.status(405).json({ error: 'Use GET' }); }
  try {
    if (!cache || Date.now() - Date.parse(cache.fetchedAt) > 3600000) {
      pending ??= refresh().finally(() => { pending = undefined; });
      await pending;
    }
    res.setHeader('Cache-Control', 'public, s-maxage=3600');
    return res.json({ ...cache, source: 'OpenStreetMap / Overpass', stale: false });
  } catch {
    res.setHeader('Cache-Control', 'no-store');
    if (cache) return res.json({ ...cache, stale: true, error: 'Refresh unavailable; cached facility locations shown.' });
    return res.status(503).json({ facilities: [], error: 'Hospital and NGO locations could not be loaded. Retry shortly.' });
  }
}
