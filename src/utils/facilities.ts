import { inHyderabad, type LatLng } from './region';

export interface Facility {
  id: string;
  name: string;
  kind: 'Hospital' | 'NGO';
  coordinates: LatLng;
  sourceUrl: string;
  phone?: string;
}

/**
 * Block 2 — Green zone candidates.
 * Turns a raw Overpass `out center tags` payload (amenity=hospital, healthcare=hospital,
 * office=ngo) into deduplicated facilities that sit inside Hyderabad.
 * Unnamed, disused, abandoned, private and out-of-region entries are dropped.
 */
export function osmSearchUrl(name: string): string {
  return 'https://www.openstreetmap.org/search?query=' + encodeURIComponent(name + ', Hyderabad');
}

/**
 * Degraded-mode facility list.
 * Overpass is a free, fair-use service and does rate-limit shared IPs, which used to
 * leave the map with no green zone at all. These major Hyderabad facilities keep the
 * safe-facility layer usable offline. Coordinates are APPROXIMATE (area centroids, not
 * surveyed entrances) and must always lose to a live Overpass result, which is why the
 * UI labels this source explicitly.
 */
export const FALLBACK_FACILITIES: Facility[] = (
  [
    ['Osmania General Hospital', [17.3735, 78.474], 'Hospital'],
    ['Gandhi Hospital, Musheerabad', [17.4247, 78.5033], 'Hospital'],
    ["Nizam's Institute of Medical Sciences (NIMS)", [17.4239, 78.4536], 'Hospital'],
    ['Apollo Hospitals, Jubilee Hills', [17.4156, 78.4115], 'Hospital'],
    ['Care Hospitals, Banjara Hills', [17.4186, 78.4408], 'Hospital'],
    ['KIMS Hospitals, Secunderabad', [17.4308, 78.4878], 'Hospital'],
    ['AIG Hospitals, Gachibowli', [17.4249, 78.3451], 'Hospital'],
    ['Continental Hospitals, Gachibowli', [17.4204, 78.3409], 'Hospital'],
    ['Yashoda Hospitals, Somajiguda', [17.4245, 78.456], 'Hospital'],
    ['Star Hospitals, Banjara Hills', [17.418, 78.441], 'Hospital'],
    ['Sarojini Devi Eye Hospital, Mehdipatnam', [17.396, 78.446], 'Hospital'],
    ['Niloufer Hospital, Red Hills', [17.4108, 78.4626], 'Hospital'],
    ['Owaisi Hospital, Kanchanbagh', [17.3452, 78.4783], 'Hospital'],
    ['ESIC Hospital, Sanathnagar', [17.4509, 78.4294], 'Hospital'],
    ['Government Maternity Hospital, Koti', [17.385, 78.485], 'Hospital'],
    ['Helping Hand Foundation', [17.3986, 78.4069], 'NGO'],
    ['Youth Red Cross', [17.4399, 78.4983], 'NGO'],
    ['St. John Ambulance', [17.4156, 78.435], 'NGO'],
    ['SEEDS India', [17.3616, 78.4747], 'NGO'],
  ] as const
).map(([name, coordinates, kind]) => ({
  id: 'fallback:' + kind + ':' + name,
  name,
  kind,
  coordinates: [...coordinates] as LatLng,
  sourceUrl: osmSearchUrl(name),
}));
export function parseFacilities(data: any): Facility[] {
  if (!Array.isArray(data?.elements) || data.remark) throw new Error('Incomplete facility data');

  const seen = new Set<string>();

  return data.elements.flatMap((item: any) => {
    const tags = item.tags || {};
    const coordinates = [item.lat ?? item.center?.lat, item.lon ?? item.center?.lon];

    const kind: Facility['kind'] | null =
      tags.amenity === 'hospital' || tags.healthcare === 'hospital'
        ? 'Hospital'
        : tags.office === 'ngo'
          ? 'NGO'
          : null;

    if (
      !kind ||
      typeof tags.name !== 'string' ||
      !inHyderabad(coordinates) ||
      tags.disused === 'yes' ||
      tags.abandoned === 'yes' ||
      tags.access === 'private' ||
      !['node', 'way', 'relation'].includes(item.type) ||
      !Number.isInteger(item.id)
    ) {
      return [];
    }

    const key = tags.name.toLowerCase() + ':' + coordinates.map((n) => n.toFixed(3)).join(',');
    if (seen.has(key)) return [];
    seen.add(key);

    const facility: Facility = {
      id: item.type + '/' + item.id,
      name: tags.name,
      kind,
      coordinates,
      sourceUrl: 'https://www.openstreetmap.org/' + item.type + '/' + item.id,
      phone: tags.phone || tags['contact:phone'],
    };
    return [facility];
  });
}
