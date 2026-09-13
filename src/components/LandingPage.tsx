import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowRight, ArrowUpRight, Menu, Moon, PhoneCall, Sun, X } from 'lucide-react';
import { INITIAL_INCIDENTS } from '../data/mockData';
import { BeaconLogo } from './BeaconLogo';
import type { Incident, Severity } from '../types';

/* ------------------------------------------------------------------ */
/* Content                                                             */
/* ------------------------------------------------------------------ */

const NAV = [
  { href: '#platform', label: 'Platform', index: '01' },
  { href: '#feed', label: 'Live Feed', index: '02' },
  { href: '#method', label: 'Method', index: '03' },
  { href: '#agencies', label: 'Agencies', index: '04' },
];

const SEV_LABEL: Record<Severity, string> = {
  Critical: 'CRITICAL',
  High: 'ELEVATED',
  Low: 'MONITOR',
};

const CAPABILITIES = [
  {
    index: '01',
    title: 'Reports, Translated!',
    kicker: 'Augmented Intake',
    body: 'Raw social posts, WhatsApp forwards and 112 call transcripts arrive in broken prose. The triage engine returns structured incidents — location, severity, trapped people, hazards.',
  },
  {
    index: '02',
    title: 'Signals, Placed!',
    kicker: 'Tactical GIS Map',
    body: 'Every verified report is geocoded onto Hyderabad’s six core zones, with severity markers, pulses and one-click inspection for field units.',
  },
  {
    index: '03',
    title: 'Channels, Unified!',
    kicker: 'Multi-Source Ingestion',
    body: 'Emergency Line 112, GHMC control room, traffic police feeds, citizen WhatsApp and field volunteers land on one canvas instead of five dashboards.',
  },
  {
    index: '04',
    title: 'Truth, Weighed!',
    kicker: 'Verification Workflow',
    body: 'Pending, Verified, Actioned. Operators confirm duplicates, merge corroborating reports and hold everything to a visible confidence score.',
  },
  {
    index: '05',
    title: 'Response, Orchestrated!',
    kicker: 'Dispatch & Units',
    body: 'Assign SDRF, NDRF, fire and utility crews without leaving the room. Every status change is written back and broadcast to every open screen.',
  },
];

const METHOD = [
  {
    step: '01',
    title: 'Ingest',
    body: 'Crowdsourced reports flow in from every channel — social, WhatsApp, 112 calls and field volunteers.',
  },
  {
    step: '02',
    title: 'Triage',
    body: 'The engine extracts location, severity, people trapped and hazards, then geocodes the report onto the city map.',
  },
  {
    step: '03',
    title: 'Dispatch',
    body: 'Operators verify, assign rescue units and track every action live from the Situation Room.',
  },
];

const STATS = [
  { value: 30, suffix: '', label: 'Incidents tracked', note: 'CURATED SET' },
  { value: 93, suffix: '%', label: 'Triage accuracy', note: 'EXTRACTION' },
  { value: 6, suffix: '', label: 'Core zones', note: 'HYDERABAD' },
  { value: 4, suffix: 'm', label: 'Median dispatch', note: 'VERIFY → UNIT' },
];

const ZONES = [
  { code: 'TOL', name: 'Tolichowki' },
  { code: 'MDP', name: 'Mehdipatnam' },
  { code: 'CHA', name: 'Charminar' },
  { code: 'GAC', name: 'Gachibowli' },
  { code: 'BAN', name: 'Banjara Hills' },
  { code: 'MOO', name: 'Moosarambagh' },
];

const AGENCIES = ['GHMC', 'SDRF', 'NDRF', 'EMRI 108', 'Police 112', 'TSSPDCL', 'Fire & Rescue'];

const MARQUEE_WORDS = ['Triaged', 'Geocoded', 'Verified', 'Dispatched', 'Escalated', 'Resolved'];

/* ------------------------------------------------------------------ */
/* Primitives                                                          */
/* ------------------------------------------------------------------ */

