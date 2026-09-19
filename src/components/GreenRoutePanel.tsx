import React, { useEffect, useMemo, useRef, useState } from 'react';
import L from 'leaflet';
import { booleanIntersects, distance, point } from '@turf/turf';
import { Navigation, Loader2, X } from 'lucide-react';
import type { Incident } from '../types';
import {
  buildHazards,
  findGreenRoute,
  routeConflict,
  type PreviewRoute,
} from '../utils/greenRouting';
import { inHyderabad, type LatLng } from '../utils/region';
import { FALLBACK_FACILITIES, type Facility } from '../utils/facilities';
import { KNOWN_LOCATIONS } from '../utils/triageEngine';
import { supabase } from '../supabaseClient';

const DEFAULT_ORIGIN: LatLng = [17.4042, 78.4646];
const ROUTE_COLOR = '#12a150';

/** The route draws itself over ~1.1s, then flows; both are skipped for reduced motion. */
const ROUTE_DRAW_MS = 1100;

/** One loop of the travelling marker along a drawn route. */
const ROUTE_TRAVEL_MS = 7000;

/**
 * Quiet period before a hazard-driven re-route fires. Incoming reports often arrive
 * in bursts; this collapses them into a single OSRM request.
 */
const AUTO_REROUTE_MS = 600;

/**
 * How many green-zone facilities are drawn. The live Overpass list carries ~1,000
 * Hyderabad hospitals; drawing every one of them buries the map and rebuilds ~2,000 SVG
 * nodes on every realtime report. Routing still considers the whole green zone — this
 * only limits what is rendered.
 */
const MAX_DRAWN_ZONE = 40;

/**
 * Radii are in METRES, so the zones scale with the map the way a real area does. Sized to be
 * unmistakable: at the Situation Room's default zoom 12 a 500 m radius is ~27 px across and
 * the 800 m destination zone ~44 px. (An 80 m radius would be ~4 px — invisible.)
 */
const ZONE_RADIUS_M = 500;
const DESTINATION_ZONE_RADIUS_M = 800;

/** Marching-dash overlay: dash length (the gap matches it, so the dash period is twice this). */
const FLOW_DASH = 10;
const FLOW_PERIOD = FLOW_DASH * 2;

/** One dash unit every 40 ms — the marching speed from the reference snippet. */
const FLOW_STEP_MS = 40;

interface GreenRoutePanelProps {
  map: L.Map | null;
  incidents: Incident[];
  /**
   * True once the incident feed has loaded. Gates ROUTING only: with the full hazard set
   * unknown, sending anyone down a road is unsafe. The green zone itself still draws — it is
   * built from facility data, and hiding every safe hospital because a database read failed
   * is the wrong failure mode.
   */
  routingReady: boolean;
  /** Why the incident feed is not ready, for the on-map readout. */
  feedError?: string;
}

