import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  ShieldAlert,
  AlertTriangle,
  BarChart2,
  RefreshCw,
  CheckCircle2,
  Sparkles,
  ShieldCheck,
  FileCode,
  Clock,
  Info,
  ChevronRight,
  AlertOctagon,
} from 'lucide-react';
import { ScoreHistoryChart } from '../components/dashboard/ScoreHistoryChart';
import { SecurityFindingsPanel } from '../components/dashboard/SecurityFindingsPanel';
import { FindingsTable } from '../components/dashboard/FindingsTable';
import { getReport, getReportFindings } from '../api/reports.api';
import { getJob } from '../api/jobs.api';
import { getRepoHistory } from '../api/repos.api';
import type { AnalyzedRepo, ScoreHistoryPoint, Finding } from '../types/dashboard.types';

interface ReportPageProps {
  reportId: string;
  repos: AnalyzedRepo[];
  authenticated: boolean;
  navigate: (path: string) => void;
  onReanalyze: (owner: string, name: string) => Promise<void>;
}

export const ReportPage: React.FC<ReportPageProps> = ({
  reportId,
  repos,
  authenticated,
  navigate,
  onReanalyze,
}) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [report, setReport] = useState<any>(null);
  const [scoreHistory, setScoreHistory] = useState<ScoreHistoryPoint[]>([]);
  const [findings, setFindings] = useState<Finding[]>([]);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [selectedRepo, setSelectedRepo] = useState<AnalyzedRepo | null>(null);
  const [reanalyzing, setReanalyzing] = useState(false);
  // Derived booleans tracked in state so JSX re-renders when they change
  const [hasSummaryText, setHasSummaryText] = useState(false);

  useEffect(() => {
    if (!reportId || !authenticated) return;
    setReport(null);
    setFindings([]);
    setScoreHistory([]);
    setHasSummaryText(false);

    const fetchReportData = async () => {
      setLoadingDetails(true);
      try {
        const reportData = await getReport(reportId);
        setReport(reportData);

        // AI summary flag — only truthy when there is real text from the backend
        setHasSummaryText(
          Boolean(reportData?.ai_summary) &&
          reportData.ai_summary !== 'AI Summary is Unavailable'
        );

        // ── Findings ────────────────────────────────────────────────────────
        // Source of truth: backend findings API. Never fabricate data.
        let findingsData: Finding[] = [];
        try {
          const rawFindings = await getReportFindings(reportId);
          console.log('RAW FINDINGS:', rawFindings);
          // Backend may return { findings: [...] }, a raw array, or null — normalise all cases
          findingsData = Array.isArray(rawFindings)
            ? rawFindings
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            : Array.isArray((rawFindings as any)?.findings)
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              ? (rawFindings as any).findings
              : [];
        } catch (err) {
          // Findings API failed — use empty array, never fabricate vulnerabilities.
          console.error('Findings API failed:', err);
          findingsData = [];
        }
        setFindings(findingsData);

        if (reportData?.job_id) {
          const jobData = await getJob(reportData.job_id);
          if (jobData && jobData.repo_id) {
            const rawHistory = await getRepoHistory(jobData.repo_id);
            setScoreHistory(Array.isArray(rawHistory) ? rawHistory : []);
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingDetails(false);
      }
    };
    fetchReportData();
  }, [reportId, authenticated]); // eslint-disable-line react-hooks/exhaustive-deps

  // Separate effect: look up selectedRepo whenever the report or repos list updates
  useEffect(() => {
    if (!report || repos.length === 0) return;
    const findRepoId = async () => {
      try {
        const jobData = await getJob(report.job_id);
        if (jobData?.repo_id) {
          const matched = repos.find(r => r.repo_id === jobData.repo_id);
          if (matched) setSelectedRepo(matched);
        }
      } catch (err) {
        console.error('Failed to resolve selectedRepo', err);
      }
    };
    findRepoId();
  }, [report, repos]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleReanalyze = async () => {
    if (!selectedRepo || reanalyzing) return;
    setReanalyzing(true);
    try {
      await onReanalyze(selectedRepo.owner, selectedRepo.name);
    } finally {
      setReanalyzing(false);
    }
  };

  // ── Security scan failure detection ─────────────────────────────────────
  // Backend signals a failed security scan with security_score === -1.
  const securityScanFailed = report?.security_score === -1;

  // Derived stats — guard with Array.isArray in case of unexpected API shape.
  // When the security scan failed, do not display fabricated counts.
  const safeFindings = Array.isArray(findings) ? findings : [];
  const qualityIssues = safeFindings.filter(f => (f.category || '').toLowerCase() !== 'security').length;
  const securityIssues = securityScanFailed
    ? null  // unknown — scan did not complete
    : safeFindings.filter(f => (f.category || '').toLowerCase() === 'security').length;
  const criticalCount = securityScanFailed
    ? null
    : safeFindings.filter(f => (f.severity || '').toLowerCase() === 'critical').length;

  /* ─── Loading ────────────────────────────────────────────── */
  if (loadingDetails) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <div className="h-7 w-7 animate-spin rounded-full border-2 border-zinc-700 border-t-green-500" />
        <p className="text-xs text-zinc-500">Loading metrics...</p>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="text-center py-20 text-zinc-500 text-sm">Failed to load report data.</div>
    );
  }

  /* ─── Main render ────────────────────────────────────────── */
  return (
    <div className="space-y-4 max-w-5xl mx-auto">

      {/* ── Security scan failure banner ─────────────────────── */}
      {securityScanFailed && (
        <div className="flex items-start gap-3 rounded-lg border border-amber-500/30 bg-amber-500/5 px-4 py-3">
          <AlertOctagon size={15} className="text-amber-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-semibold text-amber-400">Security scan could not be completed</p>
            <p className="text-xs text-amber-300/70 mt-0.5">
              The security scan failed (e.g. OSV timeout or service unavailable). Please re-run the analysis.
            </p>
          </div>
        </div>
      )}

      {/* ── Header ──────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
        <div>
          {/* Breadcrumb */}
          <div className="flex items-center gap-1 text-[11px] text-zinc-600 mb-1">
            <span className="hover:text-zinc-400 cursor-pointer transition" onClick={() => navigate('/repositories')}>
              Repositories
            </span>
            <ChevronRight size={11} />
            <span className="text-zinc-400 font-medium truncate max-w-[200px]">
              {selectedRepo ? `${selectedRepo.owner}/${selectedRepo.name}` : reportId.slice(0, 8)}
            </span>
          </div>
          <h2 className="text-base font-bold text-white tracking-tight">
            {selectedRepo ? `${selectedRepo.owner}/${selectedRepo.name}` : 'Analysis Report'}
          </h2>
          <div className="flex flex-wrap items-center gap-2 mt-1">
            <Clock size={11} className="text-zinc-600" />
            <span className="text-[11px] text-zinc-500">
              {new Date(report.created_at).toLocaleString()}
            </span>
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-green-500/10 text-green-400 border border-green-500/20">
              <CheckCircle2 size={9} /> Completed
            </span>
          </div>
        </div>

        <button
          onClick={handleReanalyze}
          disabled={!selectedRepo || reanalyzing}
          className="self-start sm:self-auto inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-orange-500 hover:bg-orange-400 disabled:bg-zinc-800 disabled:text-zinc-600 text-white text-xs font-semibold transition-all active:scale-[0.98] cursor-pointer disabled:cursor-not-allowed flex-shrink-0"
        >
          <RefreshCw size={12} className={reanalyzing ? 'animate-spin' : ''} />
          {reanalyzing ? 'Starting...' : 'Re-run Analysis'}
        </button>
      </div>

      {/* ── Stat cards + optional history ──────────────────── */}
      <div className="flex flex-col lg:flex-row gap-3">

        {/* 4 stat cards */}
        <div className="flex-1 grid grid-cols-2 xl:grid-cols-4 gap-3">
          {[
            {
              label: 'Quality Score',
              value: report.quality_score,
              displayValue: String(report.quality_score),
              sub: 'out of 100',
              icon: <TrendingUp size={13} className="text-green-500" />,
              color: 'text-white',
            },
            {
              label: 'Security Score',
              // Never display -1; show "Unavailable" when scan failed
              value: report.security_score,
              displayValue: securityScanFailed ? 'N/A' : String(report.security_score),
              sub: securityScanFailed ? 'scan unavailable' : 'out of 100',
              icon: <AlertTriangle size={13} className={securityScanFailed ? 'text-amber-500' : 'text-amber-500'} />,
              color: securityScanFailed ? 'text-amber-500' : 'text-white',
            },
            {
              label: 'Total Findings',
              value: findings.length,
              displayValue: String(findings.length),
              sub: 'issues found',
              icon: <BarChart2 size={13} className="text-zinc-500" />,
              color: 'text-white',
            },
            {
              label: 'Critical',
              // Show "N/A" when we don't have reliable security data
              value: criticalCount,
              displayValue: criticalCount === null ? 'N/A' : String(criticalCount),
              sub: criticalCount === null ? 'scan unavailable' : 'critical issues',
              icon: <ShieldAlert size={13} className="text-red-500" />,
              color: criticalCount !== null && criticalCount > 0 ? 'text-red-400' : criticalCount === null ? 'text-amber-500' : 'text-white',
            },
          ].map(({ label, displayValue, sub, icon, color }) => (
            <div
              key={label}
              className="rounded-lg border border-white/[0.07] p-4 flex flex-col justify-between gap-2"
              style={{ background: 'var(--sp-surface)' }}
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-zinc-500 font-medium">{label}</span>
                {icon}
              </div>
              <div>
                <p className={`text-2xl font-bold font-mono ${color}`}>{displayValue}</p>
                <p className="text-[10px] text-zinc-600 mt-0.5">{sub}</p>
              </div>
            </div>
          ))}
        </div>

        {/* History sidebar */}
        {scoreHistory.length > 0 && (
          <div
            className="lg:w-48 flex-shrink-0 rounded-lg border border-white/[0.07] p-4 space-y-3"
            style={{ background: 'var(--sp-surface)' }}
          >
            <div className="flex items-center gap-1.5">
              <Clock size={12} className="text-zinc-500" />
              <h3 className="text-xs font-semibold text-zinc-300">History</h3>
            </div>
            <div className="space-y-2">
              {scoreHistory.slice(0, 4).map((entry, i) => (
                <div key={i} className="flex items-center justify-between gap-1">
                  <p className="text-[10px] text-zinc-600">
                    {new Date(entry.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                  </p>
                  <span className="text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                    Q {entry.score}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── AI Executive Summary ────────────────────────────── */}
      <div
        className="rounded-lg border border-white/[0.07] p-4 space-y-2"
        style={{ background: 'var(--sp-surface)' }}
      >
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-1.5">
            <div className="h-5 w-5 rounded bg-blue-500/10 border border-blue-500/20 flex items-center justify-center flex-shrink-0">
              <Sparkles size={11} className="text-blue-400" />
            </div>
            <h3 className="text-xs font-semibold text-zinc-200">AI Executive Summary</h3>
          </div>
          {/* Disclaimer */}
          <span className="flex items-center gap-1 text-[10px] text-zinc-600">
            <Info size={10} />
            Generated by Gemini API · may be unavailable due to rate limits
          </span>
        </div>

        {/* Show summary if it exists; it's available regardless of security scan status */}
        {hasSummaryText ? (
          <p className="text-sm text-zinc-300 leading-relaxed">
            {report.ai_summary}
          </p>
        ) : (
          <p className="text-xs text-zinc-600 italic">AI Summary Unavailable</p>
        )}
      </div>

      {/* ── Score History Chart ─────────────────────────────── */}
      <div
        className="rounded-lg border border-white/[0.07] p-4"
        style={{ background: 'var(--sp-surface)' }}
      >
        <div className="flex items-center gap-1.5 mb-3">
          <TrendingUp size={13} className="text-green-500" />
          <h3 className="text-xs font-semibold text-zinc-300">Score History</h3>
        </div>
        <ScoreHistoryChart data={scoreHistory} />
      </div>

      {/* ── Security Findings Panel ─────────────────────────── */}
      <div
        className="rounded-lg border border-white/[0.07] p-4 space-y-3"
        style={{ background: 'var(--sp-surface)' }}
      >
        <div className="flex items-center gap-2">
          <ShieldCheck size={13} className="text-emerald-500" />
          <h3 className="text-xs font-semibold text-zinc-300">Security Analysis</h3>
          {/* Only show real counts when the scan actually ran */}
          {!securityScanFailed && securityIssues !== null && securityIssues > 0 && (
            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/20">
              {securityIssues} vuln
            </span>
          )}
        </div>
        {/* When scan failed, show a contextual notice instead of the panel */}
        {securityScanFailed ? (
          <p className="text-xs text-amber-500/80 bg-amber-500/5 border border-amber-500/20 rounded px-3 py-2">
            Security scan could not be completed. Please re-run the analysis.
          </p>
        ) : (
          <SecurityFindingsPanel findings={safeFindings} />
        )}
      </div>

      {/* ── Findings Table ───────────────────────────────────── */}
      <div
        className="rounded-lg border border-white/[0.07] p-4 space-y-3"
        style={{ background: 'var(--sp-surface)' }}
      >
        <div className="flex items-center gap-2">
          <FileCode size={13} className="text-blue-400" />
          <h3 className="text-xs font-semibold text-zinc-300">All Findings</h3>
          <span className="text-[10px] text-zinc-600">
            {qualityIssues} quality
            {!securityScanFailed && securityIssues !== null && ` · ${securityIssues} security`}
          </span>
        </div>
        <FindingsTable findings={safeFindings} />
      </div>
    </div>
  );
};
