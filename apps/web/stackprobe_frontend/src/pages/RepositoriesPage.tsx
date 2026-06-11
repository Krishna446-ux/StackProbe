import React, { useState, useMemo } from 'react';
import {
  GitFork, Plus, Clock, AlertTriangle,
  ChevronRight, ChevronLeft, Filter, ArrowUpDown,
} from 'lucide-react';
import type { AnalyzedRepo } from '../types/dashboard.types';

interface RepositoriesPageProps {
  repos: AnalyzedRepo[];
  navigate: (path: string) => void;
}

type Status   = 'completed' | 'warning' | 'critical';
type SortKey  = 'recent' | 'quality' | 'security';

const REPOS_PER_PAGE = 8; // 8 real repos + 1 Add card = perfect 3-col grid

/* ─── Helpers ──────────────────────────────────────────── */

function getStatus(quality: number, security: number): Status {
  if (security < 50 || quality < 50) return 'critical';
  if (security < 70 || quality < 70) return 'warning';
  return 'completed';
}

function getScoreColor(score: number): string {
  if (score >= 80) return 'text-green-400';
  if (score >= 60) return 'text-yellow-400';
  return 'text-red-400';
}

function getTimeAgo(dateStr: string): string {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60)     return 'Just now';
  if (diff < 3600)   return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400)  return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)} days ago`;
  if (diff < 2592000) return `${Math.floor(diff / 604800)} weeks ago`;
  return new Date(dateStr).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

const STATUS_CFG = {
  completed: {
    label:    'Completed',
    barBg:    'bg-green-500',
    textColor: 'text-green-400',
  },
  warning: {
    label:    'Warning',
    barBg:    'bg-yellow-500',
    textColor: 'text-yellow-400',
  },
  critical: {
    label:    'Critical',
    barBg:    'bg-red-500',
    textColor: 'text-red-400',
  },
} as const;

/* ─── Repo card ─────────────────────────────────────────── */

const RepoCard: React.FC<{ repo: AnalyzedRepo; onClick: () => void }> = ({ repo, onClick }) => {
  const status = getStatus(repo.quality_score, repo.security_score);
  const cfg    = STATUS_CFG[status];
  const hasCritical = status === 'critical';

  return (
    <div
      onClick={onClick}
      className="rounded-xl border border-white/[0.07] bg-[#141416] overflow-hidden cursor-pointer group hover:border-white/[0.14] hover:bg-[#181818] transition-all duration-150 flex flex-col"
    >
      {/* Colored top bar */}
      <div className={`h-[3px] w-full ${cfg.barBg} flex-shrink-0`} />

      {/* Header */}
      <div className="px-4 pt-3.5 pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            {/* Repo icon */}
            <div className="h-8 w-8 rounded-lg bg-[#222224] border border-white/[0.06] flex items-center justify-center flex-shrink-0">
              <GitFork size={13} className="text-zinc-400" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-white truncate leading-tight">
                {repo.owner}/{repo.name}
              </p>
              <p className="text-[10px] text-zinc-600 mt-0.5">main</p>
            </div>
          </div>
          {/* Status badge */}
          <span className={`flex-shrink-0 text-[11px] font-semibold ${cfg.textColor}`}>
            {cfg.label}
          </span>
        </div>
      </div>

      {/* Score boxes */}
      <div className="px-4 pb-3 grid grid-cols-2 gap-2">
        <div className="bg-[#1e1e20] rounded-lg px-3 py-2.5">
          <p className="text-[10px] text-zinc-500 font-medium mb-1.5">Quality</p>
          <p className={`text-2xl font-bold font-mono leading-none ${getScoreColor(repo.quality_score)}`}>
            {repo.quality_score}
          </p>
        </div>
        <div className="bg-[#1e1e20] rounded-lg px-3 py-2.5">
          <p className="text-[10px] text-zinc-500 font-medium mb-1.5">Security</p>
          <p className={`text-2xl font-bold font-mono leading-none ${getScoreColor(repo.security_score)}`}>
            {repo.security_score}
          </p>
        </div>
      </div>

      {/* Meta row */}
      <div className="px-4 pb-3 flex items-center justify-between text-[11px] text-zinc-500">
        <span className="flex items-center gap-1">
          <Clock size={11} className="flex-shrink-0" />
          {getTimeAgo(repo.analysis_date)}
        </span>
        {hasCritical && (
          <span className="flex items-center gap-1 text-red-400 font-medium">
            <AlertTriangle size={11} className="flex-shrink-0" />
            Score critical
          </span>
        )}
      </div>

      {/* View Report footer */}
      <div className="mt-auto border-t border-white/[0.05] px-4 py-2.5 flex items-center justify-between group-hover:bg-white/[0.02] transition">
        <span className="text-xs text-zinc-400 group-hover:text-zinc-200 transition font-medium">
          View Report
        </span>
        <ChevronRight size={13} className="text-zinc-600 group-hover:text-zinc-300 transition" />
      </div>
    </div>
  );
};

/* ─── Add Repository card ───────────────────────────────── */

const AddRepoCard: React.FC<{ onClick: () => void }> = ({ onClick }) => (
  <div
    onClick={onClick}
    className="rounded-xl border border-dashed border-white/[0.12] bg-[#141416] flex flex-col items-center justify-center gap-3 cursor-pointer hover:border-white/[0.22] hover:bg-white/[0.02] transition-all duration-150 min-h-[232px]"
  >
    <div className="h-10 w-10 rounded-xl bg-white/[0.05] border border-white/[0.09] flex items-center justify-center">
      <Plus size={20} className="text-zinc-400" />
    </div>
    <div className="text-center">
      <p className="text-sm font-semibold text-zinc-300">Add Repository</p>
      <p className="text-xs text-zinc-600 mt-0.5">Analyze a new GitHub repo</p>
    </div>
  </div>
);

/* ─── Main page ─────────────────────────────────────────── */

export const RepositoriesPage: React.FC<RepositoriesPageProps> = ({ repos, navigate }) => {
  const [page, setPage]       = useState(1);
  const [sortKey, setSortKey] = useState<SortKey>('recent');

  const sortedRepos = useMemo(() => {
    const arr = [...repos];
    if (sortKey === 'quality')  arr.sort((a, b) => b.quality_score - a.quality_score);
    if (sortKey === 'security') arr.sort((a, b) => b.security_score - a.security_score);
    return arr;
  }, [repos, sortKey]);

  const totalPages = Math.max(1, Math.ceil(sortedRepos.length / REPOS_PER_PAGE));
  const pageRepos  = sortedRepos.slice((page - 1) * REPOS_PER_PAGE, page * REPOS_PER_PAGE);
  const showing    = pageRepos.length;

  const cycleSortKey = () => {
    const keys: SortKey[] = ['recent', 'quality', 'security'];
    setSortKey(k => keys[(keys.indexOf(k) + 1) % keys.length]);
    setPage(1);
  };

  const sortLabel = sortKey.charAt(0).toUpperCase() + sortKey.slice(1);

  return (
    <div className="space-y-4">

      {/* ── Header ────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-white">All Repositories</h2>
          <p className="text-xs text-zinc-500 mt-0.5">
            Manage and analyze your connected GitHub repositories
          </p>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 px-2 py-1.5 text-xs text-zinc-500 cursor-not-allowed" title="Filters coming soon">
            <Filter size={12} />
            Filter
          </span>
          <button
            onClick={cycleSortKey}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/[0.08] bg-[#141416] text-xs text-zinc-400 hover:text-zinc-200 hover:border-white/[0.14] transition cursor-pointer"
          >
            <ArrowUpDown size={12} />
            Sort: {sortLabel}
          </button>
        </div>
      </div>

      {/* ── Grid ──────────────────────────────────────────── */}
      {repos.length === 0 ? (
        /* Empty state */
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="col-span-full text-center py-16">
            <div className="inline-flex h-12 w-12 rounded-xl bg-white/[0.04] border border-white/[0.07] items-center justify-center mb-4">
              <GitFork size={22} className="text-zinc-600" />
            </div>
            <p className="text-sm font-medium text-zinc-400">No repositories analyzed yet</p>
            <p className="text-xs text-zinc-600 mt-1">Submit a GitHub repository URL to get started.</p>
          </div>
          <AddRepoCard onClick={() => navigate('/submit')} />
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {pageRepos.map((repo) => (
              <RepoCard
                key={repo.repo_id}
                repo={repo}
                onClick={() => navigate(`/reports/${repo.report_id}`)}
              />
            ))}
            {/* Always show Add card as next slot */}
            <AddRepoCard onClick={() => navigate('/submit')} />
          </div>

          {/* ── Pagination footer ──────────────────────────── */}
          <div className="flex items-center justify-between pt-1">
            <p className="text-xs text-zinc-500">
              Showing {showing} of {sortedRepos.length}{' '}
              {sortedRepos.length === 1 ? 'repository' : 'repositories'}
            </p>
            {totalPages > 1 && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-white/[0.07] bg-[#141416] text-xs text-zinc-400 hover:text-zinc-200 disabled:opacity-35 disabled:cursor-not-allowed cursor-pointer transition"
                >
                  <ChevronLeft size={13} /> Prev
                </button>
                <span className="text-xs text-zinc-600 px-1">
                  Page {page} of {totalPages}
                </span>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-white/[0.07] bg-[#141416] text-xs text-zinc-400 hover:text-zinc-200 disabled:opacity-35 disabled:cursor-not-allowed cursor-pointer transition"
                >
                  Next <ChevronRight size={13} />
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};
