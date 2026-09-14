# CRISISBEACON: Hyderabad SIH prototype

React/Vite, Leaflet, Gemini triage, Supabase incidents and Vercel API functions.

## Run and verify
- `npm ci`
- Configure the keys listed in `.env.example` in your local environment.
- `npm run dev` (or `node --import tsx server.ts`)
- `npm test`, `npm run lint`, `npm run build`

Vercel uses npm and the committed package-lock. Set GEMINI_API_KEY server-side.
GEMINI_MODEL optionally overrides the default. Supabase URL and anon/publishable
key are Vite build-time variables; redeploy after changing them. Never expose a
service-role key. Local Express and Vercel share the same API handlers.

## Workflows
- Situation Room: enable Green-zone routing, choose a locality or click the map,
  select Hospital or NGO, and preview a road route.
- Locations come from OpenStreetMap via a cached, Hyderabad-bounded Overpass query.
  NGO coverage may be incomplete. An NGO office is not necessarily an aid center.
- Verified/Actioned critical and high incidents form merged 600/350 m buffers.
  Pending reports are dashed and also block candidate routes pending review.
  Display filters do not remove routing hazards. Changes trigger recomputation.
- OSRM supplies driving-road alternatives to up to three nearby eligible facilities.
  Every full geometry and endpoint connector is checked with Turf. This is candidate
  screening, not an exhaustive obstacle-aware road graph search. No straight-line
  fallback is displayed. Providers can be unavailable or return no usable route.
- The green route draws over 1.1 seconds, respecting reduced-motion preferences.
- Feed & Ingestion fetches recent Hyderabad disaster headlines from Google News RSS,
  a no-key feed in the blueprint, every five minutes while open. Review transfers a
  headline and source to triage; news is never automatically verified.
- Triage uses one bounded server-side Gemini call with structured validation.
  Missing key/model/quota errors explicitly use the deterministic fallback.
  Only localities present in the Hyderabad catalog and report can be mapped.
  Unknown locations require an operator to provide a more specific locality.
- Incident inserts have one owner, collision-resistant IDs and surfaced errors.
  Realtime insert echoes are deduplicated. Loading the app no longer deletes old rows.

## Prototype limits
This is not certified emergency navigation or dispatch advice. OSM locations,
facility capacity/opening/assistance, road closures, flood extent, elevation and
entrance access are not verified. A point outside reported buffers is not proof of
safety. Old reports remain hazards until reviewed; Actioned does not mean resolved.
No shelter/high-ground verification or trained multilingual classifier is provided.
The fallback is heuristic and requires human review. No API keys or live credentials
are included in tests.

Before public operational use, add authenticated operator authorization, restrict
Supabase write policies, protect/rate-limit the Gemini endpoint, and establish a
verified facility/road-closure feed. The current database uses public write policies;
this change does not alter those policies or delete data.

## Sources
- https://wiki.openstreetmap.org/wiki/Overpass_API/Overpass_QL
- https://wiki.openstreetmap.org/wiki/Tag:office%3Dngo
- https://project-osrm.org/docs/v5.24.0/
- https://turfjs.org/docs/api/booleanIntersects
- https://ai.google.dev/gemini-api/docs/structured-output
