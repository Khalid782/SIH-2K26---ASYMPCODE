import React, { useState, useMemo, useEffect } from 'react';
import { Header } from './components/Header';
import { SummaryCards } from './components/SummaryCards';
import { FilterBar } from './components/FilterBar';
import { DisasterMap } from './components/DisasterMap';
import { IncidentDetailModal } from './components/IncidentDetailModal';
import { DashboardTicker } from './components/DashboardTicker';
import { SidebarNav } from './components/SidebarNav';
import AITriageConsole from './components/AITriageConsole';
import FeedIngestionView from './components/FeedIngestionView';
import ResponseUnitsView from './components/ResponseUnitsView';
import SopsHotlinesView from './components/SopsHotlinesView';
import NgoCommunitiesView from './components/NgoCommunitiesView';
import { INITIAL_INCIDENTS } from './data/mockData';
import { FilterState, Incident, VerificationStatus } from './types';
import { CheckCircle, X } from 'lucide-react';
import { supabase } from './supabaseClient';
import { mapRowsToIncidents, mapRowToIncident, mapIncidentToRow, toSupabaseTimestamp } from './utils/supabaseMapper';
import LandingPage from './components/LandingPage';

export function App() {
  const [view, setView] = useState<'landing' | 'dashboard'>('landing');
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    try { return localStorage.getItem('cb-dark') === 'true'; } catch { return false; }
  });

  // Sync .dark class on <html> and persist preference
  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
    try { localStorage.setItem('cb-dark', String(darkMode)); } catch { /* ok */ }
  }, [darkMode]);
  const [incidents, setIncidents] = useState<Incident[]>(supabase ? [] : INITIAL_INCIDENTS);
  const [incidentsReady, setIncidentsReady] = useState<boolean>(!supabase);
  const [feedError, setFeedError] = useState<string>('');
  const [feedAttempt, setFeedAttempt] = useState(0);
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [lastUpdated, setLastUpdated] = useState<string>('Just now');
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [notification, setNotification] = useState<string | null>(null);
  const [highlightId, setHighlightId] = useState<string | null>(null);
  const [liveClock, setLiveClock] = useState<string>('');

  const [filters, setFilters] = useState<FilterState>({
    search: '',
    severity: 'All',
    disasterType: 'All',
    status: 'All',
    timeWindow: 'all',
  });

  // Ticking wall clock for the header
  useEffect(() => {
    const fmt = () =>
      new Date().toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
    setLiveClock(fmt());
    const id = setInterval(() => setLiveClock(fmt()), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const client = supabase;

    // Without Supabase env keys, run on the built-in mock feed.
    if (!client) {
      console.info(
        'Supabase not configured (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY missing). Running on the mock incident feed.'
      );
      return;
    }
    // TODO: report the live Supabase URL once the client type exposes it.

    // The incident load lives in its own effect below, so a failed read can be retried
    // without tearing down (and duplicating) the realtime subscription.

    // Sync realtime state across all connected devices (INSERT and UPDATE)
    const channel = client
      .channel('realtime_incidents')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'incidents' },
        (payload) => {
          console.log('[Supabase] realtime INSERT received for', payload.new.id);
          setIncidents((prev) => [mapRowToIncident(payload.new as Record<string, any>), ...prev]);
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'incidents' },
        (payload) => {
          const updated = mapRowToIncident(payload.new as Record<string, any>);
          setIncidents((prev) =>
            prev.map((inc) => (inc.id === updated.id ? updated : inc))
          );
        }
      )
      .subscribe();

    return () => {
      client.removeChannel(channel);
    };
  }, []);

  // Load every incident. Display filters and pagination must never hide a hazard from
  // green-zone route screening, so the full set is paged in (1000 at a time).
  //
  // Keyed on feedAttempt: one failed read used to pin incidentsReady to false forever, so the
  // green zone showed nothing and routing stayed dead until a manual page reload. A failure
  // now schedules its own retry with exponential backoff.
  useEffect(() => {
    if (!supabase) return;
    let cancelled = false;
    let retryTimer: ReturnType<typeof setTimeout> | null = null;

    const fetchIncidents = async () => {
      const client = supabase;
      if (!client) return;
      const rows: Record<string, any>[] = [];

      for (let offset = 0; ; offset += 1000) {
        const { data, error } = await client
          .from('incidents')
          .select('*')
          .order('created_at', { ascending: false })
          .range(offset, offset + 999);

        if (error) {
          console.error('[Supabase] page read failed at offset', offset, error);
          console.error('Error fetching incidents:', error);
          if (cancelled) return;
          const reason = error.message || 'Supabase read failed';
          setFeedError(reason);
          setNotification(`Incident feed unavailable (${reason}). Retrying automatically.`);
          retryTimer = setTimeout(
            () => {
              if (!cancelled) setFeedAttempt((n) => n + 1);
            },
            Math.min(30_000, 3_000 * 2 ** Math.min(feedAttempt, 4))
          );
          return;
        }

        rows.push(...(data || []));
        if (!data || data.length < 1000) break;
      }

      if (cancelled) return;
      setFeedError('');
      console.log('[Supabase] loaded', rows.length, 'incident rows from', 'incidents');
      setIncidents(mapRowsToIncidents(rows));
      setIncidentsReady(true);
    };

    fetchIncidents();

    return () => {
      cancelled = true;
      if (retryTimer) clearTimeout(retryTimer);
    };
  }, [feedAttempt]);

  // Handle Manual Refresh Sync
  const handleRefresh = async () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
      setLastUpdated(
        new Date().toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })
      );
      showNotification('Feed synchronized with Hyderabad Emergency Operations Center.');
    }, 600);
  };

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => {
      setNotification((current) => (current === msg ? null : current));
    }, 4500);
  };

  // Reset Filters
  const handleResetFilters = () => {
    setFilters({
      search: '',
      severity: 'All',
      disasterType: 'All',
      status: 'All',
      timeWindow: 'all',
    });
  };

  // --- Incident Deduplication (single gate inside handleCreateIncidentFromTriage) ---
  const haversineKm = (a: [number, number], b: [number, number]): number => {
    const R = 6371; // Earth radius km
    const toRad = (deg: number) => (deg * Math.PI) / 180;
    const [lat1, lng1] = a;
    const [lat2, lng2] = b;
    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);
    const s1 =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
    return 2 * R * Math.asin(Math.min(1, Math.sqrt(s1)));
  };

  const NOISE_WORDS = new Set(['hyderabad', 'telangana', 'india']);

  const normalizeLoc = (loc: string | undefined): string => {
    if (!loc) return '';
    const lowered = loc.toLowerCase();
    const noPunct = lowered.replace(/[^\p{L}\p{N}\s]/gu, ' ');
    const collapsed = noPunct.replace(/\s+/g, ' ').trim();
    const tokens = collapsed.split(' ').filter((tok) => tok.length > 0 && !NOISE_WORDS.has(tok));
    return tokens.join(' ');
  };

  const MAX_DUP_DISTANCE_KM = 1.0;
  const WITHIN_MINUTES = 30;

  const findDuplicateIncident = (candidate: Incident, pool: Incident[]): Incident | null => {
    const normCand = normalizeLoc(
      candidate.primaryLocation || candidate.extractedLocation || candidate.location
    );
    const candTokens = new Set(normCand.split(' ').filter((t) => t.length > 0));

    for (const existing of pool) {
      if (existing.disasterType !== candidate.disasterType) continue;

      const normExist = normalizeLoc(
        existing.primaryLocation || existing.extractedLocation || existing.location
      );
      const existTokens = new Set(normExist.split(' ').filter((t) => t.length > 0));

      let locOk = false;
      if (normCand.length > 0 && normExist.length > 0) {
        if (normCand === normExist) {
          locOk = true;
        } else {
          let shared = 0;
          for (const t of candTokens) if (existTokens.has(t)) shared++;
          const minUnique = Math.min(candTokens.size, existTokens.size);
          locOk = minUnique >= 1 && shared === minUnique;
        }
      }
      if (!locOk) continue;

      const distanceKm = haversineKm(candidate.coordinates, existing.coordinates);
      if (distanceKm > MAX_DUP_DISTANCE_KM) continue;

      let createdAtMs: number | null = null;
      if (existing.created_at) {
        const t = new Date(existing.created_at).getTime();
        if (!Number.isNaN(t)) createdAtMs = t;
      }
      if (createdAtMs === null) continue;
      const ageMin = (Date.now() - createdAtMs) / 60000;
      if (ageMin > WITHIN_MINUTES) continue;

      return existing;
    }
    return null;
  };  // Create Incident from the Triage Console (also persists to Supabase fresh table)
  const handleCreateIncidentFromTriage = async (newIncident: Incident) => {
    console.log('[Incident] handleCreateIncidentFromTriage invoked for', newIncident.id);
    const saved = await persistIncidentToSupabase(newIncident);
    console.log('[Incident] persisted incident', newIncident.id, saved);
    setIncidents((prev) => [newIncident, ...prev]);
    setHighlightId(newIncident.id);
    setTimeout(() => {
      setHighlightId((cur) => (cur === newIncident.id ? null : cur));
    }, 5000);
  };

  const persistIncidentToSupabase = async (incident: Incident) => {
    if (!supabase) {
      console.warn('[Supabase] persistIncidentToSupabase skipped — no client (env missing).');
      return false;
    }
    const row = mapIncidentToRow(incident);
    // Show exactly what the browser is trying to write so a bad row can be traced
    // back to a schema mismatch instead of assuming the row looked fine.
    console.log('[Supabase] inserting incident', incident.id, JSON.stringify(row, null, 2));
    const { error } = await supabase.from('incidents').insert([row]);
    if (error) {
      console.error('[Supabase] insert failed for', incident.id, error?.message, error?.details);
      return false;
    }
    console.log('[Supabase] inserted incident', incident.id, 'ok');
    return true;
  };

  const persistStatusUpdateToSupabase = async (incidentId: string, fields: Record<string, any>) => {
    if (!supabase) return;
    const { error } = await supabase.from('incidents').update(fields).eq('id', incidentId);
    if (error) console.error('Supabase update failed for', incidentId, error);
  };


  // Operator action updates incident state locally AND in Supabase
  const handleUpdateStatus = async (incidentId: string, newStatus: VerificationStatus) => {
    // Optimistic UI update
    setIncidents((prev) =>
      prev.map((inc) => (inc.id === incidentId ? { ...inc, status: newStatus } : inc))
    );

    if (selectedIncident && selectedIncident.id === incidentId) {
      setSelectedIncident((prev) => (prev ? { ...prev, status: newStatus } : null));
    }

    await persistStatusUpdateToSupabase(incidentId, {
      status: newStatus,
      verification_status: newStatus,
    });

    console.log('[Supabase] status update sent for', incidentId, 'to', newStatus);
    showNotification(`Incident ${incidentId} updated to: ${newStatus}`);
  };

  // Filtered incidents logic
  const filteredIncidents = useMemo(() => {
    return incidents.filter((incident) => {
      if (filters.search.trim()) {
        const query = filters.search.toLowerCase();
        const matchesLocation = incident.location?.toLowerCase().includes(query);
        const matchesReport = incident.originalReport?.toLowerCase().includes(query);
        const matchesType = incident.disasterType?.toLowerCase().includes(query);
        const matchesLandmark = incident.landmark?.toLowerCase().includes(query) || false;
        if (!matchesLocation && !matchesReport && !matchesType && !matchesLandmark) {
          return false;
        }
      }

      if (filters.severity !== 'All' && incident.severity !== filters.severity) {
        return false;
      }

      if (filters.disasterType !== 'All' && incident.disasterType !== filters.disasterType) {
        return false;
      }

      if (filters.status !== 'All' && incident.status !== filters.status) {
        return false;
      }

      return true;
    });
  }, [incidents, filters]);

  // Compute live statistic counts
  const counts = useMemo(() => {
    const critical = incidents.filter((i) => i.severity === 'Critical').length;
    const high = incidents.filter((i) => i.severity === 'High').length;
    const low = incidents.filter((i) => i.severity === 'Low').length;
    const verified = incidents.filter((i) => i.status === 'Verified').length;
    const actioned = incidents.filter((i) => i.status === 'Actioned').length;

    return {
      total: incidents.length,
      critical,
      high,
      low,
      verified,
      actioned,
    };
  }, [incidents]);

  // Landing page first: interactive, white & powder-blue premium
  if (view === 'landing') {
    return (
      <LandingPage
        onEnter={() => {
          setView('dashboard');
          window.scrollTo(0, 0);
        }}
        darkMode={darkMode}
        onToggleDark={() => setDarkMode((v) => !v)}
      />
    );
  }

  return (
    <div className="h-screen w-full overflow-hidden flex flex-col text-ink dark:text-paper font-sans bg-gradient-to-br from-[#e7ddd0] via-[#ddd4c1] to-[#cfc6b3] dark:bg-gradient-to-br dark:from-ink-2 dark:via-ink dark:to-ink transition-colors duration-300">
      {/* Top Header */}
      <Header
        lastUpdated={lastUpdated}
        onRefresh={handleRefresh}
        isRefreshing={isRefreshing}
        liveClock={liveClock}
        onHome={() => {
          setView('landing');
          window.scrollTo(0, 0);
        }}
        darkMode={darkMode}
        onToggleDark={() => setDarkMode((v) => !v)}
      />

      {/* Floating Notification Toast */}
      {notification && (
        <div className="fixed bottom-4 right-4 z-[2100] bg-paper/95 dark:bg-ink/90 backdrop-blur-md text-ink dark:text-paper px-4 py-2.5 rounded-xl shadow-2xl border border-paper-2 dark:border-paper/20 flex items-center gap-3 text-xs">
          <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
          <span className="font-medium">{notification}</span>
          <button
            onClick={() => setNotification(null)}
            className="text-ink dark:text-paper hover:text-ink p-0.5 cursor-pointer ml-1"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Main Body with Sidebar + Dashboard Content */}
      <div className="flex-1 min-h-0 flex overflow-hidden">
        {/* Navy Command Sidebar */}
        <SidebarNav
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          criticalCount={counts.critical}
          onBackHome={() => {
            setView('landing');
            window.scrollTo(0, 0);
          }}
        />

        {/* Dashboard Center Canvas */}
        {/* Flex column so the dashboard's map row can claim the leftover viewport height. */}
        <main className="hud-grid flex-1 min-h-0 overflow-y-auto p-3 sm:p-4 lg:p-6 space-y-4 flex flex-col max-w-7xl mx-auto w-full">
          {activeTab === 'triage' ? (
            <AITriageConsole
              onCreateIncident={handleCreateIncidentFromTriage}
              onNavigateToSituationRoom={() => setActiveTab('dashboard')}
            />
          ) : activeTab === 'reports' ? (
            <FeedIngestionView onCreateIncident={handleCreateIncidentFromTriage} />
          ) : activeTab === 'teams' ? (
            <ResponseUnitsView />
          ) : activeTab === 'ngos' ? (
            <NgoCommunitiesView />
          ) : activeTab === 'protocols' ? (
            <SopsHotlinesView />
          ) : (
            <>
              {/* Moving live-report ticker */}
              <DashboardTicker incidents={incidents} />

              {/* Summary Metric Cards */}
              <SummaryCards
                counts={counts}
                activeSeverityFilter={filters.severity}
                activeStatusFilter={filters.status}
                onSelectSeverity={(sev) => setFilters((prev) => ({ ...prev, severity: sev }))}
                onSelectStatus={(st) => setFilters((prev) => ({ ...prev, status: st }))}
              />

              {/* Search and Filters Bar */}
              <FilterBar
                filters={filters}
                onFilterChange={setFilters}
                onResetFilters={handleResetFilters}
                totalFiltered={filteredIncidents.length}
                totalCount={incidents.length}
              />

              {/* Full-width tactical map. The side Intelligence Feeds column was removed, so
                  the map now owns the whole canvas width and the leftover viewport height
                  (flex-1); leaving the default min-height alone stops the row from squeezing
                  the map's floor on short viewports. */}
              <div className="flex-1 flex flex-col min-w-0">
                {/* Main Disaster Map — full width, no side panel */}
                <div className="flex-1 flex flex-col min-w-0">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="relative flex h-2.5 w-2.5">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-alert opacity-70" />
                        <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-alert" />
                      </span>
                      <h2 className="text-xs font-bold uppercase tracking-wider text-ink dark:text-paper">
                        Hyderabad GIS Tactical Incident Map
                      </h2>
                    </div>
                    <span className="text-[11px] text-ink dark:text-paper font-mono">
                      OpenStreetMap &bull; 6 Core Zones
                    </span>
                  </div>
                  <DisasterMap
                    incidents={filteredIncidents}
                    allIncidents={incidents}
                    routingReady={incidentsReady}
                    feedError={feedError}
                    selectedIncident={selectedIncident}
                    onSelectIncident={setSelectedIncident}
                  />
                </div>

              </div>
            </>
          )}
        </main>
      </div>

      {/* Incident Details Inspection Modal */}
      <IncidentDetailModal
        incident={selectedIncident}
        onClose={() => setSelectedIncident(null)}
        onUpdateStatus={handleUpdateStatus}
      />
    </div>
  );
}

export default App;
