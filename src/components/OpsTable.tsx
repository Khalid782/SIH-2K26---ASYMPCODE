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
    'bg-paper-2 text-mute border-paper-2 dark:bg-ink/60 dark:text-paper/70 dark:border-mute',
  slate:
    'bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-800/60 dark:text-slate-300 dark:border-slate-700',
};

export const StatusBadge: React.FC<{
  label: string;
  tone?: BadgeTone;
  pulse?: boolean;
}> = ({ label, tone = 'slate', pulse }) => (
  <span
    className={`inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border whitespace-nowrap ${TONE_CLASSES[tone]}`}
  >
    {pulse && <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />}
    {label}
  </span>
);

export const ViewHeader: React.FC<{ title: string; label: string }> = ({ title, label }) => (
  <div className="flex items-center gap-2">
    <span className="w-2.5 h-2.5 rounded-full bg-signal/80"></span>
    <h2 className="text-xs font-bold uppercase tracking-wider text-ink dark:text-paper">
      {title}
    </h2>
    <span className="text-[11px] text-mute/80 dark:text-mute font-mono ml-auto">{label}</span>
  </div>
);

export const StatChips: React.FC<{
  items: { label: string; value: string; tone?: BadgeTone }[];
}> = ({ items }) => (
  <div className="flex flex-wrap items-center gap-2">
    {items.map((item) => (
      <div
        key={item.label}
        className="inline-flex items-center gap-2 bg-paper/95 dark:bg-ink/90 border border-paper-2/90 dark:border-paper/25 rounded-lg px-3 py-1.5 shadow-[0_1px_2px_rgba(17,17,16,0.04)]"
      >
        <span className="text-[11px] font-medium text-mute/80 dark:text-mute">{item.label}</span>
        <span className={`text-xs font-bold ${item.tone ? TONE_CLASSES[item.tone].split(' ')[1] : 'text-ink dark:text-paper'}`}>
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
  <div className="bg-paper/95 dark:bg-ink/90 border border-paper-2/90 dark:border-paper/25 rounded-xl shadow-[0_1px_2px_rgba(17,17,16,0.04),0_10px_24px_-18px_rgba(17,17,16,0.3)] overflow-hidden">
    <div className="px-4 py-3 border-b border-paper-2 dark:border-paper/25 flex items-center gap-2.5 flex-wrap">
      <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-paper-2 to-paper-2 dark:from-paper-2 dark:to-paper border border-paper-2 dark:border-mute flex items-center justify-center text-mute dark:text-mute shrink-0">
        {icon}
      </span>
      <div className="min-w-0">
        <h3 className="text-xs font-bold uppercase tracking-wider text-ink dark:text-paper">
          {title}
        </h3>
        {subtitle && (
          <p className="text-[11px] text-mute/80 dark:text-mute">{subtitle}</p>
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
          <tr className="bg-paper-2/70 dark:bg-ink/40">
            {columns.map((c) => (
              <th
                key={c.key}
                className={`px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider text-mute dark:text-mute whitespace-nowrap ${c.className || ''}`}
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
              className={`border-t border-paper-2/80 dark:border-paper/25/60 transition-colors ${
                row.alert
                  ? 'bg-rose-50/60 dark:bg-rose-900/20'
                  : 'hover:bg-paper-2/50 dark:hover:bg-ink/80/30'
              }`}
            >
              {row.cells.map((cell, i) => (
                <td
                  key={i}
                  className={`px-4 py-2.5 text-paper dark:text-paper align-middle whitespace-nowrap ${columns[i]?.className || ''}`}
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
      <div className="px-4 py-2.5 border-t border-paper-2 dark:border-paper/25 bg-paper-2/50 dark:bg-ink/40 text-[11px] text-mute/80 dark:text-mute">
        {footer}
      </div>
    )}
  </div>
);