import { NavLink } from 'react-router-dom';
import { useAuth } from '@/features/auth/hooks/use-auth';
import OrgSwitcher from './org-switcher';
import { Database, LayoutDashboard, Terminal, Settings, LogOut, User } from 'lucide-react';

export default function Sidebar() {
  const { user, logout } = useAuth();

  const navigation = [
    { name: 'Dashboards', href: '/dashboards', icon: LayoutDashboard },
    { name: 'SQL Editor', href: '/queries', icon: Terminal },
    { name: 'Conectores', href: '/datasources', icon: Database },
    { name: 'Ajustes', href: '/settings', icon: Settings },
  ];

  return (
    <div className="w-64 bg-[#e4e5de] border-r-2 border-[#23251d] flex flex-col min-h-screen text-[#4d4f46]">
      {/* Brand logo */}
      <div className="p-5 flex items-center gap-2.5 border-b border-[#23251d]/10">
        <div className="p-1.5 bg-[#f7a501] border-2 border-[#23251d] rounded-lg text-[#23251d]">
          <Database className="h-5 w-5" />
        </div>
        <span className="text-lg font-extrabold tracking-tight text-[#23251d] font-mono">
          Metric<span className="text-[#f7a501]">Flow</span>
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
                  ? 'bg-[#f7a501] text-[#23251d] border-2 border-[#23251d] shadow-[2px_2px_0px_0px_#23251d]'
                  : 'text-[#4d4f46] hover:bg-[#d8d9d2] hover:text-[#23251d] border-2 border-transparent'
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
        <div className="p-4 border-t-2 border-[#23251d] bg-[#e4e5de] flex flex-col gap-3">
          <div className="flex items-center gap-3 p-2 bg-[#eeefe9] border-2 border-[#23251d] rounded-xl">
            <div className="p-2 bg-[#d8d9d2] border border-[#23251d]/20 rounded-lg text-[#23251d]">
              <User className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-extrabold text-[#23251d] truncate font-mono">
                {user.firstName} {user.lastName}
              </p>
              <p className="text-[10px] text-[#4d4f46] truncate">{user.email}</p>
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
