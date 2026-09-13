import React from 'react';
import { Search, Filter, X, RotateCcw } from 'lucide-react';
import { DisasterType, FilterState, Severity, VerificationStatus } from '../types';

interface FilterBarProps {
  filters: FilterState;
  onFilterChange: (filters: FilterState) => void;
  onResetFilters: () => void;
  totalFiltered: number;
  totalCount: number;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  filters,
  onFilterChange,
  onResetFilters,
  totalFiltered,
  totalCount,
}) => {
  const isFiltered = 
    filters.search !== '' ||
    filters.severity !== 'All' ||
    filters.disasterType !== 'All' ||
    filters.status !== 'All' ||
    filters.timeWindow !== 'all';

  return (
    <div className="bg-paper/95 dark:bg-ink/90 p-3 rounded-xl border border-paper-2/90 dark:border-paper/25 shadow-[0_1px_2px_rgba(17,17,16,0.04),0_10px_24px_-18px_rgba(17,17,16,0.3)] flex flex-col gap-2.5">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2.5">
        {/* Search Bar */}
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-mute absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={filters.search}
            onChange={(e) => onFilterChange({ ...filters, search: e.target.value })}
            placeholder="Search location (e.g. Mehdipatnam, Tolichowki) or keyword..."
            className="w-full pl-9 pr-8 py-1.5 text-xs bg-paper-2/50 dark:bg-ink/50 border border-paper-2 dark:border-mute rounded-lg text-ink dark:text-paper placeholder:text-mute/70 dark:placeholder:text-mute focus:outline-none focus:ring-2 focus:ring-mute/25 focus:border-mute transition"
          />
          {filters.search && (
            <button
              onClick={() => onFilterChange({ ...filters, search: '' })}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-mute hover:text-mute p-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Dropdown Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Severity Filter */}
          <div className="flex items-center gap-1.5 bg-paper-2/60 dark:bg-ink/50 border border-paper-2 dark:border-mute rounded-lg px-2 py-1">
            <span className="text-[11px] font-semibold text-mute/80 dark:text-mute uppercase tracking-wider">
              Severity:
            </span>
            <select
              value={filters.severity}
              onChange={(e) => onFilterChange({ ...filters, severity: e.target.value as 'All' | Severity })}
              className="text-xs bg-transparent text-paper dark:text-paper font-medium focus:outline-none cursor-pointer"
            >
              <option value="All">All Severities</option>
              <option value="Critical">🔴 Critical (Red)</option>
              <option value="High">🟠 High (Orange)</option>
              <option value="Low">🟡 Low (Yellow)</option>
            </select>
          </div>

          {/* Disaster Type Filter */}
          <div className="flex items-center gap-1.5 bg-paper-2/60 dark:bg-ink/50 border border-paper-2 dark:border-mute rounded-lg px-2 py-1">
            <span className="text-[11px] font-semibold text-mute/80 dark:text-mute uppercase tracking-wider">
              Disaster Type:
            </span>
            <select
              value={filters.disasterType}
              onChange={(e) => onFilterChange({ ...filters, disasterType: e.target.value as 'All' | DisasterType })}
              className="text-xs bg-transparent text-paper dark:text-paper font-medium focus:outline-none cursor-pointer"
            >
              <option value="All">All Disaster Types</option>
              <option value="Flood">Flood</option>
              <option value="Medical Emergency">Medical Emergency</option>
              <option value="Infrastructure Damage">Infrastructure Damage</option>
              <option value="Rescue Required">Rescue Required</option>
            </select>
          </div>

          {/* Verification Status Filter */}
          <div className="flex items-center gap-1.5 bg-paper-2/60 dark:bg-ink/50 border border-paper-2 dark:border-mute rounded-lg px-2 py-1">
            <span className="text-[11px] font-semibold text-mute/80 dark:text-mute uppercase tracking-wider">
              Status:
            </span>
            <select
              value={filters.status}
              onChange={(e) => onFilterChange({ ...filters, status: e.target.value as 'All' | VerificationStatus })}
              className="text-xs bg-transparent text-paper dark:text-paper font-medium focus:outline-none cursor-pointer"
            >
              <option value="All">All Statuses</option>
              <option value="Pending">Pending</option>
              <option value="Verified">Verified</option>
              <option value="Actioned">Actioned</option>
              <option value="False Alarm">False Alarm</option>
              <option value="Duplicate">Duplicate</option>
            </select>
          </div>

          {/* Time Window Filter */}
          <div className="flex items-center gap-1.5 bg-paper-2/60 dark:bg-ink/50 border border-paper-2 dark:border-mute rounded-lg px-2 py-1">
            <span className="text-[11px] font-semibold text-mute/80 dark:text-mute uppercase tracking-wider">
              Time:
            </span>
            <select
              value={filters.timeWindow}
              onChange={(e) => onFilterChange({ ...filters, timeWindow: e.target.value as '1h' | '6h' | '24h' | 'all' })}
              className="text-xs bg-transparent text-paper dark:text-paper font-medium focus:outline-none cursor-pointer"
            >
              <option value="all">All Available</option>
              <option value="1h">Last 1 Hour</option>
              <option value="6h">Last 6 Hours</option>
              <option value="24h">Last 24 Hours</option>
            </select>
          </div>

          {/* Reset Filters button */}
          {isFiltered && (
            <button
              onClick={onResetFilters}
              className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-mute dark:text-mute hover:text-paper dark:hover:text-white bg-paper-2 dark:bg-ink/60 hover:bg-paper-2 dark:hover:bg-mute border border-paper-2 dark:border-mute hover:border-paper-2/70 rounded-lg transition cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter status row */}
      <div className="flex items-center justify-between text-[11px] text-mute/70 dark:text-mute px-1 border-t border-paper-2 dark:border-paper/25 pt-1.5">
        <div className="flex items-center gap-2">
          <span>
            Showing <strong className="text-ink dark:text-paper font-semibold">{totalFiltered}</strong> of{' '}
            <strong className="text-ink dark:text-paper font-semibold">{totalCount}</strong> incidents
          </span>
          {isFiltered && (
            <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-paper-2 dark:bg-paper-2 text-paper-2 dark:text-paper border border-paper-2 dark:border-mute">
              Active Filters
            </span>
          )}
        </div>
        <span className="text-mute/70">GHMC Command & Control Division</span>
      </div>
    </div>
  );
};
