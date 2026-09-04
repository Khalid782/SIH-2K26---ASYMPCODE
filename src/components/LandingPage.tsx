import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowRight,
  Activity,
  Moon,
  Sun,
  MapPin,
  Radio,
  ShieldCheck,
  Sparkles,
  Users,
  PhoneCall,
  Clock,
  Zap,
  Waves,
  HeartPulse,
  Satellite,
  ChevronDown,
  Menu,
  X,
  CheckCircle2,
  Building2,
} from 'lucide-react';
import { INITIAL_INCIDENTS } from '../data/mockData';
import { BeaconLogo } from './BeaconLogo';
import type { Incident, Severity } from '../types';

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

const SEVERITY_STYLES: Record<Severity, { chip: string; dot: string; bar: string }> = {
  Critical: {
    chip: 'bg-rose-100 text-rose-700 border-rose-200',
    dot: 'bg-rose-500',
    bar: 'bg-rose-500',
  },
  High: {
    chip: 'bg-orange-100 text-orange-700 border-orange-200',
    dot: 'bg-orange-500',
    bar: 'bg-orange-400',
  },
  Low: {
    chip: 'bg-sky-100 text-sky-700 border-sky-200',
    dot: 'bg-sky-500',
    bar: 'bg-sky-400',
  },
};

const STATUS_STYLES: Record<string, string> = {
  Pending: 'bg-amber-100 text-amber-700 border-amber-200',
  Verified: 'bg-sky-100 text-sky-700 border-sky-200',
  Actioned: 'bg-emerald-100 text-emerald-700 border-emerald-200',
};

const ZONES = [
  { name: 'Tolichowki', short: 'TOL', x: 28, y: 42, level: 96 },
  { name: 'Mehdipatnam', short: 'MDP', x: 42, y: 58, level: 92 },
  { name: 'Charminar', short: 'CHA', x: 55, y: 72, level: 88 },
  { name: 'Gachibowli', short: 'GAC', x: 18, y: 30, level: 64 },
  { name: 'Banjara Hills', short: 'BAN', x: 47, y: 38, level: 71 },
  { name: 'Moosarambagh', short: 'MOO', x: 66, y: 62, level: 97 },
];

/* Animated count-up number */
function CountUp({ to, suffix = '', duration = 1400 }: { to: number; suffix?: string; duration?: number }) {
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
    <span ref={ref}>
      {value.toLocaleString()}
      {suffix}
    </span>
  );
}

