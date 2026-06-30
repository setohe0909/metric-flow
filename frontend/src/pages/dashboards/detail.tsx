import { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useDashboard } from '@/features/dashboards/hooks/use-dashboards';
import { useWidgets } from '@/features/widgets/hooks/use-widgets';
import { DashboardSidebar } from '@/features/dashboards/components/dashboard-sidebar';
import { DashboardStudioPalette, type StudioPaletteType } from '@/features/dashboards/components/dashboard-studio-palette';
import { DashboardPropertiesPanel } from '@/features/dashboards/components/dashboard-properties-panel';
import { DashboardWidgetRenderer } from '@/features/dashboards/components/dashboard-widget-renderer';
import type { DashboardWidget } from '@/features/dashboards/types/dashboard-studio';
import { getDashboardPages, getInitialPageId, widgetNeedsData } from '@/features/dashboards/utils/dashboard-pages';
import { ErrorBoundary } from '@/components/error-boundary';
import { useAuth } from '@/features/auth/hooks/use-auth';
import { apiClient } from '@/lib/api-client';
import {
  LayoutDashboard,
  Plus,
  Trash2,
  Loader2,
  ArrowLeft,
  AlertTriangle,
  Clock,
  GripHorizontal,
  Share2,
  Copy,
  Check,
  Save,
  X,
  Code2,
  Eye,
  EyeOff,
  Link as LinkIcon,
} from 'lucide-react';
import ReactGridLayout, { WidthProvider } from 'react-grid-layout/legacy';

const ReactGridLayoutWithWidth = WidthProvider(ReactGridLayout);

const toWidgetLayout = (widget: DashboardWidget) => ({
  i: widget.id,
  x: widget.layoutX ?? 0,
  y: widget.layoutY ?? 0,
  w: widget.layoutW ?? 4,
  h: widget.layoutH ?? 3,
});

const normalizeLayout = (layout: any[]) =>
  layout
    .map((item) => ({
      i: String(item.i),
      x: Number(item.x ?? 0),
      y: Number(item.y ?? 0),
      w: Number(item.w ?? 4),
      h: Number(item.h ?? 3),
    }))
    .sort((a, b) => a.i.localeCompare(b.i));

const collides = (item: any, other: any) => (
  item.i !== other.i &&
  item.x < other.x + other.w &&
  item.x + item.w > other.x &&
  item.y < other.y + other.h &&
  item.y + item.h > other.y
);

const compactLayout = (layout: any[]) => {
  const sorted = normalizeLayout(layout).sort((a, b) => (
    a.y === b.y ? a.x - b.x : a.y - b.y
  ));
  const compacted: any[] = [];

  for (const rawItem of sorted) {
    const item = { ...rawItem, y: Math.max(0, rawItem.y) };

    while (item.y > 0) {
      const candidate = { ...item, y: item.y - 1 };
      if (compacted.some((other) => collides(candidate, other))) break;
      item.y -= 1;
    }

    while (compacted.some((other) => collides(item, other))) {
      item.y += 1;
    }

    compacted.push(item);
  }

  return compacted;
};

const layoutItemsAreEqual = (current: any[], next: any[]) => {
  const currentLayout = normalizeLayout(current);
  const nextLayout = normalizeLayout(next);
  if (currentLayout.length !== nextLayout.length) return false;
  return currentLayout.every((item, index) => {
    const nextItem = nextLayout[index];
    return (
      nextItem &&
      item.i === nextItem.i &&
      item.x === nextItem.x &&
      item.y === nextItem.y &&
      item.w === nextItem.w &&
      item.h === nextItem.h
    );
  });
};

const mergeWidgetLayouts = (current: any[], widgets: DashboardWidget[]) => {
  const currentById = new Map(normalizeLayout(current).map((item) => [item.i, item]));
  return compactLayout(widgets.map((widget) => {
    const currentItem = currentById.get(widget.id);
    const widgetLayout = toWidgetLayout(widget);

    // react-grid-layout briefly creates a 1x1 fallback for a child that appears
    // before our local layout catches up. Do not preserve that fallback because
    // it renders as a tiny jumping widget at the bottom of the Studio canvas.
    if (!currentItem || (currentItem.w <= 1 && currentItem.h <= 1)) {
      return widgetLayout;
    }

    return currentItem;
  }));
};

