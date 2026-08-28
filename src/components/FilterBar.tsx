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
    <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-xs flex flex-col gap-2.5">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2.5">
        {/* Search Bar */}
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={filters.search}
            onChange={(e) => onFilterChange({ ...filters, search: e.target.value })}
            placeholder="Search location (e.g. Mehdipatnam, Tolichowki) or keyword..."
            className="w-full pl-9 pr-8 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-md text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-800 transition"
          />
          {filters.search && (
            <button
              onClick={() => onFilterChange({ ...filters, search: '' })}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Dropdown Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Severity Filter */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-md px-2 py-1">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Severity:
            </span>
            <select
              value={filters.severity}
              onChange={(e) => onFilterChange({ ...filters, severity: e.target.value as 'All' | Severity })}
              className="text-xs bg-transparent text-slate-800 font-medium focus:outline-none cursor-pointer"
            >
              <option value="All">All Severities</option>
              <option value="Critical">🔴 Critical (Red)</option>
              <option value="High">🟠 High (Orange)</option>
              <option value="Low">🟡 Low (Yellow)</option>
            </select>
          </div>

          {/* Disaster Type Filter */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-md px-2 py-1">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Disaster Type:
            </span>
            <select
              value={filters.disasterType}
              onChange={(e) => onFilterChange({ ...filters, disasterType: e.target.value as 'All' | DisasterType })}
              className="text-xs bg-transparent text-slate-800 font-medium focus:outline-none cursor-pointer"
            >
              <option value="All">All Disaster Types</option>
              <option value="Flood">Flood</option>
              <option value="Medical Emergency">Medical Emergency</option>
              <option value="Infrastructure Damage">Infrastructure Damage</option>
              <option value="Rescue Required">Rescue Required</option>
            </select>
          </div>

          {/* Verification Status Filter */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-md px-2 py-1">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Status:
            </span>
            <select
              value={filters.status}
              onChange={(e) => onFilterChange({ ...filters, status: e.target.value as 'All' | VerificationStatus })}
              className="text-xs bg-transparent text-slate-800 font-medium focus:outline-none cursor-pointer"
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
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-md px-2 py-1">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Time:
            </span>
            <select
              value={filters.timeWindow}
              onChange={(e) => onFilterChange({ ...filters, timeWindow: e.target.value as '1h' | '6h' | '24h' | 'all' })}
              className="text-xs bg-transparent text-slate-800 font-medium focus:outline-none cursor-pointer"
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
              className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-slate-600 hover:text-red-600 bg-slate-100 hover:bg-red-50 border border-slate-200 hover:border-red-200 rounded-md transition cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter status row */}
      <div className="flex items-center justify-between text-[11px] text-slate-500 px-1 border-t border-slate-100 pt-1.5">
        <div className="flex items-center gap-2">
          <span>
            Showing <strong className="text-slate-800 font-semibold">{totalFiltered}</strong> of{' '}
            <strong className="text-slate-800 font-semibold">{totalCount}</strong> incidents
          </span>
          {isFiltered && (
            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-50 text-amber-800 border border-amber-200">
              Active Filters
            </span>
          )}
        </div>
        <span className="text-slate-400">GHMC Command & Control Division</span>
      </div>
    </div>
  );
};
