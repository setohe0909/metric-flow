import { ChartRenderer } from '@/features/widgets/components/chart-renderer';
import type { DashboardWidget } from '../types/dashboard-studio';

interface DashboardWidgetRendererProps {
  widget: DashboardWidget;
  data?: Record<string, any>[];
}

export function DashboardWidgetRenderer({ widget, data = [] }: DashboardWidgetRendererProps) {
  const visualConfig = widget.visualConfig ?? {};

  switch (widget.type) {
    case 'text':
    case 'markdown':
      return (
        <div className="h-full overflow-auto rounded-xl border border-[var(--color-border-soft)] bg-[var(--color-chart-surface)] p-4 text-[var(--color-chart-ink)]">
          <div className="whitespace-pre-wrap text-sm leading-relaxed">
            {visualConfig.markdown || visualConfig.text || widget.title}
          </div>
        </div>
      );

    case 'divider':
      return (
        <div className="flex h-full items-center">
          <div className="h-0.5 w-full bg-[var(--color-border-strong)]" />
        </div>
      );

    case 'image':
      return visualConfig.imageUrl ? (
        <img
          src={visualConfig.imageUrl}
          alt={widget.title}
          className="h-full w-full rounded-xl object-cover"
        />
      ) : (
        <div className="flex h-full items-center justify-center rounded-xl border border-[var(--color-border-soft)] bg-[var(--color-chart-surface)] text-xs font-bold text-[var(--color-chart-ink)]">
          Imagen sin URL
        </div>
      );

    case 'button':
      return (
        <div className="flex h-full items-center justify-center">
          <a
            href={widget.interactionConfig?.href || '#'}
            target={widget.interactionConfig?.href ? '_blank' : undefined}
            rel="noreferrer"
            className="btn-retro-primary"
          >
            {visualConfig.text || widget.title}
          </a>
        </div>
      );

    default:
      return (
        <ChartRenderer
          type={widget.type}
          chartConfig={widget.chartConfig ?? {}}
          data={data}
        />
      );
  }
}
