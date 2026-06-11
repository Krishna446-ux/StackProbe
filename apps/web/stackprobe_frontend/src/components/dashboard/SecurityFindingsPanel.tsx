import React, { useMemo } from 'react';
import type { Finding } from '../../types/dashboard.types';
import { ShieldCheck, ShieldAlert, AlertTriangle, AlertCircle } from 'lucide-react';

interface SecurityFindingsPanelProps {
  findings: Finding[];
}

export const SecurityFindingsPanel: React.FC<SecurityFindingsPanelProps> = ({ findings }) => {
  // Filter for category = 'security' (case-insensitive)
  const securityFindings = useMemo(() => {
    const sec = findings.filter(
      (f) => (f.category || '').toLowerCase() === 'security'
    );
    
    // Sort so critical and high are first
    const severityWeight = (s: string) => {
      const level = (s || '').toLowerCase();
      if (level === 'critical') return 4;
      if (level === 'high') return 3;
      if (level === 'medium' || level === 'warning') return 2;
      return 1; // low
    };

    return sec.sort((a, b) => severityWeight(b.severity) - severityWeight(a.severity));
  }, [findings]);

  if (securityFindings.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-6 text-center rounded-xl border border-emerald-900/40 bg-emerald-950/10 backdrop-blur-md space-y-2">
        <div className="rounded-full bg-emerald-950/60 p-3 text-emerald-400 border border-emerald-900/50">
          <ShieldCheck size={28} />
        </div>
        <h4 className="text-sm font-semibold text-zinc-100">No Security Vulnerabilities</h4>
        <p className="text-xs text-zinc-400 max-w-sm">
          No dependency vulnerabilities or security flaws were found in this analysis scan.
        </p>
      </div>
    );
  }

  // Count severities
  const counts = securityFindings.reduce(
    (acc, f) => {
      const sev = (f.severity || '').toLowerCase();
      if (sev === 'critical') acc.critical++;
      else if (sev === 'high') acc.high++;
      else if (sev === 'medium' || sev === 'warning') acc.medium++;
      else acc.low++;
      return acc;
    },
    { critical: 0, high: 0, medium: 0, low: 0 }
  );

  return (
    <div className="space-y-4">
      {/* Summary Badges */}
      <div className="flex flex-wrap gap-2 items-center">
        <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mr-2">
          Security Scan Results
        </h3>
        {counts.critical > 0 && (
          <span className="rounded bg-rose-950/40 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-rose-400 border border-rose-900/30">
            {counts.critical} Critical
          </span>
        )}
        {counts.high > 0 && (
          <span className="rounded bg-amber-950/40 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-400 border border-amber-900/30">
            {counts.high} High
          </span>
        )}
        {counts.medium > 0 && (
          <span className="rounded bg-yellow-950/40 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-yellow-400 border border-yellow-900/30">
            {counts.medium} Medium
          </span>
        )}
        {counts.low > 0 && (
          <span className="rounded bg-blue-950/40 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-blue-400 border border-blue-900/30">
            {counts.low} Low
          </span>
        )}
      </div>

      {/* Vulnerabilities Grid List */}
      <div className="grid gap-3 md:grid-cols-2">
        {securityFindings.map((finding) => {
          const sev = (finding.severity || '').toLowerCase();

          return (
            <div
              key={finding.finding_id}
              className={`flex flex-col justify-between p-4 rounded-xl border backdrop-blur-md transition-all hover:scale-[1.01] ${
                sev === 'critical'
                  ? 'bg-rose-950/10 border-rose-900/50 hover:border-rose-700/60 shadow-lg shadow-rose-950/10'
                  : sev === 'high'
                  ? 'bg-amber-950/10 border-amber-900/50 hover:border-amber-700/60 shadow-lg shadow-amber-950/10'
                  : 'bg-zinc-900/30 border-zinc-850 hover:border-zinc-800'
              }`}
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-xs font-bold text-zinc-400 truncate max-w-[180px]" title={finding.rule}>
                    {finding.rule}
                  </span>
                  
                  {sev === 'critical' ? (
                    <span className="inline-flex items-center gap-1 rounded bg-rose-950/50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-rose-400 border border-rose-800/35">
                      <AlertCircle size={10} /> Critical
                    </span>
                  ) : sev === 'high' ? (
                    <span className="inline-flex items-center gap-1 rounded bg-amber-950/50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-400 border border-amber-800/35">
                      <AlertTriangle size={10} /> High
                    </span>
                  ) : sev === 'medium' || sev === 'warning' ? (
                    <span className="inline-flex items-center gap-1 rounded bg-yellow-950/50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-yellow-400 border border-yellow-800/35">
                      <AlertTriangle size={10} /> Medium
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded bg-blue-950/50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-blue-400 border border-blue-800/35">
                      <ShieldAlert size={10} /> Low
                    </span>
                  )}
                </div>

                <p className="text-xs text-zinc-200 leading-relaxed line-clamp-3" title={finding.message}>
                  {finding.message}
                </p>
              </div>

              {finding.filePath && (
                <div className="mt-3 pt-2 border-t border-zinc-850/60 flex items-center justify-between text-[10px] font-mono text-zinc-500">
                  <span className="truncate max-w-[200px]" title={finding.filePath}>
                    File: {finding.filePath}
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