/* Rotating "live ops" card in the hero */
function RotatingIncidentCard() {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) return;
    const id = setInterval(() => setIndex((i) => (i + 1) % 4), 3800);
    return () => clearInterval(id);
  }, [paused]);

  const item = INITIAL_INCIDENTS[index % INITIAL_INCIDENTS.length];
  const sev = SEVERITY_STYLES[item.severity];

  return (
    <div
      className="relative h-[280px] sm:h-[300px] rounded-2xl bg-white/90 dark:bg-sky-900/90 backdrop-blur border border-sky-100 dark:border-sky-800 shadow-[0_24px_60px_-24px_rgba(2,132,199,0.35)] overflow-hidden"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-sky-100">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-sky-500"></span>
          </span>
          <span className="text-[11px] font-bold uppercase tracking-widest text-sky-800">Live Ingestion Feed</span>
        </div>
        <span className="text-[10px] font-mono text-sky-400">GHMC-EOC v2.4</span>
      </div>

      {/* Rotating incident */}
      <AnimatePresence mode="wait">
        <motion.div
          key={item.id}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -16 }}
          transition={{ duration: 0.35 }}
          className="px-4 py-3.5"
        >
          <div className="flex items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-2 min-w-0">
              <span className={`text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-md border ${sev.chip}`}>
                {item.severity}
              </span>
              <span className="text-[10px] font-mono text-sky-500">{item.id}</span>
            </div>
            <span className="flex items-center gap-1 text-[10px] text-sky-500 whitespace-nowrap">
              <Clock className="w-3 h-3" /> {item.timeAgo}
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-sky-900 font-semibold text-sm mb-1">
            <MapPin className="w-3.5 h-3.5 text-sky-500 shrink-0" />
            <span className="truncate">{item.location}</span>
          </div>
          {item.landmark && <p className="text-[11px] text-sky-600/80 mb-2 truncate">{item.landmark}</p>}

          <p className="text-xs text-sky-800/90 leading-relaxed line-clamp-3 mb-3">{item.originalReport}</p>

          {/* Confidence bar */}
          <div className="mb-3">
            <div className="flex justify-between text-[10px] text-sky-600 mb-1">
              <span className="font-medium">AI extraction confidence</span>
              <span className="font-mono font-bold">{item.aiConfidence}%</span>
            </div>
            <div className="h-1.5 rounded-full bg-sky-100 overflow-hidden">
              <motion.div
                key={`bar-${item.id}`}
                initial={{ width: 0 }}
                animate={{ width: `${item.aiConfidence}%` }}
                transition={{ duration: 0.9, ease: 'easeOut' }}
                className={`h-full rounded-full ${sev.bar}`}
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-[10px] text-sky-600">
              <Radio className="w-3 h-3" /> {item.source}
            </span>
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border ${STATUS_STYLES[item.status] ?? 'bg-sky-50 text-sky-600 border-sky-200'}`}>
              {item.status}
            </span>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Carousel dots */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
        {[0, 1, 2, 3].map((i) => (
          <button
            key={i}
            onClick={() => setIndex(i)}
            aria-label={`Show incident ${i + 1}`}
            className={`h-1.5 rounded-full transition-all cursor-pointer ${
              i === index % 4 ? 'w-6 bg-sky-500' : 'w-1.5 bg-sky-200 hover:bg-sky-300'
            }`}
          />
        ))}
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

  const stats = useMemo(
    () => [
      { label: 'Incidents tracked', value: 47, suffix: '' },
      { label: 'AI triage accuracy', value: 93, suffix: '%' },
      { label: 'Coverage zones', value: 6, suffix: '' },
      { label: 'Avg. dispatch time', value: 4, suffix: 'm' },
    ],
    []
  );

  const navLinks = [
    { href: '#platform', label: 'Platform' },
    { href: '#live-feed', label: 'Live Feed' },
    { href: '#how-it-works', label: 'How It Works' },
    { href: '#agencies', label: 'Agencies' },
  ];

  const features = [
    {
      icon: Sparkles,
      title: 'AI Disaster Triage',
      body: 'Gemini-powered extraction turns raw social posts, WhatsApp messages and 112 calls into structured incidents — severity, location, trapped people and hazards, in seconds.',
      accent: 'from-sky-400 to-sky-600',
    },
    {
      icon: MapPin,
      title: 'Tactical GIS Map',
      body: 'Every incident geocoded onto Hyderabad\u2019s 6 core zones with live markers, severity pulses and one-click inspection for field teams.',
      accent: 'from-sky-300 to-sky-500',
    },
    {
      icon: Radio,
      title: 'Multi-Channel Ingestion',
      body: 'Social media, citizen WhatsApp, Emergency Line 112, GHMC control room and traffic police feeds — unified into a single live command view.',
      accent: 'from-cyan-300 to-sky-500',
    },
    {
      icon: ShieldCheck,
      title: 'Verification Workflow',
      body: 'Pending \u2192 Verified \u2192 Actioned. Operators confirm, assign SDRF / NDRF units and track response without leaving the console.',
      accent: 'from-sky-400 to-indigo-400',
    },
  ];

  const steps = [
    {
      icon: Radio,
      step: '01',
      title: 'Ingest',
      body: 'Crowdsourced reports flow in from every channel — social, WhatsApp, 112 calls and field volunteers.',
    },
    {
      icon: Sparkles,
      step: '02',
      title: 'AI Triage',
      body: 'The engine extracts location, severity, trapped people and hazards, then geocodes each report onto the city map.',
    },
    {
      icon: Activity,
      step: '03',
      title: 'Dispatch',
      body: 'Operators verify, assign rescue units and track every action live from the Situation Room.',
    },
  ];

  return (
    <div className="min-h-screen w-full bg-[#f7fcfe] dark:bg-[#0c1a2d] text-sky-950 dark:text-sky-100 font-sans overflow-x-hidden transition-colors duration-300">
      {/* Soft powder-blue glow backdrop */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute -top-40 -left-40 w-[560px] h-[560px] rounded-full bg-sky-200/40 blur-[130px]" />
        <div className="absolute top-1/3 -right-48 w-[520px] h-[520px] rounded-full bg-cyan-100/50 blur-[130px]" />
        <div className="absolute bottom-0 left-1/3 w-[480px] h-[420px] rounded-full bg-sky-100/60 blur-[120px]" />
      </div>

      {/* ---------------- Header ---------------- */}
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-sky-950/80 backdrop-blur-xl border-b border-sky-100/80 dark:border-sky-800 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <a href="#top" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-sky-100 via-white to-sky-200 dark:from-sky-800 dark:via-sky-900 dark:to-sky-800 border border-sky-200 dark:border-sky-700 flex items-center justify-center shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_4px_12px_-4px_rgba(2,132,199,0.45)] group-hover:scale-105 transition-transform">
              <BeaconLogo className="w-4.5 h-4.5 text-sky-600" />
            </div>
            <div>
              <div className="text-[15px] font-bold tracking-tight leading-none text-sky-950">CRISISBEACON</div>
              <div className="text-[10px] text-sky-600/70 font-medium mt-0.5 tracking-wide">
                Real-Time Disaster Intelligence
              </div>
            </div>
          </a>

          <nav className="hidden md:flex items-center gap-7">
            {navLinks.map((l) => (
              <a
                key={l.href}
                href={l.href}
                className="text-[13px] font-medium text-sky-700/80 hover:text-sky-950 transition-colors relative group"
              >
                {l.label}
                <span className="absolute -bottom-1 left-0 h-0.5 w-0 bg-sky-500 rounded-full group-hover:w-full transition-all duration-300" />
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-2.5">
            {/* Dark-mode toggle */}
            {onToggleDark && (
              <button
                onClick={onToggleDark}
                title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
                aria-label="Toggle dark mode"
                className="flex items-center justify-center w-9 h-9 rounded-xl bg-sky-50/80 dark:bg-sky-800/70 border border-sky-200/70 dark:border-sky-700 text-sky-600 dark:text-sky-300 hover:bg-sky-100 dark:hover:bg-sky-700 transition cursor-pointer active:scale-90 shadow-sm"
              >
                {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>
            )}

            {/* Mobile dark-mode toggle */}
            {onToggleDark && (
              <button
                onClick={onToggleDark}
                title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium text-sky-700 dark:text-sky-300 hover:bg-sky-50 dark:hover:bg-sky-800 transition-colors"
              >
                {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                {darkMode ? 'Light Mode' : 'Dark Mode'}
              </button>
            )}

            <button
              onClick={onEnter}
              className="hidden sm:inline-flex items-center gap-2 whitespace-nowrap bg-gradient-to-b from-sky-500 to-sky-600 hover:from-sky-600 hover:to-sky-700 text-white text-[13px] font-semibold px-4.5 py-2 rounded-xl shadow-[0_8px_20px_-8px_rgba(2,132,199,0.7)] transition-all hover:shadow-[0_10px_26px_-8px_rgba(2,132,199,0.85)] hover:-translate-y-px active:scale-95 cursor-pointer"
            >
              Enter Situation Room
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => setMenuOpen((v) => !v)}
              className="md:hidden p-2 rounded-lg hover:bg-sky-50 text-sky-700 cursor-pointer"
              aria-label="Toggle menu"
            >
              {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        <AnimatePresence>
          {menuOpen && (
            <motion.nav
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="md:hidden overflow-hidden bg-white/95 backdrop-blur border-t border-sky-100"
            >
              <div className="px-4 py-3 space-y-1">
                {navLinks.map((l) => (
                  <a
                    key={l.href}
                    href={l.href}
                    onClick={() => setMenuOpen(false)}
                    className="block px-3 py-2.5 rounded-lg text-sm font-medium text-sky-800 hover:bg-sky-50 transition-colors"
                  >
                    {l.label}
                  </a>
                ))}
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    onEnter();
                  }}
                  className="w-full mt-2 flex items-center justify-center gap-2 whitespace-nowrap bg-gradient-to-b from-sky-500 to-sky-600 text-white text-sm font-semibold px-4 py-2.5 rounded-xl shadow-lg cursor-pointer"
                >
                  Enter Situation Room
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </motion.nav>
          )}
        </AnimatePresence>
      </header>

      {/* Top Live Ticker Strip */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="sticky top-16 z-40 mx-auto max-w-7xl -mb-2"
      >
        <div className="mx-4 sm:mx-6 rounded-xl bg-white/80 dark:bg-sky-900/80 backdrop-blur border border-sky-100 dark:border-sky-800 overflow-hidden shadow-[0_8px_24px_-14px_rgba(2,132,199,0.35)]">
          <div className="flex items-stretch">
            <div className="shrink-0 flex items-center gap-1.5 bg-sky-600 text-white text-[10px] font-bold uppercase tracking-widest px-3.5 py-2.5">
              <Radio className="w-3 h-3" /> Live
            </div>
            <div className="relative flex-1 overflow-hidden">
              <div className="animate-marquee flex whitespace-nowrap py-2.5 text-[11px] font-medium text-sky-800/90 dark:text-sky-300">
                {[0, 1].map((dup) => (
                  <div key={dup} className="flex shrink-0">
                    {INITIAL_INCIDENTS.slice(0, 12).map((i) => (
                      <span key={`${dup}-${i.id}`} className="flex items-center gap-2 px-5">
                        <span className={`w-1.5 h-1.5 rounded-full ${SEVERITY_STYLES[i.severity].dot}`} />
                        {i.location} &middot; {i.disasterType}
                      </span>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ---------------- Hero ---------------- */}
      <section id="top" className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 pt-8 pb-12 sm:pt-12 sm:pb-16">
        <div className="grid lg:grid-cols-2 gap-10 lg:gap-14 items-center">
          {/* Copy */}
          <motion.div
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          >
            <div className="inline-flex items-center gap-2 bg-white border border-sky-200/80 rounded-full px-3.5 py-1.5 shadow-[0_2px_10px_-4px_rgba(2,132,199,0.3)] mb-5">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
              </span>
              <span className="text-[11px] font-semibold tracking-wide text-sky-800">
                Hyderabad Emergency Operations Center &middot; SIH Prototype
              </span>
            </div>

            <h1 className="text-4xl sm:text-5xl xl:text-6xl font-extrabold tracking-tight leading-[1.05] text-sky-950">
              Disaster intelligence,
              <br />
              <span className="bg-gradient-to-r from-sky-600 via-sky-500 to-cyan-500 bg-clip-text text-transparent">
                when every second
              </span>
              <br />
              counts.
            </h1>

            <p className="mt-5 text-[15px] sm:text-base text-sky-700/80 leading-relaxed max-w-xl">
              CRISISBEACON turns social media posts, WhatsApp messages and 112 calls into a single
              live command picture — AI-triaged, geocoded and dispatched to rescue teams in real time.
            </p>

            <div className="mt-6 flex flex-col sm:flex-row gap-3.5">
              <button
                onClick={onEnter}
                className="inline-flex items-center justify-center gap-2 whitespace-nowrap bg-gradient-to-b from-sky-500 to-sky-600 hover:from-sky-600 hover:to-sky-700 text-white text-sm font-semibold px-6 py-3.5 rounded-xl shadow-[0_14px_30px_-10px_rgba(2,132,199,0.8)] transition-all hover:-translate-y-0.5 active:scale-95 cursor-pointer"
              >
                <Zap className="w-4.5 h-4.5" />
                Launch Situation Room
              </button>
              <a
                href="#live-feed"
                className="inline-flex items-center justify-center gap-2 whitespace-nowrap bg-white hover:bg-sky-50 text-sky-800 text-sm font-semibold px-6 py-3.5 rounded-xl border border-sky-200 shadow-[0_4px_14px_-6px_rgba(2,132,199,0.35)] transition-all hover:border-sky-300 active:scale-95"
              >
                Watch live feed
                <ChevronDown className="w-4 h-4" />
              </a>
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 text-[11px] font-medium text-sky-600/80">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Gemini AI triage engine
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> 6 core zones covered
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Free &amp; open prototype
              </span>
            </div>
          </motion.div>

          {/* Interactive ops preview */}
          <motion.div
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15, ease: 'easeOut' }}
            className="relative"
          >
            <div className="absolute -inset-4 rounded-[28px] bg-gradient-to-br from-sky-200/50 via-transparent to-cyan-100/50 blur-2xl" />
            <div className="relative space-y-4">
              <RotatingIncidentCard />

              {/* Zone pulse map */}
              <div className="rounded-2xl bg-white/90 backdrop-blur border border-sky-100 p-4 shadow-[0_18px_45px_-22px_rgba(2,132,199,0.4)]">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[11px] font-bold uppercase tracking-widest text-sky-800">
                    Zone Risk Monitor
                  </span>
                  <span className="text-[10px] font-mono text-sky-400">Hyderabad Metro</span>
                </div>
                <div className="relative h-36 rounded-xl bg-gradient-to-br from-sky-50 via-white to-cyan-50 dark:from-sky-900 dark:via-sky-950 dark:to-sky-900 border border-sky-100 dark:border-sky-800 overflow-hidden">
                  {/* faint grid lines */}
                  <div className="absolute inset-0 opacity-40" style={{
                    backgroundImage:
                      'linear-gradient(rgba(2,132,199,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(2,132,199,0.08) 1px, transparent 1px)',
                    backgroundSize: '28px 28px',
                  }} />

                  {/* Radar sweep cone */}
                  <div className="absolute inset-0 animate-radar-sweep origin-center">
                    <div
                      className="absolute top-1/2 left-1/2 h-[120%] w-[120%] -translate-x-1/2 -translate-y-1/2"
                      style={{
                        background: 'conic-gradient(from 0deg, transparent 0deg, transparent 330deg, rgba(14,165,233,0.18) 345deg, rgba(14,165,233,0.35) 360deg)',
                      }}
                    />
                  </div>

                  {/* Concentric rings */}
                  <div className="absolute top-1/2 left-1/2 w-24 h-24 rounded-full border border-sky-300/30 dark:border-sky-600/30 animate-ring-pulse" style={{ animationDelay: '0s' }} />
                  <div className="absolute top-1/2 left-1/2 w-24 h-24 rounded-full border border-sky-300/20 dark:border-sky-600/20 animate-ring-pulse" style={{ animationDelay: '1.3s' }} />
                  <div className="absolute top-1/2 left-1/2 w-24 h-24 rounded-full border border-sky-300/15 dark:border-sky-600/15 animate-ring-pulse" style={{ animationDelay: '2.6s' }} />

                  {/* Center beacon dot */}
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-sky-500 shadow-[0_0_8px_rgba(14,165,233,0.7)]" />

                  {ZONES.map((z) => {
                    const color = z.level > 85 ? '#f43f5e' : z.level > 70 ? '#fb923c' : '#0ea5e9';
                    const ringColor = z.level > 85 ? 'border-rose-400/50' : z.level > 70 ? 'border-orange-400/50' : 'border-sky-400/50';
                    const darkRing = z.level > 85 ? 'dark:border-rose-500/40' : z.level > 70 ? 'dark:border-orange-500/40' : 'dark:border-sky-500/40';
                    return (
                      <div key={z.name} className="absolute" style={{ left: `${z.x}%`, top: `${z.y}%` }}>
                        <div className="relative flex flex-col items-center group cursor-default">
                          {/* Expanding wave rings */}
                          <div className="absolute top-0 left-0 w-3 h-3">
                            <div className={`absolute inset-0 rounded-full border ${ringColor} ${darkRing} animate-wave-ring`} style={{ animationDelay: '0s' }} />
                            <div className={`absolute inset-0 rounded-full border ${ringColor} ${darkRing} animate-wave-ring`} style={{ animationDelay: '1s' }} />
                            <div className={`absolute inset-0 rounded-full border ${ringColor} ${darkRing} animate-wave-ring`} style={{ animationDelay: '2s' }} />
                          </div>
                          {/* Zone dot */}
                          <span className="relative flex h-3 w-3">
                            <span
                              className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-60"
                              style={{ backgroundColor: color }}
                            />
                            <span
                              className="relative inline-flex rounded-full h-3 w-3 border-2 border-white shadow"
                              style={{ backgroundColor: color }}
                            />
                          </span>
                          <span className="mt-1 text-[9px] font-bold uppercase tracking-wide text-sky-700 dark:text-sky-300 bg-white/80 dark:bg-sky-800/80 border border-sky-100 dark:border-sky-700 rounded px-1.5 py-0.5 opacity-90 group-hover:opacity-100 group-hover:scale-105 transition-transform">
                            {z.short}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="flex items-center justify-between mt-3 text-[10px] text-sky-600">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-rose-500" /> Critical
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-orange-400" /> Elevated
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-sky-500" /> Monitoring
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

      </section>

      {/* ---------------- Stats band ---------------- */}
      <section className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 pb-16 sm:pb-20">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
          {stats.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.45, delay: i * 0.08 }}
              className="bg-white/90 dark:bg-sky-900/90 backdrop-blur border border-sky-100 dark:border-sky-800 rounded-2xl px-5 py-5 shadow-[0_12px_30px_-18px_rgba(2,132,199,0.4)] hover:shadow-[0_18px_40px_-18px_rgba(2,132,199,0.5)] hover:-translate-y-0.5 transition-all"
            >
              <div className="text-3xl font-extrabold tracking-tight text-sky-950">
                <CountUp to={s.value} suffix={s.suffix} />
              </div>
              <div className="text-[11px] font-semibold uppercase tracking-wider text-sky-600/80 mt-1.5">
                {s.label}
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ---------------- Platform features ---------------- */}
      <section id="platform" className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 pb-20 sm:pb-24 scroll-mt-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-2xl mx-auto mb-12"
        >
          <div className="inline-flex items-center gap-2 bg-white border border-sky-200/80 rounded-full px-3.5 py-1.5 shadow-sm mb-4">
            <Satellite className="w-3.5 h-3.5 text-sky-500" />
            <span className="text-[11px] font-bold uppercase tracking-widest text-sky-700">The Platform</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-sky-950">
            One command center for the{' '}
            <span className="bg-gradient-to-r from-sky-600 to-cyan-500 bg-clip-text text-transparent">
              whole city
            </span>
          </h2>
          <p className="mt-4 text-sm sm:text-[15px] text-sky-700/75 leading-relaxed">
            Built for emergency operations teams who need to see everything, trust what matters,
            and act instantly.
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {features.map((f, i) => {
            const Icon = f.icon;
            return (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ duration: 0.45, delay: i * 0.08 }}
                className="group bg-white/90 dark:bg-sky-900/90 backdrop-blur border border-sky-100 dark:border-sky-800 rounded-2xl p-5.5 shadow-[0_12px_30px_-18px_rgba(2,132,199,0.4)] hover:shadow-[0_22px_48px_-20px_rgba(2,132,199,0.55)] hover:-translate-y-1 transition-all duration-300 cursor-default"
              >
                <div
                  className={`w-11 h-11 rounded-xl bg-gradient-to-br ${f.accent} flex items-center justify-center text-white shadow-[0_8px_18px_-8px_rgba(2,132,199,0.7)] group-hover:scale-110 transition-transform duration-300 mb-4`}
                >
                  <Icon className="w-5.5 h-5.5" />
                </div>
                <h3 className="text-[15px] font-bold text-sky-950 mb-2">{f.title}</h3>
                <p className="text-[13px] text-sky-700/75 leading-relaxed">{f.body}</p>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* ---------------- Live feed (interactive) ---------------- */}
      <section id="live-feed" className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 pb-20 sm:pb-24 scroll-mt-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.5 }}
          className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8"
        >
          <div>
            <div className="inline-flex items-center gap-2 bg-white border border-sky-200/80 rounded-full px-3.5 py-1.5 shadow-sm mb-4">
              <Activity className="w-3.5 h-3.5 text-sky-500" />
              <span className="text-[11px] font-bold uppercase tracking-widest text-sky-700">Interactive demo</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-sky-950">
              See the feed in action
            </h2>
            <p className="mt-3 text-sm text-sky-700/75 max-w-lg">
              Filter real incident data by severity and tap any card to inspect the extracted intelligence.
            </p>
          </div>

          {/* Severity filter tabs */}
          <div className="flex items-center gap-1.5 bg-white/90 border border-sky-100 rounded-xl p-1.5 shadow-sm w-fit">
            {(['All', 'Critical', 'High', 'Low'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFeedFilter(f)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  feedFilter === f
                    ? 'bg-gradient-to-b from-sky-500 to-sky-600 text-white shadow-[0_4px_12px_-4px_rgba(2,132,199,0.7)]'
                    : 'text-sky-700/80 hover:bg-sky-50 hover:text-sky-900'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence mode="popLayout">
            {feedIncidents.map((inc: Incident) => {
              const sev = SEVERITY_STYLES[inc.severity];
              const isOpen = expandedId === inc.id;
              return (
                <motion.div
                  layout
                  key={inc.id}
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  transition={{ duration: 0.25 }}
                >
                  <button
                    onClick={() => setExpandedId(isOpen ? null : inc.id)}
                    className={`w-full text-left bg-white/90 backdrop-blur border rounded-2xl shadow-[0_10px_26px_-18px_rgba(2,132,199,0.45)] transition-all cursor-pointer hover:-translate-y-0.5 hover:shadow-[0_18px_40px_-20px_rgba(2,132,199,0.55)] ${
                      isOpen ? 'border-sky-300 ring-2 ring-sky-100' : 'border-sky-100'
                    } p-4.5`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-2.5">
                      <span className={`text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-md border ${sev.chip}`}>
                        {inc.severity}
                      </span>
                      <span className="text-[10px] font-mono text-sky-500">{inc.id}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-sky-950 font-semibold text-sm mb-1">
                      <MapPin className="w-3.5 h-3.5 text-sky-500 shrink-0" />
                      <span className="truncate">{inc.location}</span>
                    </div>
                    <div className="text-[11px] text-sky-600/80 mb-2.5">{inc.disasterType} &middot; {inc.timeAgo}</div>

                    <AnimatePresence initial={false}>
                      {isOpen && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.25 }}
                          className="overflow-hidden"
                        >
                          <p className="text-xs text-sky-800/90 leading-relaxed mb-3 pt-1 border-t border-sky-100">
                            &ldquo;{inc.originalReport}&rdquo;
                          </p>
                          <div className="flex flex-wrap items-center gap-1.5 mb-2">
                            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border ${STATUS_STYLES[inc.status] ?? 'bg-sky-50 text-sky-600 border-sky-200'}`}>
                              {inc.status}
                            </span>
                            {inc.entitiesExtracted.peopleTrapped ? (
                              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md border bg-rose-50 text-rose-700 border-rose-200">
                                {inc.entitiesExtracted.peopleTrapped} trapped
                              </span>
                            ) : null}
                            {inc.entitiesExtracted.waterLevel ? (
                              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md border bg-cyan-50 text-cyan-700 border-cyan-200">
                                {inc.entitiesExtracted.waterLevel} water
                              </span>
                            ) : null}
                          </div>
                          <div className="flex items-center justify-between text-[10px] text-sky-600 mb-1">
                            <span>AI confidence</span>
                            <span className="font-mono font-bold">{inc.aiConfidence}%</span>
                          </div>
                          <div className="h-1.5 rounded-full bg-sky-100 overflow-hidden">
                            <div className={`h-full rounded-full ${sev.bar}`} style={{ width: `${inc.aiConfidence}%` }} />
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <div className={`flex items-center justify-between mt-1 ${isOpen ? 'opacity-0' : ''} ${isOpen ? '' : ''}`}>
                      <span className="flex items-center gap-1.5 text-[10px] text-sky-600">
                        <Radio className="w-3 h-3" /> {inc.source}
                      </span>
                      <span className="flex items-center gap-1 text-[10px] font-semibold text-sky-500">
                        {isOpen ? 'Collapse' : 'Inspect'}
                        <ChevronDown className={`w-3 h-3 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                      </span>
                    </div>
                  </button>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </section>

      {/* ---------------- How it works ---------------- */}
      <section id="how-it-works" className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 pb-20 sm:pb-24 scroll-mt-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-2xl mx-auto mb-12"
        >
          <div className="inline-flex items-center gap-2 bg-white border border-sky-200/80 rounded-full px-3.5 py-1.5 shadow-sm mb-4">
            <Zap className="w-3.5 h-3.5 text-sky-500" />
            <span className="text-[11px] font-bold uppercase tracking-widest text-sky-700">How it works</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-sky-950">
            From signal to response in{' '}
            <span className="bg-gradient-to-r from-sky-600 to-cyan-500 bg-clip-text text-transparent">
              three steps
            </span>
          </h2>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-4 relative">
          {/* connector line */}
          <div className="hidden md:block absolute top-[52px] left-[16%] right-[16%] h-px bg-gradient-to-r from-sky-200 via-sky-300 to-sky-200" />
          {steps.map((s, i) => {
            const Icon = s.icon;
            return (
              <motion.div
                key={s.step}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ duration: 0.45, delay: i * 0.12 }}
                className="relative bg-white/90 backdrop-blur border border-sky-100 rounded-2xl p-6 shadow-[0_12px_30px_-18px_rgba(2,132,199,0.4)] hover:shadow-[0_20px_44px_-20px_rgba(2,132,199,0.5)] hover:-translate-y-0.5 transition-all"
              >
                <div className="flex items-center justify-between mb-5">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-sky-100 via-white to-sky-200 border border-sky-200 flex items-center justify-center text-sky-600 shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_6px_14px_-6px_rgba(2,132,199,0.45)]">
                    <Icon className="w-5.5 h-5.5" />
                  </div>
                  <span className="text-3xl font-extrabold text-sky-100 tracking-tight">{s.step}</span>
                </div>
                <h3 className="text-[15px] font-bold text-sky-950 mb-2">{s.title}</h3>
                <p className="text-[13px] text-sky-700/75 leading-relaxed">{s.body}</p>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* ---------------- Agencies ---------------- */}
      <section id="agencies" className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 pb-20 sm:pb-24 scroll-mt-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.5 }}
          className="bg-white/80 backdrop-blur border border-sky-100 rounded-2xl px-6 sm:px-10 py-8 shadow-[0_14px_36px_-20px_rgba(2,132,199,0.4)]"
        >
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <Building2 className="w-5 h-5 text-sky-500" />
              <div>
                <div className="text-sm font-bold text-sky-950">Built for city emergency networks</div>
                <div className="text-[11px] text-sky-600/75">Unified dispatch across every responding agency</div>
              </div>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-2.5">
              {['GHMC', 'SDRF', 'NDRF', 'EMRI 108', 'Police 112', 'TSSPDCL', 'Fire & Rescue'].map((a) => (
                <span
                  key={a}
                  className="text-[11px] font-bold tracking-wide text-sky-800 bg-sky-50/80 border border-sky-200/70 rounded-full px-3.5 py-1.5 hover:bg-sky-100 hover:border-sky-300 transition-colors cursor-default"
                >
                  {a}
                </span>
              ))}
            </div>
          </div>
        </motion.div>
      </section>

      {/* ---------------- CTA band ---------------- */}
      <section className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 pb-20">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.5 }}
          className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-sky-500 via-sky-600 to-cyan-600 text-white px-6 sm:px-12 py-12 sm:py-16 text-center shadow-[0_30px_70px_-30px_rgba(2,132,199,0.9)]"
        >
          {/* decorative rings */}            <div className="pointer-events-none absolute -top-24 -right-24 w-72 h-72 rounded-full bg-white/10 dark:bg-sky-400/10 blur-2xl" />
          <div className="pointer-events-none absolute -bottom-32 -left-16 w-80 h-80 rounded-full bg-cyan-300/20 dark:bg-cyan-900/20 blur-3xl" />
          <div className="pointer-events-none absolute inset-0 opacity-[0.07]" style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.6) 1px, transparent 1px)',
            backgroundSize: '32px 32px',
          }} />

          <div className="relative">
            <div className="inline-flex items-center gap-2 bg-white/15 border border-white/25 rounded-full px-4 py-1.5 backdrop-blur mb-5">
              <HeartPulse className="w-3.5 h-3.5" />
              <span className="text-[11px] font-bold uppercase tracking-widest">Every minute matters</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-4">
              Ready to command the response?
            </h2>
            <p className="text-sm sm:text-[15px] text-sky-100/90 max-w-xl mx-auto mb-8 leading-relaxed">
              Step into the Situation Room and experience AI-triaged disaster response with live
              Hyderabad flood data — no signup needed.
            </p>
            <button
              onClick={onEnter}
              className="inline-flex items-center gap-2.5 whitespace-nowrap bg-white text-sky-700 hover:bg-sky-50 text-sm font-bold px-7 py-3.5 rounded-xl shadow-[0_16px_36px_-12px_rgba(8,47,73,0.55)] transition-all hover:-translate-y-0.5 active:scale-95 cursor-pointer"
            >
              <Users className="w-4.5 h-4.5" />
              Open the Situation Room
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      </section>

      {/* ---------------- Footer ---------------- */}        <footer className="relative z-10 border-t border-sky-100 dark:border-sky-800 bg-white/60 dark:bg-sky-950/60 backdrop-blur transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-sky-100 via-white to-sky-200 dark:from-sky-800 dark:via-sky-900 dark:to-sky-800 border border-sky-200 dark:border-sky-700 flex items-center justify-center">
              <BeaconLogo className="w-4 h-4 text-sky-600" />
            </div>
            <div>
              <div className="text-[13px] font-bold tracking-tight text-sky-950 leading-none">CRISISBEACON</div>
              <div className="text-[10px] text-sky-600/70 mt-0.5">Real-Time Disaster Intelligence Platform</div>
            </div>
          </div>

          <div className="flex items-center gap-5 text-[11px] text-sky-600/80 dark:text-sky-400">
            <span className="flex items-center gap-1.5">
              <PhoneCall className="w-3 h-3" /> Emergency: 112
            </span>
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-3 h-3" /> GHMC &amp; SDRF coordination
            </span>
          </div>

          <div className="text-[10px] text-sky-500/70 dark:text-sky-500">
            &copy; {new Date().getFullYear()} CRISISBEACON &middot; SIH Prototype &middot; Built with care
          </div>
        </div>
      </footer>
    </div>
  );
}