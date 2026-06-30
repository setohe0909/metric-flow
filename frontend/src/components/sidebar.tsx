import { NavLink } from 'react-router-dom';
import { useAuth } from '@/features/auth/hooks/use-auth';
import OrgSwitcher from './org-switcher';
import { BookOpen, Database, LayoutDashboard, Terminal, Settings, LogOut, User } from 'lucide-react';

export default function Sidebar() {
  const { user, logout } = useAuth();

  const navigation = [
    { name: 'Dashboards', href: '/dashboards', icon: LayoutDashboard },
    { name: 'SQL Editor', href: '/queries', icon: Terminal },
    { name: 'Conectores', href: '/datasources', icon: Database },
    { name: 'Docs', href: '/docs', icon: BookOpen },
    { name: 'Ajustes', href: '/settings', icon: Settings },
  ];

  return (
    <div className="w-64 bg-[var(--color-panel)] border-r-2 border-[var(--color-ink)] flex flex-col min-h-screen text-[var(--color-muted-text)]">
      {/* Brand logo */}
      <div className="p-5 flex items-center gap-2.5 border-b border-[color-mix(in_srgb,var(--color-ink)_10%,transparent)]">
        <div className="p-1.5 bg-[var(--color-accent)] border-2 border-[var(--color-ink)] rounded-lg text-[var(--color-ink)]">
          <Database className="h-5 w-5" />
        </div>
        <span className="text-lg font-extrabold tracking-tight text-[var(--color-ink)] font-mono">
          Metric<span className="text-[var(--color-accent)]">Flow</span>
        </span>
      </div>

      {/* Org switcher */}
      <div className="px-4 py-3">
        <OrgSwitcher />
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-2">
        {navigation.map((item) => (
          <NavLink
            key={item.name}
            to={item.href}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 text-sm font-bold rounded-xl transition-all ${
                isActive
                  ? 'bg-[var(--color-accent)] text-[var(--color-on-accent)] border-2 border-[var(--color-ink)] shadow-[2px_2px_0px_0px_var(--color-ink)]'
                  : 'text-[var(--color-muted-text)] hover:bg-[var(--color-muted-surface)] hover:text-[var(--color-ink)] border-2 border-transparent'
              }`
            }
          >
            <item.icon className="h-4 w-4 shrink-0" />
            {item.name}
          </NavLink>
        ))}
      </nav>

      {/* User footer */}
      {user && (
        <div className="p-4 border-t-2 border-[var(--color-ink)] bg-[var(--color-panel)] flex flex-col gap-3">
          <div className="flex items-center gap-3 p-2 bg-[var(--color-canvas)] border-2 border-[var(--color-ink)] rounded-xl">
            <div className="p-2 bg-[var(--color-muted-surface)] border border-[color-mix(in_srgb,var(--color-ink)_20%,transparent)] rounded-lg text-[var(--color-ink)]">
              <User className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-extrabold text-[var(--color-ink)] truncate font-mono">
                {user.firstName} {user.lastName}
              </p>
              <p className="text-[10px] text-[var(--color-muted-text)] truncate">{user.email}</p>
            </div>
          </div>

          <button
            onClick={logout}
            className="btn-retro-danger w-full justify-center"
          >
            <LogOut className="h-3.5 w-3.5" />
            Cerrar Sesión
          </button>
        </div>
      )}
    </div>
  );
}