export default function GreenRoutePanel({
  map,
  incidents,
  routingReady,
  feedError,
}: GreenRoutePanelProps) {
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [facilityError, setFacilityError] = useState('');
  const [facilityBusy, setFacilityBusy] = useState(false);
  const [facilityFallback, setFacilityFallback] = useState(false);
  const [facilityStatus, setFacilityStatus] = useState<
    'idle' | 'live' | 'fallback' | 'degraded' | 'unreachable'
  >('idle');
  const [facilityRefresh, setFacilityRefresh] = useState(0);
  const [kind, setKind] = useState<Facility['kind']>('Hospital');
  // Green-zone routing is ON by default: the map should show people a way out without
  // anyone having to find a checkbox first.
  const [enabled, setEnabled] = useState(true);
  const [routeWanted, setRouteWanted] = useState(true);
  const [origin, setOrigin] = useState<LatLng>(DEFAULT_ORIGIN);
  const [request, setRequest] = useState(0);
  const [route, setRoute] = useState<(PreviewRoute & { context: string }) | null>(null);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  // Pending live re-route, kept in a ref so clearing the drawn route (which is what
  // makes a conflicting line disappear) cannot cancel the recompute that follows.
  const rerouteTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cancelAutoReroute = () => {
    if (rerouteTimer.current) {
      clearTimeout(rerouteTimer.current);
      rerouteTimer.current = null;
    }
  };
  useEffect(() => () => cancelAutoReroute(), []);

  // Load the facility list once the operator enables green-zone routing. The green zone
  // must never be empty, so a rate-limited provider or a missing endpoint degrades to the
  // built-in fallback list instead of showing nothing.
  useEffect(() => {
    if (!enabled) return;
    const controller = new AbortController();
    let active = true;

    setFacilityBusy(true);
    setFacilityError('');

    fetch('/api/facilities', { signal: controller.signal })
      .then(async (response) => {
        const data = await response.json().catch(() => null);
        const list: Facility[] = Array.isArray(data?.facilities) ? data.facilities : [];
        if (!list.length) throw new Error(data?.error || 'No facilities were returned.');
        if (!active) return;
        setFacilities(list);
        setFacilityFallback(Boolean(data?.fallback || data?.stale));
        setFacilityError(data?.error || '');
        setFacilityStatus(
          !response.ok ? 'degraded' : data?.fallback || data?.stale ? 'fallback' : 'live'
        );
      })
      .catch((e) => {
        if (!active || e?.name === 'AbortError') return;
        setFacilities(FALLBACK_FACILITIES);
        setFacilityFallback(true);
        setFacilityError(e.message);
        setFacilityStatus('unreachable');
      })
      .finally(() => {
        if (active) setFacilityBusy(false);
      });

    return () => {
      active = false;
      controller.abort();
    };
  }, [enabled, facilityRefresh]);

  const destinations = useMemo(() => facilities.filter((f) => f.kind === kind), [facilities, kind]);

  // Fingerprint of the hazard set, so buffers/layers rebuild on report edits rather
  // than on every array identity change.
  const hazardKey = JSON.stringify(incidents.map((i) => [i.id, i.coordinates, i.severity, i.status]));

  // Identity of the routing request only. A shifted hazard mask must not silently
  // invalidate the drawn route — routeConflict() decides that and drives live re-routing.
  const requestContext = JSON.stringify([origin, kind, destinations.map((d) => d.id)]);

  const hazards = useMemo(() => buildHazards(incidents), [incidents, hazardKey]);

  // Block 2 — the green zone itself: facilities outside every reported hazard buffer.
  // Computed once so the markers, the displayed count and the preview candidates agree.
  const greenZone = useMemo(
    () =>
      destinations.filter(
        (d) =>
          !hazards.hazards.some((h) =>
            booleanIntersects(point([d.coordinates[1], d.coordinates[0]]), h.polygon)
          )
      ),
    [destinations, hazards]
  );

  // The nearest slice of the green zone to the current start point.
  const drawnZone = useMemo(() => {
    const start = point([origin[1], origin[0]]);
    return [...greenZone]
      .sort(
        (a, b) =>
          distance(start, point([a.coordinates[1], a.coordinates[0]])) -
          distance(start, point([b.coordinates[1], b.coordinates[0]]))
      )
      .slice(0, MAX_DRAWN_ZONE);
  }, [greenZone, origin]);

  // Auto-route: as soon as the green zone is known, request a route so the map always
  // shows a way out on its own. `request > 0` keeps this from looping when a route
  // cannot be found — the status line explains that instead.
  useEffect(() => {
    if (!enabled || !routeWanted || !routingReady || request > 0 || !greenZone.length) return;
    setRequest(1);
  }, [enabled, routeWanted, routingReady, request, greenZone.length]);

  // Draw the green zone, hazard buffers, safe facilities, and click-to-set the start point.
  //
  // Deliberately NOT gated on routingReady. This effect used to return early whenever the
  // incident feed had not loaded, which meant a Supabase read failure hid every hospital on
  // the map and made the green zone look broken rather than unscreened.
  useEffect(() => {
    if (!map || !enabled) return;
    const layers = L.layerGroup().addTo(map);

    for (const hazard of hazards.hazards) {
      L.geoJSON(hazard.polygon, {
        style: {
          color: hazard.incident.severity === 'Critical' ? '#dc2626' : '#ea580c',
          weight: 1.5,
          // Unverified buffers still withhold routes, so keep them perceptible at city
          // zoom rather than leaving them as a hairline outline.
          fillOpacity: hazard.confirmed ? 0.22 : 0.08,
          dashArray: hazard.confirmed ? undefined : '5 5',
        },
      })
        .bindTooltip(hazard.confirmed ? 'Confirmed hazard buffer' : 'Unverified report: operator review')
        .addTo(layers);
    }

    for (const facility of drawnZone) {
      // A green zone in METRES around each safe facility, outlined so overlapping zones stay
      // readable. Where facilities cluster these merge into one continuous green area.
      L.circle(facility.coordinates, {
        radius: ZONE_RADIUS_M,
        color: ROUTE_COLOR,
        weight: 1,
        opacity: 0.5,
        dashArray: '4 5',
        fillColor: ROUTE_COLOR,
        fillOpacity: 0.15,
      })
        .bindTooltip(
          Object.assign(document.createElement('span'), {
            textContent:
              facility.kind +
              ': ' +
              facility.name +
              (routingReady
                ? ' — green zone, outside every reported hazard buffer (availability unverified)'
                : ' — green zone UNScreened: hazard data unavailable (availability unverified)'),
          })
        )
        .addTo(layers);
      // A high-contrast pin, so the facility itself is findable at any zoom. Non-interactive
      // so the surrounding zone keeps the hover and tooltip.
      L.circleMarker(facility.coordinates, {
        radius: 6.5,
        color: '#ffffff',
        weight: 2.5,
        fillColor: ROUTE_COLOR,
        fillOpacity: 1,
        interactive: false,
      }).addTo(layers);
    }

    const choose = (event: L.LeafletMouseEvent) => {
      const next: LatLng = [event.latlng.lat, event.latlng.lng];
      if (inHyderabad(next)) {
        // Clicking anywhere is a request: route from there, no button needed.
        cancelAutoReroute();
        setRouteWanted(true);
        setOrigin(next);
        setRoute(null);
        setMessage('');
      }
    };

    map.on('click', choose);
    return () => {
      map.off('click', choose);
      layers.remove();
    };
  }, [map, enabled, hazards, drawnZone, routingReady]);

  // Start-point pin.
  useEffect(() => {
    if (!map || !enabled) return;
    const marker = L.circleMarker(origin, { radius: 7, color: '#0284c7', fillOpacity: 1 })
      .bindTooltip('Route start')
      .addTo(map);
    return () => {
      marker.remove();
    };
  }, [map, enabled, origin]);

  // Preview request. Deliberately NOT keyed on the hazard set: an unrelated new report
  // leaves a still-valid route alone, and a conflicting one is handled below. The
  // closure is always fresh because the effect only runs after a dependency changed.
  useEffect(() => {
    setRoute(null);
    if (!enabled || !request || !routingReady) {
      setBusy(false);
      // A click with the feed down used to clear the message and do nothing at all, which
      // reads as a broken button. Say why instead.
      if (enabled && request && !routingReady) {
        setMessage(
          'Hazard data unavailable — routing is disabled until the incident feed loads. Retrying automatically.'
        );
      }
      return;
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20_000);
    let active = true;

    setBusy(true);
    setMessage('Checking road alternatives against reported hazards...');

    findGreenRoute(origin, incidents, greenZone, controller.signal)
      .then((result) => {
        if (active) {
          setRoute({ ...result, context: requestContext });
          setMessage('Route ready. Road closures and facility availability are not verified.');
        }
      })
      .catch((error) => {
        if (active) {
          setMessage(
            error.name === 'AbortError' ? 'Routing timed out. Please retry.' : error.message
          );
        }
      })
      .finally(() => {
        clearTimeout(timeout);
        if (active) setBusy(false);
      });

    return () => {
      active = false;
      clearTimeout(timeout);
      controller.abort();
    };
    // greenZone is read from the current render: this effect only re-runs after one of
    // these dependencies changed, so the candidate list it routes to is never stale.
  }, [enabled, request, origin, destinations, requestContext, routingReady]);

  // Live re-routing (FR5.5). The hazard mask shifts as reports land, so re-check the
  // drawn route on every hazard change and recompute it without another click. The moment
  // a route stops being valid it is removed — a line crossing a new hazard is never left
  // on screen while the replacement is being fetched.
  useEffect(() => {
    if (!enabled || !route) return;

    const conflict = routeConflict(route.coordinates, incidents, route.destinationCoordinates);
    if (!conflict) return;

    cancelAutoReroute();
    setRoute(null);
    setMessage(conflict + ' Re-routing automatically...');
    rerouteTimer.current = setTimeout(() => {
      rerouteTimer.current = null;
      setRequest((n) => n + 1);
    }, AUTO_REROUTE_MS);
  }, [enabled, route, hazardKey]);

  // Draw the cleared route and animate it: a soft glow, a 1.1s draw-on, then a continuous
  // flowing dash with a marker travelling towards the safe facility.
  useEffect(() => {
    if (!map || !enabled || !route || route.context !== requestContext) return;

    const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const coords = route.coordinates;

    const glow = L.polyline(coords, {
      color: ROUTE_COLOR,
      weight: 12,
      opacity: 0.16,
      interactive: false,
    }).addTo(map);
    const line = L.polyline(coords, { color: ROUTE_COLOR, weight: 5, opacity: 0.95 }).addTo(map);
    map.fitBounds(glow.getBounds(), { padding: [30, 50], maxZoom: 15, animate: false });

    const destination = L.marker(route.destinationCoordinates, {
      icon: L.divIcon({
        className: 'custom-pin',
        html: '<div class="green-zone-pin"></div>',
        iconSize: [14, 14],
        iconAnchor: [7, 7],
      }),
    })
      .bindTooltip(route.destination + ' — ' + route.kind + ' (safe destination)')
      .addTo(map);

    // The destination's own green zone: the safe point the route actually lands on.
    const destinationZone = L.circle(route.destinationCoordinates, {
      radius: DESTINATION_ZONE_RADIUS_M,
      color: ROUTE_COLOR,
      weight: 1.5,
      opacity: 0.6,
      fillColor: ROUTE_COLOR,
      fillOpacity: 0.2,
      interactive: false,
    }).addTo(map);

    let flow: L.Polyline | null = null;
    let flowPath: SVGPathElement | null = null;
    let draw: Animation | undefined;

    // Dashed overlay riding the solid route — the marching "ant path" that makes the
    // direction of travel obvious. Revealed only after the draw-on, so the route is never
    // fully dashed before it has been drawn.
    const startFlow = () => {
      flow = L.polyline(coords, {
        color: '#eafff4',
        weight: 3,
        opacity: 0.95,
        dashArray: FLOW_DASH + ' ' + FLOW_DASH,
        interactive: false,
      }).addTo(map);
      flowPath = flow.getElement() as SVGPathElement | null;
    };

    const path = line.getElement() as SVGPathElement | null;
    if (!reducedMotion) {
      if (path) {
        const length = path.getTotalLength();
        draw = path.animate(
          [
            { strokeDasharray: length + ' ' + length, strokeDashoffset: length },
            { strokeDasharray: length + ' ' + length, strokeDashoffset: 0 },
          ],
          { duration: ROUTE_DRAW_MS, easing: 'ease-out' }
        );
        draw.finished
          .then(() => {
            // isConnected is false once the effect has cleaned up, so a late resolve
            // cannot leak a layer onto the map.
            if (path.isConnected) startFlow();
          })
          .catch(() => {
            /* cancelled on cleanup */
          });
      } else {
        startFlow();
      }
    }

    let raf = 0;
    let traveller: L.CircleMarker | null = null;
    if (!reducedMotion && coords.length > 1) {
      traveller = L.circleMarker(coords[0], {
        radius: 6.5,
        color: '#ffffff',
        weight: 2.5,
        fillColor: ROUTE_COLOR,
        fillOpacity: 1,
      }).addTo(map);

      const started = performance.now();
      // One rAF loop drives both moving parts: the marching dashes and the marker
      // travelling towards safety. The dash advances one unit every FLOW_STEP_MS, so a full
      // dash period takes FLOW_PERIOD * FLOW_STEP_MS. rAF (rather than the reference
      // snippet's setInterval) means it pauses off-screen and is always cancelled on cleanup.
      const step = (now: number) => {
        const elapsed = now - started;
        if (flowPath) {
          flowPath.style.strokeDashoffset = String(-((elapsed / FLOW_STEP_MS) % FLOW_PERIOD));
        }
        const t = (elapsed % ROUTE_TRAVEL_MS) / ROUTE_TRAVEL_MS;
        const exact = t * (coords.length - 1);
        const i = Math.floor(exact);
        const a = coords[i];
        const b = coords[Math.min(i + 1, coords.length - 1)];
        const f = exact - i;
        traveller?.setLatLng([a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f]);
        raf = requestAnimationFrame(step);
      };
      raf = requestAnimationFrame(step);
    }

    return () => {
      draw?.cancel();
      cancelAnimationFrame(raf);
      destinationZone.remove();
      flow?.remove();
      traveller?.remove();
      destination.remove();
      line.remove();
      glow.remove();
    };
  }, [map, enabled, route, requestContext]);

  const routeReady = route && route.context === requestContext;

  return (
    <section className="bg-paper/95 dark:bg-ink/90 border border-paper-2/90 dark:border-paper/25 rounded-xl p-3.5 text-xs space-y-2 shadow-[0_1px_2px_rgba(17,17,16,0.04),0_10px_24px_-18px_rgba(17,17,16,0.3)]">
      <div className="flex items-center justify-between gap-2">
        <label className="flex items-center gap-2 font-semibold text-ink dark:text-paper cursor-pointer">
          <input
            type="checkbox"
            checked={enabled}
            onChange={(e) => {
              cancelAutoReroute();
              setEnabled(e.target.checked);
              setRequest(0);
              setRoute(null);
            }}
            className="accent-safe w-3.5 h-3.5 cursor-pointer"
          />
          Green-zone safe routing
        </label>
        <span className="text-[10px] font-bold uppercase tracking-wider text-safe">
          Module 5 &bull; SIH prototype
        </span>
      </div>

      {!routingReady && (
        <p role="status" className="text-[11px] text-hazard">
          Hazard data unavailable{feedError ? ` (${feedError})` : ''} — the green zone below is
          drawn <strong>without hazard screening</strong>, and routing stays disabled until the
          incident feed loads. Retrying automatically.
        </p>
      )}

      {!enabled && (
        <p className="text-[11px] text-ink dark:text-paper">
          Enable to draw the green zone: every hospital and NGO standing outside the reported
          hazard buffers.
        </p>
      )}

      {enabled && (
        <>
          <div className="flex flex-wrap items-end gap-2">
            <label className="flex-1 min-w-40 text-[10px] font-bold uppercase tracking-wider text-ink dark:text-paper">
              Start locality
              <select
                aria-label="Route start locality"
                className="block mt-1 w-full rounded-lg border border-paper-2 dark:border-mute p-2 bg-paper-2/40 dark:bg-ink/50 text-xs font-medium text-ink dark:text-paper focus:outline-none focus:ring-2 focus:ring-mute/30 cursor-pointer"
                value={
                  KNOWN_LOCATIONS.find(
                    (l) => l.coordinates[0] === origin[0] && l.coordinates[1] === origin[1]
                  )?.name || ''
                }
                onChange={(e) => {
                  const found = KNOWN_LOCATIONS.find((l) => l.name === e.target.value);
                  if (found) {
                    cancelAutoReroute();
                    setRouteWanted(true);
                    setOrigin(found.coordinates);
                    setRoute(null);
                    setMessage('');
                  }
                }}
              >
                <option value="" disabled>
                  Selected map point
                </option>
                {KNOWN_LOCATIONS.map((l) => (
                  <option key={l.name} value={l.name}>
                    {l.fullName.split(',')[0]}
                  </option>
                ))}
              </select>
            </label>

            <label className="text-[10px] font-bold uppercase tracking-wider text-ink dark:text-paper">
              Destination type
              <select
                aria-label="Destination type"
                className="block mt-1 rounded-lg border border-paper-2 dark:border-mute p-2 bg-paper-2/40 dark:bg-ink/50 text-xs font-medium text-ink dark:text-paper focus:outline-none focus:ring-2 focus:ring-mute/30 cursor-pointer"
                value={kind}
                onChange={(e) => {
                  setKind(e.target.value as Facility['kind']);
                  setRoute(null);
                }}
              >
                <option value="Hospital">Hospital</option>
                <option value="NGO">NGO</option>
              </select>
            </label>

            <button
              disabled={busy || facilityBusy || !routingReady || !greenZone.length}
              onClick={() => {
                setRouteWanted(true);
                setRequest((n) => n + 1);
              }}
              className="inline-flex items-center gap-1.5 rounded-lg bg-safe text-white text-xs font-semibold px-3 py-2.5 hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
            >
              {busy ? <Loader2 size={14} className="animate-spin" /> : <Navigation size={14} />}
              {busy ? 'Routing...' : 'Route me to safety'}
            </button>

            <button
              title="Stop routing"
              aria-label="Stop routing"
              onClick={() => {
                cancelAutoReroute();
                setRouteWanted(false);
                setRequest(0);
                setRoute(null);
                setMessage('');
              }}
              className="p-2.5 border border-paper-2 dark:border-mute rounded-lg text-ink dark:text-paper hover:text-ink dark:hover:text-white transition cursor-pointer"
            >
              <X size={14} />
            </button>
          </div>

          {/* The headline people should be able to read at a glance. */}
          {routeReady && (
            <div className="rounded-lg border border-safe/40 bg-safe/10 px-3 py-2">
              <p className="text-[10px] font-bold uppercase tracking-wider text-safe">
                Safe route active
              </p>
              <p className="text-sm font-semibold text-ink dark:text-paper">
                {(route.distance / 1000).toFixed(1)} km &middot;{' '}
                {Math.max(1, Math.round(route.duration / 60))} min to {route.destination}
              </p>
              <p className="text-[11px] text-ink dark:text-paper">
                {route.kind} &bull;{' '}
                <a
                  className="underline"
                  href={route.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  view on OpenStreetMap
                </a>{' '}
                &bull; re-routes automatically if a new hazard crosses it
              </p>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-ink dark:text-paper">
            <span className="inline-flex items-center gap-1.5">
              <span className="w-3.5 h-2.5 rounded-sm border border-dashed border-safe bg-safe/15" />
              green zone (safe to travel)
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-3.5 h-2.5 rounded-sm border border-red-600 bg-red-600/20" />
              confirmed hazard
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-3.5 h-2.5 rounded-sm border border-dashed border-orange-500" />
              unverified report
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-safe ring-2 ring-safe/25" />
              safe facility
            </span>
          </div>

          {!facilityBusy && destinations.length > 0 && (
            <p className="text-[11px] font-semibold text-safe">
              {`${greenZone.length} of ${destinations.length} mapped ${kind.toLowerCase()} location${
                destinations.length === 1 ? '' : 's'
              } ${routingReady ? 'sit outside reported hazard buffers' : 'shown unscreened'}`}
              {greenZone.length > drawnZone.length ? ` (nearest ${drawnZone.length} drawn)` : ''}
            </p>
          )}
          {facilityBusy && (
            <p className="text-[11px] font-semibold text-safe">
              Loading hospitals and NGOs...
            </p>
          )}
          {/* Neither of these can stay silent: an empty green zone looks identical to a broken
              one, and the remedy is different in each case. */}
          {!facilityBusy && destinations.length === 0 && (
            <p role="status" className="text-[11px] font-semibold text-hazard">
              No {kind.toLowerCase()} locations loaded, so there is nothing to draw. Use Retry
              below.
            </p>
          )}
          {!facilityBusy && destinations.length > 0 && drawnZone.length === 0 && (
            <p role="status" className="text-[11px] font-semibold text-hazard">
              Every mapped {kind.toLowerCase()} location is inside a reported hazard buffer, so
              no green zone can be drawn and no safe destination can be offered. Verify or
              dismiss the surrounding reports.
            </p>
          )}

          <p className="text-[11px] text-ink dark:text-paper">
            Tap anywhere on the map to route from there. Not emergency navigation: facility
            opening, capacity and emergency assistance are unverified, and absence of reports does
            not establish safety.
          </p>

          <p className="text-[11px] text-ink dark:text-paper">
            Source:{' '}
            {facilityFallback
              ? 'built-in fallback list (approximate, OpenStreetMap unavailable)'
              : 'OpenStreetMap'}
          </p>

          {facilityError && (
            <p role="status" className="text-[11px] text-hazard">
              {facilityError}{' '}
              <button
                className="underline cursor-pointer"
                onClick={() => setFacilityRefresh((n) => n + 1)}
              >
                Retry
              </button>
            </p>
          )}

          <div role="status" aria-live="polite" className="text-[11px] text-ink dark:text-paper">
            {message}
          </div>

          {/* Runtime readout. The map is the only place these values are visible, so the
              panel states them plainly instead of leaving a blank map to be guessed at. */}
          <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5 rounded-lg border border-paper-2/80 dark:border-paper/20 bg-paper-2/40 dark:bg-ink/50 px-2.5 py-2 font-mono text-[10px] text-ink dark:text-paper">
            <dt>facilities API</dt>
            <dd className={facilityStatus === 'unreachable' ? 'text-alert' : undefined}>
              {facilityStatus}
            </dd>
            <dt>loaded</dt>
            <dd>
              {facilities.length} from {facilityFallback ? 'fallback list' : 'OpenStreetMap'}
            </dd>
            <dt>Supabase</dt>
            <dd>{supabase ? 'configured' : 'not configured (demo incidents)'}</dd>
            <dt>incident feed</dt>
            <dd className={routingReady ? undefined : 'text-alert'}>
              {routingReady ? 'ready' : 'NOT READY - routing disabled, zone unscreened'}
            </dd>
            {!routingReady && feedError && (
              <>
                <dt>feed error</dt>
                <dd className="text-alert">{feedError}</dd>
              </>
            )}
            <dt>incidents</dt>
            <dd>{incidents.length}</dd>
            <dt>hazard zones</dt>
            <dd>
              {hazards.hazards.length} ({hazards.hazards.filter((h) => h.confirmed).length}{' '}
              confirmed)
            </dd>
            <dt>green zone</dt>
            <dd>
              {greenZone.length} outside buffers, {drawnZone.length} drawn
            </dd>
            <dt>route</dt>
            <dd>{busy ? 'computing' : routeReady ? route.destination : 'none'}</dd>
          </dl>
        </>
      )}
    </section>
  );
}
