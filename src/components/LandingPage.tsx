import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AnimatePresence,
  motion,
  useMotionValue,
  useScroll,
  useSpring,
  useTransform,
} from 'motion/react';
import {
  Activity,
  Ambulance,
  ArrowRight,
  ArrowUpRight,
  ChevronRight,
  Cpu,
  Crosshair,
  Droplets,
  Flame,
  Gauge,
  MapPinned,
  Menu,
  Moon,
  PhoneCall,
  Radar,
  Radio,
  ShieldAlert,
  Siren,
  Sun,
  TriangleAlert,
  Waypoints,
  X,
} from 'lucide-react';
import { INITIAL_INCIDENTS } from '../data/mockData';
import { BeaconLogo } from './BeaconLogo';
import type { Incident, Severity } from '../types';

/* ------------------------------------------------------------------ */
/* Content                                                             */
/* ------------------------------------------------------------------ */

const NAV = [
  { href: '#platform', label: 'Platform', index: '01' },
  { href: '#feed', label: 'Live Feed', index: '02' },
  { href: '#protocol', label: 'Protocol', index: '03' },
  { href: '#coverage', label: 'Coverage', index: '04' },
];

const SEV_LABEL: Record<Severity, string> = {
  Critical: 'CRITICAL',
  High: 'HIGH',
  Low: 'MONITOR',
};

const SEV_STYLE: Record<Severity, string> = {
  Critical: 'border-alert/45 bg-alert/10 text-alert',
  High: 'border-hazard/50 bg-hazard/12 text-hazard',
  Low: 'border-safe/45 bg-safe/10 text-safe',
};

const ALERT_FEED = [
  'LEVEL-1 URBAN FLOOD EMERGENCY DECLARED — HYDERABAD',
  'MUSI RIVER AT 4.2M AND RISING · MOOSARAMBAGH GAUGE',
  '112 CALL VOLUME 3.4× BASELINE — TRIAGE QUEUE AUTO-SCALING',
  'SDRF BATTALION 4 STAGED — TOLICHOWKI LOW-LYING CLUSTERS',
  'NDRF TEAMS AIRLIFTED TO MEHDIPATNAM RELIEF CORRIDOR',
  'POWER GRID PARTIAL OUTAGE — TSSPDCL CREWS DISPATCHED',
  'CITIZEN REPORTS FLOODING IN FROM WHATSAPP + SOCIAL CHANNELS',
];

const CAPABILITIES = [
  {
    index: '01',
    title: 'Multi-channel intake',
    kicker: 'One canvas, five feeds',
    body: 'Emergency Line 112, GHMC control room, traffic police feeds, citizen WhatsApp and field volunteers land in one place instead of five dashboards.',
    Icon: Radio,
  },
  {
    index: '02',
    title: 'AI triage in seconds',
    kicker: 'Broken prose → structured data',
    body: 'Raw forwards and call transcripts are parsed into location, severity, people trapped, hazards and response needed — with a visible confidence score.',
    Icon: Cpu,
  },
  {
    index: '03',
    title: 'Tactical GIS mapping',
    kicker: 'Every report geocoded',
    body: 'Verified reports drop onto the six core zones of Hyderabad with severity pulses, hotspots and one-click inspection for field units.',
    Icon: MapPinned,
  },
  {
    index: '04',
    title: 'Verification workflow',
    kicker: 'Pending → Verified → Actioned',
    body: 'Operators merge corroborating reports, flag duplicates and false alarms, and hold the whole picture to an auditable truth standard.',
    Icon: ShieldAlert,
  },
  {
    index: '05',
    title: 'Unit dispatch',
    kicker: 'Move crews, not paperwork',
    body: 'Assign SDRF, NDRF, fire, ambulance and utility crews without leaving the room. Every action is written back and broadcast instantly.',
    Icon: Ambulance,
  },
  {
    index: '06',
    title: 'Shared command picture',
    kicker: 'Zero version drift',
    body: 'Realtime sync means the control room, field tablets and district desks all read from the same live picture — the second it changes.',
    Icon: Waypoints,
  },
];

const PHASES = [
  {
    step: '01',
    title: 'Ingest',
    body: 'Crowdsourced reports flood in from every channel — social, WhatsApp, 112 calls and field volunteers.',
    Icon: Radio,
  },
  {
    step: '02',
    title: 'Triage',
    body: 'The engine extracts location, severity, people trapped and hazards, then geocodes the report onto the city map.',
    Icon: Crosshair,
  },
  {
    step: '03',
    title: 'Dispatch',
    body: 'Operators verify, assign rescue units and track every action live from the Situation Room.',
    Icon: Siren,
  },
];

const STATS = [
  { value: 30, suffix: '', label: 'Incidents tracked', note: 'LIVE DATASET' },
  { value: 93, suffix: '%', label: 'Triage accuracy', note: 'EXTRACTION' },
  { value: 6, suffix: '', label: 'Core zones', note: 'HYDERABAD' },
  { value: 4, suffix: 'm', label: 'Median dispatch', note: 'VERIFY → UNIT' },
];

/** Zone blips positioned over the radar scope (percentage of the disc). */
const ZONES = [
  { code: 'GAC', name: 'Gachibowli', zone: 'West', left: 24, top: 68, severity: 'Low' as Severity },
  { code: 'TOL', name: 'Tolichowki', zone: 'West', left: 30, top: 34, severity: 'Critical' as Severity },
  { code: 'MDP', name: 'Mehdipatnam', zone: 'Central', left: 46, top: 52, severity: 'High' as Severity },
  { code: 'BAN', name: 'Banjara Hills', zone: 'Central', left: 52, top: 24, severity: 'High' as Severity },
  { code: 'MOO', name: 'Moosarambagh', zone: 'South', left: 70, top: 66, severity: 'Critical' as Severity },
  { code: 'CHA', name: 'Charminar', zone: 'Old City', left: 74, top: 38, severity: 'Low' as Severity },
];

const CHANNELS = ['Emergency Line 112', 'GHMC Control Room', 'Citizen WhatsApp', 'Social Media', 'Field Volunteer', 'Traffic Police'];

const AGENCIES = ['GHMC', 'SDRF', 'NDRF', 'EMRI 108', 'Police 112', 'TSSPDCL', 'Fire & Rescue'];

const HOTLINES = [
  { code: '112', label: 'Unified emergency', Icon: PhoneCall },
  { code: '108', label: 'Ambulance / EMRI', Icon: Ambulance },
  { code: '101', label: 'Fire & rescue', Icon: Flame },
];

const MARQUEE_WORDS = ['Ingest', 'Triage', 'Geocode', 'Verify', 'Dispatch', 'Resolve'];

