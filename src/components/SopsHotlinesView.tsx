import React from 'react';
import { PhoneCall, FileText, LifeBuoy, BookOpenCheck } from 'lucide-react';
import { OpsTable, ViewHeader, StatChips, StatusBadge, OpsColumn, OpsRow } from './OpsTable';

const HOTLINE_COLUMNS: OpsColumn[] = [
  { key: 'service', label: 'Service' },
  { key: 'number', label: 'Number' },
  { key: 'availability', label: 'Availability' },
  { key: 'owner', label: 'Owner' },
];

const HOTLINE_ROWS: OpsRow[] = [
  {
    id: 'h-112',
    cells: [
      <span key="c" className="font-semibold text-ink dark:text-paper">National Emergency</span>,
      <span key="n" className="font-mono font-bold text-ink dark:text-paper">112</span>,
      '24 × 7',
      'MHA',
    ],
  },
  {
    id: 'h-100',
    cells: [
      <span key="c" className="font-semibold text-ink dark:text-paper">Police</span>,
      <span key="n" className="font-mono font-bold text-ink dark:text-paper">100</span>,
      '24 × 7',
      'Hyderabad Police',
    ],
  },
  {
    id: 'h-108',
    cells: [
      <span key="c" className="font-semibold text-ink dark:text-paper">Ambulance</span>,
      <span key="n" className="font-mono font-bold text-ink dark:text-paper">108</span>,
      '24 × 7',
      'GVK EMRI',
    ],
  },
  {
    id: 'h-101',
    cells: [
      <span key="c" className="font-semibold text-ink dark:text-paper">Fire & Rescue</span>,
      <span key="n" className="font-mono font-bold text-ink dark:text-paper">101</span>,
      '24 × 7',
      'Fire Dept',
    ],
  },
  {
    id: 'h-ghmc',
    cells: [
      <span key="c" className="font-semibold text-ink dark:text-paper">GHMC Flood Helpline</span>,
      <span key="n" className="font-mono font-bold text-ink dark:text-paper">040-21111111</span>,
      '24 × 7',
      'GHMC Control Room',
    ],
  },
  {
    id: 'h-power',
    cells: [
      <span key="c" className="font-semibold text-ink dark:text-paper">Power Outage</span>,
      <span key="n" className="font-mono font-bold text-ink dark:text-paper">1912</span>,
      '24 × 7',
      'TSSPDCL',
    ],
  },
  {
    id: 'h-ndrf',
    cells: [
      <span key="c" className="font-semibold text-ink dark:text-paper">NDRF Helpline</span>,
      <span key="n" className="font-mono font-bold text-ink dark:text-paper">9711077372</span>,
      '24 × 7',
      'NDRF HQ',
    ],
  },
  {
    id: 'h-child',
    cells: [
      <span key="c" className="font-semibold text-ink dark:text-paper">Child Helpline</span>,
      <span key="n" className="font-mono font-bold text-ink dark:text-paper">1098</span>,
      '24 × 7',
      'Ministry of Women & Child',
    ],
  },
];

const SOP_COLUMNS: OpsColumn[] = [
  { key: 'id', label: 'SOP ID' },
  { key: 'title', label: 'Title' },
  { key: 'trigger', label: 'Trigger' },
  { key: 'owner', label: 'Owner' },
  { key: 'version', label: 'Version' },
  { key: 'status', label: 'Status' },
];

const SOP_ROWS: OpsRow[] = [
  {
    id: 'sop-1',
    cells: [
      <span key="c" className="font-mono font-semibold text-mute dark:text-paper/70">SOP-FLD-01</span>,
      'Flood Evacuation Protocol',
      'Red alert / water entry',
      'GHMC + SDRF',
      'v3.1',
      <StatusBadge key="s" label="Active" tone="green" />,
    ],
  },
  {
    id: 'sop-2',
    cells: [
      <span key="c" className="font-mono font-semibold text-mute dark:text-paper/70">SOP-RSC-02</span>,
      'Water Rescue Operations',
      'Trapped persons',
      'SDRF / NDRF',
      'v2.4',
      <StatusBadge key="s" label="Active" tone="green" />,
    ],
  },
  {
    id: 'sop-3',
    cells: [
      <span key="c" className="font-mono font-semibold text-mute dark:text-paper/70">SOP-MED-03</span>,
      'Medical Boat Evacuation',
      'Medical cases in flood',
      'EMRI 108',
      'v1.9',
      <StatusBadge key="s" label="Active" tone="green" />,
    ],
  },
  {
    id: 'sop-4',
    cells: [
      <span key="c" className="font-mono font-semibold text-mute dark:text-paper/70">SOP-ELE-04</span>,
      'Electrical Hazard Response',
      'Wires in water',
      'TSSPDCL',
      'v2.0',
      <StatusBadge key="s" label="Active" tone="green" />,
    ],
  },
  {
    id: 'sop-5',
    cells: [
      <span key="c" className="font-mono font-semibold text-mute dark:text-paper/70">SOP-SHT-05</span>,
      'Shelter & Relief Activation',
      'Evacuation > 100',
      'GHMC Revenue',
      'v3.2',
      <StatusBadge key="s" label="Active" tone="green" />,
    ],
  },
  {
    id: 'sop-6',
    cells: [
      <span key="c" className="font-mono font-semibold text-mute dark:text-paper/70">SOP-COM-06</span>,
      'Siren & Community Alert',
      'Dam / nala breach',
      'HMWSSB',
      'v1.7',
      <StatusBadge key="s" label="Review" tone="amber" />,
    ],
  },
];

export default function SopsHotlinesView() {
  return (
    <div className="max-w-4xl mx-auto w-full space-y-4">
      <ViewHeader title="SOPs & Hotlines" label="8 hotlines &bull; 6 active SOPs &bull; vetted 2026" />
      <StatChips
        items={[
          { label: 'Hotlines', value: '8', tone: 'sky' },
          { label: 'Active SOPs', value: '5', tone: 'green' },
          { label: 'Under review', value: '1', tone: 'amber' },
          { label: 'All toll-free', value: 'Yes', tone: 'sky' },
        ]}
      />
      <OpsTable
        title="Emergency Hotlines"
        subtitle="Verified numbers for dispatchers and the public"
        icon={<PhoneCall className="w-4 h-4" />}
        chip="Verified"
        chipTone="green"
        columns={HOTLINE_COLUMNS}
        rows={HOTLINE_ROWS}
      />
      <OpsTable
        title="Active Standard Operating Procedures"
        subtitle="Trigger-based playbooks referenced by the triage engine"
        icon={<FileText className="w-4 h-4" />}
        chip="Linked to engine"
        chipTone="sky"
        columns={SOP_COLUMNS}
        rows={SOP_ROWS}
        footer={
          <span className="flex items-center gap-1.5">
            <LifeBuoy className="w-3.5 h-3.5 text-mute" />
            When Gemini triage flags a report, the matching SOP ID is attached to the incident card.
          </span>
        }
      />
      <div className="flex items-center gap-1.5 text-[11px] text-mute/80 dark:text-mute">
        <BookOpenCheck className="w-3.5 h-3.5" />
        Full playbook PDFs are available from the GHMC disaster-control room on request.
      </div>
    </div>
  );
}