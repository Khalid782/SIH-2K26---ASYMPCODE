import React, { useState, useMemo, useEffect } from 'react';
import { Header } from './components/Header';
import { SummaryCards } from './components/SummaryCards';
import { FilterBar } from './components/FilterBar';
import { DisasterMap } from './components/DisasterMap';
import { IncomingReports } from './components/IncomingReports';
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
  const [incidents, setIncidents] = useState<Incident[]>(INITIAL_INCIDENTS);
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

    // Fetch initial incidents from Supabase — capped at 30 (DB may still hold old 107 demo rows)
    const fetchIncidents = async () => {
      const { data, error } = await client
        .from('incidents')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(30);

      if (error) {
        console.error('Error fetching incidents:', error);
      } else if (data) {
        if (data.length > 0) setIncidents(mapRowsToIncidents(data));
        // If DB holds more than 30 rows (legacy demo/simulated inserts), trim the oldest in background
        // so the count stays at 30 until you connect a real API.
        try {
          const { count } = await client.from('incidents').select('id', { count: 'exact', head: true });
          if (count !== null && count > 30) {
            const { data: allIds } = await client
              .from('incidents')
              .select('id')
              .order('created_at', { ascending: false });
            if (allIds && allIds.length > 30) {
              const toDelete: string[] = (allIds as { id: string }[]).slice(30).map((r) => r.id);
              const { error: delErr } = await client.from('incidents').delete().in('id', toDelete);
              if (delErr) console.warn('Auto-trim excess incidents failed (run SQL below manually):', delErr.message);
              else console.info(`Trimmed ${toDelete.length} excess incidents from Supabase — now 30.`);
            }
          }
        } catch (e) {
          console.warn('Auto-trim check failed:', e);
        }
      }
    };

    fetchIncidents();

    // Sync real-time updates across all connected devices (INSERT and UPDATE events)
    const channel = client
      .channel('realtime_incidents')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'incidents' },
        (payload) => {
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

  // Handle Manual Refresh Sync
  const handleRefresh = () => {
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

  // Create Incident from AI Triage Console (also persists to Supabase fresh table)
  const handleCreateIncidentFromTriage = async (newIncident: Incident) => {
    const ts = toSupabaseTimestamp(new Date());
    const withTimestamp: Incident = {
      ...newIncident,
      created_at: newIncident.created_at || ts || undefined,
      timestamp: newIncident.timestamp || ts || 'Just now',
    };
    setIncidents((prev) => [withTimestamp, ...prev]);
    setHighlightId(newIncident.id);
    setTimeout(() => {
      setHighlightId((cur) => (cur === newIncident.id ? null : cur));
    }, 5000);
    if (supabase) {
      const { error } = await supabase.from('incidents').insert([mapIncidentToRow(withTimestamp)]);
      if (error) console.error('Error inserting triage incident into Supabase:', error);
    }
    showNotification(
      `Gemini triage → ${newIncident.id}: ${newIncident.severity} ${newIncident.disasterType} marked on map & added to feed`
    );
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

    // Persist status change to Supabase (when configured)
    if (supabase) {
      const { error } = await supabase
        .from('incidents')
        .update({ status: newStatus })
        .eq('id', incidentId);

      if (error) {
        console.error('Error updating incident status in Supabase:', error);
      }
    }

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
            className="text-mute hover:text-ink p-0.5 cursor-pointer ml-1"
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
        <main className="hud-grid flex-1 min-h-0 overflow-y-auto p-3 sm:p-4 lg:p-6 space-y-4 max-w-7xl mx-auto w-full">
          {activeTab === 'triage' ? (
            <AITriageConsole
              onCreateIncident={handleCreateIncidentFromTriage}
              onNavigateToSituationRoom={() => setActiveTab('dashboard')}
            />
          ) : activeTab === 'reports' ? (
            <FeedIngestionView />
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

              {/* Map + Incoming Reports Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
                {/* Main Disaster Map */}
                <div className="lg:col-span-7 xl:col-span-8 flex flex-col">
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
                    <span className="text-[11px] text-mute font-mono">
                      OpenStreetMap &bull; 6 Core Zones
                    </span>
                  </div>
                  <DisasterMap
                    incidents={filteredIncidents}
                    selectedIncident={selectedIncident}
                    onSelectIncident={setSelectedIncident}
                  />
                </div>

                {/* Incoming Reports Scrollable Feed */}
                <div className="lg:col-span-5 xl:col-span-4 flex flex-col">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-hazard"></span>
                      <h2 className="text-xs font-bold uppercase tracking-wider text-ink dark:text-paper">
                        Intelligence Feeds
                      </h2>
                    </div>
                    <span className="text-[11px] text-mute">
                      Click to inspect & action
                    </span>
                  </div>
                  <IncomingReports
                    incidents={filteredIncidents}
                    selectedIncident={selectedIncident}
                    onSelectIncident={setSelectedIncident}
                    highlightId={highlightId}
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
