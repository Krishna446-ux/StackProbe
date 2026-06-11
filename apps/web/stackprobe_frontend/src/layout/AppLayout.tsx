import React from 'react';
import { LogOut } from 'lucide-react';

interface AppLayoutProps {
  currentPath: string;
  onLogout: () => void;
  sidebar: React.ReactNode;
  children: React.ReactNode;
  disabled?: boolean;
}

/** Build a human-readable breadcrumb from the current path */
function getBreadcrumb(path: string): { segments: string[]; title: string } {
  if (path === '/submit')       return { segments: ['Dashboard'], title: 'Dashboard' };
  if (path === '/repositories') return { segments: ['Repositories'], title: 'Repositories' };
  if (path === '/settings')     return { segments: ['Settings'], title: 'Settings' };
  if (path.startsWith('/jobs/'))    return { segments: ['Dashboard', 'Analysis Running'], title: 'Analysis Running' };
  if (path.startsWith('/reports/')) return { segments: ['Dashboard', 'Report'], title: 'Report' };
  return { segments: ['Dashboard'], title: 'Dashboard' };
}

export const AppLayout: React.FC<AppLayoutProps> = ({
  currentPath,
  onLogout,
  sidebar,
  children,
  disabled,
}) => {
  const { segments } = getBreadcrumb(currentPath);

  return (
    <div className="min-h-screen text-zinc-100 flex font-sans" style={{ background: 'var(--sp-bg)' }}>

      {/* Sidebar */}
      {sidebar}

      {/* Right: header + content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Top bar */}
        <header className="flex-shrink-0 h-[52px] flex items-center justify-between px-5 md:px-6 border-b sticky top-0 z-30" style={{ background: 'var(--sp-bg)', borderColor: 'var(--sp-border)' }}>
          {/* Breadcrumb (hidden on very small screens to avoid collision with hamburger) */}
          <div className="hidden md:flex items-center gap-1.5 text-sm text-zinc-500">
            {segments.map((seg, i) => (
              <React.Fragment key={seg}>
                {i > 0 && <span className="text-zinc-700">/</span>}
                <span className={i === segments.length - 1 ? 'text-zinc-200 font-medium' : ''}>
                  {seg}
                </span>
              </React.Fragment>
            ))}
          </div>

          {/* Mobile: StackProbe label (sits right of hamburger which is absolute-positioned) */}
          <div className="flex md:hidden items-center ml-10">
            <span className="text-sm font-semibold text-white">StackProbe</span>
          </div>

          {/* Right: logout */}
          <button
            onClick={() => {
              if (!disabled) onLogout();
            }}
            disabled={disabled}
            className={`flex items-center gap-1.5 text-xs transition px-2.5 py-1.5 rounded-lg font-medium
              ${disabled ? 'text-zinc-600 cursor-not-allowed' : 'text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 cursor-pointer'}`}
            title="Log out"
          >
            <LogOut size={14} />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-5 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
};
