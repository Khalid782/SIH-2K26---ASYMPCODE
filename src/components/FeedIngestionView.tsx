import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Radio, Activity, Inbox, ShieldCheck, Play, Pause, FastForward, RadioTower } from 'lucide-react';
import { OpsTable, ViewHeader, StatChips, StatusBadge, OpsColumn, OpsRow } from './OpsTable';
import { analyzeDisasterReportHybrid } from '../utils/triageEngine';
import { SYNTHETIC_REPORTS, getRandomReport, nextIntervalMs, SyntheticReport } from '../utils/syntheticFeed';
import { Incident, Severity } from '../types';

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
      <span key="c" className="font-semibold text-ink dark:text-paper">Citizen WhatsApp Line</span>,
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
      <span key="c" className="font-semibold text-ink dark:text-paper">Emergency Line 112</span>,
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
      <span key="c" className="font-semibold text-ink dark:text-paper">X / Twitter Monitor</span>,
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
      <span key="c" className="font-semibold text-ink dark:text-paper">Facebook Community Groups</span>,
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
      <span key="c" className="font-semibold text-ink dark:text-paper">GHMC Sensor Telemetry</span>,
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
      <span key="c" className="font-semibold text-ink dark:text-paper">Field Volunteer App</span>,
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
      <span key="c" className="font-semibold text-ink dark:text-paper">SMS 112 Gateway</span>,
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
      <span key="c" className="font-semibold text-ink dark:text-paper">Traffic Police Feed</span>,
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
      <span key="c" className="font-semibold text-ink dark:text-paper">Web / Portal Form</span>,
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
      <span key="c" className="font-semibold text-ink dark:text-paper">Community Radio / HAM</span>,
      'Radio',
      <StatusBadge key="s" label="Standby" tone="slate" />,
      <span key="n" className="font-mono">12</span>,
      <span key="q" className="font-mono">0</span>,
      <span key="a" className="font-mono">82%</span>,
      '18 min ago',
    ],
  },
];

interface FeedIngestionViewProps {
  onCreateIncident: (incident: Incident) => void;
}

function buildIncidentFromTriage(
  result: Awaited<ReturnType<typeof analyzeDisasterReportHybrid>>,
  rawText: string,
  source: SyntheticReport['channel']
): Incident {
  const newId = `INC-2026-${Math.floor(100 + Math.random() * 900)}`;
  const now = new Date();
  const ts = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')} IST`;

  const urgencyLevel =
    result.recommendedPriority === 'Immediate Response'
      ? 'Immediate'
      : result.recommendedPriority === 'High Priority'
        ? 'Elevated'
        : 'Monitoring';

  const peopleTrapped = result.extractedEntities.peopleTrapped;
  const waterLevel =
    result.extractedEntities.waterLevel ||
    (result.severity === 'Critical' ? '3.5 ft (Rapidly Rising)' : '2.0 ft');

  return {
    id: newId,
    created_at: now.toISOString(),
    location: result.primaryLocation || result.location,
    extractedLocation: result.primaryLocation || result.location,
    primaryLocation: result.primaryLocation || result.location,
    secondaryLocations: result.secondaryLocations || [],
    landmark: `${(result.primaryLocation || result.location).split(',')[0]} Emergency Sector`,
    coordinates: [result.coordinates[0], result.coordinates[1]],
    disasterType: result.disasterType as Incident['disasterType'],
    severity: result.severity,
    aiConfidence: result.aiConfidence,
    confidence: result.confidence || result.aiConfidence,
    locationConfidence: result.locationConfidence,
    detectedSignals: [...(result.detectedSignals || [])],
    hazards: result.hazards ? [...result.hazards] : [],
    responseNeeded: result.responseNeeded ? [...result.responseNeeded] : [],
    recommendedPriority: result.recommendedPriority,
    engineUsed: result.engineUsed,
    source,
    timeAgo: 'Just now',
    timestamp: ts,
    originalReport: rawText.trim(),
    status: 'Pending',
    verificationStatus: 'Pending',
    entitiesExtracted: {
      urgency: urgencyLevel,
      peopleTrapped,
      waterLevel,
      affectedArea: result.primaryLocation || result.location,
    },
  };
}