/* ------------------------------------------------------------------ */
/* Motion primitives                                                   */
/* ------------------------------------------------------------------ */

/** Mouse-tracked 3D tilt, spring-smoothed. */
function useTilt(max = 9) {
  const rx = useMotionValue(0);
  const ry = useMotionValue(0);
  const rotateX = useSpring(rx, { stiffness: 170, damping: 18, mass: 0.5 });
  const rotateY = useSpring(ry, { stiffness: 170, damping: 18, mass: 0.5 });

  const onMouseMove = (event: React.MouseEvent<HTMLElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const px = (event.clientX - rect.left) / rect.width - 0.5;
    const py = (event.clientY - rect.top) / rect.height - 0.5;
    ry.set(px * max * 2);
    rx.set(-py * max * 2);
  };
  const onMouseLeave = () => {
    rx.set(0);
    ry.set(0);
  };

  return { rotateX, rotateY, onMouseMove, onMouseLeave };
}

/** A plate that physically leans toward the cursor. */
function TiltPlate({
  children,
  className,
  max = 9,
}: {
  children: React.ReactNode;
  className?: string;
  max?: number;
}) {
  const tilt = useTilt(max);
  return (
    <motion.div
      onMouseMove={tilt.onMouseMove}
      onMouseLeave={tilt.onMouseLeave}
      style={{ rotateX: tilt.rotateX, rotateY: tilt.rotateY, transformStyle: 'preserve-3d' }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/** Targeting-HUD corner brackets. */
function Corners({ tone = 'border-alert' }: { tone?: string }) {
  const base = 'pointer-events-none absolute h-3 w-3';
  return (
    <>
      <span className={`${base} left-0 top-0 border-l-2 border-t-2 ${tone}`} />
      <span className={`${base} right-0 top-0 border-r-2 border-t-2 ${tone}`} />
      <span className={`${base} bottom-0 left-0 border-b-2 border-l-2 ${tone}`} />
      <span className={`${base} bottom-0 right-0 border-b-2 border-r-2 ${tone}`} />
    </>
  );
}

/** Scrolling red/black caution tape. */
function HazardTape({ className = 'h-1.5' }: { className?: string }) {
  return <div aria-hidden className={`hazard-tape w-full ${className}`} />;
}

/** Small wide-tracked mono section label with a hazard slash. */
function SectionLabel({ index, children }: { index: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 font-mono text-[10px] uppercase tracking-[0.28em] text-mute dark:text-paper/45">
      <span className="text-alert">{index}</span>
      <span className="h-px w-8 bg-alert/50" />
      <span>{children}</span>
    </div>
  );
}

/** Count-up figure, triggered the first time it scrolls into view. */
function CountUp({ to, suffix = '', duration = 1300 }: { to: number; suffix?: string; duration?: number }) {
  const [value, setValue] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const started = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries[0].isIntersecting || started.current) return;
        started.current = true;
        const start = performance.now();
        const tick = (now: number) => {
          const progress = Math.min((now - start) / duration, 1);
          const eased = 1 - Math.pow(1 - progress, 3);
          setValue(Math.round(to * eased));
          if (progress < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
        observer.disconnect();
      },
      { threshold: 0.4 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [to, duration]);

  return (
    <span ref={ref} className="tabular-nums">
      {value.toLocaleString()}
      {suffix}
    </span>
  );
}

/** Rotating word for the hero headline. */
function RotatingWord({ words, className }: { words: string[]; className?: string }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setIndex((i) => (i + 1) % words.length), 2600);
    return () => clearInterval(id);
  }, [words.length]);

  return (
    <span className={`relative inline-block align-bottom ${className ?? ''}`}>
      <AnimatePresence mode="wait">
        <motion.span
          key={words[index]}
          initial={{ opacity: 0, y: '0.4em', rotateX: -55 }}
          animate={{ opacity: 1, y: 0, rotateX: 0 }}
          exit={{ opacity: 0, y: '-0.4em', rotateX: 55 }}
          transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
          className="inline-block"
        >
          {words[index]}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* Emergency chrome                                                    */
/* ------------------------------------------------------------------ */

/** Red alert strip that scrolls the current emergency bulletin. */
function AlertBar() {
  return (
    <div className="relative z-40 border-b border-void/40 bg-alert text-paper">
      <div className="flex items-stretch">
        <div className="flex shrink-0 items-center gap-2 bg-void px-4 font-mono text-[10px] font-bold uppercase tracking-[0.24em] sm:px-6">
          <Siren className="h-3.5 w-3.5 animate-pulse" />
          Alert
        </div>
        <div className="relative flex-1 overflow-hidden">
          <div className="animate-marquee flex whitespace-nowrap py-2 font-mono text-[10px] uppercase tracking-[0.16em]">
            {[0, 1].map((dup) => (
              <div key={dup} className="flex shrink-0">
                {ALERT_FEED.map((line) => (
                  <span key={`${dup}-${line}`} className="flex items-center gap-3 px-6">
                    <span className="h-1.5 w-1.5 rounded-full bg-caution" />
                    {line}
                  </span>
                ))}
              </div>
            ))}
          </div>
        </div>
        <div className="hidden shrink-0 items-center gap-2 border-l border-paper/25 px-4 font-mono text-[10px] uppercase tracking-[0.2em] sm:flex">
          <span className="h-1.5 w-1.5 animate-blink rounded-full bg-caution" />
          LEVEL-1
        </div>
      </div>
    </div>
  );
}

/** Live radar scope with pulsing zone blips. */
function RadarScope({ compact = false }: { compact?: boolean }) {
  return (
    <div className="relative aspect-square w-full">
      <div className="radar-rings absolute inset-0 rounded-full border border-ink/15 dark:border-paper/15" />
      <div className="radar-disc absolute inset-0 rounded-full" />

      {/* Range rings */}
      {[0.34, 0.62, 0.88].map((scale) => (
        <span
          key={scale}
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-dashed border-ink/15 dark:border-paper/15"
          style={{ width: `${scale * 100}%`, height: `${scale * 100}%` }}
        />
      ))}

      {/* Sweep crosshair */}
      <span className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-ink/10 dark:bg-paper/10" />
      <span className="absolute top-1/2 left-0 h-px w-full -translate-y-1/2 bg-ink/10 dark:bg-paper/10" />

      {ZONES.map((zone, i) => (
        <span
          key={zone.code}
          className="absolute -translate-x-1/2 -translate-y-1/2"
          style={{ left: `${zone.left}%`, top: `${zone.top}%` }}
        >
          <motion.span
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.3 + i * 0.12, duration: 0.4, ease: 'backOut' }}
            className="relative block"
          >
            <span
              className={`absolute -inset-2 rounded-full ${
                zone.severity === 'Critical' ? 'animate-blip-ring border border-alert' : ''
              }`}
            />
            <span
              className={`block h-2 w-2 rounded-full ${
                zone.severity === 'Critical'
                  ? 'bg-alert shadow-[0_0_12px_2px_rgba(224,40,26,0.7)]'
                  : zone.severity === 'High'
                    ? 'bg-hazard shadow-[0_0_10px_1px_rgba(240,147,43,0.65)]'
                    : 'bg-safe shadow-[0_0_8px_1px_rgba(18,161,80,0.55)]'
              }`}
            />
            {!compact && (
              <span className="absolute left-1/2 top-3 -translate-x-1/2 whitespace-nowrap font-mono text-[8px] uppercase tracking-[0.18em] text-mute dark:text-paper/45">
                {zone.code}
              </span>
            )}
          </motion.span>
        </span>
      ))}

      <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
        <Crosshair className="h-4 w-4 text-alert" />
      </span>
    </div>
  );
}

