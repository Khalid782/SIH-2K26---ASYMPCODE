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
    <div className="bg-white/95 dark:bg-sky-900/90 p-3 rounded-xl border border-sky-100/90 dark:border-sky-800 shadow-[0_1px_2px_rgba(8,47,73,0.04),0_10px_24px_-18px_rgba(2,132,199,0.3)] flex flex-col gap-2.5">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2.5">
        {/* Search Bar */}
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-sky-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={filters.search}
            onChange={(e) => onFilterChange({ ...filters, search: e.target.value })}
            placeholder="Search location (e.g. Mehdipatnam, Tolichowki) or keyword..."
            className="w-full pl-9 pr-8 py-1.5 text-xs bg-sky-50/50 dark:bg-sky-800/50 border border-sky-100 dark:border-sky-700 rounded-lg text-sky-950 dark:text-sky-100 placeholder:text-sky-400/70 dark:placeholder:text-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-400/25 focus:border-sky-400 transition"
          />
          {filters.search && (
            <button
              onClick={() => onFilterChange({ ...filters, search: '' })}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-sky-400 hover:text-sky-600 p-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Dropdown Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Severity Filter */}
          <div className="flex items-center gap-1.5 bg-sky-50/60 dark:bg-sky-800/50 border border-sky-100 dark:border-sky-700 rounded-lg px-2 py-1">
            <span className="text-[11px] font-semibold text-sky-600/80 dark:text-sky-400 uppercase tracking-wider">
              Severity:
            </span>
            <select
              value={filters.severity}
              onChange={(e) => onFilterChange({ ...filters, severity: e.target.value as 'All' | Severity })}
              className="text-xs bg-transparent text-sky-900 dark:text-sky-200 font-medium focus:outline-none cursor-pointer"
            >
              <option value="All">All Severities</option>
              <option value="Critical">🔴 Critical (Red)</option>
              <option value="High">🟠 High (Orange)</option>
              <option value="Low">🟡 Low (Yellow)</option>
            </select>
          </div>

          {/* Disaster Type Filter */}
          <div className="flex items-center gap-1.5 bg-sky-50/60 dark:bg-sky-800/50 border border-sky-100 dark:border-sky-700 rounded-lg px-2 py-1">
            <span className="text-[11px] font-semibold text-sky-600/80 dark:text-sky-400 uppercase tracking-wider">
              Disaster Type:
            </span>
            <select
              value={filters.disasterType}
              onChange={(e) => onFilterChange({ ...filters, disasterType: e.target.value as 'All' | DisasterType })}
              className="text-xs bg-transparent text-sky-900 dark:text-sky-200 font-medium focus:outline-none cursor-pointer"
            >
              <option value="All">All Disaster Types</option>
              <option value="Flood">Flood</option>
              <option value="Medical Emergency">Medical Emergency</option>
              <option value="Infrastructure Damage">Infrastructure Damage</option>
              <option value="Rescue Required">Rescue Required</option>
            </select>
          </div>

          {/* Verification Status Filter */}
          <div className="flex items-center gap-1.5 bg-sky-50/60 dark:bg-sky-800/50 border border-sky-100 dark:border-sky-700 rounded-lg px-2 py-1">
            <span className="text-[11px] font-semibold text-sky-600/80 dark:text-sky-400 uppercase tracking-wider">
              Status:
            </span>
            <select
              value={filters.status}
              onChange={(e) => onFilterChange({ ...filters, status: e.target.value as 'All' | VerificationStatus })}
              className="text-xs bg-transparent text-sky-900 dark:text-sky-200 font-medium focus:outline-none cursor-pointer"
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
          <div className="flex items-center gap-1.5 bg-sky-50/60 dark:bg-sky-800/50 border border-sky-100 dark:border-sky-700 rounded-lg px-2 py-1">
            <span className="text-[11px] font-semibold text-sky-600/80 dark:text-sky-400 uppercase tracking-wider">
              Time:
            </span>
            <select
              value={filters.timeWindow}
              onChange={(e) => onFilterChange({ ...filters, timeWindow: e.target.value as '1h' | '6h' | '24h' | 'all' })}
              className="text-xs bg-transparent text-sky-900 dark:text-sky-200 font-medium focus:outline-none cursor-pointer"
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
              className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-sky-600 dark:text-sky-400 hover:text-sky-900 dark:hover:text-white bg-sky-50 dark:bg-sky-800/60 hover:bg-sky-100 dark:hover:bg-sky-700 border border-sky-200 dark:border-sky-700 hover:border-sky-300 rounded-lg transition cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter status row */}
      <div className="flex items-center justify-between text-[11px] text-sky-600/70 dark:text-sky-400 px-1 border-t border-sky-100 dark:border-sky-800 pt-1.5">
        <div className="flex items-center gap-2">
          <span>
            Showing <strong className="text-sky-950 dark:text-sky-100 font-semibold">{totalFiltered}</strong> of{' '}
            <strong className="text-sky-950 dark:text-sky-100 font-semibold">{totalCount}</strong> incidents
          </span>
          {isFiltered && (
            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-sky-100 dark:bg-sky-800 text-sky-800 dark:text-sky-200 border border-sky-200 dark:border-sky-700">
              Active Filters
            </span>
          )}
        </div>
        <span className="text-sky-500/70">GHMC Command & Control Division</span>
      </div>
    </div>
  );
};
