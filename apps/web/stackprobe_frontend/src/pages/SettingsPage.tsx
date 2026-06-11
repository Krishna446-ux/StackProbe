import React from 'react';
import { Sun, Moon, Type, Save } from 'lucide-react';
import { useSettings, type Theme, type FontSize } from '../hooks/useSettings';

export const SettingsPage: React.FC = () => {
  const { settings, setTheme, setFontSize } = useSettings();

  return (
    <div className="max-w-xl mx-auto py-4 space-y-6">
      {/* Page header */}
      <div className="border-b border-white/[0.07] pb-4">
        <h2 className="text-base font-semibold text-white">Settings</h2>
        <p className="text-xs text-zinc-500 mt-0.5">
          Preferences are saved locally in your browser — no account sync.
        </p>
      </div>

      {/* ── Appearance ──────────────────────────────────────── */}
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          {settings.theme === 'dark' ? (
            <Moon size={13} className="text-zinc-500" />
          ) : (
            <Sun size={13} className="text-zinc-500" />
          )}
          <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Appearance</h3>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {(['dark', 'light'] as Theme[]).map((t) => {
            const active = settings.theme === t;
            return (
              <button
                key={t}
                onClick={() => setTheme(t)}
                className={`relative flex items-center gap-3 px-4 py-3 rounded-lg border text-sm font-medium transition-all cursor-pointer
                  ${active
                    ? 'border-green-500/50 bg-green-500/[0.06] text-green-400'
                    : 'border-white/[0.07] bg-[#141416] text-zinc-400 hover:border-white/[0.12] hover:text-zinc-200'
                  }`}
              >
                {t === 'dark' ? <Moon size={16} /> : <Sun size={16} />}
                <span className="capitalize">{t} Mode</span>
                {active && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 h-1.5 w-1.5 rounded-full bg-green-500" />
                )}
              </button>
            );
          })}
        </div>
      </section>

      {/* ── Font Size ───────────────────────────────────────── */}
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <Type size={13} className="text-zinc-500" />
          <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Font Size</h3>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {(
            [
              { id: 'small',  label: 'Small',  sample: 'text-xs' },
              { id: 'medium', label: 'Medium', sample: 'text-sm' },
              { id: 'large',  label: 'Large',  sample: 'text-base' },
            ] as { id: FontSize; label: string; sample: string }[]
          ).map(({ id, label, sample }) => {
            const active = settings.fontSize === id;
            return (
              <button
                key={id}
                onClick={() => setFontSize(id)}
                className={`relative flex flex-col items-center gap-1.5 px-3 py-3 rounded-lg border transition-all cursor-pointer
                  ${active
                    ? 'border-green-500/50 bg-green-500/[0.06] text-green-400'
                    : 'border-white/[0.07] bg-[#141416] text-zinc-400 hover:border-white/[0.12] hover:text-zinc-200'
                  }`}
              >
                <span className={`font-bold ${sample}`}>Aa</span>
                <span className="text-xs">
                  {label}
                  {id === 'small' && <span className="text-zinc-600"> (default)</span>}
                </span>
                {active && (
                  <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-green-500" />
                )}
              </button>
            );
          })}
        </div>
      </section>

      {/* ── Info footer ─────────────────────────────────────── */}
      <div className="flex items-center gap-2 text-xs text-zinc-600 pt-2">
        <Save size={11} />
        <span>Changes apply immediately and persist across sessions.</span>
      </div>
    </div>
  );
};