/** Live cursor coordinate readout — written straight to the DOM node. */
function CursorReadout() {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const onMove = (event: MouseEvent) => {
      const node = ref.current;
      if (!node) return;
      const x = String(Math.round(event.clientX)).padStart(4, '0');
      const y = String(Math.round(event.clientY)).padStart(4, '0');
      node.textContent = `X ${x} / Y ${y}`;
    };
    window.addEventListener('mousemove', onMove);
    return () => window.removeEventListener('mousemove', onMove);
  }, []);

  return (
    <span ref={ref} className="tabular-nums">
      X 0000 / Y 0000
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
    <span className={`inline-block align-bottom ${className ?? ''}`}>
      <AnimatePresence mode="wait">
        <motion.span
          key={words[index]}
          initial={{ opacity: 0, y: '0.35em' }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: '-0.35em' }}
          transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
          className="inline-block"
        >
          {words[index]}
        </motion.span>
      </AnimatePresence>
    </span>
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

/** Small wide-tracked mono section label. */
function SectionLabel({ index, children }: { index: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 font-mono text-[10px] uppercase tracking-[0.28em] text-mute dark:text-paper/45">
      <span>{index}</span>
      <span className="h-px w-8 bg-ink/25 dark:bg-paper/25" />
      <span>{children}</span>
    </div>
  );
}

