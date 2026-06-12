import React, { useState, useEffect } from 'react';
import { CheckCircle2, Loader2, Clock, ArrowLeft } from 'lucide-react';
import { getJobCurrentStage } from '../api/jobs.api';

interface JobStatusPageProps {
  routeJobId: string;
  status: string;
  pollingError: string;
  navigate: (path: string) => void;
}

// Pipeline stages — each maps to a backend current_stage value
const stages = [
  {
    key: 'CLONING',
    label: 'Repository Cloned',
    desc: 'Fetched source code and metadata from origin',
    headline: 'Cloning Repository...',
    subline: 'Downloading source code from GitHub',
    progress: 20,
  },
  {
    key: 'QUALITY_ANALYSIS',
    label: 'Code Quality Analysis',
    desc: 'Scanned for complexity, smells and maintainability',
    headline: 'Running Code Quality Analysis...',
    subline: 'Scanning for complexity, smells and maintainability issues',
    progress: 45,
  },
  {
    key: 'SECURITY_SCAN',
    label: 'Security Scan',
    desc: 'Checking vulnerabilities and exposed secrets',
    headline: 'Running Security Scan...',
    subline: 'Analyzing dependency vulnerabilities and secret exposure',
    progress: 70,
  },
  {
    key: 'AI_SUMMARY',
    label: 'Generating AI Summary',
    desc: 'Producing an overview of findings and risks',
    headline: 'Generating AI Summary...',
    subline: 'Producing an intelligent overview of all findings and risks',
    progress: 90,
  },
];

/** Map current_stage → 0-based index into the stages array. Returns -1 for PENDING/unknown. */
function getStageIndex(currentStage: string): number {
  const s = (currentStage || '').toUpperCase();
  if (s === 'COMPLETE') return stages.length;   // all done (past last)
  if (s === 'FAILED') return stages.length;   // treat failed as all done visually
  const idx = stages.findIndex((st) => st.key === s);
  return idx; // -1 for PENDING / unknown
}

/** Derive progress percentage from real current_stage. */
function getProgress(currentStage: string): number {
  const s = (currentStage || '').toUpperCase();
  if (s === 'PENDING') return 5;
  if (s === 'COMPLETE') return 100;
  if (s === 'FAILED') return 100;
  const stage = stages.find((st) => st.key === s);
  return stage ? stage.progress : 5;
}

/** Derive the headline text from real current_stage. */
function getHeadline(currentStage: string): { title: string; sub: string } {
  const s = (currentStage || '').toUpperCase();
  if (s === 'PENDING') return { title: 'Preparing analysis...', sub: 'Job is queued and will start shortly' };
  if (s === 'COMPLETE') return { title: 'Analysis Complete!', sub: 'Redirecting to your report...' };
  if (s === 'FAILED') return { title: 'Analysis Failed', sub: 'The pipeline encountered an error. See details below.' };
  const stage = stages.find((st) => st.key === s);
  return stage
    ? { title: stage.headline, sub: stage.subline }
    : { title: 'Processing...', sub: 'Please wait while analysis runs' };
}