export default function FeedIngestionView({ onCreateIncident }: FeedIngestionViewProps) {
  const [isRunning, setIsRunning] = useState(false);
  const [processedCount, setProcessedCount] = useState(0);
  const [createdCount, setCreatedCount] = useState(0);
  const [noiseCount, setNoiseCount] = useState(0);
  const [lastReport, setLastReport] = useState<SyntheticReport | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const runningRef = useRef(false);

  useEffect(() => {
    runningRef.current = isRunning;
  }, [isRunning]);

  const processOneReport = useCallback(async () => {
    if (isProcessing) return;
    const report = getRandomReport();
    setLastReport(report);
    setIsProcessing(true);

    try {
      const triage = await analyzeDisasterReportHybrid(report.text);
      setProcessedCount((prev) => prev + 1);

      if (triage.isRelevant) {
        const incident = buildIncidentFromTriage(triage, report.text, report.channel);
        onCreateIncident(incident);
        setCreatedCount((prev) => prev + 1);
      } else {
        setNoiseCount((prev) => prev + 1);
      }
    } catch (err) {
      console.warn('Synthetic feed triage error:', err);
      setNoiseCount((prev) => prev + 1);
    } finally {
      setIsProcessing(false);
    }
  }, [onCreateIncident, isProcessing]);

  const scheduleNext = useCallback(() => {
    if (!runningRef.current) return;
    const ms = nextIntervalMs(6, 10);
    intervalRef.current = setTimeout(() => {
      void processOneReport().finally(() => {
        scheduleNext();
      });
    }, ms);
  }, [processOneReport]);

  const startFeed = useCallback(() => {
    if (isRunning) return;
    setIsRunning(true);
    runningRef.current = true;
    scheduleNext();
  }, [isRunning, scheduleNext]);

  const pauseFeed = useCallback(() => {
    setIsRunning(false);
    runningRef.current = false;
    if (intervalRef.current) {
      clearTimeout(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const injectNow = useCallback(() => {
    void processOneReport();
  }, [processOneReport]);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearTimeout(intervalRef.current);
      runningRef.current = false;
    };
  }, []);

  const resetStats = () => {
    pauseFeed();
    setProcessedCount(0);
    setCreatedCount(0);
    setNoiseCount(0);
    setLastReport(null);
  };

  return (
    <div className="max-w-4xl mx-auto w-full space-y-4">
      <ViewHeader title="Feed & Ingestion" label="10 live channels • Gemini pre-filter active" />
      <StatChips
        items={[
          { label: 'Channels', value: '10', tone: 'sky' },
          { label: 'Online', value: '9', tone: 'green' },
          { label: 'Degraded', value: '1', tone: 'amber' },
          { label: 'Reports (24h)', value: '3,079', tone: 'sky' },
        ]}
      />

      <div className="bg-paper/95 dark:bg-ink/90 border border-paper-2/90 dark:border-paper/25 rounded-xl p-4 space-y-3 shadow-[0_1px_2px_rgba(17,17,16,0.04),0_10px_24px_-18px_rgba(17,17,16,0.3)]">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2">
            <RadioTower className="w-4 h-4 text-signal shrink-0" />
            <h3 className="text-[11px] font-bold uppercase tracking-wider text-ink dark:text-paper">
              Synthetic Social Media Crisis Feed — Demo Mode
            </h3>
            <span className="text-[10px] text-ink dark:text-paper font-mono ml-auto mr-2">
              {SYNTHETIC_REPORTS.length} reports loaded • interval 6–10s
            </span>
            <StatusBadge
              label={isRunning ? 'Feed Running' : 'Paused'}
              tone={isRunning ? 'green' : 'slate'}
              pulse={isRunning}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <div className="rounded-lg border border-paper-2 dark:border-paper/20 bg-paper-2/40 dark:bg-ink/50 px-3 py-2">
            <div className="text-[10px] font-medium uppercase tracking-wider text-ink dark:text-paper">
              Reports Processed
            </div>
            <div className="text-lg font-bold font-mono text-ink dark:text-paper leading-tight">
              {processedCount}
            </div>
          </div>
          <div className="rounded-lg border border-paper-2 dark:border-paper/20 bg-paper-2/40 dark:bg-ink/50 px-3 py-2">
            <div className="text-[10px] font-medium uppercase tracking-wider text-ink dark:text-paper">
              Relevant Incidents Created
            </div>
            <div className="text-lg font-bold font-mono text-emerald-600 dark:text-emerald-300 leading-tight">
              {createdCount}
            </div>
          </div>
          <div className="rounded-lg border border-paper-2 dark:border-paper/20 bg-paper-2/40 dark:bg-ink/50 px-3 py-2">
            <div className="text-[10px] font-medium uppercase tracking-wider text-ink dark:text-paper">
              Noise Filtered
            </div>
            <div className="text-lg font-bold font-mono text-ink dark:text-paper leading-tight">
              {noiseCount}
            </div>
          </div>
          <div className="rounded-lg border border-paper-2 dark:border-paper/20 bg-paper-2/40 dark:bg-ink/50 px-3 py-2">
            <div className="text-[10px] font-medium uppercase tracking-wider text-ink dark:text-paper">
              Status
            </div>
            <div className={`text-sm font-bold leading-tight ${isRunning ? 'text-emerald-600 dark:text-emerald-300' : 'text-ink dark:text-paper'}`}>
              {isRunning ? 'Live Feed Running' : 'Paused'}
            </div>
          </div>
        </div>

        {lastReport && (
          <div className="rounded-lg border border-paper-2 dark:border-paper/20 bg-paper-2/50 dark:bg-ink/40 px-3 py-2">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-ink dark:text-paper">
                Last Report
              </span>
              <span className="text-[10px] font-mono text-ink dark:text-paper ml-auto">#{lastReport.id} • {lastReport.channel}</span>
              <span className={`text-[10px] font-bold uppercase tracking-wider ${
                lastReport.tag === 'critical'
                  ? 'text-rose-600 dark:text-rose-400'
                  : lastReport.tag === 'high'
                    ? 'text-orange-600 dark:text-orange-400'
                    : lastReport.tag === 'noise'
                      ? 'text-ink dark:text-paper'
                      : lastReport.tag === 'duplicate'
                        ? 'text-sky-600 dark:text-sky-400'
                        : 'text-amber-600 dark:text-amber-400'
              }`}>
                {lastReport.tag}
              </span>
            </div>
            <p className="text-xs text-ink dark:text-paper leading-relaxed">
              {lastReport.text}
            </p>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={startFeed}
            disabled={isRunning}
            className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-3.5 py-2 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-sm"
          >
            <Play className="w-3.5 h-3.5" />
            Start Demo Feed
          </button>
          <button
            onClick={pauseFeed}
            disabled={!isRunning}
            className="inline-flex items-center gap-1.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold px-3.5 py-2 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-sm"
          >
            <Pause className="w-3.5 h-3.5" />
            Pause Demo Feed
          </button>
          <button
            onClick={injectNow}
            disabled={isProcessing}
            className="inline-flex items-center gap-1.5 bg-mute hover:bg-mute/90 text-white text-xs font-semibold px-3.5 py-2 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-sm"
          >
            <FastForward className="w-3.5 h-3.5" />
            {isProcessing ? 'Processing…' : 'Inject Next Report'}
          </button>
          <button
            onClick={resetStats}
            className="inline-flex items-center gap-1.5 text-ink dark:text-paper hover:text-ink dark:hover:text-white text-xs font-medium px-2.5 py-2 rounded-lg transition-colors"
          >
            Reset
          </button>
        </div>
      </div>

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
      <div className="flex items-center gap-1.5 text-[11px] text-ink dark:text-paper">
        <Activity className="w-3.5 h-3.5" />
        <Inbox className="w-3.5 h-3.5" />
        Queue backlog of <strong className="text-ink dark:text-paper">87</strong> messages is being
        drained by the severity engine &mdash; estimated clear in 4 minutes.
      </div>
    </div>
  );
}
