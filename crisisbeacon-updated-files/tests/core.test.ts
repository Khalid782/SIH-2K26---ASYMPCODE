import test from 'node:test';
import assert from 'node:assert/strict';
import { analyzeDisasterReport } from '../src/utils/triageEngine';
import { validateTriageResult, runGeminiTriage } from '../src/utils/geminiTriage';
import { buildHazards, routeClear, findGreenRoute } from '../src/utils/greenRouting';
import { parseFacilities } from '../src/utils/facilities';
import { parseNews } from '../api/news';
import handler from '../api/triage';
import { mapIncidentToRow } from '../src/utils/supabaseMapper';
import type { Incident } from '../src/types';

const incident: Incident = {
  id: 'test', location: 'Hyderabad', coordinates: [17.4, 78.45], severity: 'Critical',
  disasterType: 'Flood', status: 'Verified', source: 'Social Media', aiConfidence: 90,
  timestamp: '2026-09-14T01:00:00Z', timeAgo: 'now', originalReport: 'Flooding',
  entitiesExtracted: { urgency: 'Immediate' },
};
test('routing rejects a line crossing a hazard even with both endpoints outside', () => {
  const { mask } = buildHazards([incident]);
  assert.equal(routeClear([[78.43, 17.4], [78.47, 17.4]], mask), false);
  assert.equal(routeClear([[78.43, 17.43], [78.47, 17.43]], mask), true);
});
test('false alarms and duplicates never form hazards; pending stays unconfirmed', () => {
  assert.equal(buildHazards([{ ...incident, status: 'False Alarm' }]).hazards.length, 0);
  assert.equal(buildHazards([{ ...incident, status: 'Duplicate' }]).hazards.length, 0);
  assert.equal(buildHazards([{ ...incident, status: 'Pending' }]).mask, null);
  assert.equal(buildHazards([{ ...incident, status: 'Pending' }]).hazards.length, 1);
});
test('invalid, empty and out-of-region routes fail closed', () => {
  for (const coords of [[], null, [[78, 17]], [[0, 0], [1, 1]], [[NaN, 17.4], [78.4, 17.4]]]) assert.equal(routeClear(coords, null), false);
});
test('routing never queries a provider for a start inside a hazard', async () => {
  await assert.rejects(findGreenRoute([17.4, 78.45], [incident], [], new AbortController().signal), /inside/);
});
test('fallback prefers actual incident over from/via reference and recognizes aliases', () => {
  assert.match(analyzeDisasterReport('Coming from Tolichowki. Flooding near Mehdipatnam.').primaryLocation, /Mehdipatnam/);
  assert.equal(analyzeDisasterReport('Flooding at kphb').isKnownLocation, true);
});
test('fallback does not invent quantities, mislabel meters or map unknown locations', () => {
  assert.equal(analyzeDisasterReport('Family trapped in flood at Uppal').extractedEntities.peopleTrapped, undefined);
  assert.equal(analyzeDisasterReport('Flooding 2 meters at Uppal').extractedEntities.waterLevel, '2 meters');
  assert.equal(analyzeDisasterReport('Flooding somewhere').locationConfidence, 0);
});
test('ordinary place mentions and explicit negation are not disasters', () => {
  for (const text of ['Coffee near Charminar bridge', 'Hospital directions in Uppal', 'No flooding in Mehdipatnam']) assert.equal(analyzeDisasterReport(text).isRelevant, false);
});
const modelData = () => ({
  isRelevant: true, primaryLocation: 'Uppal', severity: 'High', disasterType: 'Flood',
  cleanedReport: 'Flooding at Uppal.', confidence: 90, locationConfidence: 90,
  secondaryLocations: [], hazards: [], detectedSignals: [], responseNeeded: [],
  coordinates: { lat: 0, lng: 0 },
});
test('model coordinates are replaced by catalog data and unknown locations withheld', () => {
  const data = modelData(); validateTriageResult(data, 'Flooding at Uppal');
  assert.deepEqual(data.coordinates, { lat: 17.3984, lng: 78.5583 });
  const unknown = { ...modelData(), primaryLocation: 'Unknown place' };
  validateTriageResult(unknown, 'Flooding somewhere'); assert.equal(unknown.coordinates, null);
  assert.throws(() => validateTriageResult({ ...modelData(), isRelevant: 'false' }, ''), /Invalid/);
});
test('missing Gemini key returns explicit fallback', async () => {
  const key = process.env.GEMINI_API_KEY;
  delete process.env.GEMINI_API_KEY;
  try { assert.equal((await runGeminiTriage('Flooding at Uppal')).success, false); }
  finally { if (key) process.env.GEMINI_API_KEY = key; }
});
test('triage handler rejects bad methods and oversized reports', async () => {
  const res: any = { code: 200, setHeader() {}, status(code: number) { this.code = code; return this; }, json(body: any) { return body; } };
  await handler({ method: 'GET' } as any, res); assert.equal(res.code, 405);
  await handler({ method: 'POST', body: { text: 'a'.repeat(8001) } } as any, res); assert.equal(res.code, 400);
});
test('database mapper uses columns and UTC without invented flood data', () => {
  const row = mapIncidentToRow(incident);
  assert.equal(row.water_level, null); assert.equal(row.incident_timestamp, '2026-09-14 01:00:00');
  assert.equal(row.latitude, 17.4); assert.equal('coordinates' in row, false);
});
test('facility parser accepts hospitals and NGOs only in Hyderabad', () => {
  const elements = [
    { id: 1, type: 'node', lat: 17.4, lon: 78.45, tags: { name: 'Test hospital', amenity: 'hospital' } },
    { id: 2, type: 'way', center: { lat: 17.41, lon: 78.45 }, tags: { name: 'Test NGO', office: 'ngo' } },
    { id: 3, type: 'node', lat: 0, lon: 0, tags: { name: 'Outside', amenity: 'hospital' } },
  ];
  assert.deepEqual(parseFacilities({ elements }).map((f) => f.kind), ['Hospital', 'NGO']);
  assert.throws(() => parseFacilities({ elements, remark: 'timeout' }));
});
test('news is deduplicated, recent, Hyderabad-specific and link-safe', async () => {
  const now = Date.parse('2026-09-14T12:00:00Z');
  const item = (title: string, link = 'https://example.com/news', date = 'Mon, 14 Sep 2026 10:00:00 GMT') =>
    '<item><title>' + title + '</title><link>' + link + '</link><pubDate>' + date + '</pubDate></item>';
  const xml = '<rss version="2.0"><channel><title>Test</title>' +
    item('Hyderabad flood update') + item('Hyderabad flood update') + item('Delhi flood update') +
    item('Hyderabad fire', 'javascript:alert(1)') + item('Hyderabad flood', undefined, 'Mon, 01 Jan 2024 10:00:00 GMT') + '</channel></rss>';
  assert.equal((await parseNews(xml, now)).length, 1);
});
