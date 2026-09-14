import { inHyderabad, type LatLng } from './region.js';
export interface Facility {
  id: string; name: string; kind: 'Hospital' | 'NGO'; coordinates: LatLng; sourceUrl: string; phone?: string;
}
export function parseFacilities(data: any): Facility[] {
  if (!Array.isArray(data?.elements) || data.remark) throw new Error('Incomplete facility data');
  const seen = new Set<string>();
  return data.elements.flatMap((item: any) => {
    const tags = item.tags || {};
    const coords = [item.lat ?? item.center?.lat, item.lon ?? item.center?.lon];
    const kind = tags.amenity === 'hospital' || tags.healthcare === 'hospital' ? 'Hospital' : tags.office === 'ngo' ? 'NGO' : null;
    if (!kind || typeof tags.name !== 'string' || !inHyderabad(coords) ||
        tags.disused === 'yes' || tags.abandoned === 'yes' || tags.access === 'private' ||
        !['node', 'way', 'relation'].includes(item.type) || !Number.isInteger(item.id)) return [];
    const key = tags.name.toLowerCase() + ':' + coords.map((n) => n.toFixed(3)).join(',');
    if (seen.has(key)) return [];
    seen.add(key);
    return [{ id: item.type + '/' + item.id, name: tags.name, kind, coordinates: coords,
      sourceUrl: 'https://www.openstreetmap.org/' + item.type + '/' + item.id,
      phone: tags.phone || tags['contact:phone'] }] as Facility[];
  });
}
