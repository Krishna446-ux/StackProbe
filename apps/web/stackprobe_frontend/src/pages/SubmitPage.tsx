import React from 'react';
import { Sparkles, Lock, TrendingUp, ChevronRight, GitFork, Info } from 'lucide-react';
import type { AnalyzedRepo } from '../types/dashboard.types';

interface SubmitPageProps {
  navigate: (path: string) => void;
  repos: AnalyzedRepo[];
  repoUrl: string;
  onRepoUrlChange: (url: string) => void;
  force: boolean;
  onForceChange: (checked: boolean) => void;
  onSubmit: () => void;
  jobId: string;
  pollingError: string;
}

const featurePills = [
  { icon: Sparkles,   label: 'AI Summary' },
  { icon: Lock,       label: 'Security Scan' },
  { icon: TrendingUp, label: 'Score History' },
];

export const SubmitPage: React.FC<SubmitPageProps> = ({
  navigate,
  repos,
  repoUrl,
  onRepoUrlChange,
  force,
  onForceChange,
  onSubmit,
  jobId,
  pollingError,
}) => {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') onSubmit();
  };

  return (
    <div className="max-w-2xl mx-auto py-4 md:py-8 space-y-5">

      {/* Compact heading */}
      <div className="text-center space-y-1">
        <h2 className="text-xl md:text-2xl font-bold text-white tracking-tight">
          Analyze a Repository
        </h2>
        <p className="text-xs text-zinc-500 max-w-md mx-auto">
          Paste any public GitHub repository URL to get an instant quality and security report.
        </p>
      </div>

      {/* Submit form */}
      <div className="space-y-2">
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="flex-1 relative">
            <span className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
              <svg className="w-3.5 h-3.5 text-zinc-600" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.17 6.839 9.49.5.092.682-.217.682-.48 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.464-1.11-1.464-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.137 20.167 22 16.418 22 12c0-5.523-4.477-10-10-10z"/>
              </svg>
            </span>
            <input
              type="text"
              placeholder="https://github.com/owner/repository"
              value={repoUrl}
              onChange={(e) => onRepoUrlChange(e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-full h-10 pl-8 pr-3 rounded-lg bg-[#1a1a1d] border border-white/[0.09] text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-green-600/50 transition"
            />
          </div>
          <button
            id="submit-analysis-btn"
            onClick={onSubmit}
            disabled={!!jobId || !repoUrl.trim()}
            className="h-10 px-4 rounded-lg bg-green-600 hover:bg-green-500 disabled:bg-zinc-800 disabled:text-zinc-600 text-white text-sm font-semibold transition-all duration-150 active:scale-[0.98] cursor-pointer disabled:cursor-not-allowed flex items-center gap-1.5 flex-shrink-0 whitespace-nowrap"
          >
            <svg className="w-3.5 h-3.5 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M13 10V3L4 14h7v7l9-11h-7z"/>
            </svg>
            {jobId ? 'Running...' : 'Analyze Repository'}
          </button>
        </div>

        {/* Force + feature pills on same row */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <input
              type="checkbox"
              id="force-chk"
              checked={force}
              onChange={(e) => onForceChange(e.target.checked)}
              className="h-3 w-3 rounded border-zinc-700 bg-zinc-900 accent-green-600 cursor-pointer"
            />
            <label htmlFor="force-chk" className="text-xs text-zinc-500 select-none cursor-pointer">
              Force fresh scan
            </label>
          </div>
          <div className="flex items-center gap-1.5">
            {featurePills.map(({ icon: Icon, label }) => (
              <div key={label} className="hidden sm:flex items-center gap-1 px-2 py-1 rounded-full text-[11px] text-zinc-500 bg-white/[0.03] border border-white/[0.05]">
                <Icon size={10} />
                {label}
              </div>
            ))}
          </div>
        </div>

        {pollingError && (
          <div className="px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
            {pollingError}
          </div>
        )}
      </div>

      {/* Repository requirements notice */}
      <div className="flex gap-2.5 px-4 py-3 rounded-lg border border-white/[0.06] bg-white/[0.02]">
        <Info size={13} className="text-blue-400 flex-shrink-0 mt-0.5" />
        <p className="text-[11px] text-zinc-500 leading-relaxed">
          <span className="text-zinc-400 font-medium">Supported:</span>{' '}
          JavaScript · TypeScript · JSX · MJS files in Node.js projects with{' '}
          <span className="font-mono text-zinc-400">package.json</span>.
          A <span className="font-mono text-zinc-400">package-lock.json</span> is recommended for dependency analysis.
        </p>
      </div>

      {/* Recent repos */}
      {repos.length > 0 && (
        <div className="space-y-2">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-600">Recent</p>
          <div
            className="rounded-lg border border-white/[0.07] overflow-hidden divide-y divide-white/[0.05]"
            style={{ background: 'var(--sp-surface)' }}
          >
            {repos.slice(0, 6).map((repo) => (
              <div
                key={repo.repo_id}
                onClick={() => navigate(`/reports/${repo.report_id}`)}
                className="flex items-center justify-between px-4 py-2.5 hover:bg-white/[0.03] transition cursor-pointer group"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <GitFork size={12} className="text-zinc-600 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-zinc-200 truncate">
                      {repo.owner}/{repo.name}
                    </p>
                    <p className="text-[10px] text-zinc-600">
                      {new Date(repo.analysis_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                  <div className="hidden sm:flex items-center gap-1.5 text-[10px] font-mono font-semibold">
                    <span className="px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">Q {repo.quality_score}</span>
                    <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">S {repo.security_score}</span>
                  </div>
                  <span className="text-[11px] text-blue-400 group-hover:text-blue-300 transition flex items-center gap-0.5 font-medium">
                    View <ChevronRight size={11} />
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
