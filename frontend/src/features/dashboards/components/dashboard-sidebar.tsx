import { LayoutDashboard, Plus } from 'lucide-react';
import type { DashboardPage } from '../types/dashboard-studio';

interface DashboardSidebarProps {
  pages: DashboardPage[];
  activePageId: string;
  isEditing?: boolean;
  onSelectPage: (pageId: string) => void;
}

export function DashboardSidebar({
  pages,
  activePageId,
  isEditing = false,
  onSelectPage,
}: DashboardSidebarProps) {
  return (
    <aside className="rounded-2xl border-2 border-[#23251d] bg-[#f4f4f0] p-3 shadow-[4px_4px_0px_0px_#23251d] lg:sticky lg:top-24 lg:self-start">
      <div className="flex items-center gap-2 border-b-2 border-[#23251d] pb-3 mb-3">
        <LayoutDashboard className="h-4 w-4 text-[#f7a501]" />
        <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#23251d] font-mono">
          Secciones
        </span>
      </div>
      <nav className="space-y-2" aria-label="Secciones del dashboard">
        {pages.map((page) => {
          const active = page.id === activePageId;
          return (
            <button
              key={page.id}
              type="button"
              onClick={() => onSelectPage(page.id)}
              className="w-full rounded-xl px-3 py-2 text-left text-xs font-bold transition-all focus:outline-none focus:ring-2 focus:ring-[#f7a501]"
              style={{
                border: '2px solid #23251d',
                backgroundColor: active ? '#f7a501' : '#eeefe9',
                color: '#23251d',
                boxShadow: active ? '2px 2px 0px 0px #23251d' : 'none',
              }}
            >
              {page.title}
            </button>
          );
        })}
      </nav>
      {isEditing && (
        <button
          type="button"
          className="mt-3 w-full btn-retro-secondary text-xs justify-center"
          title="Próximamente: crear sección"
        >
          <Plus className="h-3.5 w-3.5" />
          Nueva sección
        </button>
      )}
    </aside>
  );
}