export const JobStatusPage: React.FC<JobStatusPageProps> = ({
  routeJobId,
  status,
  pollingError,
  navigate,
}) => {
  const [currentStage, setCurrentStage] = useState('PENDING');

  // Poll the real current stage from the backend every 2 seconds
  useEffect(() => {
    if (!routeJobId) return;

    // Seed the initial state from the top-level job status
    const topStatus = (status || '').toUpperCase();
    if (topStatus === 'PENDING') setCurrentStage('PENDING');
    if (topStatus === 'COMPLETE') setCurrentStage('COMPLETE');
    if (topStatus === 'FAILED') setCurrentStage('FAILED');

    // Don't poll once terminal
    if (topStatus === 'COMPLETE' || topStatus === 'FAILED') return;

    const interval = setInterval(async () => {
      try {
        //data is current_stage,it is a string not an object
        const data: string = await getJobCurrentStage(routeJobId);
        console.log("Stage API response:", data);
        if (data) {
          console.log("Setting stage:", data);
          setCurrentStage((data as string).toUpperCase());
        }
      } catch {
        // Silently ignore — top-level polling in useJobPolling handles errors
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [routeJobId, status]);

  const stageIndex = getStageIndex(currentStage);
  const isFailed = currentStage === 'FAILED' || (status || '').toUpperCase() === 'FAILED';
  const progress = getProgress(currentStage);
  const { title: headlineTitle, sub: headlineSub } = getHeadline(currentStage);

  // SVG gauge
  const radius = 54;
  const circ = 2 * Math.PI * radius;
  const offset = circ - (progress / 100) * circ;

  return (
    <div className="max-w-xl mx-auto py-6 md:py-10">
      <div className="rounded-2xl border border-white/[0.07] bg-[#141416] p-6 md:p-8 space-y-6">

        {/* Title */}
        <div className="text-center space-y-1">
          <p className="text-xs font-semibold uppercase tracking-widest text-zinc-600">Analysis in progress</p>
          <h2 className="text-base font-semibold text-zinc-200 font-mono truncate">{routeJobId || '—'}</h2>
        </div>

        {/* Circular progress */}
        <div className="flex justify-center">
          <div className="relative flex items-center justify-center w-36 h-36">
            <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 128 128">
              {/* Track */}
              <circle cx="64" cy="64" r={radius} fill="none" stroke="#27272a" strokeWidth="10" />
              {/* Progress */}
              <circle
                cx="64" cy="64" r={radius}
                fill="none"
                stroke={isFailed ? '#ef4444' : '#16a34a'}
                strokeWidth="10"
                strokeLinecap="round"
                strokeDasharray={circ}
                strokeDashoffset={offset}
                className="transition-all duration-700 ease-out"
              />
            </svg>
            <span className="text-2xl font-bold font-mono text-white z-10">
              {isFailed ? '!' : `${progress}%`}
            </span>
          </div>
        </div>

        {/* Status label — driven by real currentStage */}
        {isFailed ? (
          <div className="text-center space-y-1">
            <p className="text-sm font-semibold text-red-400 flex items-center justify-center gap-2">
              {headlineTitle}
            </p>
            <p className="text-xs text-zinc-500">{headlineSub}</p>
          </div>
        ) : (
          <div className="text-center space-y-1">
            <p className="text-sm font-semibold text-white flex items-center justify-center gap-2">
              <Loader2 size={14} className="text-green-500 animate-spin" />
              {headlineTitle}
            </p>
            <p className="text-xs text-zinc-500">{headlineSub}</p>
          </div>
        )}

        {/* Pipeline stages */}
        <div className="space-y-2">
          {stages.map((stage, idx) => {
            const done = idx < stageIndex;
            const active = idx === stageIndex;
            return (
              <div
                key={stage.key}
                className={`flex items-start gap-3 p-3.5 rounded-xl border transition-colors
                  ${active ? 'border-white/[0.12] bg-white/[0.04]' : 'border-transparent'}`}
              >
                <div className="flex-shrink-0 mt-0.5">
                  {done ? (
                    <CheckCircle2 size={18} className="text-green-500" />
                  ) : active ? (
                    <Loader2 size={18} className="text-green-500 animate-spin" />
                  ) : (
                    <Clock size={18} className="text-zinc-700" />
                  )}
                </div>
                <div>
                  <p className={`text-sm font-semibold ${done || active ? 'text-zinc-200' : 'text-zinc-600'}`}>
                    {stage.label}
                  </p>
                  <p className="text-xs text-zinc-600 mt-0.5">{stage.desc}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Error */}
        {pollingError && (
          <div className="px-4 py-3 rounded-xl border border-red-500/20 bg-red-500/10 text-red-400 text-sm">
            {pollingError}
          </div>
        )}

        {/* Hint */}
        {!isFailed && (
          <p className="text-center text-xs text-zinc-600 italic">
            This usually takes 30–90 seconds. You can safely leave this page.
          </p>
        )}

        {/* Back button */}
        <div className="text-center">
          <button
            onClick={() => navigate('/submit')}
            className="inline-flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 transition cursor-pointer"
          >
            <ArrowLeft size={13} /> Cancel and return
          </button>
        </div>
      </div>
    </div>
  );
};
