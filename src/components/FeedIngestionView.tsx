import React from 'react';
import { Radio, Activity, Inbox, ShieldCheck } from 'lucide-react';
import { OpsTable, ViewHeader, StatChips, StatusBadge, OpsColumn, OpsRow } from './OpsTable';

const COLUMNS: OpsColumn[] = [
  { key: 'channel', label: 'Ingestion Channel' },
  { key: 'type', label: 'Type' },
  { key: 'status', label: 'Status' },
  { key: 'reports', label: 'Reports (24h)', className: 'text-right' },
  { key: 'queue', label: 'In Queue', className: 'text-right' },
  { key: 'confidence', label: 'AI Confidence', className: 'text-right' },
  { key: 'updated', label: 'Last Update' },
];

const ROWS: OpsRow[] = [
  {
    id: 'ch-whatsapp',
    cells: [
      <span key="c" className="font-semibold text-sky-950 dark:text-sky-100">Citizen WhatsApp Line</span>,
      'Text / Voice notes',
      <StatusBadge key="s" label="Online" tone="green" pulse />,
      <span key="n" className="font-mono">1,284</span>,
      <span key="q" className="font-mono">23</span>,
      <span key="a" className="font-mono">94%</span>,
      'Just now',
    ],
  },
  {
    id: 'ch-112',
    cells: [
      <span key="c" className="font-semibold text-sky-950 dark:text-sky-100">Emergency Line 112</span>,
      'Voice → transcript',
      <StatusBadge key="s" label="Online" tone="green" pulse />,
      <span key="n" className="font-mono">612</span>,
      <span key="q" className="font-mono">8</span>,
      <span key="a" className="font-mono">91%</span>,
      '2 min ago',
    ],
  },
  {
    id: 'ch-twitter',
    cells: [
      <span key="c" className="font-semibold text-sky-950 dark:text-sky-100">X / Twitter Monitor</span>,
      'Social media',
      <StatusBadge key="s" label="Online" tone="green" />,
      <span key="n" className="font-mono">389</span>,
      <span key="q" className="font-mono">12</span>,
      <span key="a" className="font-mono">88%</span>,
      '1 min ago',
    ],
  },
  {
    id: 'ch-facebook',
    cells: [
      <span key="c" className="font-semibold text-sky-950 dark:text-sky-100">Facebook Community Groups</span>,
      'Social media',
      <StatusBadge key="s" label="Online" tone="green" />,
      <span key="n" className="font-mono">214</span>,
      <span key="q" className="font-mono">6</span>,
      <span key="a" className="font-mono">86%</span>,
      '3 min ago',
    ],
  },
  {
    id: 'ch-sensors',
    cells: [
      <span key="c" className="font-semibold text-sky-950 dark:text-sky-100">GHMC Sensor Telemetry</span>,
      'IoT water gauges',
      <StatusBadge key="s" label="Online" tone="green" pulse />,
      <span key="n" className="font-mono">96</span>,
      <span key="q" className="font-mono">0</span>,
      <span key="a" className="font-mono">97%</span>,
      '30 sec ago',
    ],
  },
  {
    id: 'ch-volunteer',
    cells: [
      <span key="c" className="font-semibold text-sky-950 dark:text-sky-100">Field Volunteer App</span>,
      'Field app',
      <StatusBadge key="s" label="Online" tone="green" />,
      <span key="n" className="font-mono">173</span>,
      <span key="q" className="font-mono">4</span>,
      <span key="a" className="font-mono">93%</span>,
      'Just now',
    ],
  },
  {
    id: 'ch-sms',
    cells: [
      <span key="c" className="font-semibold text-sky-950 dark:text-sky-100">SMS 112 Gateway</span>,
      'SMS',
      <StatusBadge key="s" label="Degraded" tone="amber" />,
      <span key="n" className="font-mono">148</span>,
      <span key="q" className="font-mono text-rose-600 dark:text-rose-400 font-bold">31</span>,
      <span key="a" className="font-mono">84%</span>,
      '6 min ago',
    ],
    alert: true,
  },
  {
    id: 'ch-traffic',
    cells: [
      <span key="c" className="font-semibold text-sky-950 dark:text-sky-100">Traffic Police Feed</span>,
      'Agency feed',
      <StatusBadge key="s" label="Online" tone="green" />,
      <span key="n" className="font-mono">87</span>,
      <span key="q" className="font-mono">2</span>,
      <span key="a" className="font-mono">90%</span>,
      '4 min ago',
    ],
  },
  {
    id: 'ch-web',
    cells: [
      <span key="c" className="font-semibold text-sky-950 dark:text-sky-100">Web / Portal Form</span>,
      'Web',
      <StatusBadge key="s" label="Online" tone="green" />,
      <span key="n" className="font-mono">64</span>,
      <span key="q" className="font-mono">1</span>,
      <span key="a" className="font-mono">89%</span>,
      '5 min ago',
    ],
  },
  {
    id: 'ch-radio',
    cells: [
      <span key="c" className="font-semibold text-sky-950 dark:text-sky-100">Community Radio / HAM</span>,
      'Radio',
      <StatusBadge key="s" label="Standby" tone="slate" />,
      <span key="n" className="font-mono">12</span>,
      <span key="q" className="font-mono">0</span>,
      <span key="a" className="font-mono">82%</span>,
      '18 min ago',
    ],
  },
];

export default function FeedIngestionView() {
  return (
    <div className="max-w-4xl mx-auto w-full space-y-4">
      <ViewHeader title="Feed & Ingestion" label="10 live channels &bull; Gemini pre-filter active" />
      <StatChips
        items={[
          { label: 'Channels', value: '10', tone: 'sky' },
          { label: 'Online', value: '9', tone: 'green' },
          { label: 'Degraded', value: '1', tone: 'amber' },
          { label: 'Reports (24h)', value: '3,079', tone: 'sky' },
        ]}
      />
      <OpsTable
        title="Ingestion Channel Matrix"
        subtitle="Live sources feeding the AI triage pipeline"
        icon={<Radio className="w-4 h-4" />}
        chip="Ingesting"
        chipTone="green"
        columns={COLUMNS}
        rows={ROWS}
        footer={
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            Every report is de-duplicated and pre-filtered by Gemini before it reaches the intelligence feed.
          </span>
        }
      />
      <div className="flex items-center gap-1.5 text-[11px] text-sky-600/80 dark:text-sky-400">
        <Activity className="w-3.5 h-3.5" />
        <Inbox className="w-3.5 h-3.5" />
        Queue backlog of <strong className="text-sky-950 dark:text-sky-100">87</strong> messages is being
        drained by the severity engine &mdash; estimated clear in 4 minutes.
      </div>
    </div>
  );
}