/** The hero's 3D command console — radar + live incident readout. */
function CommandConsole() {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) return;
    const id = setInterval(() => setIndex((i) => (i + 1) % INITIAL_INCIDENTS.length), 4200);
    return () => clearInterval(id);
  }, [paused]);

  const item = INITIAL_INCIDENTS[index % INITIAL_INCIDENTS.length];
  const tilt = useTilt(7);

  const rows: Array<[string, string]> = [
    ['ID', item.id],
    ['SEVERITY', SEV_LABEL[item.severity]],
    ['ZONE', item.location],
    ['SOURCE', item.source],
    ['STATUS', item.status.toUpperCase()],
  ];

  return (
    <div className="scene">
      <motion.div
        onMouseMove={tilt.onMouseMove}
        onMouseLeave={tilt.onMouseLeave}
        onMouseEnter={() => setPaused(true)}
        style={{ rotateX: tilt.rotateX, rotateY: tilt.rotateY, transformStyle: 'preserve-3d' }}
        className="relative rounded-2xl border border-ink/15 bg-paper/95 p-4 shadow-[0_40px_90px_-50px_rgba(17,17,16,0.75)] backdrop-blur dark:border-paper/12 dark:bg-steel/95 sm:p-5"
      >
        <Corners tone="border-alert" />

        {/* Console head */}
        <div className="flex items-center justify-between border-b border-ink/10 pb-3 dark:border-paper/10">
          <span className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.22em]">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-alert opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-alert" />
            </span>
            Command console
          </span>
          <span className="font-mono text-[10px] text-mute dark:text-paper/45">GHMC·EOC / v2.4</span>
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
          {/* Radar panel */}
          <div
            className="relative rounded-xl border border-ink/10 bg-paper-2/40 p-3 dark:border-paper/10 dark:bg-paper/[0.03]"
            style={{ transform: 'translateZ(30px)' }}
          >
            <div className="mb-2 flex items-center justify-between font-mono text-[9px] uppercase tracking-[0.2em] text-mute dark:text-paper/45">
              <span>Zone watch</span>
              <span className="text-alert">6 active</span>
            </div>
            <RadarScope compact />
          </div>

          {/* Telemetry */}
          <div className="flex flex-col" style={{ transform: 'translateZ(52px)' }}>
            <AnimatePresence mode="wait">
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.26 }}
              >
                <dl className="font-mono text-[11px]">
                  {rows.map(([key, value]) => (
                    <div
                      key={key}
                      className="flex items-baseline justify-between gap-3 border-b border-dashed border-ink/12 py-1.5 dark:border-paper/12"
                    >
                      <dt className="shrink-0 tracking-[0.16em] text-mute dark:text-paper/45">{key}</dt>
                      <dd className="truncate text-right font-medium text-ink dark:text-paper">{value}</dd>
                    </div>
                  ))}
                </dl>

                <p className="mt-3 line-clamp-3 font-mono text-[10px] leading-relaxed text-mute dark:text-paper/55">
                  &ldquo;{item.originalReport}&rdquo;
                </p>

                <div className="mt-3 flex items-center gap-3">
                  <span className="font-mono text-[9px] tracking-[0.18em] text-mute dark:text-paper/45">CONF</span>
                  <span className="relative h-1 flex-1 overflow-hidden rounded-full bg-ink/12 dark:bg-paper/15">
                    <motion.span
                      key={`bar-${item.id}`}
                      initial={{ width: 0 }}
                      animate={{ width: `${item.aiConfidence}%` }}
                      transition={{ duration: 0.8, ease: 'easeOut' }}
                      className="absolute inset-y-0 left-0 block rounded-full bg-alert"
                    />
                  </span>
                  <span className="font-mono text-[10px] tabular-nums">{item.aiConfidence}%</span>
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Alert gauge */}
            <div className="mt-auto pt-4">
              <div className="flex items-end justify-between">
                <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-mute dark:text-paper/45">
                  City alert level
                </span>
                <span className="font-hazard text-2xl font-extrabold leading-none text-alert">LEVEL 1</span>
              </div>
              <div className="mt-2 flex gap-1">
                {[0, 1, 2, 3, 4].map((seg) => (
                  <motion.span
                    key={seg}
                    initial={{ opacity: 0.25 }}
                    animate={{ opacity: seg < 4 ? 1 : 0.25 }}
                    transition={{ delay: 0.5 + seg * 0.08 }}
                    className={`h-1.5 flex-1 rounded-full ${seg < 4 ? 'bg-alert' : 'bg-ink/15 dark:bg-paper/20'}`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Console footer */}
        <div className="mt-4 flex items-center justify-between border-t border-ink/10 pt-3 font-mono text-[9px] uppercase tracking-[0.18em] text-mute dark:border-paper/10 dark:text-paper/45">
          <span>
            Stream {String(index + 1).padStart(2, '0')} / {String(INITIAL_INCIDENTS.length).padStart(2, '0')}
          </span>
          <span className="flex items-center gap-1.5">
            <Activity className="h-3 w-3 text-alert" />
            {paused ? 'Hold' : 'Streaming'}
          </span>
        </div>
      </motion.div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Landing page                                                        */
/* ------------------------------------------------------------------ */

interface LandingPageProps {
  onEnter: () => void;
  darkMode?: boolean;
  onToggleDark?: () => void;
}

export default function LandingPage({ onEnter, darkMode, onToggleDark }: LandingPageProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [feedFilter, setFeedFilter] = useState<'All' | Severity>('All');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll();
  const pageProgress = useSpring(scrollYProgress, { stiffness: 130, damping: 26, mass: 0.4 });
  const { scrollYProgress: heroProgress } = useScroll({
    target: heroRef,
    offset: ['start start', 'end start'],
  });
  const consoleY = useTransform(heroProgress, [0, 1], [0, 90]);
  const consoleTilt = useTransform(heroProgress, [0, 1], [0, 9]);

  const feedIncidents = useMemo(
    () =>
      INITIAL_INCIDENTS.filter((i) => (feedFilter === 'All' ? true : i.severity === feedFilter)).slice(0, 6),
    [feedFilter]
  );

  useEffect(() => {
    if (!menuOpen) return;
    const close = () => setMenuOpen(false);
    window.addEventListener('hashchange', close);
    return () => window.removeEventListener('hashchange', close);
  }, [menuOpen]);

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-paper font-sans text-ink transition-colors duration-300 dark:bg-void dark:text-paper">
      {/* Scroll progress tape */}
      <motion.div
        style={{ scaleX: pageProgress }}
        className="fixed left-0 top-0 z-[60] h-0.5 w-full origin-left bg-alert"
      />

      <AlertBar />

      {/* ---------------- Header ---------------- */}
      <header className="sticky top-0 z-50 border-b border-ink/12 bg-paper/85 backdrop-blur-md dark:border-paper/12 dark:bg-void/85">
        <div className="mx-auto flex h-14 max-w-[1600px] items-center justify-between px-5 sm:px-8">
          <a href="#top" className="flex items-center gap-2.5">
            <span className="relative grid h-7 w-7 place-items-center rounded-lg border border-alert/40 bg-alert/10 text-alert">
              <BeaconLogo className="h-4 w-4" />
              <span className="absolute -inset-1 rounded-lg border border-alert/30 animate-siren" />
            </span>
            <span className="font-hazard text-lg font-extrabold uppercase leading-none tracking-[0.02em]">
              Crisisbeacon
            </span>
            <span className="hidden font-mono text-[10px] text-mute sm:inline dark:text-paper/45">/ GHMC·EOC</span>
          </a>

          <nav className="hidden items-center gap-8 lg:flex">
            {NAV.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="group flex items-baseline gap-1.5 font-mono text-[10px] uppercase tracking-[0.2em] text-mute transition-colors hover:text-ink dark:text-paper/55 dark:hover:text-paper"
              >
                <span className="text-[8px] text-alert opacity-70">{item.index}</span>
                {item.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-3 sm:gap-4">
            <span className="hidden items-center gap-2 font-mono text-[10px] tracking-[0.14em] text-safe md:flex">
              <span className="h-1.5 w-1.5 rounded-full bg-safe animate-pulse" />
              SYS ONLINE
            </span>

            {onToggleDark && (
              <button
                onClick={onToggleDark}
                aria-label="Toggle dark mode"
                title={darkMode ? 'Switch to daylight ops' : 'Switch to night ops'}
                className="grid h-8 w-8 cursor-pointer place-items-center rounded-lg border border-ink/20 text-ink/70 transition-colors hover:bg-ink hover:text-paper dark:border-paper/20 dark:text-paper/70 dark:hover:bg-paper dark:hover:text-ink"
              >
                {darkMode ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
              </button>
            )}

            <button
              onClick={onEnter}
              className="group inline-flex cursor-pointer items-center gap-2 rounded-lg bg-alert px-4 py-2 font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-paper transition-colors hover:bg-alert-2"
            >
              Enter EOC
              <ArrowUpRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </button>

            <button
              onClick={() => setMenuOpen((v) => !v)}
              aria-label="Toggle menu"
              className="grid h-8 w-8 cursor-pointer place-items-center rounded-lg border border-ink/20 text-ink lg:hidden dark:border-paper/20 dark:text-paper"
            >
              {menuOpen ? <X className="h-3.5 w-3.5" /> : <Menu className="h-3.5 w-3.5" />}
            </button>
          </div>
        </div>

        <AnimatePresence>
          {menuOpen && (
            <motion.nav
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.24 }}
              className="overflow-hidden border-t border-ink/12 bg-paper/95 backdrop-blur lg:hidden dark:border-paper/12 dark:bg-void/95"
            >
              {NAV.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  onClick={() => setMenuOpen(false)}
                  className="flex items-baseline gap-3 border-b border-ink/10 px-5 py-3.5 font-mono text-[11px] uppercase tracking-[0.2em] dark:border-paper/10"
                >
                  <span className="text-[9px] text-alert">{item.index}</span>
                  {item.label}
                </a>
              ))}
            </motion.nav>
          )}
        </AnimatePresence>
      </header>

      {/* ---------------- Hero — Hyderabad video backdrop (petabencana-style) ---------------- */}
      <section id="top" ref={heroRef} className="relative flex min-h-[90vh] items-center overflow-hidden bg-void text-paper">
        {/* --- Hyderabad city video backdrop — image fallback + light washes so footage is unmistakable --- */}
        <div aria-hidden className="absolute inset-0 bg-void">
          {/* Hyderabad panorama shot from Golconda Fort — shows instantly and stays behind the video */}
          <img
            src="https://upload.wikimedia.org/wikipedia/commons/thumb/7/74/Panoramic_View_of_Hyderabaad.webm/1920px--Panoramic_View_of_Hyderabaad.webm.jpg"
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
            loading="eager"
          />
          <video
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
            poster="https://upload.wikimedia.org/wikipedia/commons/thumb/7/74/Panoramic_View_of_Hyderabaad.webm/1920px--Panoramic_View_of_Hyderabaad.webm.jpg"
            className="absolute inset-0 h-full w-full object-cover"
            onLoadedData={(e) => ((e.target as HTMLVideoElement).style.opacity = '1')}
            style={{ opacity: 1 }}
          >
            <source
              src="https://upload.wikimedia.org/wikipedia/commons/transcoded/7/74/Panoramic_View_of_Hyderabaad.webm/Panoramic_View_of_Hyderabaad.webm.1080p.vp9.webm"
              type="video/webm"
            />
            <source
              src="https://upload.wikimedia.org/wikipedia/commons/transcoded/7/74/Panoramic_View_of_Hyderabaad.webm/Panoramic_View_of_Hyderabaad.webm.480p.vp9.webm"
              type="video/webm"
            />
            <source src="https://videos.pexels.com/video-files/852421/852421-hd_1920_1080_30fps.mp4" type="video/mp4" />
          </video>
          {/* PetaBencana-style light wash — video stays clearly visible */}
          <div className="absolute inset-0 bg-void/30" />
          <div className="absolute inset-0 bg-gradient-to-t from-void/55 via-transparent to-void/20" />
          <div className="absolute inset-0 bg-gradient-to-r from-void/25 via-transparent to-transparent" />
        </div>

        {/* HUD + bloom layered over the video — subtle so footage stays visible */}
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="hud-grid absolute inset-0 opacity-10" />
          <div className="absolute -left-40 top-0 h-[520px] w-[520px] rounded-full bg-alert/18 blur-[110px] animate-siren" />
          <div className="absolute -right-32 top-32 h-[460px] w-[460px] rounded-full bg-hazard/10 blur-[130px]" />
        </div>

        <div className="relative z-10 mx-auto flex max-w-[1600px] w-full flex-col gap-10 px-5 py-10 sm:px-8 sm:py-16 lg:flex-row lg:items-end lg:justify-between lg:gap-12 lg:py-16">
          <motion.div
            initial={{ opacity: 0, y: 26 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="w-full max-w-3xl lg:shrink-0"
          >
            <span className="inline-flex items-center gap-2.5 rounded-full border border-alert/35 bg-alert/10 px-3.5 py-1.5 font-mono text-[10px] uppercase tracking-[0.22em] text-alert">
              <TriangleAlert className="h-3.5 w-3.5" />
              Active incident · Hyderabad urban flood
            </span>

            <h1 className="mt-7 font-hazard text-[clamp(3rem,8.4vw,6.6rem)] font-extrabold uppercase leading-[0.86] tracking-[-0.02em]">
              The city is flooding.
              <br />
              We are already{' '}
              <RotatingWord words={['moving.', 'dispatching.', 'on it.']} className="text-alert" />
            </h1>

            <p className="mt-8 max-w-xl text-[15px] leading-relaxed text-paper/75">
              CRISISBEACON fuses 112 calls, WhatsApp forwards, social posts and field reports into one live
              disaster command picture — triaged, geocoded against Hyderabad&apos;s six core zones and
              dispatched before the second call comes in.
            </p>

            <div className="mt-10 flex flex-wrap items-center gap-x-9 gap-y-5">
              <motion.button
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.97 }}
                onClick={onEnter}
                className="animate-alert-glow group relative inline-flex cursor-pointer items-center gap-3 rounded-xl bg-alert px-7 py-4 font-mono text-[11px] font-bold uppercase tracking-[0.2em] text-paper transition-colors hover:bg-alert-2"
              >
                <Siren className="h-4 w-4" />
                Enter the Situation Room
                <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
              </motion.button>
              <a
                href="#feed"
                className="group inline-flex items-center gap-2.5 border-b border-paper/30 pb-1 font-mono text-[11px] uppercase tracking-[0.2em] text-paper/70 transition-colors hover:border-alert hover:text-alert"
              >
                Watch the live feed
                <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </a>
            </div>

            {/* Emergency hotlines */}
            <div className="mt-11 grid gap-px overflow-hidden rounded-xl border border-paper/15 bg-paper/10 backdrop-blur-sm sm:grid-cols-3">
              {HOTLINES.map(({ code, label, Icon }) => (
                <a
                  key={code}
                  href={`tel:${code}`}
                  className="group flex items-center gap-3 bg-paper px-4 py-3.5 transition-colors hover:bg-alert hover:text-paper dark:bg-void dark:hover:bg-alert shadow-[0_2px_18px_rgba(0,0,0,0.22)]"
                >
                  <Icon className="h-4 w-4 shrink-0 text-alert transition-colors group-hover:text-paper" />
                  <span className="flex flex-col leading-tight">
                    <span className="font-hazard text-xl font-extrabold leading-none">{code}</span>
                    <span className="mt-0.5 font-mono text-[9px] uppercase tracking-[0.16em] text-mute transition-colors group-hover:text-paper/80 dark:text-paper/45">
                      {label}
                    </span>
                  </span>
                </a>
              ))}
            </div>

            <p className="mt-8 font-mono text-[10px] uppercase leading-relaxed tracking-[0.16em] text-paper/50">
              Gemini extraction · 6 core zones · No signup for the prototype
            </p>
          </motion.div>

          {/* Floating command console — docks to bottom-right so the Hyderabad video stays open (PetaBencana-style) */}
          <motion.div
            initial={{ opacity: 0, y: 34 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.12, ease: [0.22, 1, 0.36, 1] }}
            className="w-full max-w-[520px] self-stretch lg:w-[440px] lg:max-w-none lg:shrink-0 lg:self-end xl:w-[480px]"
          >
            <div className="scene h-full">
              <motion.div
                style={{ y: consoleY, rotateX: consoleTilt, transformStyle: 'preserve-3d' }}
                className="origin-bottom lg:origin-top"
              >
                <CommandConsole />
              </motion.div>
            </div>
          </motion.div>
        </div>

        {/* Attribution required by the CC BY-SA 4.0 licence on the Hyderabad panorama footage. */}
        <p className="absolute bottom-12 left-5 z-10 font-mono text-[9px] uppercase tracking-[0.18em] text-paper/40 sm:left-8">
          Hyderabad aerial &mdash; Wikimedia Commons, CC BY-SA 4.0
        </p>

        <HazardTape className="h-2" />
      </section>

      {/* ---------------- Stat band ---------------- */}
      <section className="relative z-10 mx-auto -mt-px max-w-[1600px] px-5 py-14 sm:px-8">
        <div className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-ink/12 bg-ink/12 dark:border-paper/12 dark:bg-paper/12 md:grid-cols-4">
          {STATS.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.4, delay: i * 0.06 }}
              whileHover={{ y: -4 }}
              className="plate-3d bg-paper p-5 sm:p-6 dark:bg-void"
            >
              <div className="font-hazard text-4xl font-extrabold leading-none tracking-[-0.01em] sm:text-5xl">
                <CountUp to={stat.value} suffix={stat.suffix} />
              </div>
              <div className="mt-3 text-[12px] font-semibold">{stat.label}</div>
              <div className="mt-1 flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-[0.2em] text-mute dark:text-paper/40">
                <Gauge className="h-3 w-3 text-alert" />
                {stat.note}
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ---------------- Display marquee ---------------- */}
      <div className="relative z-10 select-none overflow-hidden border-y border-ink/12 py-6 dark:border-paper/12 sm:py-8">
        <div className="animate-marquee-slow flex whitespace-nowrap">
          {[0, 1].map((dup) => (
            <div key={dup} className="flex shrink-0 items-center">
              {MARQUEE_WORDS.map((word) => (
                <span key={`${dup}-${word}`} className="flex items-center">
                  <span className="px-7 font-hazard text-[9vw] font-extrabold uppercase leading-none tracking-[-0.01em] text-transparent [-webkit-text-stroke:1px_#111110] sm:text-[5.5rem] dark:[-webkit-text-stroke:1px_#f1efea]">
                    {word}
                  </span>
                  <span className="text-2xl text-alert">✳</span>
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* ---------------- Platform ---------------- */}
      <section id="platform" className="relative z-10 scroll-mt-20 px-5 py-16 sm:px-8 sm:py-24">
        <div className="mx-auto max-w-[1600px]">
          <div className="grid gap-8 lg:grid-cols-12">
            <div className="lg:col-span-4">
              <SectionLabel index="01">The Platform</SectionLabel>
            </div>
            <div className="lg:col-span-8">
              <h2 className="font-hazard text-[clamp(2.2rem,4.6vw,3.8rem)] font-extrabold uppercase leading-[0.94] tracking-[-0.01em]">
                Built for the worst hour of the year.
              </h2>
              <p className="mt-5 max-w-2xl text-[14px] leading-relaxed text-mute dark:text-paper/55">
                Six systems, one command room. Everything a district control room needs between the first
                forwarded message and the last unit rolling back in.
              </p>
            </div>
          </div>

          <div className="scene mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {CAPABILITIES.map(({ index, title, kicker, body, Icon }, i) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 22 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ duration: 0.45, delay: i * 0.05 }}
              >
                <TiltPlate
                  max={7}
                  className="plate-3d group relative h-full rounded-2xl border border-ink/12 bg-paper p-6 transition-colors duration-300 hover:border-alert/40 dark:border-paper/12 dark:bg-steel"
                >
                  <Corners tone="border-alert/0 group-hover:border-alert" />
                  <div
                    className="flex items-start justify-between"
                    style={{ transform: 'translateZ(28px)' }}
                  >
                    <span className="grid h-11 w-11 place-items-center rounded-xl border border-alert/30 bg-alert/10 text-alert transition-colors group-hover:bg-alert group-hover:text-paper">
                      <Icon className="h-5 w-5" />
                    </span>
                    <span className="font-mono text-[10px] tracking-[0.2em] text-mute dark:text-paper/40">
                      {index}
                    </span>
                  </div>

                  <h3
                    className="mt-5 font-hazard text-2xl font-extrabold uppercase leading-none tracking-[0.01em]"
                    style={{ transform: 'translateZ(20px)' }}
                  >
                    {title}
                  </h3>
                  <div className="mt-2 font-mono text-[9px] uppercase tracking-[0.2em] text-alert">{kicker}</div>
                  <p className="mt-4 text-[13px] leading-relaxed text-mute dark:text-paper/55">{body}</p>
                </TiltPlate>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------------- Live feed ---------------- */}
      <section id="feed" className="relative z-10 scroll-mt-20 border-y border-ink/12 bg-paper-2/40 dark:border-paper/12 dark:bg-paper/[0.015]">
        <div className="mx-auto max-w-[1600px] px-5 py-16 sm:px-8 sm:py-24">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <SectionLabel index="02">Live Feed</SectionLabel>
              <h2 className="mt-6 font-hazard text-[clamp(2.2rem,4.6vw,3.8rem)] font-extrabold uppercase leading-[0.94] tracking-[-0.01em]">
                See the feed in action.
              </h2>
              <p className="mt-4 max-w-lg text-[14px] leading-relaxed text-mute dark:text-paper/55">
                Filter live incident data by severity and open any record to inspect the intelligence the
                engine extracted from the original report.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-px overflow-hidden rounded-lg border border-ink/15 dark:border-paper/15">
              {(['All', 'Critical', 'High', 'Low'] as const).map((filter) => (
                <button
                  key={filter}
                  onClick={() => setFeedFilter(filter)}
                  className={`cursor-pointer px-4 py-2.5 font-mono text-[10px] uppercase tracking-[0.16em] transition-colors ${
                    feedFilter === filter
                      ? 'bg-alert text-paper'
                      : 'text-mute hover:bg-alert/10 hover:text-alert dark:text-paper/50'
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <AnimatePresence mode="popLayout">
              {feedIncidents.map((incident: Incident) => {
                const isOpen = expandedId === incident.id;
                return (
                  <motion.div
                    layout
                    key={incident.id}
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.24 }}
                  >
                    <button
                      onClick={() => setExpandedId(isOpen ? null : incident.id)}
                      className="plate-3d group flex h-full w-full cursor-pointer flex-col rounded-2xl border border-ink/12 bg-paper p-5 text-left transition-transform duration-500 hover:-translate-y-1 hover:border-alert/40 dark:border-paper/12 dark:bg-steel"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <span
                          className={`rounded-full border px-2.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.18em] ${SEV_STYLE[incident.severity]}`}
                        >
                          {SEV_LABEL[incident.severity]}
                        </span>
                        <span className="font-mono text-[10px] text-mute dark:text-paper/40">{incident.id}</span>
                      </div>

                      <h3 className="mt-4 font-hazard text-2xl font-extrabold uppercase leading-none tracking-[0.01em]">
                        {incident.location}
                      </h3>
                      <div className="mt-2 font-mono text-[10px] uppercase tracking-[0.16em] text-mute dark:text-paper/45">
                        {incident.disasterType} · {incident.timeAgo}
                      </div>

                      <AnimatePresence initial={false}>
                        {isOpen && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.24 }}
                            className="overflow-hidden"
                          >
                            <p className="mt-5 border-t border-ink/12 pt-4 text-[13px] leading-relaxed text-mute dark:border-paper/12 dark:text-paper/60">
                              &ldquo;{incident.originalReport}&rdquo;
                            </p>
                            <div className="mt-4 flex flex-wrap gap-x-5 gap-y-1.5 font-mono text-[10px] uppercase tracking-[0.14em]">
                              <span>STATUS · {incident.status}</span>
                              {incident.entitiesExtracted.peopleTrapped ? (
                                <span className="text-alert">
                                  TRAPPED · {incident.entitiesExtracted.peopleTrapped}
                                </span>
                              ) : null}
                              {incident.entitiesExtracted.waterLevel ? (
                                <span className="text-hazard">
                                  WATER · {incident.entitiesExtracted.waterLevel}
                                </span>
                              ) : null}
                            </div>
                            <div className="mt-4 flex items-center gap-3">
                              <span className="font-mono text-[10px] tracking-[0.18em] text-mute dark:text-paper/45">
                                CONF
                              </span>
                              <span className="relative h-1 flex-1 overflow-hidden rounded-full bg-ink/12 dark:bg-paper/15">
                                <span
                                  className="absolute inset-y-0 left-0 block rounded-full bg-alert"
                                  style={{ width: `${incident.aiConfidence}%` }}
                                />
                              </span>
                              <span className="font-mono text-[10px] tabular-nums">{incident.aiConfidence}%</span>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      <div className="mt-auto flex items-center justify-between pt-5 font-mono text-[10px] uppercase tracking-[0.16em] text-mute dark:text-paper/40">
                        <span>{incident.source}</span>
                        <span className="inline-flex items-center gap-1 transition-colors group-hover:text-alert">
                          {isOpen ? 'Close' : 'Inspect'}
                          <ChevronRight
                            className={`h-3 w-3 transition-transform ${isOpen ? 'rotate-90' : ''}`}
                          />
                        </span>
                      </div>
                    </button>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>

          {/* Channel strip */}
          <div className="mt-12 flex flex-wrap items-center gap-x-3 gap-y-2 border-t border-ink/12 pt-8 dark:border-paper/12">
            <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-mute dark:text-paper/40">
              Ingesting from
            </span>
            {CHANNELS.map((channel) => (
              <span
                key={channel}
                className="rounded-full border border-ink/15 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.14em] text-mute dark:border-paper/15 dark:text-paper/50"
              >
                {channel}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ---------------- Protocol ---------------- */}
      <section id="protocol" className="relative z-10 scroll-mt-20 px-5 py-16 sm:px-8 sm:py-24">
        <div className="mx-auto max-w-[1600px]">
          <div className="grid gap-8 lg:grid-cols-12">
            <div className="lg:col-span-4">
              <SectionLabel index="03">Response Protocol</SectionLabel>
            </div>
            <div className="lg:col-span-8">
              <h2 className="font-hazard text-[clamp(2.2rem,4.6vw,3.8rem)] font-extrabold uppercase leading-[0.94] tracking-[-0.01em]">
                Signal to rescue in three moves.
              </h2>
            </div>
          </div>

          <div className="scene mt-14 grid gap-5 md:grid-cols-3">
            {PHASES.map(({ step, title, body, Icon }, i) => (
              <motion.div
                key={step}
                initial={{ opacity: 0, y: 22 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ duration: 0.45, delay: i * 0.08 }}
              >
                <TiltPlate
                  max={6}
                  className="plate-3d relative h-full overflow-hidden rounded-2xl border border-ink/12 bg-paper p-6 transition-colors duration-300 hover:border-alert/40 dark:border-paper/12 dark:bg-steel sm:p-8"
                >
                  <span className="absolute right-0 top-0 h-16 w-16 rounded-bl-[3rem] bg-alert/10" />
                  <div className="flex items-baseline justify-between">
                    <span className="font-hazard text-[4rem] font-extrabold leading-none tracking-[-0.02em] text-ink/10 dark:text-paper/12">
                      {step}
                    </span>
                    <Icon className="h-5 w-5 text-alert" />
                  </div>
                  <h3 className="mt-6 font-hazard text-2xl font-extrabold uppercase leading-none tracking-[0.01em]">
                    {title}
                  </h3>
                  <p className="mt-3 text-[13px] leading-relaxed text-mute dark:text-paper/55">{body}</p>
                  <div className="mt-6 flex items-center gap-2">
                    {PHASES.map((_, dot) => (
                      <span
                        key={dot}
                        className={`h-1 rounded-full transition-all ${
                          dot <= i ? 'w-6 bg-alert' : 'w-3 bg-ink/15 dark:bg-paper/20'
                        }`}
                      />
                    ))}
                  </div>
                </TiltPlate>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------------- Coverage ---------------- */}
      <section
        id="coverage"
        className="relative z-10 scroll-mt-20 overflow-hidden border-y border-ink/12 bg-void text-paper dark:border-paper/12"
      >
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="hud-grid absolute inset-0 opacity-40" />
          <div className="absolute -right-24 top-1/3 h-[420px] w-[420px] rounded-full bg-alert/20 blur-[130px] animate-siren" />
        </div>

        <div className="relative mx-auto grid max-w-[1600px] items-center gap-14 px-5 py-16 sm:px-8 sm:py-24 lg:grid-cols-12">
          <div className="lg:col-span-6">
            <div className="flex items-center gap-3 font-mono text-[10px] uppercase tracking-[0.28em] text-paper/45">
              <span className="text-alert">04</span>
              <span className="h-px w-8 bg-alert/50" />
              Coverage
            </div>

            <h2 className="mt-6 font-hazard text-[clamp(2.2rem,4.6vw,3.8rem)] font-extrabold uppercase leading-[0.94] tracking-[-0.01em]">
              Six zones under continuous watch.
            </h2>
            <p className="mt-5 max-w-lg text-[14px] leading-relaxed text-paper/60">
              Every report is geocoded to a core zone and scored against live risk signals — water level,
              call density, road access and response capacity.
            </p>

            <div className="mt-10 grid gap-px overflow-hidden rounded-2xl border border-paper/12 bg-paper/12 sm:grid-cols-2">
              {ZONES.map((zone) => (
                <div key={zone.code} className="group flex items-center justify-between bg-void px-5 py-4 transition-colors hover:bg-alert">
                  <div>
                    <div className="font-hazard text-lg font-extrabold uppercase leading-none tracking-[0.02em]">
                      {zone.name}
                    </div>
                    <div className="mt-1 font-mono text-[9px] uppercase tracking-[0.2em] text-paper/45 transition-colors group-hover:text-paper/80">
                      {zone.zone} · {zone.code}
                    </div>
                  </div>
                  <span
                    className={`rounded-full border px-2.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.16em] transition-colors group-hover:border-paper/50 group-hover:text-paper ${
                      zone.severity === 'Critical'
                        ? 'border-alert/50 bg-alert/15 text-alert'
                        : zone.severity === 'High'
                          ? 'border-hazard/50 bg-hazard/15 text-hazard'
                          : 'border-safe/50 bg-safe/15 text-safe'
                    }`}
                  >
                    {SEV_LABEL[zone.severity]}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-6">
            <div className="scene mx-auto max-w-[560px]">
              <TiltPlate
                max={8}
                className="plate-3d relative rounded-3xl border border-paper/12 bg-steel/70 p-6 backdrop-blur sm:p-8"
              >
                <Corners tone="border-alert" />
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.22em]">
                    <Radar className="h-3.5 w-3.5 text-alert" />
                    Zone watch
                  </span>
                  <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-paper/45">
                    Live sweep
                  </span>
                </div>
                <div className="mt-6">
                  <RadarScope />
                </div>
                <div className="mt-6 grid grid-cols-3 gap-px overflow-hidden rounded-xl border border-paper/12 bg-paper/12 font-mono text-[9px] uppercase tracking-[0.16em]">
                  {[
                    ['Critical', ZONES.filter((z) => z.severity === 'Critical').length],
                    ['High', ZONES.filter((z) => z.severity === 'High').length],
                    ['Monitor', ZONES.filter((z) => z.severity === 'Low').length],
                  ].map(([label, count]) => (
                    <div key={label as string} className="bg-steel px-3 py-3 text-center">
                      <div className="font-hazard text-2xl font-extrabold leading-none tracking-[0.01em] text-paper">
                        {count as number}
                      </div>
                      <div className="mt-1 text-paper/45">{label as string}</div>
                    </div>
                  ))}
                </div>
              </TiltPlate>
            </div>
          </div>
        </div>

        <HazardTape className="h-2" />
      </section>

      {/* ---------------- Agencies ---------------- */}
      <section className="relative z-10 mx-auto max-w-[1600px] px-5 py-16 sm:px-8 sm:py-20">
        <SectionLabel index="05">Built for city emergency networks</SectionLabel>
        <p className="mt-5 max-w-xl text-[13px] leading-relaxed text-mute dark:text-paper/55">
          One operational picture, shared across every responding agency — no re-broadcasting, no version
          drift, no waiting for the whiteboard.
        </p>
        <div className="mt-10 flex flex-wrap items-center gap-x-3 gap-y-3 border-t border-ink/12 pt-8 dark:border-paper/12">
          {AGENCIES.map((agency) => (
            <span
              key={agency}
              className="rounded-lg border border-ink/12 px-4 py-2 font-hazard text-lg font-extrabold uppercase leading-none tracking-[0.03em] text-mute transition-colors hover:border-alert hover:text-alert dark:border-paper/12 dark:text-paper/45 dark:hover:border-alert dark:hover:text-alert"
            >
              {agency}
            </span>
          ))}
        </div>
      </section>

      {/* ---------------- CTA ---------------- */}
      <section className="relative z-10 overflow-hidden border-y border-ink/12 bg-alert text-paper dark:border-paper/12">
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="hud-grid absolute inset-0 opacity-30" />
        </div>
        <div className="relative mx-auto max-w-[1600px] px-5 py-20 text-center sm:px-8 sm:py-28">
          <p className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.3em] text-paper/80">
            <Droplets className="h-3.5 w-3.5" />
            Every minute matters
          </p>
          <h2 className="mt-7 font-hazard text-[clamp(2.6rem,7vw,5.4rem)] font-extrabold uppercase leading-[0.88] tracking-[-0.01em]">
            Command the response.
          </h2>
          <p className="mx-auto mt-6 max-w-lg text-[14px] leading-relaxed text-paper/80">
            Step into the Situation Room and work the live Hyderabad feed — triage a report, watch it land
            on the map, and move a unit.
          </p>
          <motion.button
            whileHover={{ y: -3 }}
            whileTap={{ scale: 0.97 }}
            onClick={onEnter}
            className="group mt-10 inline-flex cursor-pointer items-center gap-3 rounded-xl border-2 border-paper/40 bg-void px-8 py-4 font-mono text-[11px] font-bold uppercase tracking-[0.2em] text-paper transition-colors hover:border-paper"
          >
            <Siren className="h-4 w-4" />
            Open the Situation Room
            <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </motion.button>
        </div>
        <HazardTape className="h-2" />
      </section>

      {/* ---------------- Footer ---------------- */}
      <footer className="relative z-10 bg-paper dark:bg-void">
        <div className="mx-auto max-w-[1600px] px-5 py-12 sm:px-8">
          <div className="grid gap-10 lg:grid-cols-12">
            <div className="lg:col-span-5">
              <div className="flex items-center gap-2.5">
                <span className="grid h-8 w-8 place-items-center rounded-lg border border-alert/35 bg-alert/10 text-alert">
                  <BeaconLogo className="h-4 w-4" />
                </span>
                <span className="font-hazard text-lg font-extrabold uppercase leading-none tracking-[0.02em]">
                  Crisisbeacon
                </span>
              </div>
              <p className="mt-4 max-w-xs font-mono text-[10px] uppercase leading-relaxed tracking-[0.16em] text-mute dark:text-paper/40">
                Disaster command &amp; emergency response intelligence · SIH prototype
              </p>
              <div className="mt-5 flex gap-2">
                <span className="h-1.5 w-10 rounded-full bg-alert" />
                <span className="h-1.5 w-6 rounded-full bg-hazard" />
                <span className="h-1.5 w-4 rounded-full bg-safe" />
              </div>
            </div>

            <div className="lg:col-span-3">
              <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-mute dark:text-paper/40">
                Index
              </div>
              <div className="mt-4 space-y-2.5">
                {NAV.map((item) => (
                  <a
                    key={item.href}
                    href={item.href}
                    className="block font-mono text-[11px] uppercase tracking-[0.16em] transition-colors hover:text-alert"
                  >
                    {item.label}
                  </a>
                ))}
              </div>
            </div>

            <div className="lg:col-span-4">
              <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-mute dark:text-paper/40">
                Emergency lines
              </div>
              <div className="mt-4 space-y-2.5 font-mono text-[11px] uppercase tracking-[0.16em]">
                <a href="tel:112" className="flex items-center gap-2 transition-colors hover:text-alert">
                  <PhoneCall className="h-3 w-3 text-alert" /> Emergency 112
                </a>
                <a href="tel:108" className="flex items-center gap-2 transition-colors hover:text-alert">
                  <Ambulance className="h-3 w-3 text-alert" /> Ambulance 108
                </a>
                <a href="tel:101" className="flex items-center gap-2 transition-colors hover:text-alert">
                  <Flame className="h-3 w-3 text-alert" /> Fire 101
                </a>
                <div className="text-mute dark:text-paper/45">GHMC · SDRF coordination cell</div>
                <div className="text-mute dark:text-paper/45">Hyderabad, Telangana</div>
              </div>
            </div>
          </div>

          <div className="mt-12 flex flex-col gap-3 border-t border-ink/12 pt-6 font-mono text-[10px] uppercase tracking-[0.16em] text-mute sm:flex-row sm:items-center sm:justify-between dark:border-paper/12 dark:text-paper/40">
            <span>© {new Date().getFullYear()} CRISISBEACON</span>
            <span className="hidden items-center gap-2 md:flex">
              <ShieldAlert className="h-3 w-3 text-alert" />
              Prototype · not for live operational use
            </span>
            <span>Built for those who run toward it</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
