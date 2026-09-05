import React from 'react';
import { HeartHandshake, HandHeart, Users, Radio } from 'lucide-react';
import { OpsTable, ViewHeader, StatChips, StatusBadge, OpsColumn, OpsRow } from './OpsTable';

const COLUMNS: OpsColumn[] = [
  { key: 'org', label: 'Organization' },
  { key: 'focus', label: 'Focus Area' },
  { key: 'zone', label: 'Active Zone' },
  { key: 'volunteers', label: 'Volunteers', className: 'text-right' },
  { key: 'contact', label: 'Contact' },
  { key: 'status', label: 'Status' },
];

const ROWS: OpsRow[] = [
  {
    id: 'ngo-hhf',
    cells: [
      <span key="c" className="font-semibold text-sky-950 dark:text-sky-100">Helping Hand Foundation</span>,
      'Medical camps & rescue',
      'Tolichowki',
      <span key="n" className="font-mono">120</span>,
      'Via 112 · field app',
      <StatusBadge key="s" label="Active" tone="green" pulse />,
    ],
  },
  {
    id: 'ngo-goonj',
    cells: [
      <span key="c" className="font-semibold text-sky-950 dark:text-sky-100">Goonj</span>,
      'Relief material & ration',
      'City-wide',
      <span key="n" className="font-mono">200</span>,
      'goonj.org',
      <StatusBadge key="s" label="Active" tone="green" />,
    ],
  },
  {
    id: 'ngo-seeds',
    cells: [
      <span key="c" className="font-semibold text-sky-950 dark:text-sky-100">SEEDS India</span>,
      'Search & rescue volunteers',
      'Old City',
      <span key="n" className="font-mono">85</span>,
      'seedsindia.org',
      <StatusBadge key="s" label="Active" tone="green" />,
    ],
  },
  {
    id: 'ngo-yrc',
    cells: [
      <span key="c" className="font-semibold text-sky-950 dark:text-sky-100">Youth Red Cross</span>,
      'First aid & stretcher teams',
      'Secunderabad',
      <span key="n" className="font-mono">150</span>,
      'redcrosshyd.org',
      <StatusBadge key="s" label="Active" tone="green" />,
    ],
  },
  {
    id: 'ngo-akshaya',
    cells: [
      <span key="c" className="font-semibold text-sky-950 dark:text-sky-100">Akshaya Patra</span>,
      'Cooked meals for shelters',
      'All shelters',
      <span key="n" className="font-mono">60</span>,
      'akshayapatra.org',
      <StatusBadge key="s" label="Active" tone="green" />,
    ],
  },
  {
    id: 'ngo-sja',
    cells: [
      <span key="c" className="font-semibold text-sky-950 dark:text-sky-100">St. John Ambulance</span>,
      'Ambulance backup',
      'Banjara Hills',
      <span key="n" className="font-mono">40</span>,
      'sjaindia.org',
      <StatusBadge key="s" label="Active" tone="green" />,
    ],
  },
  {
    id: 'ngo-janmitra',
    cells: [
      <span key="c" className="font-semibold text-sky-950 dark:text-sky-100">Jan Mitra Volunteers</span>,
      'Local flood volunteers',
      'Mehdipatnam',
      <span key="n" className="font-mono">95</span>,
      'WhatsApp group',
      <StatusBadge key="s" label="Active" tone="green" />,
    ],
  },
  {
    id: 'ngo-aid',
    cells: [
      <span key="c" className="font-semibold text-sky-950 dark:text-sky-100">AID Hyderabad</span>,
      'De-watering support',
      'Amberpet',
      <span key="n" className="font-mono">55</span>,
      'aidindia.org',
      <StatusBadge key="s" label="Mobilizing" tone="amber" />,
    ],
  },
  {
    id: 'ngo-bsg',
    cells: [
      <span key="c" className="font-semibold text-sky-950 dark:text-sky-100">Bharat Scouts & Guides</span>,
      'Shelter management',
      'Kukatpally',
      <span key="n" className="font-mono">70</span>,
      'scouts telangana',
      <StatusBadge key="s" label="Standby" tone="slate" />,
    ],
  },
  {
    id: 'ngo-care',
    cells: [
      <span key="c" className="font-semibold text-sky-950 dark:text-sky-100">Care & Share Foundation</span>,
      'Child-safe evacuation',
      'Tolichowki',
      <span key="n" className="font-mono">30</span>,
      'careandshare.org',
      <StatusBadge key="s" label="Active" tone="green" />,
    ],
  },
];

export default function NgoCommunitiesView() {
  return (
    <div className="max-w-4xl mx-auto w-full space-y-4">
      <ViewHeader title="NGOs & Helping Communities" label="10 partner organizations &bull; volunteer net" />
      <StatChips
        items={[
          { label: 'Total volunteers', value: '905', tone: 'sky' },
          { label: 'Active', value: '8', tone: 'green' },
          { label: 'Mobilizing', value: '1', tone: 'amber' },
          { label: 'Standby', value: '1', tone: 'slate' },
        ]}
      />
      <OpsTable
        title="NGO & Community Partner Roster"
        subtitle="Civil-society partners coordinated through the GHMC command loop"
        icon={<HeartHandshake className="w-4 h-4" />}
        chip="Partner net live"
        chipTone="green"
        columns={COLUMNS}
        rows={ROWS}
        footer={
          <span className="flex items-center gap-1.5">
            <HandHeart className="w-3.5 h-3.5 text-rose-500" />
            Volunteers are dispatched only through the field app with an incident ID — no unverified
            private requests.
          </span>
        }
      />
      <div className="flex items-center gap-1.5 text-[11px] text-sky-600/80 dark:text-sky-400">
        <Users className="w-3.5 h-3.5" />
        <Radio className="w-3.5 h-3.5" />
        Community radio slot every hour at :45 — used to broadcast shelter locations and relief
        pickup points.
      </div>
    </div>
  );
}