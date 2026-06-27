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
    <aside className="rounded-2xl border-2 border-[#23251d] bg-[#23251d] p-4 text-white shadow-[4px_4px_0px_0px_#f7a501] lg:sticky lg:top-24 lg:self-start">
      <div className="mb-4 rounded-xl border border-white/10 bg-white/[0.06] p-3">
        <div className="mb-3 flex items-center gap-2 border-b border-white/15 pb-2">
          <LayoutDashboard className="h-4 w-4 text-[#f7a501]" />
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
                className={`w-full rounded-xl border-2 px-3 py-2 text-left text-xs font-extrabold transition-all focus:outline-none focus:ring-2 focus:ring-[#f7a501] ${
                  active
                    ? 'border-[#f7a501] bg-[#f7a501] text-[#23251d] shadow-[2px_2px_0px_0px_#eeefe9]'
                    : 'border-white/20 bg-white/10 text-white hover:border-[#f7a501]'
                }`}
              >
                {page.title}
              </button>
            );
          })}
        </nav>
        <button
          type="button"
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border-2 border-white/25 bg-white/10 px-3 py-2 text-xs font-bold text-white/80 transition-all hover:border-[#f7a501] hover:text-white"
          title="Próximamente: crear sección"
        >
          <Plus className="h-3.5 w-3.5" />
          Nueva sección
        </button>
      </div>

      <div className="mb-3 flex items-center gap-2 border-b-2 border-white/20 pb-3">
        <LayoutTemplate className="h-4 w-4 text-[#f7a501]" />
        <div>
          <p className="text-[11px] font-extrabold uppercase tracking-wider font-mono">
            Studio
          </p>
          <p className="text-[10px] text-white/60">Agrega bloques al canvas</p>
        </div>
      </div>

      <div className="space-y-2">
        {narrativeItems.map(({ type, label, description, icon: Icon }) => (
          <button
            key={type}
            type="button"
            disabled={disabled}
            onClick={() => onAddWidget(type)}
            className="group w-full rounded-xl border-2 border-white/20 bg-white/10 p-3 text-left transition-all hover:-translate-y-0.5 hover:border-[#f7a501] hover:bg-[#f7a501] hover:text-[#23251d] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <div className="flex items-start gap-2">
              <Icon className="mt-0.5 h-4 w-4 text-[#f7a501] group-hover:text-[#23251d]" />
              <div>
                <p className="text-xs font-extrabold font-mono">{label}</p>
                <p className="text-[10px] leading-snug text-white/60 group-hover:text-[#23251d]/70">
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
          className="w-full rounded-xl border-2 border-[#f7a501] bg-[#f7a501] p-3 text-left text-[#23251d] shadow-[2px_2px_0px_0px_#eeefe9] transition-all hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <div className="flex items-start gap-2">
            <BarChart3 className="mt-0.5 h-4 w-4" />
            <div>
              <p className="text-xs font-extrabold font-mono">Chart / KPI</p>
              <p className="text-[10px] leading-snug text-[#23251d]/70">
                Abre el creador con consultas, ejes y colores
              </p>
            </div>
          </div>
        </button>
      </div>

      <div className="mt-3 rounded-xl border border-white/10 bg-black/20 p-2 text-[10px] leading-relaxed text-white/60">
        <MousePointer2 className="mr-1 inline h-3 w-3 text-[#f7a501]" />
        Selecciona un widget del canvas para editar sus propiedades.
      </div>

      <div className="mt-2 flex items-center gap-1 text-[10px] text-white/50">
        <Table2 className="h-3 w-3" />
        Tablas y charts avanzados siguen en el creador actual.
      </div>
    </aside>
  );
}
