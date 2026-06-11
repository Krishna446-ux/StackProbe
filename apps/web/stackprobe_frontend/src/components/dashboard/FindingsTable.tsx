import React, { useState, useMemo } from 'react';
import type { Finding } from '../../types/dashboard.types';
import { AlertCircle, AlertTriangle, Info, Search, FilterX, Copy, Check, ChevronLeft, ChevronRight } from 'lucide-react';

interface FindingsTableProps {
  findings: Finding[];
}

export const FindingsTable: React.FC<FindingsTableProps> = ({ findings }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSeverities, setSelectedSeverities] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const toggleSeverity = (severity: string) => {
    setSelectedSeverities((prev) =>
      prev.includes(severity)
        ? prev.filter((s) => s !== severity)
        : [...prev, severity]
    );
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedSeverities([]);
    setCurrentPage(1);
  };

  const filteredFindings = useMemo(() => {
    return findings.filter((finding) => {
      // Normalize severity
      const sev = (finding.severity || '').toLowerCase();
      
      // Filter by severity
      if (selectedSeverities.length > 0) {
        // Match either direct string or lowercase representation
        const match = selectedSeverities.some((s) => s.toLowerCase() === sev);
        if (!match) return false;
      }

      // Filter by search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const rule = (finding.rule || '').toLowerCase();
        const msg = (finding.message || '').toLowerCase();
        const file = (finding.filePath || '').toLowerCase();
        const cat = (finding.category || '').toLowerCase();

        return rule.includes(query) || msg.includes(query) || file.includes(query) || cat.includes(query);
      }

      return true;
    });
  }, [findings, searchQuery, selectedSeverities]);

  // Reset to page 1 when filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedSeverities]);

  const totalPages = Math.max(1, Math.ceil(filteredFindings.length / itemsPerPage));
  const paginatedFindings = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredFindings.slice(start, start + itemsPerPage);
  }, [filteredFindings, currentPage, itemsPerPage]);

  const severityBadge = (severity: string) => {
    const sev = (severity || '').toLowerCase();
    switch (sev) {
      case 'critical':
        return (
          <span className="inline-flex items-center gap-1 rounded bg-rose-950/40 px-2 py-1 text-xs font-semibold text-rose-400 border border-rose-900/40">
            <AlertCircle size={12} /> Critical
          </span>
        );
      case 'high':
        return (
          <span className="inline-flex items-center gap-1 rounded bg-amber-950/40 px-2 py-1 text-xs font-semibold text-amber-400 border border-amber-900/40">
            <AlertTriangle size={12} /> High
          </span>
        );
      case 'medium':
      case 'warning':
        return (
          <span className="inline-flex items-center gap-1 rounded bg-yellow-950/40 px-2 py-1 text-xs font-semibold text-yellow-400 border border-yellow-900/40">
            <AlertTriangle size={12} /> Medium
          </span>
        );
      case 'low':
      case 'info':
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded bg-blue-950/40 px-2 py-1 text-xs font-semibold text-blue-400 border border-blue-900/40">
            <Info size={12} /> Low
          </span>
        );
    }
  };

  const severitiesList = ['Critical', 'High', 'Medium', 'Low'];

  const FilePathCell = ({ path }: { path: string }) => {
    const [copied, setCopied] = useState(false);
    const handleCopy = () => {
      navigator.clipboard.writeText(path);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    };
    if (!path || path === 'N/A') return <span className="text-zinc-500">N/A</span>;
    return (
      <div className="flex items-center gap-2 max-w-[200px]">
        <span className="font-mono text-xs text-zinc-500 truncate" title={path}>{path}</span>
        <button onClick={handleCopy} className="text-zinc-500 hover:text-zinc-300 transition cursor-pointer flex-shrink-0" title="Copy path">
          {copied ? <Check size={13} className="text-green-500" /> : <Copy size={13} />}
        </button>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Filters and Search Bar */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-zinc-500">
            <Search size={16} />
          </span>
          <input
            type="text"
            placeholder="Search findings (rule, message, file)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg pl-9 pr-3 py-2 text-sm text-zinc-300 placeholder-zinc-600 focus:outline-none focus:border-zinc-700 transition"
          />
        </div>

        {/* Severity Toggles */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-zinc-500 font-medium mr-1">Severity:</span>
          {severitiesList.map((sev) => {
            const isSelected = selectedSeverities.includes(sev);
            return (
              <button
                key={sev}
                onClick={() => toggleSeverity(sev)}
                className={`px-3 py-1 rounded-full text-xs font-medium border transition ${
                  isSelected
                    ? 'bg-zinc-100 text-black border-zinc-100'
                    : 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:border-zinc-700'
                }`}
              >
                {sev}
              </button>
            );
          })}

          {(searchQuery || selectedSeverities.length > 0) && (
            <button
              onClick={clearFilters}
              className="inline-flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-300 px-2 py-1 transition"
            >
              <FilterX size={14} /> Clear
            </button>
          )}
        </div>
      </div>

      {/* Responsive Table Container */}
      <div className="overflow-x-auto rounded-xl border border-zinc-850 bg-zinc-900/20">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-zinc-800 bg-zinc-900/50 text-xs font-semibold uppercase tracking-wider text-zinc-400">
              <th className="py-3 px-4 font-bold">Severity</th>
              <th className="py-3 px-4 font-bold">Category</th>
              <th className="py-3 px-4 font-bold">Rule</th>
              <th className="py-3 px-4 font-bold">Message</th>
              <th className="py-3 px-4 font-bold">Location</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/60 text-sm text-zinc-300">
            {paginatedFindings.length > 0 ? (
              paginatedFindings.map((finding) => (
                <tr
                  key={finding.finding_id}
                  className="hover:bg-zinc-850/20 transition-colors"
                >
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    {severityBadge(finding.severity)}
                  </td>
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <span className="font-mono text-xs uppercase text-zinc-500">
                      {finding.category || 'quality'}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 font-mono text-xs text-zinc-400 max-w-[150px] truncate" title={finding.rule}>
                    {finding.rule || 'N/A'}
                  </td>
                  <td className="py-3.5 px-4 max-w-xs md:max-w-md">
                    <div className="text-zinc-200 line-clamp-2" title={finding.message}>
                      {finding.message}
                    </div>
                  </td>
                  <td className="py-3.5 px-4">
                    <FilePathCell path={finding.filePath} />
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="py-8 text-center text-zinc-500">
                  No matching findings found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between text-xs text-zinc-500 px-1 mt-2">
        <span>Showing {paginatedFindings.length} of {filteredFindings.length} findings</span>
        {totalPages > 1 && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-white/[0.07] bg-[#141416] text-xs text-zinc-400 hover:text-zinc-200 disabled:opacity-35 disabled:cursor-not-allowed cursor-pointer transition"
            >
              <ChevronLeft size={13} /> Prev
            </button>
            <span className="text-xs text-zinc-600 px-1">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-white/[0.07] bg-[#141416] text-xs text-zinc-400 hover:text-zinc-200 disabled:opacity-35 disabled:cursor-not-allowed cursor-pointer transition"
            >
              Next <ChevronRight size={13} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
