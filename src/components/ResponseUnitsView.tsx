import React from 'react';
import { Users, ShieldCheck, Truck, PhoneCall } from 'lucide-react';
import { OpsTable, ViewHeader, StatChips, StatusBadge, OpsColumn, OpsRow } from './OpsTable';

const COLUMNS: OpsColumn[] = [
  { key: 'unit', label: 'Unit' },
  { key: 'agency', label: 'Agency' },
  { key: 'zone', label: 'Base / Zone' },
  { key: 'personnel', label: 'Personnel', className: 'text-right' },
  { key: 'assets', label: 'Assets' },
  { key: 'status', label: 'Status' },
  { key: 'dispatched', label: 'Dispatched' },
];

const ROWS: OpsRow[] = [
  {
    id: 'u-alpha',
    cells: [
      <span key="c" className="font-semibold text-sky-950 dark:text-sky-100">SDRF Alpha Unit</span>,
      'SDRF Telangana',
      'Mehdipatnam',
      <span key="n" className="font-mono">24</span>,
      'Boats ×4, Drones ×2',
      <StatusBadge key="s" label="Deployed" tone="green" pulse />,
      '08:58',
    ],
  },
  {
    id: 'u-bravo',
    cells: [
      <span key="c" className="font-semibold text-sky-950 dark:text-sky-100">SDRF Bravo Unit</span>,
      'SDRF Telangana',
      'Tolichowki',
      <span key="n" className="font-mono">18</span>,
      'Boats ×3, Rope kits',
      <StatusBadge key="s" label="Deployed" tone="green" pulse />,
      '08:54',
    ],
  },
  {
    id: 'u-ndrf-t1',
    cells: [
      <span key="c" className="font-semibold text-sky-950 dark:text-sky-100">NDRF 10th Bn — Team 1</span>,
      'NDRF',
      'Moosarambagh',
      <span key="n" className="font-mono">40</span>,
      'Boats ×6, Cutters',
      <StatusBadge key="s" label="Deployed" tone="green" pulse />,
      '08:32',
    ],
  },
  {
    id: 'u-ndrf-evac',
    cells: [
      <span key="c" className="font-semibold text-sky-950 dark:text-sky-100">NDRF Evacuation Squad C</span>,
      'NDRF',
      'Tolichowki · Paramount',
      <span key="n" className="font-mono">16</span>,
      'Boats ×2, Stretchers',
      <StatusBadge key="s" label="Deployed" tone="green" />,
      '08:15',
    ],
  },
  {
    id: 'u-drf3',
    cells: [
      <span key="c" className="font-semibold text-sky-950 dark:text-sky-100">GHMC DRF-3</span>,
      'GHMC',
      'Gachibowli',
      <span key="n" className="font-mono">12</span>,
      'Pumps ×6, Trucks',
      <StatusBadge key="s" label="Deployed" tone="green" />,
      '08:05',
    ],
  },
  {
    id: 'u-dqr1',
    cells: [
      <span key="c" className="font-semibold text-sky-950 dark:text-sky-100">DQR Team 1</span>,
      'GHMC QRT',
      'Amberpet',
      <span key="n" className="font-mono">8</span>,
      'Pumps ×2, JCB',
      <StatusBadge key="s" label="Deployed" tone="green" />,
      '07:59',
    ],
  },
  {
    id: 'u-fire',
    cells: [
      <span key="c" className="font-semibold text-sky-950 dark:text-sky-100">Fire & Emergency Squad</span>,
      'Fire Dept',
      'Charminar',
      <span key="n" className="font-mono">14</span>,
      'Tender, BA sets',
      <StatusBadge key="s" label="Deployed" tone="green" />,
      '08:48',
    ],
  },
  {
    id: 'u-tsspdcl',
    cells: [
      <span key="c" className="font-semibold text-sky-950 dark:text-sky-100">Electrical Crew — TSSPDCL</span>,
      'TSSPDCL',
      'Gachibowli',
      <span key="n" className="font-mono">6</span>,
      'Boom truck',
      <StatusBadge key="s" label="On-site" tone="amber" />,
      '08:12',
    ],
  },
  {
    id: 'u-emri',
    cells: [
      <span key="c" className="font-semibold text-sky-950 dark:text-sky-100">EMRI 108 Medical Unit</span>,
      'GVK EMRI',
      'Banjara Hills',
      <span key="n" className="font-mono">4</span>,
      'Ambulances ×2',
      <StatusBadge key="s" label="En route" tone="sky" pulse />,
      '08:41',
    ],
  },
  {
    id: 'u-rpf',
    cells: [
      <span key="c" className="font-semibold text-sky-950 dark:text-sky-100">Railway Protection Squad</span>,
      'RPF',
      'Secunderabad',
      <span key="n" className="font-mono">10</span>,
      'Pumps, ladders',
      <StatusBadge key="s" label="Standby" tone="slate" />,
      '—',
    ],
  },
];

export default function ResponseUnitsView() {
  return (
    <div className="max-w-4xl mx-auto w-full space-y-4">
      <ViewHeader title="SDRF / NDRF Units" label="10 active units &bull; Command comms linked" />
      <StatChips
        items={[
          { label: 'Personnel in field', value: '152', tone: 'sky' },
          { label: 'Deployed', value: '7', tone: 'green' },
          { label: 'En route / On-site', value: '2', tone: 'amber' },
          { label: 'Standby', value: '1', tone: 'slate' },
        ]}
      />
      <OpsTable
        title="Deployed Response Units"
        subtitle="Live unit roster across Hyderabad flood zones"
        icon={<Users className="w-4 h-4" />}
        chip="Roster live"
        chipTone="green"
        columns={COLUMNS}
        rows={ROWS}
        footer={
          <span className="flex items-center gap-1.5">
            <Truck className="w-3.5 h-3.5 text-sky-500" />
            Additional 2 NDRF teams are on 20-minute standby at the AOC and can be airborne on request.
          </span>
        }
      />
      <div className="flex items-center gap-1.5 text-[11px] text-sky-600/80 dark:text-sky-400">
        <PhoneCall className="w-3.5 h-3.5" />
        Unit-to-unit comms on GRN channel 4 &bull; <ShieldCheck className="w-3.5 h-3.5" />
        all units report position every 5 minutes via the field app.
      </div>
    </div>
  );
}