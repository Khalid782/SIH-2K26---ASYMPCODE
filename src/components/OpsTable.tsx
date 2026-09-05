import React from 'react';

export type BadgeTone = 'green' | 'amber' | 'red' | 'sky' | 'slate';

const TONE_CLASSES: Record<BadgeTone, string> = {
  green:
    'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-300 dark:border-emerald-700',
  amber:
    'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/40 dark:text-amber-300 dark:border-amber-700',
  red:
    'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-900/40 dark:text-rose-300 dark:border-rose-700',
  sky:
    'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-800/60 dark:text-sky-300 dark:border-sky-700',
  slate:
    'bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-800/60 dark:text-slate-300 dark:border-slate-700',
};

export const StatusBadge: React.FC<{
  label: string;
  tone?: BadgeTone;
  pulse?: boolean;
}> = ({ label, tone = 'slate', pulse }) => (
  <span
    className={`inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border whitespace-nowrap ${TONE_CLASSES[tone]}`}
  >
    {pulse && <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />}
    {label}
  </span>
);

export const ViewHeader: React.FC<{ title: string; label: string }> = ({ title, label }) => (
  <div className="flex items-center gap-2">
    <span className="w-2.5 h-2.5 rounded-sm bg-sky-500"></span>
    <h2 className="text-xs font-bold uppercase tracking-wider text-sky-950 dark:text-sky-100">
      {title}
    </h2>
    <span className="text-[11px] text-sky-600/80 dark:text-sky-400 font-mono ml-auto">{label}</span>
  </div>
);

export const StatChips: React.FC<{
  items: { label: string; value: string; tone?: BadgeTone }[];
}> = ({ items }) => (
  <div className="flex flex-wrap items-center gap-2">
    {items.map((item) => (
      <div
        key={item.label}
        className="inline-flex items-center gap-2 bg-white/95 dark:bg-sky-900/90 border border-sky-100/90 dark:border-sky-800 rounded-lg px-3 py-1.5 shadow-[0_1px_2px_rgba(8,47,73,0.04)]"
      >
        <span className="text-[11px] font-medium text-sky-600/80 dark:text-sky-400">{item.label}</span>
        <span className={`text-xs font-bold ${item.tone ? TONE_CLASSES[item.tone].split(' ')[1] : 'text-sky-950 dark:text-sky-100'}`}>
          {item.value}
        </span>
      </div>
    ))}
  </div>
);

export interface OpsColumn {
  key: string;
  label: string;
  className?: string;
}

export interface OpsRow {
  id: string;
  cells: React.ReactNode[];
  alert?: boolean;
}

interface OpsTableProps {
  title: string;
  subtitle?: string;
  icon: React.ReactNode;
  chip?: string;
  chipTone?: BadgeTone;
  columns: OpsColumn[];
  rows: OpsRow[];
  footer?: React.ReactNode;
}

export const OpsTable: React.FC<OpsTableProps> = ({
  title,
  subtitle,
  icon,
  chip,
  chipTone = 'green',
  columns,
  rows,
  footer,
}) => (
  <div className="bg-white/95 dark:bg-sky-900/90 border border-sky-100/90 dark:border-sky-800 rounded-xl shadow-[0_1px_2px_rgba(8,47,73,0.04),0_10px_24px_-18px_rgba(2,132,199,0.3)] overflow-hidden">
    <div className="px-4 py-3 border-b border-sky-100 dark:border-sky-800 flex items-center gap-2.5 flex-wrap">
      <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-sky-100 to-sky-200 dark:from-sky-800 dark:to-sky-900 border border-sky-200 dark:border-sky-700 flex items-center justify-center text-sky-600 dark:text-sky-400 shrink-0">
        {icon}
      </span>
      <div className="min-w-0">
        <h3 className="text-xs font-bold uppercase tracking-wider text-sky-950 dark:text-sky-100">
          {title}
        </h3>
        {subtitle && (
          <p className="text-[11px] text-sky-600/80 dark:text-sky-400">{subtitle}</p>
        )}
      </div>
      {chip && (
        <div className="ml-auto">
          <StatusBadge label={chip} tone={chipTone} pulse />
        </div>
      )}
    </div>
    <div className="overflow-x-auto">
      <table className="w-full text-left text-xs min-w-[680px]">
        <thead>
          <tr className="bg-sky-50/70 dark:bg-sky-800/40">
            {columns.map((c) => (
              <th
                key={c.key}
                className={`px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider text-sky-600 dark:text-sky-400 whitespace-nowrap ${c.className || ''}`}
              >
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={row.id}
              className={`border-t border-sky-100/80 dark:border-sky-800/60 transition-colors ${
                row.alert
                  ? 'bg-rose-50/60 dark:bg-rose-900/20'
                  : 'hover:bg-sky-50/50 dark:hover:bg-sky-800/30'
              }`}
            >
              {row.cells.map((cell, i) => (
                <td
                  key={i}
                  className={`px-4 py-2.5 text-sky-900 dark:text-sky-100 align-middle whitespace-nowrap ${columns[i]?.className || ''}`}
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
    {footer && (
      <div className="px-4 py-2.5 border-t border-sky-100 dark:border-sky-800 bg-sky-50/50 dark:bg-sky-900/40 text-[11px] text-sky-600/80 dark:text-sky-400">
        {footer}
      </div>
    )}
  </div>
);