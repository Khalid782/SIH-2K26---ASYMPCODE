import test from 'node:test';
import assert from 'node:assert/strict';
import { findGreenRoute } from '../src/utils/greenRouting';
import type { Facility } from '../src/utils/facilities';
import type { Incident } from '../src/types';
const facility: Facility = { id: 'node/1', name: 'Fixture hospital', kind: 'Hospital', coordinates: [17.44, 78.45], sourceUrl: 'https://www.openstreetmap.org/node/1' };
const start: [number, number] = [17.42, 78.45];
test('road result preserves full geometry and facility provenance', async () => {
  const original = globalThis.fetch;
  globalThis.fetch = async () => Response.json({ code: 'Ok', routes: [{ distance: 2500, duration: 300, geometry: { coordinates: [[78.45, 17.42], [78.451, 17.43], [78.45, 17.44]] } }] });
  try {
    const route = await findGreenRoute(start, [], [facility], new AbortController().signal);
    assert.equal(route.coordinates.length, 3); assert.equal(route.kind, 'Hospital');
    assert.equal(route.sourceUrl, facility.sourceUrl);
  } finally { globalThis.fetch = original; }
});
test('provider errors never become straight-line routes', async () => {
  const original = globalThis.fetch;
  globalThis.fetch = async () => new Response('', { status: 503 });
  try { await assert.rejects(findGreenRoute(start, [], [facility], new AbortController().signal), /unavailable/); }
  finally { globalThis.fetch = original; }
});
test('unverified hazards withhold candidate routes', async () => {
  const incident = { id: 'h', coordinates: [17.43, 78.45], severity: 'Critical', status: 'Pending' } as Incident;
  const original = globalThis.fetch;
  globalThis.fetch = async () => Response.json({ code: 'Ok', routes: [{ distance: 2500, duration: 300, geometry: { coordinates: [[78.45, 17.42], [78.45, 17.44]] } }] });
  try { await assert.rejects(findGreenRoute(start, [incident], [facility], new AbortController().signal), /Operator review/); }
  finally { globalThis.fetch = original; }
});
