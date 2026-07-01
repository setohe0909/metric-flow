import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '@/features/auth/hooks/use-auth';
import OrgSwitcher from './org-switcher';
import { BookOpen, Database, LayoutDashboard, Terminal, Settings, LogOut, User, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { LanguageSwitcher } from '@/lib/i18n';
import { ThemeToggle } from '@/lib/theme';

export default function Sidebar() {
  const { user, logout } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const navigation = [
    { name: 'Dashboards', href: '/dashboards', icon: LayoutDashboard },
    { name: 'SQL Editor', href: '/queries', icon: Terminal },
    { name: 'Conectores', href: '/datasources', icon: Database },
    { name: 'Docs', href: '/docs', icon: BookOpen },
    { name: 'Ajustes', href: '/settings', icon: Settings },
  ];

  return (
    <div
      className={`${isCollapsed ? 'w-20' : 'w-64'} bg-[var(--color-panel)] border-r-2 border-[var(--color-ink)] flex flex-col min-h-screen text-[var(--color-muted-text)] transition-[width] duration-300 ease-out`}
    >
      {/* Brand logo */}
      <div className={`${isCollapsed ? 'px-3 py-5 justify-center' : 'p-5'} flex items-center gap-2.5 border-b border-[color-mix(in_srgb,var(--color-ink)_10%,transparent)]`}>
        <div className="p-1.5 bg-[var(--color-accent)] border-2 border-[var(--color-ink)] rounded-lg text-[var(--color-ink)]">
          <Database className="h-5 w-5" />
        </div>
        {!isCollapsed && <span className="text-lg font-extrabold tracking-tight text-[var(--color-ink)] font-mono">
          Metric<span className="text-[var(--color-accent)]">Flow</span>
        </span>}
      </div>

      <div className={`${isCollapsed ? 'px-3' : 'px-4'} pt-3`}>
        <button
          type="button"
          onClick={() => setIsCollapsed((collapsed) => !collapsed)}
          aria-expanded={!isCollapsed}
          aria-label={isCollapsed ? 'Expandir sidebar' : 'Colapsar sidebar'}
          className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-[var(--color-ink)] bg-[var(--color-canvas)] px-3 py-2 text-xs font-extrabold text-[var(--color-ink)] shadow-[2px_2px_0px_0px_var(--color-ink)] transition-all hover:-translate-y-0.5 hover:bg-[var(--color-muted-surface)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] focus:ring-offset-2 focus:ring-offset-[var(--color-panel)]"
        >
          {isCollapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
          {!isCollapsed && <span>Colapsar</span>}
        </button>
      </div>

      {/* Org switcher */}
      {!isCollapsed && (
        <div className="px-4 py-3">
          <OrgSwitcher />
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-2">
        {navigation.map((item) => (
          <NavLink
            key={item.name}
            to={item.href}
            title={isCollapsed ? item.name : undefined}
            className={({ isActive }) =>
              `flex items-center ${isCollapsed ? 'justify-center px-0' : 'gap-3 px-3'} py-2 text-sm font-bold rounded-xl transition-all ${
                isActive
                  ? 'bg-[var(--color-accent)] text-[var(--color-on-accent)] border-2 border-[var(--color-ink)] shadow-[2px_2px_0px_0px_var(--color-ink)]'
                  : 'text-[var(--color-muted-text)] hover:bg-[var(--color-muted-surface)] hover:text-[var(--color-ink)] border-2 border-transparent'
              }`
            }
          >
            <item.icon className="h-4 w-4 shrink-0" />
            {!isCollapsed && item.name}
          </NavLink>
        ))}
      </nav>

      {!isCollapsed && (
        <div className="px-4 pb-3">
          <div className="rounded-2xl border-2 border-[var(--color-ink)] bg-[var(--color-canvas)] p-2 shadow-[2px_2px_0px_0px_var(--color-ink)]">
            <p className="mb-2 px-1 font-mono text-[10px] font-extrabold uppercase tracking-[0.16em] text-[var(--color-muted-text)]">
              Preferencias
            </p>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <div className="min-w-0 flex-1 [&_label]:w-full [&_label]:justify-between [&_label]:px-2.5 [&_label]:py-1.5">
                <LanguageSwitcher />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* User footer */}
      {user && (
        <div className={`${isCollapsed ? 'p-3' : 'p-4'} border-t-2 border-[var(--color-ink)] bg-[var(--color-panel)] flex flex-col gap-3`}>
          <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'} p-2 bg-[var(--color-canvas)] border-2 border-[var(--color-ink)] rounded-xl`}>
            <div className="p-2 bg-[var(--color-muted-surface)] border border-[color-mix(in_srgb,var(--color-ink)_20%,transparent)] rounded-lg text-[var(--color-ink)]">
              <User className="h-4 w-4" />
            </div>
            {!isCollapsed && <div className="min-w-0 flex-1">
              <p className="text-xs font-extrabold text-[var(--color-ink)] truncate font-mono">
                {user.firstName} {user.lastName}
              </p>
              <p className="text-[10px] text-[var(--color-muted-text)] truncate">{user.email}</p>
            </div>}
          </div>

          <button
            onClick={logout}
            aria-label={isCollapsed ? 'Cerrar sesión' : undefined}
            title={isCollapsed ? 'Cerrar sesión' : undefined}
            className="btn-retro-danger w-full justify-center"
          >
            <LogOut className="h-3.5 w-3.5" />
            {!isCollapsed && 'Cerrar Sesión'}
          </button>
        </div>
      )}
    </div>
  );
}
