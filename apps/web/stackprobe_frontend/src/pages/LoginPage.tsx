import React from 'react';
import { Logo } from '../components/common/Logo';
import { CheckCircle2, Info, ChevronRight } from 'lucide-react';
interface LoginPageProps {
  message?: string;
}

const LoginPage: React.FC<LoginPageProps> = ({ message }) => {
  function handleLogin() {
    window.location.href =
      `/api/auth/github`;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0d0d0f] text-white p-4 font-sans">
      {/* Ambient glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-green-900/10 blur-[140px]" />
      </div>

      <div className="relative w-full max-w-[420px] space-y-3">

        {/* Main card */}
        <div className="rounded-2xl border border-white/[0.07] bg-[#161618] shadow-2xl shadow-black/60 p-7 space-y-5">

          {/* Branding */}
          <div className="flex flex-col items-center text-center space-y-3">
            <Logo iconSize={40} textSize="text-xl" />
            <div className="space-y-1">
              <h1 className="text-lg font-semibold text-white tracking-tight">
                Analyze GitHub Repositories with AI
              </h1>
              <p className="text-xs text-zinc-400 leading-relaxed max-w-[300px]">
                Instant quality scores, security analysis, and AI-powered insights for any public GitHub repository.
              </p>
            </div>
          </div>

          {/* Session expired message */}
          {message && (
            <div className="px-3 py-2.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs text-center">
              {message}
            </div>
          )}

          {/* OAuth button */}
          <div className="space-y-2">
            <button
              onClick={handleLogin}
              className="flex w-full items-center justify-center gap-2.5 rounded-xl bg-[#2a2a2e] hover:bg-[#323236] border border-white/[0.08] px-5 py-2.5 font-semibold text-white text-sm transition-all duration-150 active:scale-[0.98] cursor-pointer"
            >
              <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.17 6.839 9.49.5.092.682-.217.682-.48 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.464-1.11-1.464-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.137 20.167 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
              </svg>
              Continue with GitHub
            </button>
            <p className="text-[11px] text-zinc-600 text-center">
              We only request read access to public repositories.
            </p>
          </div>

          {/* Trust badges */}
          <div className="border-t border-white/[0.06] pt-4 flex items-center justify-between gap-2">
            {['No code stored', 'Read-only access', 'SOC 2 ready'].map((badge) => (
              <div key={badge} className="flex items-center gap-1.5 text-[11px] text-zinc-500">
                <CheckCircle2 size={11} className="text-green-500 flex-shrink-0" />
                <span>{badge}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Repository requirements notice */}
        <div className="rounded-xl border border-white/[0.06] bg-[#141416] px-4 py-3 flex gap-3">
          <Info size={14} className="text-blue-400 flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="text-xs font-medium text-zinc-300">Supported Projects</p>
            <p className="text-[11px] text-zinc-500 leading-relaxed">
              StackProbe currently supports{' '}
              <span className="text-zinc-400 font-medium">JavaScript · TypeScript · JSX · MJS</span>{' '}
              files in Node.js projects with a <span className="text-zinc-400 font-mono">package.json</span>.
              A <span className="text-zinc-400 font-mono">package-lock.json</span> is recommended for full dependency analysis.
            </p>
          </div>
        </div>

        {/* Limitations accordion */}
        <details className="sp-details rounded-xl border border-white/[0.06] bg-[#141416] overflow-hidden">
          <summary className="flex items-center gap-2 px-4 py-3 text-xs font-medium text-zinc-400 hover:text-zinc-200 transition select-none">
            <ChevronRight size={13} className="sp-chevron text-zinc-600" />
            Current Limitations
          </summary>
          <div className="px-4 pb-3 pt-0">
            <div className="border-t border-white/[0.05] pt-3 space-y-1.5">
              {[
                'Analyzes public GitHub repositories only.',
                'Focused on Node.js / JavaScript ecosystem projects.',
                'Code quality scanning is powered by ESLint — best suited for JS/TS codebases.',
                'Dependency vulnerability analysis depends on the presence of package metadata.',
                'AI Executive Summaries are best-effort and may occasionally be unavailable.',
                'Security scan results may be incomplete for repositories with non-standard structures.',
                'Multi-language repository analysis is on the roadmap, not yet supported.',
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-2 text-[11px] text-zinc-500">
                  <span className="mt-1.5 h-1 w-1 rounded-full bg-zinc-700 flex-shrink-0" />
                  {item}
                </div>
              ))}
            </div>
          </div>
        </details>

      </div>
    </div>
  );
};

export default LoginPage;