/** The live ingestion readout in the hero — flat, monospaced, blueprint-like. */
function LiveReadout() {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) return;
    const id = setInterval(() => setIndex((i) => (i + 1) % INITIAL_INCIDENTS.length), 4200);
    return () => clearInterval(id);
  }, [paused]);

  const item = INITIAL_INCIDENTS[index % INITIAL_INCIDENTS.length];
  const rows: Array<[string, string]> = [
    ['ID', item.id],
    ['SEVERITY', SEV_LABEL[item.severity]],
    ['ZONE', item.location],
    ['SOURCE', item.source],
  ];

  return (
    <div
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      className="rounded-xl border border-ink/15 bg-paper-2/60 dark:border-paper/15 dark:bg-paper/[0.03]"
    >
      <div className="flex items-center justify-between border-b border-ink/12 px-4 py-3 dark:border-paper/12">
        <span className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.22em]">
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-signal opacity-70" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-signal" />
          </span>
          Live ingestion
        </span>
        <span className="font-mono text-[10px] text-mute dark:text-paper/45">GHMC·EOC / v2.4</span>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={item.id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.28 }}
          className="px-4 py-4"
        >
          <dl className="font-mono text-[11px]">
            {rows.map(([key, value]) => (
              <div
                key={key}
                className="flex items-baseline justify-between gap-4 border-b border-dashed border-ink/12 py-2 dark:border-paper/12"
              >
                <dt className="shrink-0 tracking-[0.18em] text-mute dark:text-paper/45">{key}</dt>
                <dd className="truncate text-right">{value}</dd>
              </div>
            ))}
          </dl>

          <p className="mt-4 line-clamp-3 font-mono text-[11px] leading-relaxed text-mute dark:text-paper/55">
            &ldquo;{item.originalReport}&rdquo;
          </p>

          <div className="mt-4 flex items-center gap-3">
            <span className="font-mono text-[10px] tracking-[0.18em] text-mute dark:text-paper/45">CONF</span>
            <span className="relative h-px flex-1 bg-ink/15 dark:bg-paper/20">
              <motion.span
                key={`bar-${item.id}`}
                initial={{ width: 0 }}
                animate={{ width: `${item.aiConfidence}%` }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
                className="absolute -inset-y-px left-0 block bg-ink dark:bg-paper"
              />
            </span>
            <span className="font-mono text-[10px] tabular-nums">{item.aiConfidence}%</span>
          </div>
        </motion.div>
      </AnimatePresence>

      <div className="flex items-center justify-between border-t border-ink/12 px-4 py-3 font-mono text-[10px] text-mute dark:border-paper/12 dark:text-paper/45">
        <span>
          Stream {String(index + 1).padStart(2, '0')} / {String(INITIAL_INCIDENTS.length).padStart(2, '0')}
        </span>
        <span>{item.timeAgo}</span>
      </div>
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
    <div className="min-h-screen w-full overflow-x-hidden bg-paper font-sans text-ink transition-colors duration-300 dark:bg-ink-2 dark:text-paper">
      {/* Blueprint column guides */}
      <div aria-hidden className="pointer-events-none fixed inset-0 z-0 hidden justify-center px-8 lg:flex">
        <div className="grid h-full w-full max-w-[1600px] grid-cols-12">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="h-full border-l border-ink/[0.06] dark:border-paper/[0.07]" />
          ))}
        </div>
      </div>

      {/* ---------------- Header ---------------- */}
      <header className="fixed inset-x-0 top-0 z-50 border-b border-ink/12 bg-paper/85 backdrop-blur-md dark:border-paper/12 dark:bg-ink-2/85">
        <div className="mx-auto flex h-14 max-w-[1600px] items-center justify-between px-5 sm:px-8">
          <a href="#top" className="flex items-center gap-2.5">
            <span className="grid h-6 w-6 place-items-center rounded-lg border border-ink/30 dark:border-paper/30">
              <BeaconLogo className="h-3.5 w-3.5" />
            </span>
            <span className="font-display text-[13px] font-extrabold uppercase tracking-[-0.01em]">Crisisbeacon</span>
            <span className="hidden font-mono text-[10px] text-mute sm:inline dark:text-paper/45">/ GHMC·EOC</span>
          </a>

          <nav className="hidden items-center gap-8 lg:flex">
            {NAV.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="group flex items-baseline gap-1.5 font-mono text-[10px] uppercase tracking-[0.2em] text-mute transition-colors hover:text-ink dark:text-paper/55 dark:hover:text-paper"
              >
                <span className="text-[8px] opacity-50">{item.index}</span>
                {item.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-3 sm:gap-4">
            <span className="hidden font-mono text-[10px] tracking-[0.12em] text-mute md:inline dark:text-paper/45">
              <CursorReadout />
            </span>

            {onToggleDark && (
              <button
                onClick={onToggleDark}
                aria-label="Toggle dark mode"
                title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
                className="grid h-7 w-7 cursor-pointer place-items-center rounded-lg border border-ink/20 text-ink/70 transition-colors hover:bg-ink hover:text-paper dark:border-paper/20 dark:text-paper/70 dark:hover:bg-paper dark:hover:text-ink"
              >
                {darkMode ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
              </button>
            )}

            <button
              onClick={onEnter}
              className="group inline-flex cursor-pointer items-center gap-2 rounded-lg bg-ink px-4 py-2 font-mono text-[10px] uppercase tracking-[0.18em] text-paper transition-colors hover:bg-signal dark:bg-paper dark:text-ink dark:hover:bg-signal dark:hover:text-paper"
            >
              Enter
              <ArrowUpRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </button>

            <button
              onClick={() => setMenuOpen((v) => !v)}
              aria-label="Toggle menu"
              className="grid h-7 w-7 cursor-pointer place-items-center rounded-lg border border-ink/20 text-ink lg:hidden dark:border-paper/20 dark:text-paper"
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
              className="overflow-hidden rounded-b-lg border-t border-ink/12 bg-paper/95 backdrop-blur lg:hidden dark:border-paper/12 dark:bg-ink-2/95"
            >
              {NAV.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  onClick={() => setMenuOpen(false)}
                  className="flex items-baseline gap-3 border-b border-ink/10 px-5 py-3.5 font-mono text-[11px] uppercase tracking-[0.2em] dark:border-paper/10"
                >
                  <span className="text-[9px] text-mute dark:text-paper/45">{item.index}</span>
                  {item.label}
                </a>
              ))}
            </motion.nav>
          )}
        </AnimatePresence>
      </header>

      {/* ---------------- Live ticker ---------------- */}
      <div className="relative z-10 border-b border-ink/12 bg-paper-2/50 pt-14 dark:border-paper/12 dark:bg-paper/[0.02]">
        <div className="flex items-stretch">
          <div className="flex shrink-0 items-center gap-2 border-r border-ink/12 px-5 font-mono text-[10px] uppercase tracking-[0.22em] sm:px-8 dark:border-paper/12">
            <span className="h-1.5 w-1.5 rounded-full bg-signal" />
            Live
          </div>
          <div className="relative flex-1 overflow-hidden">
            <div className="animate-marquee flex whitespace-nowrap py-2.5 font-mono text-[10px] uppercase tracking-[0.16em] text-mute dark:text-paper/50">
              {[0, 1].map((dup) => (
                <div key={dup} className="flex shrink-0">
                  {INITIAL_INCIDENTS.slice(0, 12).map((incident) => (
                    <span key={`${dup}-${incident.id}`} className="flex items-center gap-2 px-5">
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${
                          incident.severity === 'Critical' ? 'bg-signal' : 'bg-ink/40 dark:bg-paper/40'
                        }`}
                      />
                      {incident.location} · {incident.disasterType}
                    </span>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ---------------- Hero ---------------- */}
      <section id="top" className="relative z-10 mx-auto max-w-[1600px] scroll-mt-20 px-5 pt-14 sm:px-8 sm:pt-20">
        <div className="grid items-start gap-12 lg:grid-cols-12 lg:gap-16">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="lg:col-span-7"
          >
            <SectionLabel index="—">Hyderabad Emergency Operations Center</SectionLabel>

            <h1 className="mt-7 font-display text-[clamp(2.4rem,7.2vw,5.6rem)] font-extrabold leading-[0.94] tracking-[-0.045em]">
              Disaster response,
              <br />
              at the speed of{' '}
              <RotatingWord words={['thought.', 'instinct.', 'need.']} className="text-signal" />
            </h1>

            <p className="mt-8 max-w-xl text-[15px] leading-relaxed text-mute dark:text-paper/60">
              The crisis console that thinks with you, not for you. CRISISBEACON turns social posts,
              WhatsApp messages and 112 calls into one live command picture — triaged, geocoded and
              dispatched before the second call comes in.
            </p>

            <div className="mt-10 flex flex-wrap items-center gap-x-9 gap-y-5">
              <button
                onClick={onEnter}
                className="group inline-flex cursor-pointer items-center gap-3 rounded-lg bg-ink px-6 py-4 font-mono text-[11px] uppercase tracking-[0.2em] text-paper transition-colors hover:bg-signal dark:bg-paper dark:text-ink dark:hover:bg-signal dark:hover:text-paper"
              >
                Enter the Situation Room
                <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
              </button>
              <a
                href="#feed"
                className="group inline-flex items-center gap-2.5 border-b border-ink/25 pb-1 font-mono text-[11px] uppercase tracking-[0.2em] text-mute transition-colors hover:border-ink hover:text-ink dark:border-paper/25 dark:text-paper/55 dark:hover:border-paper dark:hover:text-paper"
              >
                Watch the live feed
                <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </a>
            </div>

            <p className="mt-10 font-mono text-[10px] uppercase leading-relaxed tracking-[0.16em] text-mute dark:text-paper/40">
              Gemini extraction · 6 core zones · No signup for the prototype
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.12, ease: [0.22, 1, 0.36, 1] }}
            className="lg:col-span-5"
          >
            <LiveReadout />
          </motion.div>
        </div>

        {/* Spec sheet band */}
        <div className="mt-16 grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-ink/12 bg-ink/12 dark:border-paper/12 dark:bg-paper/12 md:grid-cols-4">
          {STATS.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.4, delay: i * 0.06 }}
              className="bg-paper p-5 sm:p-6 dark:bg-ink-2 first:rounded-tl-xl last:rounded-tr-xl md:[&:nth-child(4)]:rounded-tr-xl md:[&:nth-child(5)]:rounded-bl-xl md:[&:nth-child(8)]:rounded-br-xl"
            >
              <div className="font-display text-3xl font-extrabold tracking-[-0.03em] sm:text-4xl">
                <CountUp to={stat.value} suffix={stat.suffix} />
              </div>
              <div className="mt-2 text-[12px] font-medium">{stat.label}</div>
              <div className="mt-1 font-mono text-[9px] uppercase tracking-[0.2em] text-mute dark:text-paper/40">
                {stat.note}
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ---------------- Display marquee ---------------- */}
      <div className="relative z-10 mt-16 select-none overflow-hidden border-y border-ink/12 py-6 sm:mt-20 sm:py-8 dark:border-paper/12">
        <div className="animate-marquee-slow flex whitespace-nowrap">
          {[0, 1].map((dup) => (
            <div key={dup} className="flex shrink-0 items-center">
              {MARQUEE_WORDS.map((word) => (
                <span key={`${dup}-${word}`} className="flex items-center">
                  <span className="px-7 font-display text-[9vw] font-extrabold uppercase leading-none tracking-[-0.04em] text-transparent [-webkit-text-stroke:1px_#111110] sm:text-[5.5rem] dark:[-webkit-text-stroke:1px_#f1efea]">
                    {word}
                  </span>
                  <span className="text-2xl text-signal">✳</span>
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* ---------------- Platform ---------------- */}
      <section id="platform" className="relative z-10 mx-auto max-w-[1600px] scroll-mt-20 px-5 py-16 sm:px-8 sm:py-24">
        <div className="grid gap-8 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <SectionLabel index="01">The Platform</SectionLabel>
          </div>
          <div className="lg:col-span-8">
            <h2 className="font-display text-[clamp(1.9rem,4vw,3.2rem)] font-extrabold leading-[1.02] tracking-[-0.04em]">
              One canvas for the whole city. Every intent, translated into action.
            </h2>
          </div>
        </div>

        <div className="mt-14">
          {CAPABILITIES.map((capability, i) => (
            <motion.div
              key={capability.index}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.45, delay: i * 0.04 }}
              className="group -mx-3 grid grid-cols-12 items-start gap-x-6 gap-y-3 border-t border-ink/12 px-3 py-8 transition-colors last:border-b hover:bg-ink dark:border-paper/12 dark:hover:bg-paper sm:py-10"
            >
              <span className="col-span-12 font-mono text-[11px] tracking-[0.2em] text-mute transition-colors group-hover:text-paper/60 sm:col-span-1 dark:text-paper/45 dark:group-hover:text-ink/60">
                {capability.index}
              </span>
              <h3 className="col-span-12 font-display text-2xl font-bold tracking-[-0.03em] transition-colors group-hover:text-paper sm:col-span-4 sm:text-[28px] dark:group-hover:text-ink">
                {capability.title}
              </h3>
              <div className="col-span-12 font-mono text-[10px] uppercase tracking-[0.2em] text-mute transition-colors group-hover:text-paper/60 sm:col-span-3 dark:text-paper/45 dark:group-hover:text-ink/60">
                {capability.kicker}
              </div>
              <p className="col-span-12 text-[13px] leading-relaxed text-mute transition-colors group-hover:text-paper/80 sm:col-span-4 dark:text-paper/55 dark:group-hover:text-ink/75">
                {capability.body}
              </p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ---------------- Open letter ---------------- */}
      <section className="relative z-10 border-y border-ink/12 dark:border-paper/12">
        <div className="mx-auto grid max-w-[1600px] gap-10 px-5 py-16 sm:px-8 sm:py-24 lg:grid-cols-12">
          <div className="lg:col-span-3">
            <SectionLabel index="02">Open Letter</SectionLabel>
            <p className="mt-5 max-w-[14rem] font-mono text-[10px] uppercase leading-relaxed tracking-[0.18em] text-mute dark:text-paper/40">
              to those who run toward it
            </p>
          </div>
          <div className="lg:col-span-9">
            <p className="font-editorial text-[clamp(1.8rem,3.4vw,2.9rem)] leading-[1.18]">
              To those who run toward it,
            </p>
            <div className="mt-7 max-w-2xl space-y-4 text-[14px] leading-relaxed text-mute dark:text-paper/60">
              <p>
                Coordination was never meant to happen through forty tabs, three WhatsApp groups and a
                whiteboard that only one room can see. It happens through listening, corroborating,
                deciding — and moving.
              </p>
              <p>
                But for too long the tools have asked you to translate, re-type, re-explain and re-broadcast
                while the water keeps rising. We built CRISISBEACON for the way this work actually happens:
                a place where a forwarded message becomes a marker on a map, and where the paperwork fades
                into the background.
              </p>
              <p>
                So you can see more of the city, trust more of what you see, and stay closer to the people
                waiting on the other side of the radio.
              </p>
            </div>
            <p className="mt-7 font-editorial text-xl">This is for you.</p>
          </div>
        </div>
      </section>

      {/* ---------------- Live feed ---------------- */}
      <section id="feed" className="relative z-10 mx-auto max-w-[1600px] scroll-mt-20 px-5 py-16 sm:px-8 sm:py-24">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <SectionLabel index="03">Interactive</SectionLabel>
            <h2 className="mt-6 font-display text-[clamp(1.9rem,4vw,3.2rem)] font-extrabold leading-[1.02] tracking-[-0.04em]">
              See the feed in action.
            </h2>
            <p className="mt-4 max-w-lg text-[14px] leading-relaxed text-mute dark:text-paper/55">
              Filter live incident data by severity and open any record to inspect the intelligence the
              engine extracted from the original report.
            </p>
          </div>

          <div className="flex items-center gap-px overflow-hidden rounded-lg border border-ink/15 dark:border-paper/15">
            {(['All', 'Critical', 'High', 'Low'] as const).map((filter) => (
              <button
                key={filter}
                onClick={() => setFeedFilter(filter)}
                className={`cursor-pointer px-4 py-2.5 font-mono text-[10px] uppercase tracking-[0.16em] transition-colors ${
                  feedFilter === filter
                    ? 'bg-ink text-paper dark:bg-paper dark:text-ink'
                    : 'text-mute hover:bg-ink/5 hover:text-ink dark:text-paper/50 dark:hover:bg-paper/5 dark:hover:text-paper'
                }`}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-12 grid gap-px overflow-hidden rounded-xl border border-ink/12 bg-ink/12 dark:border-paper/12 dark:bg-paper/12 sm:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence mode="popLayout">
            {feedIncidents.map((incident: Incident) => {
              const isOpen = expandedId === incident.id;
              return (
                <motion.div
                  layout
                  key={incident.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.22 }}
                  className="bg-paper dark:bg-ink-2 first:rounded-tl-xl last:rounded-tr-xl md:first:rounded-tl-xl md:last:rounded-tr-xl"
                >
                  <button
                    onClick={() => setExpandedId(isOpen ? null : incident.id)}
                    className="group flex h-full w-full cursor-pointer flex-col p-5 text-left transition-colors hover:bg-paper-2/60 dark:hover:bg-paper/[0.04]"
                  >
                    <div className="flex items-center justify-between gap-3 font-mono text-[10px] uppercase tracking-[0.18em]">
                      <span className={incident.severity === 'Critical' ? 'text-signal' : 'text-mute dark:text-paper/50'}>
                        {SEV_LABEL[incident.severity]}
                      </span>
                      <span className="text-mute dark:text-paper/40">{incident.id}</span>
                    </div>

                    <h3 className="mt-4 font-display text-lg font-bold tracking-[-0.02em]">{incident.location}</h3>
                    <div className="mt-1 font-mono text-[10px] uppercase tracking-[0.16em] text-mute dark:text-paper/45">
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
                              <span className="text-signal">
                                TRAPPED · {incident.entitiesExtracted.peopleTrapped}
                              </span>
                            ) : null}
                            {incident.entitiesExtracted.waterLevel ? (
                              <span>WATER · {incident.entitiesExtracted.waterLevel}</span>
                            ) : null}
                          </div>
                          <div className="mt-4 flex items-center gap-3">
                            <span className="font-mono text-[10px] tracking-[0.18em] text-mute dark:text-paper/45">
                              CONF
                            </span>
                            <span className="relative h-px flex-1 bg-ink/15 dark:bg-paper/20">
                              <span
                                className="absolute -inset-y-px left-0 block bg-ink dark:bg-paper"
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
                      <span className="transition-colors group-hover:text-ink dark:group-hover:text-paper">
                        {isOpen ? '− Collapse' : '+ Inspect'}
                      </span>
                    </div>
                  </button>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </section>

      {/* ---------------- Method ---------------- */}
      <section id="method" className="relative z-10 scroll-mt-20 border-y border-ink/12 dark:border-paper/12">
        <div className="mx-auto max-w-[1600px] px-5 py-16 sm:px-8 sm:py-24">
          <div className="grid gap-8 lg:grid-cols-12">
            <div className="lg:col-span-4">
              <SectionLabel index="04">Method</SectionLabel>
            </div>
            <div className="lg:col-span-8">
              <h2 className="font-display text-[clamp(1.9rem,4vw,3.2rem)] font-extrabold leading-[1.02] tracking-[-0.04em]">
                From signal to response in three moves.
              </h2>
            </div>
          </div>

          <div className="mt-14 grid gap-px overflow-hidden rounded-xl border border-ink/12 bg-ink/12 dark:border-paper/12 dark:bg-paper/12 md:grid-cols-3">
            {METHOD.map((item) => (
              <div key={item.step} className="bg-paper p-6 sm:p-8 dark:bg-ink-2 first:rounded-tl-xl last:rounded-tr-xl md:first:rounded-tl-xl md:last:rounded-tr-xl">
                <div className="flex items-baseline justify-between">
                  <span className="font-display text-[3.5rem] font-extrabold leading-none tracking-[-0.05em] text-ink/12 dark:text-paper/15">
                    {item.step}
                  </span>
                  <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-mute dark:text-paper/40">
                    Step {item.step}
                  </span>
                </div>
                <h3 className="mt-6 font-display text-xl font-bold tracking-[-0.02em]">{item.title}</h3>
                <p className="mt-3 text-[13px] leading-relaxed text-mute dark:text-paper/55">{item.body}</p>
              </div>
            ))}
          </div>

          {/* Coverage */}
          <div className="mt-16 grid gap-8 lg:grid-cols-12">
            <div className="lg:col-span-4">
              <SectionLabel index="05">Coverage</SectionLabel>
              <p className="mt-5 max-w-[15rem] text-[13px] leading-relaxed text-mute dark:text-paper/50">
                Six core zones under continuous watch, each with its own risk posture.
              </p>
            </div>
            <div className="lg:col-span-8">
              <div className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-ink/12 bg-ink/12 sm:grid-cols-3 dark:border-paper/12 dark:bg-paper/12">
                {ZONES.map((zone) => (
                  <div key={zone.code} className="group bg-paper p-5 transition-colors hover:bg-ink dark:bg-ink-2 dark:hover:bg-paper first:rounded-tl-xl last:rounded-tr-xl md:first:rounded-tl-xl md:last:rounded-tr-xl">
                    <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-mute transition-colors group-hover:text-paper/60 dark:text-paper/40 dark:group-hover:text-ink/60">
                      {zone.code}
                    </div>
                    <div className="mt-2 font-display text-[15px] font-semibold tracking-[-0.01em] transition-colors group-hover:text-paper dark:group-hover:text-ink">
                      {zone.name}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ---------------- Agencies ---------------- */}
      <section id="agencies" className="relative z-10 mx-auto max-w-[1600px] scroll-mt-20 px-5 py-16 sm:px-8 sm:py-20">
        <SectionLabel index="06">Built for city emergency networks</SectionLabel>
        <p className="mt-5 max-w-xl text-[13px] leading-relaxed text-mute dark:text-paper/55">
          One operational picture, shared across every responding agency — no re-broadcasting, no version
          drift.
        </p>
        <div className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-4 border-t border-ink/12 pt-8 dark:border-paper/12">
          {AGENCIES.map((agency) => (
            <span
              key={agency}
              className="font-display text-[15px] font-semibold uppercase tracking-[-0.01em] text-mute transition-colors hover:text-ink dark:text-paper/45 dark:hover:text-paper"
            >
              {agency}
            </span>
          ))}
        </div>
      </section>

      {/* ---------------- CTA ---------------- */}
      <section className="relative z-10 border-y border-ink/12 bg-ink text-paper dark:border-paper/12 dark:bg-paper dark:text-ink">
        <div className="mx-auto max-w-[1600px] px-5 py-20 text-center sm:px-8 sm:py-28">
          <p className="font-mono text-[10px] uppercase tracking-[0.3em] opacity-60">Every minute matters</p>
          <h2 className="mt-7 font-display text-[clamp(2.2rem,6vw,4.8rem)] font-extrabold leading-[0.96] tracking-[-0.045em]">
            Command the response.
          </h2>
          <p className="mx-auto mt-6 max-w-lg text-[14px] leading-relaxed opacity-70">
            Step into the Situation Room and work the live Hyderabad feed — triage a report, watch it land
            on the map, and move a unit.
          </p>
          <button
            onClick={onEnter}
            className="group mt-10 inline-flex cursor-pointer items-center gap-3 rounded-lg border border-paper/35 px-7 py-4 font-mono text-[11px] uppercase tracking-[0.2em] transition-colors hover:bg-paper hover:text-ink dark:border-ink/35 dark:hover:bg-ink dark:hover:text-paper"
          >
            Open the Situation Room
            <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </button>
        </div>
      </section>

      {/* ---------------- Footer ---------------- */}
      <footer className="relative z-10">
        <div className="mx-auto max-w-[1600px] px-5 py-12 sm:px-8">
          <div className="grid gap-10 lg:grid-cols-12">
            <div className="lg:col-span-5">
              <div className="flex items-center gap-2.5">
                <span className="grid h-7 w-7 place-items-center rounded-lg border border-ink/25 dark:border-paper/25">
                  <BeaconLogo className="h-4 w-4" />
                </span>
                <span className="font-display text-sm font-extrabold uppercase tracking-[-0.01em]">
                  Crisisbeacon
                </span>
              </div>
              <p className="mt-4 max-w-xs font-mono text-[10px] uppercase leading-relaxed tracking-[0.16em] text-mute dark:text-paper/40">
                Real-time disaster intelligence platform · SIH prototype
              </p>
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
                    className="block font-mono text-[11px] uppercase tracking-[0.16em] transition-colors hover:text-signal"
                  >
                    {item.label}
                  </a>
                ))}
              </div>
            </div>

            <div className="lg:col-span-4">
              <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-mute dark:text-paper/40">
                Contact
              </div>
              <div className="mt-4 space-y-2.5 font-mono text-[11px] uppercase tracking-[0.16em]">
                <a href="tel:112" className="flex items-center gap-2 transition-colors hover:text-signal">
                  <PhoneCall className="h-3 w-3" /> Emergency 112
                </a>
                <div className="text-mute dark:text-paper/45">GHMC · SDRF coordination cell</div>
                <div className="text-mute dark:text-paper/45">Hyderabad, Telangana</div>
              </div>
            </div>
          </div>

          <div className="mt-12 flex flex-col gap-3 border-t border-ink/12 pt-6 font-mono text-[10px] uppercase tracking-[0.16em] text-mute sm:flex-row sm:items-center sm:justify-between dark:border-paper/12 dark:text-paper/40">
            <span>© {new Date().getFullYear()} CRISISBEACON</span>
            <span className="hidden md:inline">
              <CursorReadout />
            </span>
            <span>Built with care</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
