import type { SourceType } from '../types';

export interface SyntheticReport {
  id: string;
  text: string;
  channel: SourceType;
  tag: 'critical' | 'high' | 'low' | 'noise' | 'duplicate';
}

const CRITICAL_REAL: SyntheticReport[] = [
  {
    id: 'sr-01',
    channel: 'Citizen WhatsApp',
    tag: 'critical',
    text: 'HELP SOS tolichowki flyover underpass mein pani 5 feet ho gaya hai aur 3 log ghar ke andar trapped hai family with old uncle. Water still rising please send rescue boat immediately near shaikpet nala bridge.',
  },
  {
    id: 'sr-02',
    channel: 'Social Media',
    tag: 'critical',
    text: 'URGENT moosarambagh bridge pe Musi river overflow 4 log first floor mein phas gaye hai landmark near madina building water chest high rising fast unconscious patient also there ambulance needed.',
  },
  {
    id: 'sr-03',
    channel: 'GHMC Control Room',
    tag: 'critical',
    text: 'Charminar Laad Bazaar 2 floor building gir gaya wall collapse near makkah masjid 5 people feared trapped short circuit sparking also reported fire brigade required urgently bachao.',
  },
  {
    id: 'sr-04',
    channel: 'Emergency Line (112)',
    tag: 'critical',
    text: 'Mehdipatnam pvnr expressway pillar 124 ke neeche bus submerged 12 commuters trapped roof pe khade hai water rapidly overflowing electrical wires also touching water live current please send NDRF.',
  },
];

const HIGH_REAL: SyntheticReport[] = [
  {
    id: 'sr-05',
    channel: 'Field Volunteer',
    tag: 'high',
    text: 'Gachibowli stadium outer ring road side se water entering residential apartments basement cars submerged 4 cars stuck people moving upstairs no casualties yet situation monitor needed.',
  },
  {
    id: 'sr-06',
    channel: 'Traffic Police Feed',
    tag: 'high',
    text: 'Secunderabad paradise circle kphb route road completely blocked tree fell 3 transformer sparking happened traffic jam 2km long Kukatpally Y junction water logged chest height vehicles stranded.',
  },
  {
    id: 'sr-07',
    channel: 'Social Media',
    tag: 'high',
    text: 'Kukatpally KPHB colony phase 5 main nala overflow many homes entering water elderly dialysis patient needs medical evacuation immediately ambulance not able to reach water waist high.',
  },
  {
    id: 'sr-08',
    channel: 'Citizen WhatsApp',
    tag: 'high',
    text: 'Begumpet flyover area prakash nagar water logging waist height cars stalled pregnant lady needs urgent medical help moving to hospital family very worried please respond fast.',
  },
];

const LOW_MONITOR: SyntheticReport[] = [
  {
    id: 'sr-09',
    channel: 'Social Media',
    tag: 'low',
    text: 'Charminar local market mein light drizzle ho rahi hai some shopkeepers keeping tarpaulin no water logging reported yet citizens enjoying weather nothing emergency just normal rain update.',
  },
  {
    id: 'sr-10',
    channel: 'Field Volunteer',
    tag: 'low',
    text: 'Jubilee hills road no 45 dry condition se water receding slowly all routes open now traffic normal only minor puddles visible monitoring situation no incident needed.',
  },
  {
    id: 'sr-11',
    channel: 'GHMC Control Room',
    tag: 'low',
    text: 'Lakdikapul railway bridge water level decreasing 1 foot left only clean up crew started work no trapped people reported status green.',
  },
];

const NOISE_IRRELEVANT: SyntheticReport[] = [
  {
    id: 'sr-12',
    channel: 'Social Media',
    tag: 'noise',
    text: 'Biryani at paradise secunderabad was amazing today everyone try the new haleem special ramzan offer limited time only.',
  },
  {
    id: 'sr-13',
    channel: 'Social Media',
    tag: 'noise',
    text: 'Hi guys planning weekend trip to gachibowli stadium cricket match any suggestions for parking nearby? DM only.',
  },
];

const DUPLICATE_SIMILAR: SyntheticReport[] = [
  {
    id: 'sr-14',
    channel: 'Citizen WhatsApp',
    tag: 'duplicate',
    text: 'Tolichowki flyover underpass pani bahut aa raha hai 3 log trapped hai near shaikpet nala somebody please send boat uncle also trapped urgent bachao.',
  },
];

export const SYNTHETIC_REPORTS: SyntheticReport[] = [
  ...CRITICAL_REAL,
  ...HIGH_REAL,
  ...LOW_MONITOR,
  ...NOISE_IRRELEVANT,
  ...DUPLICATE_SIMILAR,
];

export function getRandomReport(): SyntheticReport {
  const pool = [...SYNTHETIC_REPORTS];
  const weighted: SyntheticReport[] = [];
  for (const r of pool) {
    const weight = r.tag === 'duplicate' ? 2 : r.tag === 'noise' ? 3 : r.tag === 'low' ? 2 : 4;
    for (let i = 0; i < weight; i++) weighted.push(r);
  }
  return weighted[Math.floor(Math.random() * weighted.length)];
}

export function nextIntervalMs(minSec = 6, maxSec = 10): number {
  const min = Math.min(minSec, maxSec);
  const max = Math.max(minSec, maxSec);
  const sec = Math.random() * (max - min) + min;
  return Math.round(sec * 1000);
}
