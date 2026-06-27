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
    <aside className="rounded-2xl border-2 border-[var(--color-border-strong)] bg-[var(--color-widget)] p-3 shadow-[var(--shadow-retro-strong)] lg:sticky lg:top-24 lg:self-start">
      <div className="flex items-center gap-2 border-b-2 border-[var(--color-border-soft)] pb-3 mb-3">
        <LayoutDashboard className="h-4 w-4 text-[var(--color-accent)]" />
        <span className="text-[11px] font-extrabold uppercase tracking-wider text-[var(--color-ink)] font-mono">
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
              className="w-full rounded-xl px-3 py-2 text-left text-xs font-bold transition-all focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
              style={{
                border: '2px solid var(--color-border-strong)',
                backgroundColor: active ? 'var(--color-accent)' : 'var(--color-chart-surface)',
                color: active ? '#23251d' : 'var(--color-ink)',
                boxShadow: active ? 'var(--shadow-retro-soft)' : 'none',
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
