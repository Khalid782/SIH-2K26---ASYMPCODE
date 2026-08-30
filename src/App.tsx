import React, { useState, useMemo, useEffect } from 'react';
import { Header } from './components/Header';
import { SummaryCards } from './components/SummaryCards';
import { FilterBar } from './components/FilterBar';
import { DisasterMap } from './components/DisasterMap';
import { IncomingReports } from './components/IncomingReports';
import { IncidentDetailModal } from './components/IncidentDetailModal';
import { SidebarNav } from './components/SidebarNav';
import { AITriageConsole } from './components/AITriageConsole';
import { INITIAL_INCIDENTS, BASELINE_STATS } from './data/mockData';
import { FilterState, Incident, Severity, VerificationStatus } from './types';
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';
import { supabase } from './supabaseClient';
export function App() {
  const [incidents, setIncidents] = useState<Incident[]>(INITIAL_INCIDENTS);
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [lastUpdated, setLastUpdated] = useState<string>('Just now');
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [notification, setNotification] = useState<string | null>(null);

  const [filters, setFilters] = useState<FilterState>({
    search: '',
    severity: 'All',
    disasterType: 'All',
    status: 'All',
    timeWindow: 'all',
  });
useEffect(() => {
    // Fetch initial incidents from Supabase
    const fetchIncidents = async () => {
      const { data, error } = await supabase
        .from('incidents')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching incidents:', error);
      } else if (data && data.length > 0) {
        setIncidents(data as Incident[]);
      }
    };

    fetchIncidents();

    // Sync real-time updates across all connected devices
    const channel = supabase
      .channel('realtime_incidents')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'incidents' }, (payload) => {
        setIncidents((prev) => [payload.new as Incident, ...prev]);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);
  // Handle Manual Refresh Sync
  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
      setLastUpdated(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
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

  // Create Incident from AI Triage Console
  const handleCreateIncidentFromTriage = (newIncident: Incident) => {
    setIncidents((prev) => [newIncident, ...prev]);
    showNotification('Incident added to Situation Room');
  };

  // Operator action updates incident mock state
  const handleUpdateStatus = (incidentId: string, newStatus: VerificationStatus) => {
    setIncidents((prev) =>
      prev.map((inc) => (inc.id === incidentId ? { ...inc, status: newStatus } : inc))
    );

    // Update currently inspected incident as well
    if (selectedIncident && selectedIncident.id === incidentId) {
      setSelectedIncident((prev) => (prev ? { ...prev, status: newStatus } : null));
    }

    showNotification(`Incident ${incidentId} updated to: ${newStatus}`);
  };

  // Filtered incidents logic
  const filteredIncidents = useMemo(() => {
    return incidents.filter((incident) => {
      // Search filter (keyword or location)
      if (filters.search.trim()) {
        const query = filters.search.toLowerCase();
        const matchesLocation = incident.location.toLowerCase().includes(query);
        const matchesReport = incident.originalReport.toLowerCase().includes(query);
        const matchesType = incident.disasterType.toLowerCase().includes(query);
        const matchesLandmark = incident.landmark?.toLowerCase().includes(query) || false;
        if (!matchesLocation && !matchesReport && !matchesType && !matchesLandmark) {
          return false;
        }
      }

      // Severity filter
      if (filters.severity !== 'All' && incident.severity !== filters.severity) {
        return false;
      }

      // Disaster Type filter
      if (filters.disasterType !== 'All' && incident.disasterType !== filters.disasterType) {
        return false;
      }

      // Verification Status filter
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

    // Use baseline proportion adjustment to preserve 47 total if desired
    return {
      total: incidents.length,
      critical,
      high,
      low,
      verified,
      actioned,
    };
  }, [incidents]);

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col text-slate-900 font-sans">
      {/* Top Header */}
      <Header
        lastUpdated={lastUpdated}
        onRefresh={handleRefresh}
        isRefreshing={isRefreshing}
      />

      {/* Floating Notification Toast */}
      {notification && (
        <div className="fixed bottom-4 right-4 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-lg shadow-xl border border-slate-700 flex items-center gap-3 text-xs animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="font-medium">{notification}</span>
          <button
            onClick={() => setNotification(null)}
            className="text-slate-400 hover:text-white p-0.5 cursor-pointer ml-1"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Main Body with Sidebar + Dashboard Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Navy Command Sidebar */}
        <SidebarNav
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          criticalCount={counts.critical}
        />

        {/* Dashboard Center Canvas */}
        <main className="flex-1 overflow-y-auto p-3 sm:p-4 lg:p-6 space-y-4 max-w-7xl mx-auto w-full">
          {activeTab === 'triage' ? (
            <AITriageConsole
              onCreateIncident={handleCreateIncidentFromTriage}
              onNavigateToSituationRoom={() => setActiveTab('dashboard')}
            />
          ) : (
            <>
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
                {/* Main Disaster Map (Largest element on page: 8 cols on large screens) */}
                <div className="lg:col-span-7 xl:col-span-8 flex flex-col">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-sm bg-red-600"></span>
                      <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                        Hyderabad GIS Tactical Incident Map
                      </h2>
                    </div>
                    <span className="text-[11px] text-slate-500 font-mono">
                      OpenStreetMap &bull; 6 Core Zones
                    </span>
                  </div>
                  <DisasterMap
                    incidents={filteredIncidents}
                    selectedIncident={selectedIncident}
                    onSelectIncident={setSelectedIncident}
                  />
                </div>

                {/* Incoming Reports Scrollable Feed (4 cols on large screens) */}
                <div className="lg:col-span-5 xl:col-span-4 flex flex-col">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-sm bg-slate-700"></span>
                      <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                        Intelligence Feeds
                      </h2>
                    </div>
                    <span className="text-[11px] text-slate-500">
                      Click to inspect & action
                    </span>
                  </div>
                  <IncomingReports
                    incidents={filteredIncidents}
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
