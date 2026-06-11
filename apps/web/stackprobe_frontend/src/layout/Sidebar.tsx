import React, { useState } from 'react';
import { Logo } from '../components/common/Logo';
import {
  LayoutDashboard,
  GitFork,
  Settings,
  X,
  Menu,
} from 'lucide-react';

interface SidebarProps {
  currentPath: string;
  navigate: (path: string) => void;
  disabled?: boolean;
}

const navItems = [
  { label: 'Dashboard',    icon: LayoutDashboard, path: '/submit' },
  { label: 'Repositories', icon: GitFork,          path: '/repositories' },
  { label: 'Settings',     icon: Settings,         path: '/settings' },
];

function getActiveItem(path: string): string {
  if (path === '/submit')       return 'Dashboard';
  if (path === '/repositories') return 'Repositories';
  if (path === '/settings')     return 'Settings';
  if (path.startsWith('/jobs/'))    return 'Dashboard';
  if (path.startsWith('/reports/')) return 'Dashboard';
  return 'Dashboard';
}

const NavContent: React.FC<{
  currentPath: string;
  navigate: (p: string) => void;
  onClose?: () => void;
  disabled?: boolean;
}> = ({ currentPath, navigate, onClose, disabled }) => {
  const activeLabel = getActiveItem(currentPath);

  return (
    <div className="flex flex-col h-full" style={{ background: 'var(--sp-sidebar)' }}>
      {/* Logo */}
      <div className="px-4 pt-5 pb-6 flex items-center justify-between">
        <Logo iconSize={30} textSize="text-[15px]" />
        {onClose && (
          <button onClick={onClose} className="text-zinc-400 hover:text-white transition md:hidden cursor-pointer">
            <X size={18} />
          </button>
        )}
      </div>

      {/* Nav items */}
      <nav className="flex-1 px-2 space-y-0.5">
        {navItems.map(({ label, icon: Icon, path }) => {
          const isActive = activeLabel === label;
          return (
              <button
              key={label}
              onClick={() => {
                if (disabled) return;
                navigate(path);
                onClose?.();
              }}
              disabled={disabled}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-100 
                ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                ${isActive
                  ? 'bg-white/[0.08] text-white'
                  : 'text-zinc-400 hover:text-white hover:bg-white/[0.05]'
                }`}
            >
              <Icon
                size={16}
                className={isActive ? 'text-white' : 'text-zinc-500'}
                strokeWidth={isActive ? 2.2 : 1.8}
              />
              <span>{label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
};

export const Sidebar: React.FC<SidebarProps> = ({ currentPath, navigate, disabled }) => {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* Mobile hamburger */}
      <button
        className="fixed top-3.5 left-4 z-50 flex md:hidden items-center justify-center w-8 h-8 rounded-lg border border-white/[0.08] text-zinc-400 hover:text-white transition cursor-pointer"
        style={{ background: 'var(--sp-surface2)' }}
        onClick={() => setMobileOpen(true)}
        aria-label="Open menu"
      >
        <Menu size={16} />
      </button>

      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile drawer */}
      <div
        className={`fixed top-0 left-0 z-50 h-full w-52 border-r transform transition-transform duration-200 md:hidden
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}
        style={{ background: 'var(--sp-sidebar)', borderColor: 'var(--sp-border)' }}
      >
        <NavContent currentPath={currentPath} navigate={navigate} onClose={() => setMobileOpen(false)} disabled={disabled} />
      </div>

      {/* Desktop sidebar */}
      <div
        className="hidden md:flex flex-col w-52 flex-shrink-0 h-screen border-r sticky top-0"
        style={{ background: 'var(--sp-sidebar)', borderColor: 'var(--sp-border)' }}
      >
        <NavContent currentPath={currentPath} navigate={navigate} disabled={disabled} />
      </div>
    </>
  );
};
