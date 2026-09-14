import React, { useEffect, useMemo, useState } from 'react';
import L from 'leaflet';
import { booleanIntersects, point } from '@turf/turf';
import { Navigation, Loader2, X } from 'lucide-react';
import type { Incident } from '../types';
import { buildHazards, findGreenRoute, type PreviewRoute } from '../utils/greenRouting';
import { inHyderabad, type LatLng } from '../utils/region';
import type { Facility } from '../utils/facilities';
import { KNOWN_LOCATIONS } from '../utils/triageEngine';

export default function GreenRoutePanel({ map, incidents }: { map: L.Map | null; incidents: Incident[] }) {
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [facilityError, setFacilityError] = useState('');
  const [facilityBusy, setFacilityBusy] = useState(false);
  const [facilityRefresh, setFacilityRefresh] = useState(0);
  const [kind, setKind] = useState('Hospital');
  const [enabled, setEnabled] = useState(false);
  const [origin, setOrigin] = useState<LatLng>([17.4042, 78.4646]);
  const [request, setRequest] = useState(0);
  const [route, setRoute] = useState<(PreviewRoute & { context: string }) | null>(null);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (!enabled) return;
    const controller = new AbortController();
    let active = true;
    setFacilityBusy(true);
    setFacilityError('');
    fetch('/api/facilities', { signal: controller.signal }).then(async (response) => {
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      if (active) { setFacilities(data.facilities); setFacilityError(data.error || ''); }
    }).catch((e) => { if (active) setFacilityError(e.message); }).finally(() => { if (active) setFacilityBusy(false); });
    return () => { active = false; controller.abort(); };
  }, [enabled, facilityRefresh]);
  const destinations = useMemo(() => facilities.filter((f) => f.kind === kind), [facilities, kind]);
  const hazardKey = JSON.stringify(incidents.map((i) => [i.id, i.coordinates, i.severity, i.status]));
  const routeContext = JSON.stringify([origin, hazardKey, kind, destinations.map((d) => d.id)]);
  const hazards = useMemo(() => buildHazards(incidents), [hazardKey]);

  useEffect(() => {
    if (!map || !enabled) return;
    const layers = L.layerGroup().addTo(map);
    for (const hazard of hazards.hazards) {
      L.geoJSON(hazard.polygon, { style: {
        color: hazard.incident.severity === 'Critical' ? '#dc2626' : '#ea580c',
        weight: 1.5, fillOpacity: hazard.confirmed ? 0.22 : 0, dashArray: hazard.confirmed ? undefined : '5 5',
      }}).bindTooltip(hazard.confirmed ? 'Confirmed hazard buffer' : 'Unverified report: operator review').addTo(layers);
    }
    for (const destination of destinations) {
      const blocked = hazards.hazards.some((h) => booleanIntersects(point([...destination.coordinates].reverse()), h.polygon));
      if (!blocked) L.circle(destination.coordinates, { radius: 80, color: '#059669', fillOpacity: 0.3 })
        .bindTooltip(Object.assign(document.createElement('span'), { textContent: destination.kind + ': ' + destination.name + ' (availability unverified)' })).addTo(layers);
    }
    const choose = (event: L.LeafletMouseEvent) => {
      const next: LatLng = [event.latlng.lat, event.latlng.lng];
      if (inHyderabad(next)) { setOrigin(next); setRequest(0); setRoute(null); setMessage(''); }
    };
    map.on('click', choose);
    return () => { map.off('click', choose); layers.remove(); };
  }, [map, enabled, hazards, destinations]);

  useEffect(() => {
    if (!map || !enabled) return;
    const marker = L.circleMarker(origin, { radius: 7, color: '#0284c7', fillOpacity: 1 }).bindTooltip('Route start').addTo(map);
    return () => { marker.remove(); };
  }, [map, enabled, origin]);

  useEffect(() => {
    setRoute(null);
    if (!enabled || !request) { setBusy(false); return; }
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20000);
    let active = true;
    setBusy(true);
    setMessage('Checking road alternatives against reported hazards...');
    findGreenRoute(origin, incidents, destinations, controller.signal).then((result) => {
      if (active) { setRoute({ ...result, context: routeContext }); setMessage('Preview ready. Road closures and facility availability are not verified.'); }
    }).catch((error) => {
      if (active) setMessage(error.name === 'AbortError' ? 'Routing timed out. Please retry.' : error.message);
    }).finally(() => { clearTimeout(timeout); if (active) setBusy(false); });
    return () => { active = false; clearTimeout(timeout); controller.abort(); };
  }, [enabled, request, origin, hazardKey, destinations]);

  useEffect(() => {
    if (!map || !enabled || !route || route.context !== routeContext) return;
    const line = L.polyline(route.coordinates, { color: '#059669', weight: 5, opacity: 0.95 }).addTo(map);
    map.fitBounds(line.getBounds(), { padding: [30, 50], maxZoom: 15, animate: false });
    const path = line.getElement() as SVGPathElement | null;
    let animation: Animation | undefined;
    if (path && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
      const length = path.getTotalLength();
      animation = path.animate([{ strokeDasharray: length + ' ' + length, strokeDashoffset: length }, { strokeDasharray: length + ' ' + length, strokeDashoffset: 0 }], { duration: 1100, easing: 'ease-out' });
    }
    return () => { animation?.cancel(); line.remove(); };
  }, [map, enabled, route, hazardKey, origin, destinations]);

  return <section className="border border-emerald-200 bg-white text-gray-900 rounded-lg p-3 text-xs space-y-2">
    <div className="flex items-center justify-between gap-2">
      <label className="flex items-center gap-2 font-semibold"><input type="checkbox" checked={enabled} onChange={(e) => { setEnabled(e.target.checked); setRequest(0); }} />Green-zone routing</label>
      <span className="text-emerald-700">SIH prototype</span>
    </div>
    {enabled && <>
      <div className="flex flex-wrap items-end gap-2">
        <label className="flex-1 min-w-40">Start locality
          <select aria-label="Route start locality" className="block mt-1 w-full rounded border p-2 bg-white" value={KNOWN_LOCATIONS.find((l) => l.coordinates[0] === origin[0] && l.coordinates[1] === origin[1])?.name || ''} onChange={(e) => {
            const found = KNOWN_LOCATIONS.find((l) => l.name === e.target.value);
            if (found) { setOrigin(found.coordinates); setRequest(0); setRoute(null); }
          }}>
            <option value="" disabled>Selected map point</option>
            {KNOWN_LOCATIONS.map((l) => <option key={l.name} value={l.name}>{l.fullName.split(',')[0]}</option>)}
          </select>
        </label>
        <label>Destination type<select aria-label="Destination type" className="block mt-1 rounded border p-2 bg-white" value={kind} onChange={(e) => { setKind(e.target.value); setRoute(null); }}>
          <option>Hospital</option><option>NGO</option></select></label>
        <button disabled={busy || facilityBusy || !destinations.length} onClick={() => setRequest((n) => n + 1)} className="flex items-center gap-1 rounded bg-emerald-700 text-white p-2 disabled:opacity-50">
          {busy ? <Loader2 size={14} className="animate-spin" /> : <Navigation size={14} />}Preview route
        </button>
        <button title="Clear route" aria-label="Clear route" className="p-2 border rounded" onClick={() => { setRequest(0); setRoute(null); setMessage(''); }}><X size={14} /></button>
      </div>
      <p>Solid buffers: verified reports. Dashed: unverified. Green points: hospitals/NGOs outside reported buffers.</p>
      <p className="text-gray-600">Not emergency navigation. Facility opening, capacity and emergency assistance are unverified; absence of reports does not establish safety.</p>
      <p>{facilityBusy ? 'Loading nearby hospitals and NGOs...' : destinations.length + ' mapped ' + kind.toLowerCase() + ' locations'} | OpenStreetMap</p>
      {facilityError && <p role="alert" className="text-red-700">{facilityError} <button className="underline" onClick={() => setFacilityRefresh((n) => n + 1)}>Retry</button></p>}
      <div role="status" aria-live="polite">{message}</div>
      {route && route.context === routeContext && <p className="font-semibold text-emerald-800">{(route.distance / 1000).toFixed(1)} km road preview to {route.destination} ({route.kind}) <a className="underline" href={route.sourceUrl} target="_blank" rel="noopener noreferrer">View source</a></p>}
    </>}
  </section>;
}
