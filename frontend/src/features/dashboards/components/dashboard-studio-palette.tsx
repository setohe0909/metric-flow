import {
  BarChart3,
  FileText,
  Image,
  LayoutDashboard,
  LayoutTemplate,
  Minus,
  MousePointer2,
  Plus,
  Table2,
} from 'lucide-react';
import type { DashboardPage } from '../types/dashboard-studio';

export type StudioPaletteType = 'text' | 'divider' | 'image';

interface DashboardStudioPaletteProps {
  pages: DashboardPage[];
  activePageId: string;
  disabled?: boolean;
  onSelectPage: (pageId: string) => void;
  onAddWidget: (type: StudioPaletteType) => void;
  onOpenChartCreator: () => void;
}

const narrativeItems: Array<{
  type: StudioPaletteType;
  label: string;
  description: string;
  icon: typeof FileText;
}> = [
  {
    type: 'text',
    label: 'Texto',
    description: 'Insights, notas y storytelling',
    icon: FileText,
  },
  {
    type: 'divider',
    label: 'Separador',
    description: 'Divide secciones visuales',
    icon: Minus,
  },
  {
    type: 'image',
    label: 'Imagen',
    description: 'Logos, banners y contexto',
    icon: Image,
  },
];

export function DashboardStudioPalette({
  pages,
  activePageId,
  disabled = false,
  onSelectPage,
  onAddWidget,
  onOpenChartCreator,
}: DashboardStudioPaletteProps) {
  return (
    <aside className="rounded-2xl border-2 border-[var(--color-border-strong)] bg-[var(--color-widget)] p-4 text-[var(--color-ink)] shadow-[var(--shadow-retro-strong)] lg:sticky lg:top-24 lg:self-start">
      <div className="mb-4 rounded-xl border border-[var(--color-border-soft)] bg-[color-mix(in_srgb,var(--color-chart-surface)_8%,transparent)] p-3">
        <div className="mb-3 flex items-center gap-2 border-b border-[var(--color-border-soft)] pb-2">
          <LayoutDashboard className="h-4 w-4 text-[var(--color-accent)]" />
          <p className="text-[11px] font-extrabold uppercase tracking-wider font-mono">
            Secciones
          </p>
        </div>
        <nav className="space-y-2" aria-label="Secciones del dashboard">
          {pages.map((page) => {
            const active = page.id === activePageId;
            return (
              <button
                key={page.id}
                type="button"
                onClick={() => onSelectPage(page.id)}
                className={`w-full rounded-xl border-2 px-3 py-2 text-left text-xs font-extrabold transition-all focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] ${
                  active
                    ? 'border-[var(--color-accent)] bg-[var(--color-accent)] text-[var(--color-on-accent)] shadow-[var(--shadow-retro-soft)]'
                    : 'border-[var(--color-border-soft)] bg-[var(--color-surface)] text-[var(--color-ink)] hover:border-[var(--color-accent)]'
                }`}
              >
                {page.title}
              </button>
            );
          })}
        </nav>
        <button
          type="button"
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border-2 border-[var(--color-border-soft)] bg-[var(--color-surface)] px-3 py-2 text-xs font-bold text-[var(--color-muted-text)] transition-all hover:border-[var(--color-accent)] hover:text-[var(--color-ink)]"
          title="Próximamente: crear sección"
        >
          <Plus className="h-3.5 w-3.5" />
          Nueva sección
        </button>
      </div>

      <div className="mb-3 flex items-center gap-2 border-b-2 border-[var(--color-border-soft)] pb-3">
        <LayoutTemplate className="h-4 w-4 text-[var(--color-accent)]" />
        <div>
          <p className="text-[11px] font-extrabold uppercase tracking-wider font-mono">
            Studio
          </p>
          <p className="text-[10px] text-[var(--color-muted-text)]">Agrega bloques al canvas</p>
        </div>
      </div>

      <div className="space-y-2">
        {narrativeItems.map(({ type, label, description, icon: Icon }) => (
          <button
            key={type}
            type="button"
            disabled={disabled}
            onClick={() => onAddWidget(type)}
            className="group w-full rounded-xl border-2 border-[var(--color-border-soft)] bg-[var(--color-surface)] p-3 text-left transition-all hover:-translate-y-0.5 hover:border-[var(--color-accent)] hover:bg-[var(--color-accent)] hover:text-[var(--color-on-accent)] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <div className="flex items-start gap-2">
              <Icon className="mt-0.5 h-4 w-4 text-[var(--color-accent)] group-hover:text-[var(--color-on-accent)]" />
              <div>
                <p className="text-xs font-extrabold font-mono">{label}</p>
                <p className="text-[10px] leading-snug text-[var(--color-muted-text)] group-hover:text-[var(--color-on-accent)]/70">
                  {description}
                </p>
              </div>
            </div>
          </button>
        ))}

        <button
          type="button"
          disabled={disabled}
          onClick={onOpenChartCreator}
          className="w-full rounded-xl border-2 border-[var(--color-accent)] bg-[var(--color-accent)] p-3 text-left text-[var(--color-on-accent)] shadow-[var(--shadow-retro-soft)] transition-all hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <div className="flex items-start gap-2">
            <BarChart3 className="mt-0.5 h-4 w-4" />
            <div>
              <p className="text-xs font-extrabold font-mono">Chart / KPI</p>
              <p className="text-[10px] leading-snug text-[color-mix(in_srgb,var(--color-on-accent)_70%,transparent)]">
                Abre el creador con consultas, ejes y colores
              </p>
            </div>
          </div>
        </button>
      </div>

      <div className="mt-3 rounded-xl border border-[var(--color-border-soft)] bg-[color-mix(in_srgb,var(--color-canvas)_60%,transparent)] p-2 text-[10px] leading-relaxed text-[var(--color-muted-text)]">
        <MousePointer2 className="mr-1 inline h-3 w-3 text-[var(--color-accent)]" />
        Selecciona un widget del canvas para editar sus propiedades.
      </div>

      <div className="mt-2 flex items-center gap-1 text-[10px] text-[var(--color-subtle-text)]">
        <Table2 className="h-3 w-3" />
        Tablas y charts avanzados siguen en el creador actual.
      </div>
    </aside>
  );
}