export default function DashboardDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { activeOrg } = useAuth();
  const {
    dashboard,
    isLoadingDashboard,
    dashboardError,
    updateDashboardLayout,
    isUpdatingLayout,
    toggleShareDashboard,
    isTogglingShare,
    togglePublishDashboard,
    isTogglingPublish,
  } = useDashboard(id || '');
  const {
    createWidget,
    isCreatingWidget,
    updateWidget,
    isUpdatingWidget,
    deleteWidget,
  } = useWidgets();

  const [isEditingLayout, setIsEditingLayout] = useState(false);
  const [localLayouts, setLocalLayouts] = useState<any[]>([]);
  const [activePageId, setActivePageId] = useState('');
  const [selectedWidgetId, setSelectedWidgetId] = useState<string | null>(null);
  const [showSharePanel, setShowSharePanel] = useState(false);
  const [shareTab, setShareTab] = useState<'link' | 'embed'>('link');
  const [copied, setCopied] = useState(false);
  const [copiedEmbed, setCopiedEmbed] = useState(false);
  const [iframeWidth, setIframeWidth] = useState('100%');
  const [iframeHeight, setIframeHeight] = useState('600');

  const isViewer = activeOrg?.role === 'READER';

  const pages = useMemo(
    () => (dashboard ? getDashboardPages(dashboard) : []),
    [dashboard],
  );
  const activePage = pages.find((page) => page.id === activePageId) ?? pages[0];
  const activeWidgets = useMemo(
    () => activePage?.widgets ?? [],
    [activePage],
  );
  const localLayoutById = useMemo(
    () => new Map(localLayouts.map((item) => [String(item.i), item])),
    [localLayouts],
  );
  const selectedWidget = activeWidgets.find((widget) => widget.id === selectedWidgetId);
  const activePageQuery = activePage && activePage.id !== 'legacy-default-page'
    ? `?pageId=${activePage.id}`
    : '';

  useEffect(() => {
    if (dashboard && !activePageId) {
      setActivePageId(getInitialPageId(dashboard));
    }
  }, [activePageId, dashboard]);

  useEffect(() => {
    if (selectedWidgetId && !selectedWidget) {
      setSelectedWidgetId(null);
    }
  }, [selectedWidget, selectedWidgetId]);

  // Initialize layouts from active dashboard page widgets
  useEffect(() => {
    setLocalLayouts((current) => {
      const next = isEditingLayout
        ? mergeWidgetLayouts(current, activeWidgets)
        : compactLayout(activeWidgets.map(toWidgetLayout));
      return layoutItemsAreEqual(current, next) ? current : next;
    });
  }, [activeWidgets, isEditingLayout]);

  if (isLoadingDashboard) {
    return (
      <div className="py-20 flex justify-center items-center">
        <Loader2 className="animate-spin h-8 w-8 text-[var(--color-accent)]" />
      </div>
    );
  }

  if (dashboardError || !dashboard) {
    return (
      <div className="p-6 bg-red-100 border-2 border-[var(--color-border-strong)] rounded-2xl text-red-750 flex flex-col items-center justify-center gap-2 max-w-md mx-auto mt-10 shadow-[var(--shadow-retro-strong)]">
        <AlertTriangle className="h-6 w-6 text-red-650" />
        <h3 className="font-extrabold font-mono text-[var(--color-ink)]">Error al cargar el dashboard</h3>
        <p className="text-xs text-red-800">Asegúrate de tener acceso o que el dashboard exista.</p>
        <button
          onClick={() => navigate('/dashboards')}
          className="btn-retro-secondary mt-4"
        >
          Volver a Dashboards
        </button>
      </div>
    );
  }

  const handleDeleteWidget = async (widgetId: string, widgetTitle: string) => {
    if (isViewer) return;
    if (confirm(`¿Estás seguro de quitar el widget "${widgetTitle}" de este dashboard?`)) {
      try {
        await deleteWidget({ id: widgetId, dashboardId: dashboard.id });
      } catch (err: any) {
        alert(err.response?.data?.message || 'Error al eliminar el widget.');
      }
    }
  };

  const handleAddStudioWidget = async (type: StudioPaletteType) => {
    if (isViewer || !dashboard?.id) return;
    const pageId = activePage?.id === 'legacy-default-page' ? undefined : activePage?.id;
    const defaults = {
      text: {
        title: 'Nuevo bloque de texto',
        layoutW: 6,
        layoutH: 3,
        visualConfig: {
          text: 'Escribe aquí el insight que acompaña este dashboard.',
          markdown: 'Escribe aquí el insight que acompaña este dashboard.',
        },
      },
      divider: {
        title: 'Separador',
        layoutW: 12,
        layoutH: 1,
        visualConfig: {},
      },
      image: {
        title: 'Imagen',
        layoutW: 4,
        layoutH: 3,
        visualConfig: {
          imageUrl: '',
        },
      },
    } satisfies Record<StudioPaletteType, {
      title: string;
      layoutW: number;
      layoutH: number;
      visualConfig: Record<string, any>;
    }>;
    const config = defaults[type];
    const compactedLayout = compactLayout(localLayouts.length
      ? localLayouts
      : activeWidgets.map(toWidgetLayout));
    const layoutY = Math.max(0, ...compactedLayout.map((item) => item.y + item.h));
    const created = await createWidget({
      dashboardId: dashboard.id,
      pageId,
      title: config.title,
      type,
      chartConfig: {},
      configVersion: 2,
      visualConfig: config.visualConfig,
      layoutX: 0,
      layoutY,
      layoutW: config.layoutW,
      layoutH: config.layoutH,
    });
    setLocalLayouts((current) => {
      const next = [
        ...(current.length ? compactLayout(current) : compactedLayout),
        {
          i: created.id,
          x: 0,
          y: layoutY,
          w: config.layoutW,
          h: config.layoutH,
        },
      ];
      return compactLayout(next);
    });
    setSelectedWidgetId(created.id);
    setIsEditingLayout(true);
  };

  const handleSaveWidgetProperties = async (changes: {
    title: string;
    visualConfig: Record<string, any>;
  }) => {
    if (!dashboard?.id || !selectedWidget) return;
    await updateWidget({
      id: selectedWidget.id,
      dashboardId: dashboard.id,
      data: {
        title: changes.title,
        visualConfig: changes.visualConfig,
        configVersion: 2,
      },
    });
  };

  const handleOpenChartCreator = () => {
    navigate(`/dashboards/${dashboard.id}/widgets/new${activePageQuery}`);
  };

  const handleSaveLayout = async () => {
    try {
      const layoutsPayload = compactLayout(localLayouts).map((l) => ({
        id: l.i,
        x: l.x,
        y: l.y,
        w: l.w,
        h: l.h,
      }));
      await updateDashboardLayout(layoutsPayload);
      setIsEditingLayout(false);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error al guardar el diseño.');
    }
  };

  const handleCancelLayout = () => {
    if (activeWidgets) {
      setLocalLayouts(
        compactLayout(activeWidgets.map(toWidgetLayout))
      );
    }
    setIsEditingLayout(false);
  };

  const handleToggleShare = async () => {
    try {
      await toggleShareDashboard(!dashboard.isPublic);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error al cambiar estado de compartido.');
    }
  };

  const handleTogglePublished = async () => {
    try {
      await togglePublishDashboard(!dashboard.publishedAt);
    } catch (err: any) {
      alert(
        err.response?.data?.message ||
          'Error al cambiar el estado de publicación.',
      );
    }
  };

  const handleCopyLink = () => {
    const link = `${window.location.origin}/shared/dashboard/${dashboard.shareToken}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyEmbed = () => {
    const src = `${window.location.origin}/shared/dashboard/${dashboard.shareToken}`;
    const snippet = `<iframe\n  src="${src}"\n  width="${iframeWidth}"\n  height="${iframeHeight}"\n  frameborder="0"\n  allowfullscreen\n></iframe>`;
    navigator.clipboard.writeText(snippet);
    setCopiedEmbed(true);
    setTimeout(() => setCopiedEmbed(false), 2000);
  };

  const handleLayoutInteraction = (nextLayout: any) => {
    if (!isEditingLayout) return;
    setLocalLayouts((current) => (
      layoutItemsAreEqual(current, nextLayout) ? current : normalizeLayout(nextLayout)
    ));
  };

  const handleResizeWidgetByStep = (
    widgetId: string,
    delta: { w?: number; h?: number },
  ) => {
    setSelectedWidgetId(widgetId);
    setLocalLayouts((current) => {
      const baseLayout = current.length
        ? normalizeLayout(current)
        : compactLayout(activeWidgets.map(toWidgetLayout));
      const next = baseLayout.map((item) => {
        if (item.i !== widgetId) return item;

        const nextW = Math.min(12, Math.max(2, item.w + (delta.w ?? 0)));
        const nextH = Math.min(10, Math.max(1, item.h + (delta.h ?? 0)));
        const nextX = Math.min(item.x, 12 - nextW);

        return {
          ...item,
          x: Math.max(0, nextX),
          w: nextW,
          h: nextH,
        };
      });

      return compactLayout(next);
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 border-b-2 border-[var(--color-border-soft)] pb-6">
        <div className="space-y-1">
          <Link
            to="/dashboards"
            className="inline-flex items-center gap-1.5 text-xs text-[var(--color-subtle-text)] hover:text-[var(--color-ink)] transition-colors mb-2 font-mono"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Volver a Dashboards
          </Link>
          <h1 className="text-2xl font-extrabold text-[var(--color-ink)] flex items-center gap-2.5 font-mono">
            <LayoutDashboard className="h-6 w-6 text-[var(--color-accent)]" /> {dashboard.name}
            <span
              className={`text-[10px] uppercase px-2 py-1 rounded border-2 border-[var(--color-border-strong)] ${
                dashboard.publishedAt
                  ? 'bg-green-200 text-green-950'
                  : 'bg-[var(--color-muted-surface)] text-[var(--color-muted-text)]'
              }`}
            >
              {dashboard.publishedAt ? 'Publicado' : 'Borrador'}
            </span>
          </h1>
          {dashboard.description && (
            <p className="text-xs text-[var(--color-muted-text)] max-w-2xl font-mono">{dashboard.description}</p>
          )}
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-3">
          {!isViewer && (
            <>
              {isEditingLayout ? (
                <div className="flex items-center gap-2.5">
                  <button
                    onClick={handleSaveLayout}
                    disabled={isUpdatingLayout}
                    className="btn-retro-primary text-xs"
                  >
                    {isUpdatingLayout ? (
                      <Loader2 className="animate-spin h-3.5 w-3.5 text-[var(--color-on-accent)]" />
                    ) : (
                      <Save className="h-3.5 w-3.5 text-[var(--color-on-accent)]" />
                    )}
                    Guardar Diseño
                  </button>
                  <button
                    onClick={handleCancelLayout}
                    disabled={isUpdatingLayout}
                    className="btn-retro-secondary text-xs"
                  >
                    <X className="h-3.5 w-3.5" />
                    Cancelar
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setIsEditingLayout(true)}
                  className="btn-retro-secondary"
                >
                  <GripHorizontal className="h-4 w-4 text-slate-500" />
                  Abrir Studio
                </button>
              )}

              <button
                onClick={handleTogglePublished}
                disabled={isTogglingPublish}
                className="btn-retro-secondary"
              >
                {isTogglingPublish ? (
                  <Loader2 className="animate-spin h-4 w-4" />
                ) : dashboard.publishedAt ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
                {dashboard.publishedAt ? 'Retirar' : 'Publicar'}
              </button>

              <button
                onClick={() => setShowSharePanel(!showSharePanel)}
                className={`btn-retro-secondary ${
                  dashboard.isPublic ? 'border-[var(--color-accent)] text-[var(--color-accent)]' : ''
                }`}
              >
                <Share2 className="h-4 w-4" />
                Compartir
              </button>

              <Link
                to={`/dashboards/${dashboard.id}/widgets/new${activePageQuery}`}
                className="btn-retro-primary"
              >
                <Plus className="h-4 w-4 text-[var(--color-on-accent)]" /> Agregar Widget
              </Link>
            </>
          )}
        </div>
      </div>

      {/* Share Panel */}
      {showSharePanel && (
        <div className="bg-[var(--color-surface)] border-2 border-[var(--color-border-strong)] rounded-2xl p-5 space-y-4 animate-in fade-in slide-in-from-top-2 duration-200 shadow-[var(--shadow-retro-strong)]">
          {/* Header row: title + toggle */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="space-y-1">
              <h3 className="text-sm font-extrabold text-[var(--color-ink)] font-mono">Compartir Dashboard Públicamente</h3>
              <p className="text-xs text-[var(--color-muted-text)] leading-relaxed font-mono">
                Permite que cualquier persona acceda a este dashboard a través de un enlace de solo lectura y marca blanca.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-[var(--color-muted-text)] font-extrabold font-mono">
                {dashboard.isPublic ? 'Compartido' : 'Privado'}
              </span>
              <button
                onClick={handleToggleShare}
                disabled={isTogglingShare}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  dashboard.isPublic ? 'bg-[var(--color-accent)]' : 'bg-[var(--color-muted-surface)]'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-[var(--color-widget)] shadow ring-0 transition duration-200 ease-in-out ${
                    dashboard.isPublic ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>

          {dashboard.isPublic && dashboard.shareToken && (
            <div className="space-y-3 pt-3 border-t-2 border-[color-mix(in_srgb,var(--color-border-strong)_12%,transparent)]">
              {/* Tab selector: Link vs Embed */}
              <div className="flex border-2 border-[var(--color-border-strong)] rounded-xl overflow-hidden shadow-[var(--shadow-retro-soft)] w-fit font-mono text-xs font-bold">
                <button
                  onClick={() => setShareTab('link')}
                  className={`flex items-center gap-1.5 px-4 py-2 border-r-2 border-[var(--color-border-strong)] transition-colors ${
                    shareTab === 'link' ? 'bg-[var(--color-accent)] text-[var(--color-on-accent)]' : 'bg-[var(--color-widget)] text-[var(--color-muted-text)] hover:bg-[var(--color-muted-surface)]'
                  }`}
                >
                  <LinkIcon className="h-3.5 w-3.5" /> Enlace
                </button>
                <button
                  onClick={() => setShareTab('embed')}
                  className={`flex items-center gap-1.5 px-4 py-2 transition-colors ${
                    shareTab === 'embed' ? 'bg-[var(--color-accent)] text-[var(--color-on-accent)]' : 'bg-[var(--color-widget)] text-[var(--color-muted-text)] hover:bg-[var(--color-muted-surface)]'
                  }`}
                >
                  <Code2 className="h-3.5 w-3.5" /> Embed
                </button>
              </div>

              {shareTab === 'link' && (
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-[var(--color-muted-text)] uppercase tracking-wider font-mono">
                    Enlace Público Compartido
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      readOnly
                      value={`${window.location.origin}/shared/dashboard/${dashboard.shareToken}`}
                      className="flex-1 bg-[var(--color-widget)] border-2 border-[var(--color-border-strong)] rounded-xl px-3 py-2 text-xs text-[var(--color-ink)] focus:outline-none focus:border-[var(--color-accent)] transition-all font-mono shadow-[var(--shadow-retro-soft)]"
                    />
                    <button onClick={handleCopyLink} className="btn-retro-secondary text-xs">
                      {copied ? (
                        <><Check className="h-3.5 w-3.5 text-green-600" /> Copiado</>
                      ) : (
                        <><Copy className="h-3.5 w-3.5 text-[var(--color-ink)]" /> Copiar Enlace</>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {shareTab === 'embed' && (
                <div className="space-y-3">
                  <label className="text-[11px] font-bold text-[var(--color-muted-text)] uppercase tracking-wider font-mono">
                    Código de Integración (iframe)
                  </label>

                  {/* Dimensiones */}
                  <div className="flex gap-3">
                    <div className="flex-1">
                      <label className="block text-[10px] font-bold font-mono text-[var(--color-muted-text)] mb-1">Ancho</label>
                      <input
                        type="text"
                        value={iframeWidth}
                        onChange={(e) => setIframeWidth(e.target.value)}
                        className="w-full px-3 py-1.5 border-2 border-[var(--color-border-strong)] rounded-lg bg-[var(--color-widget)] text-xs font-mono text-[var(--color-ink)] focus:outline-none shadow-[1px_1px_0px_0px_var(--color-border-strong)]"
                        placeholder="100% o 800px"
                      />
                    </div>
                    <div className="w-28">
                      <label className="block text-[10px] font-bold font-mono text-[var(--color-muted-text)] mb-1">Alto (px)</label>
                      <input
                        type="text"
                        value={iframeHeight}
                        onChange={(e) => setIframeHeight(e.target.value)}
                        className="w-full px-3 py-1.5 border-2 border-[var(--color-border-strong)] rounded-lg bg-[var(--color-widget)] text-xs font-mono text-[var(--color-ink)] focus:outline-none shadow-[1px_1px_0px_0px_var(--color-border-strong)]"
                        placeholder="600"
                      />
                    </div>
                  </div>

                  {/* Snippet preview */}
                  <div
                    className="border-2 border-[var(--color-border-strong)] rounded-xl overflow-hidden"
                    style={{ boxShadow: 'var(--shadow-retro-soft)' }}
                  >
                    {/* Fake code editor titlebar */}
                    <div className="bg-[var(--color-ink)] px-4 py-2 flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full bg-red-500 opacity-70" />
                      <div className="w-2.5 h-2.5 rounded-full bg-yellow-400 opacity-70" />
                      <div className="w-2.5 h-2.5 rounded-full bg-green-500 opacity-70" />
                      <span className="text-[10px] font-mono text-slate-400 ml-2">embed.html</span>
                    </div>
                    <pre
                      className="bg-[var(--color-canvas)] text-[var(--color-ink)] text-[11px] font-mono p-4 overflow-x-auto leading-relaxed whitespace-pre"
                    >{`<iframe
  src="${window.location.origin}/shared/dashboard/${dashboard.shareToken}"
  width="${iframeWidth}"
  height="${iframeHeight}"
  frameborder="0"
  allowfullscreen
></iframe>`}</pre>
                  </div>

                  <button onClick={handleCopyEmbed} className="btn-retro-primary text-xs">
                    {copiedEmbed ? (
                      <><Check className="h-3.5 w-3.5 text-[var(--color-on-accent)]" /> Copiado!</>
                    ) : (
                      <><Copy className="h-3.5 w-3.5 text-[var(--color-on-accent)]" /> Copiar código embed</>
                    )}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <div className={`grid grid-cols-1 gap-6 ${
        isEditingLayout && !isViewer
          ? 'xl:grid-cols-[280px_minmax(0,1fr)_320px]'
          : 'lg:grid-cols-[220px_1fr]'
      }`}>
        {isEditingLayout && !isViewer ? (
          <DashboardStudioPalette
            pages={pages}
            activePageId={activePage?.id ?? ''}
            disabled={isCreatingWidget}
            onSelectPage={setActivePageId}
            onAddWidget={handleAddStudioWidget}
            onOpenChartCreator={handleOpenChartCreator}
          />
        ) : (
          <div className="space-y-4">
            <DashboardSidebar
              pages={pages}
              activePageId={activePage?.id ?? ''}
              onSelectPage={setActivePageId}
            />
          </div>
        )}

        {/* Widgets Canvas */}
        {activeWidgets.length === 0 ? (
          <div className="border-2 border-dashed border-[var(--color-border-strong)] rounded-2xl p-16 flex flex-col items-center justify-center text-center bg-[var(--color-widget)] shadow-[var(--shadow-retro-strong)]">
            <div className="p-4 bg-[var(--color-muted-surface)] border-2 border-[var(--color-border-strong)] rounded-2xl text-slate-500 mb-4">
              <LayoutDashboard className="h-8 w-8 text-[var(--color-accent)]" />
            </div>
            <h3 className="text-base font-extrabold text-[var(--color-ink)] font-mono">Esta sección está vacía</h3>
            <p className="text-xs text-[var(--color-muted-text)] max-w-xs mt-1 mb-6 leading-relaxed font-mono">
              Agrega widgets visuales o narrativos para construir esta sección del dashboard.
            </p>
            {!isViewer && (
              <Link
                to={`/dashboards/${dashboard.id}/widgets/new${activePageQuery}`}
                className="btn-retro-primary"
              >
                <Plus className="h-4 w-4 text-[var(--color-on-accent)]" /> Agregar primer widget
              </Link>
            )}
          </div>
        ) : (
          <div className={isEditingLayout ? 'dashboard-studio-canvas relative rounded-3xl border-2 border-dashed border-[color-mix(in_srgb,var(--color-border-strong)_30%,transparent)] bg-[color-mix(in_srgb,var(--color-widget)_45%,transparent)] p-3' : 'relative'}>
            <ReactGridLayoutWithWidth
              className="layout"
              layout={localLayouts}
              cols={12}
              rowHeight={80}
              isDraggable={isEditingLayout}
              isResizable={isEditingLayout}
              resizeHandles={['se', 'e', 's']}
              compactType="vertical"
              isBounded={false}
              useCSSTransforms={!isEditingLayout}
              draggableHandle=".drag-handle"
              draggableCancel=".react-resizable-handle, input, textarea, button, a"
              onDrag={handleLayoutInteraction}
              onDragStop={handleLayoutInteraction}
              onResize={handleLayoutInteraction}
              onResizeStop={handleLayoutInteraction}
              margin={isEditingLayout ? [16, 16] : [20, 20]}
            >
              {activeWidgets.map((widget) => (
                <div
                  key={widget.id}
                  data-grid={localLayoutById.get(widget.id) ?? toWidgetLayout(widget)}
                  onClick={() => {
                    if (isEditingLayout && !isViewer) {
                      setSelectedWidgetId(widget.id);
                    }
                  }}
                  className={`group flex h-full flex-col rounded-2xl border-2 bg-[var(--color-widget)] text-[var(--color-ink)] shadow-[var(--shadow-retro-strong)] ${
                    isEditingLayout ? 'overflow-visible' : 'overflow-hidden'
                  } ${
                    selectedWidgetId === widget.id
                      ? 'border-[var(--color-accent)] ring-4 ring-[color-mix(in_srgb,var(--color-accent)_28%,transparent)]'
                      : isEditingLayout
                        ? 'border-dashed border-[var(--color-accent)] bg-[color-mix(in_srgb,var(--color-accent)_10%,transparent)]'
                        : 'border-[var(--color-border-strong)]'
                  }`}
                >
                  {/* Retro OS Header Bar */}
                  <div className="bg-[var(--color-widget-header)] border-b-2 border-[var(--color-border-soft)] px-4 py-2.5 flex items-center justify-between gap-3 drag-handle cursor-grab active:cursor-grabbing">
                    <div className="flex gap-1.5 shrink-0">
                      <div className="w-3.5 h-3.5 rounded-full window-circle-red" />
                      <div className="w-3.5 h-3.5 rounded-full window-circle-yellow" />
                      <div className="w-3.5 h-3.5 rounded-full window-circle-green" />
                    </div>
                    <span className="text-xs font-extrabold text-[var(--color-ink)] truncate font-mono flex-1 text-center select-none">
                      {widget.title}.json
                    </span>
                    {isEditingLayout && selectedWidgetId === widget.id && (
                      <div className="flex items-center gap-1">
                        {[
                          { label: 'W−', title: 'Reducir ancho', delta: { w: -1 } },
                          { label: 'W+', title: 'Aumentar ancho', delta: { w: 1 } },
                          { label: 'H−', title: 'Reducir alto', delta: { h: -1 } },
                          { label: 'H+', title: 'Aumentar alto', delta: { h: 1 } },
                        ].map((control) => (
                          <button
                            key={control.label}
                            type="button"
                            title={control.title}
                            onClick={(event) => {
                              event.stopPropagation();
                              handleResizeWidgetByStep(widget.id, control.delta);
                            }}
                            className="rounded-md border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-1.5 py-0.5 text-[9px] font-black text-[var(--color-ink)] shadow-[1px_1px_0_0_var(--color-border-strong)] hover:bg-[var(--color-accent)]"
                          >
                            {control.label}
                          </button>
                        ))}
                      </div>
                    )}
                    {!isViewer && !isEditingLayout && (
                      <button
                        onClick={() => handleDeleteWidget(widget.id, widget.title)}
                        className="text-[var(--color-muted-text)] hover:text-red-500 hover:bg-red-500/10 p-1 rounded transition-all"
                        title="Eliminar widget"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Chart container */}
                  <div className="flex-1 min-h-0 p-5 bg-[var(--color-chart-surface)] text-[var(--color-chart-ink)]">
                    <ErrorBoundary>
                      <WidgetContainer
                        dashboardId={dashboard.id}
                        widget={widget}
                      />
                    </ErrorBoundary>
                  </div>
                </div>
              ))}
            </ReactGridLayoutWithWidth>
          </div>
        )}

        {isEditingLayout && !isViewer && (
          <DashboardPropertiesPanel
            widget={selectedWidget}
            isSaving={isUpdatingWidget}
            onSave={handleSaveWidgetProperties}
            onDelete={(widget) => handleDeleteWidget(widget.id, widget.title)}
          />
        )}
      </div>
    </div>
  );
}

function WidgetContainer({
  dashboardId,
  widget,
}: {
  dashboardId: string;
  widget: DashboardWidget;
}) {
  const needsData = widgetNeedsData(widget.type);
  const [data, setData] = useState<Record<string, any>[] | null>(null);
  const [loading, setLoading] = useState(needsData);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!needsData) {
      return;
    }

    let active = true;
    async function loadData() {
      try {
        setLoading(true);
        setError(null);
        const { data: res } = await apiClient.get<{
          rows: Record<string, any>[];
        }>(`/dashboards/${dashboardId}/widgets/${widget.id}/data`);
        if (active) {
          setData(res.rows);
        }
      } catch (err: any) {
        if (active) {
          setError(err.response?.data?.message || 'Error al ejecutar SQL.');
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }
    loadData();

    return () => {
      active = false;
    };
  }, [dashboardId, needsData, widget.id, widget.updatedAt]);

  if (!needsData) {
    return <DashboardWidgetRenderer widget={widget} />;
  }

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center text-[var(--color-muted-text)] py-6">
        <Loader2 className="animate-spin h-5 w-5 text-[var(--color-accent)]" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center p-3 space-y-1 text-[var(--color-muted-text)] text-xs font-mono">
        <Clock className="h-5 w-5 text-red-500 mb-1" />
        <span className="text-[10px] text-red-650 font-bold truncate max-w-full">
          Fallo al cargar datos
        </span>
        <p className="text-[9px] text-[var(--color-muted-text)] line-clamp-2">{error}</p>
      </div>
    );
  }

  return (
    <DashboardWidgetRenderer widget={widget} data={data || []} />
  );
}
