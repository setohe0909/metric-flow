import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useDashboard } from '@/features/dashboards/hooks/use-dashboards';
import { useWidgets } from '@/features/widgets/hooks/use-widgets';
import { useQueries } from '@/features/queries/hooks/use-queries';
import { ChartRenderer } from '@/features/widgets/components/chart-renderer';
import { ErrorBoundary } from '@/components/error-boundary';
import { useAuth } from '@/features/auth/hooks/use-auth';
import { SpotlightCard } from '@/components/spotlight-card';
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
} from 'lucide-react';
import ReactGridLayout, { WidthProvider } from 'react-grid-layout/legacy';

const ReactGridLayoutWithWidth = WidthProvider(ReactGridLayout);

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
  } = useDashboard(id || '');
  const { deleteWidget } = useWidgets();

  const [isEditingLayout, setIsEditingLayout] = useState(false);
  const [localLayouts, setLocalLayouts] = useState<any[]>([]);
  const [showSharePanel, setShowSharePanel] = useState(false);
  const [copied, setCopied] = useState(false);

  const isViewer = activeOrg?.role === 'viewer';

  // Initialize layouts from dashboard widgets
  useEffect(() => {
    if (dashboard?.widgets) {
      setLocalLayouts(
        dashboard.widgets.map((w: any) => ({
          i: w.id,
          x: w.layoutX,
          y: w.layoutY,
          w: w.layoutW,
          h: w.layoutH,
        }))
      );
    }
  }, [dashboard]);

  if (isLoadingDashboard) {
    return (
      <div className="py-20 flex justify-center items-center">
        <Loader2 className="animate-spin h-8 w-8 text-[#f7a501]" />
      </div>
    );
  }

  if (dashboardError || !dashboard) {
    return (
      <div className="p-6 bg-red-100 border-2 border-[#23251d] rounded-2xl text-red-750 flex flex-col items-center justify-center gap-2 max-w-md mx-auto mt-10 shadow-[4px_4px_0px_0px_#23251d]">
        <AlertTriangle className="h-6 w-6 text-red-650" />
        <h3 className="font-extrabold font-mono text-[#23251d]">Error al cargar el dashboard</h3>
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

  const handleSaveLayout = async () => {
    try {
      const layoutsPayload = localLayouts.map((l) => ({
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
    if (dashboard?.widgets) {
      setLocalLayouts(
        dashboard.widgets.map((w: any) => ({
          i: w.id,
          x: w.layoutX,
          y: w.layoutY,
          w: w.layoutW,
          h: w.layoutH,
        }))
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

  const handleCopyLink = () => {
    const link = `${window.location.origin}/shared/dashboard/${dashboard.shareToken}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleLayoutChange = (newLayout: any) => {
    if (isEditingLayout) {
      setLocalLayouts(newLayout);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 border-b-2 border-[#23251d] pb-6">
        <div className="space-y-1">
          <Link
            to="/dashboards"
            className="inline-flex items-center gap-1.5 text-xs text-[#4d4f46] hover:text-[#23251d] transition-colors mb-2 font-mono"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Volver a Dashboards
          </Link>
          <h1 className="text-2xl font-extrabold text-[#23251d] flex items-center gap-2.5 font-mono">
            <LayoutDashboard className="h-6 w-6 text-[#f7a501]" /> {dashboard.name}
          </h1>
          {dashboard.description && (
            <p className="text-xs text-[#4d4f46] max-w-2xl font-mono">{dashboard.description}</p>
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
                      <Loader2 className="animate-spin h-3.5 w-3.5 text-[#23251d]" />
                    ) : (
                      <Save className="h-3.5 w-3.5 text-[#23251d]" />
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
                  Editar Diseño
                </button>
              )}

              <button
                onClick={() => setShowSharePanel(!showSharePanel)}
                className={`btn-retro-secondary ${
                  dashboard.isPublic ? 'border-[#f7a501] text-[#f7a501]' : ''
                }`}
              >
                <Share2 className="h-4 w-4" />
                Compartir
              </button>

              <Link
                to={`/dashboards/${dashboard.id}/widgets/new`}
                className="btn-retro-primary"
              >
                <Plus className="h-4 w-4 text-[#23251d]" /> Agregar Widget
              </Link>
            </>
          )}
        </div>
      </div>

      {/* Share Panel */}
      {showSharePanel && (
        <div className="bg-[#eeefe9] border-2 border-[#23251d] rounded-2xl p-5 space-y-4 animate-in fade-in slide-in-from-top-2 duration-200 shadow-[4px_4px_0px_0px_#23251d]">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="space-y-1">
              <h3 className="text-sm font-extrabold text-[#23251d] font-mono">Compartir Dashboard Públicamente</h3>
              <p className="text-xs text-[#4d4f46] leading-relaxed font-mono">
                Permite que cualquier persona acceda a este dashboard a través de un enlace de solo lectura y marca blanca.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-[#4d4f46] font-extrabold font-mono">
                {dashboard.isPublic ? 'Compartido' : 'Privado'}
              </span>
              <button
                onClick={handleToggleShare}
                disabled={isTogglingShare}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  dashboard.isPublic ? 'bg-[#f7a501]' : 'bg-slate-350'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    dashboard.isPublic ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>

          {dashboard.isPublic && dashboard.shareToken && (
            <div className="space-y-2 pt-3 border-t-2 border-[#23251d]/10">
              <label className="text-[11px] font-bold text-[#4d4f46] uppercase tracking-wider font-mono">
                Enlace Público Compartido
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  readOnly
                  value={`${window.location.origin}/shared/dashboard/${dashboard.shareToken}`}
                  className="flex-1 bg-white border-2 border-[#23251d] rounded-xl px-3 py-2 text-xs text-[#23251d] focus:outline-none focus:border-[#f7a501] transition-all font-mono shadow-[2px_2px_0px_0px_#23251d]"
                />
                <button
                  onClick={handleCopyLink}
                  className="btn-retro-secondary text-xs"
                >
                  {copied ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-green-600" /> Copiado
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5 text-[#23251d]" /> Copiar Enlace
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Widgets Canvas */}
      {(!dashboard.widgets || dashboard.widgets.length === 0) ? (
        <div className="border-2 border-dashed border-[#23251d] rounded-2xl p-16 flex flex-col items-center justify-center text-center bg-white shadow-[4px_4px_0px_0px_#23251d]">
          <div className="p-4 bg-[#f4f4f0] border-2 border-[#23251d] rounded-2xl text-slate-500 mb-4">
            <LayoutDashboard className="h-8 w-8 text-[#f7a501]" />
          </div>
          <h3 className="text-base font-extrabold text-[#23251d] font-mono">Este dashboard está vacío</h3>
          <p className="text-xs text-[#4d4f46] max-w-xs mt-1 mb-6 leading-relaxed font-mono">
            Agrega gráficos visuales para analizar tus indicadores clave de rendimiento (KPIs).
          </p>
          {!isViewer && (
            <Link
              to={`/dashboards/${dashboard.id}/widgets/new`}
              className="btn-retro-primary"
            >
              <Plus className="h-4 w-4 text-[#23251d]" /> Agregar primer widget
            </Link>
          )}
        </div>
      ) : (
        <div className="relative">
          <ReactGridLayoutWithWidth
            className="layout"
            layout={localLayouts}
            cols={12}
            rowHeight={80}
            isDraggable={isEditingLayout}
            isResizable={isEditingLayout}
            draggableHandle=".drag-handle"
            onLayoutChange={handleLayoutChange}
            margin={[20, 20]}
          >
            {dashboard.widgets.map((widget) => (
              <SpotlightCard
                key={widget.id}
                className={`hover:border-[#f7a501] !p-0 ${
                  isEditingLayout
                    ? 'border-dashed border-[#f7a501] bg-[#f7a501]/5'
                    : 'border-[#23251d]'
                }`}
              >
                {/* Retro OS Header Bar */}
                <div className="bg-[#e4e5de] border-b-2 border-[#23251d] px-4 py-2.5 flex items-center justify-between gap-3 drag-handle cursor-grab active:cursor-grabbing">
                  <div className="flex gap-1.5 shrink-0">
                    <div className="w-3.5 h-3.5 rounded-full window-circle-red" />
                    <div className="w-3.5 h-3.5 rounded-full window-circle-yellow" />
                    <div className="w-3.5 h-3.5 rounded-full window-circle-green" />
                  </div>
                  <span className="text-xs font-extrabold text-[#23251d] truncate font-mono flex-1 text-center select-none">
                    {widget.title}.json
                  </span>
                  {!isViewer && !isEditingLayout && (
                    <button
                      onClick={() => handleDeleteWidget(widget.id, widget.title)}
                      className="text-[#4d4f46] hover:text-red-500 hover:bg-red-500/10 p-1 rounded transition-all"
                      title="Eliminar widget"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>

                {/* Chart container */}
                <div className="flex-1 min-h-0 p-5 bg-white">
                  <ErrorBoundary>
                    <WidgetContainer widget={widget} />
                  </ErrorBoundary>
                </div>
              </SpotlightCard>
            ))}
          </ReactGridLayoutWithWidth>
        </div>
      )}
    </div>
  );
}

function WidgetContainer({ widget }: { widget: any }) {
  const { runQuery } = useQueries();
  const [data, setData] = useState<Record<string, any>[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    async function loadData() {
      if (!widget.query) {
        setLoading(false);
        setError('Consulta no vinculada.');
        return;
      }
      try {
        setLoading(true);
        setError(null);
        const res = await runQuery({
          datasourceId: widget.query.datasourceId,
          querySql: widget.query.querySql,
        });
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
  }, [widget.query, runQuery]);

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center text-[#4d4f46] py-6">
        <Loader2 className="animate-spin h-5 w-5 text-[#f7a501]" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center p-3 space-y-1 text-[#4d4f46] text-xs font-mono">
        <Clock className="h-5 w-5 text-red-500 mb-1" />
        <span className="text-[10px] text-red-650 font-bold truncate max-w-full">
          Fallo al cargar datos
        </span>
        <p className="text-[9px] text-[#4d4f46] line-clamp-2">{error}</p>
      </div>
    );
  }

  return (
    <ChartRenderer
      type={widget.type}
      chartConfig={widget.chartConfig}
      data={data || []}
    />
  );
}
