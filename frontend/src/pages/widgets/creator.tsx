import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useDashboard } from '@/features/dashboards/hooks/use-dashboards';
import { useWidgets } from '@/features/widgets/hooks/use-widgets';
import { useQueries } from '@/features/queries/hooks/use-queries';
import { ChartRenderer } from '@/features/widgets/components/chart-renderer';
import { ErrorBoundary } from '@/components/error-boundary';
import { useAuth } from '@/features/auth/hooks/use-auth';
import {
  ArrowLeft,
  Loader2,
  Database,
  BarChart,
  LineChart,
  PieChart,
  Sliders,
  Save,
  HelpCircle,
  FileText,
  AlertTriangle,
} from 'lucide-react';

// ─── Paleta retro ───────────────────────────────────────────────
const C = {
  bg: '#eeefe9',
  card: '#f4f4f0',
  olive: '#23251d',
  muted: '#6b6e62',
  yellow: '#f7a501',
  border: '2px solid #23251d',
  shadow: '4px 4px 0px 0px #23251d',
  shadowSm: '3px 3px 0px 0px #23251d',
  shadowYellow: '3px 3px 0px 0px #f7a501',
};

// Estilos compartidos para inputs y selects
const inputClass = 'w-full px-3 py-2 rounded-xl text-sm outline-none transition-all';
const inputStyle: React.CSSProperties = {
  color: C.olive,
  backgroundColor: C.bg,
  border: C.border,
};

function RetroInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  const [focused, setFocused] = useState(false);
  return (
    <input
      {...props}
      className={`${inputClass} ${props.className ?? ''}`}
      style={{
        ...inputStyle,
        boxShadow: focused ? C.shadowYellow : 'none',
        ...(props.style ?? {}),
      }}
      onFocus={e => { setFocused(true); props.onFocus?.(e); }}
      onBlur={e => { setFocused(false); props.onBlur?.(e); }}
    />
  );
}

function RetroSelect(props: React.SelectHTMLAttributes<HTMLSelectElement> & { children: React.ReactNode }) {
  const [focused, setFocused] = useState(false);
  const { children, ...rest } = props;
  return (
    <select
      {...rest}
      className={`${inputClass} cursor-pointer font-medium ${rest.className ?? ''}`}
      style={{
        ...inputStyle,
        boxShadow: focused ? C.shadowYellow : 'none',
        ...(rest.style ?? {}),
      }}
      onFocus={e => { setFocused(true); rest.onFocus?.(e); }}
      onBlur={e => { setFocused(false); rest.onBlur?.(e); }}
    >
      {children}
    </select>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="block text-[11px] font-bold uppercase tracking-wider mb-1.5" style={{ color: C.muted }}>
      {children}
    </label>
  );
}

export default function WidgetCreator() {
  const { dashboardId } = useParams<{ dashboardId: string }>();
  const navigate = useNavigate();
  const { activeOrg } = useAuth();

  const { isLoadingDashboard } = useDashboard(dashboardId || '');
  const { savedQueries, isLoadingQueries } = useQueries();
  const { createWidget, isCreatingWidget } = useWidgets();
  const { runQuery } = useQueries();

  // Inputs del Formulario
  const [title, setTitle] = useState('');
  const [queryId, setQueryId] = useState('');
  const [chartType, setChartType] = useState<string>('bar');

  // Mapeos de Ejes
  const [xAxisColumn, setXAxisColumn] = useState('');
  const [yAxisColumn, setYAxisColumn] = useState('');
  const [selectedColor, setSelectedColor] = useState('#f7a501');
  const [kpiColumn, setKpiColumn] = useState('');
  const [kpiLabel, setKpiLabel] = useState('');

  // Estados de previsualización
  const [previewData, setPreviewData] = useState<Record<string, any>[] | null>(null);
  const [previewColumns, setPreviewColumns] = useState<string[]>([]);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState('');

  const isViewer = activeOrg?.role === 'READER';

  // Si se selecciona otra query, cargar su previsualización automáticamente
  useEffect(() => {
    if (!queryId) {
      setPreviewData(null);
      setPreviewColumns([]);
      setPreviewError(null);
      return;
    }

    const query = savedQueries.find((q) => q.id === queryId);
    if (!query) return;

    async function loadPreview() {
      setIsLoadingPreview(true);
      setPreviewError(null);
      try {
        const res = await runQuery({
          datasourceId: query!.datasourceId,
          querySql: query!.querySql,
        });
        setPreviewData(res.rows);
        setPreviewColumns(res.columns);

        if (res.columns.length > 0) {
          setXAxisColumn(res.columns[0]);
          setKpiColumn(res.columns[0]);
          setKpiLabel(res.columns[0]);
          setYAxisColumn(res.columns.length > 1 ? res.columns[1] : res.columns[0]);
        }
      } catch (err: any) {
        setPreviewError(err.response?.data?.message || 'Error al ejecutar la consulta SQL.');
        setPreviewData(null);
        setPreviewColumns([]);
      } finally {
        setIsLoadingPreview(false);
      }
    }
    loadPreview();
  }, [queryId, savedQueries, runQuery]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isViewer || !dashboardId || !queryId || !title.trim()) return;

    let chartConfig: Record<string, any> = {};
    if (chartType === 'kpi') {
      chartConfig = {
        kpiColumn: kpiColumn || previewColumns[0],
        kpiLabel: kpiLabel || kpiColumn || previewColumns[0],
      };
    } else {
      chartConfig = {
        xAxis: xAxisColumn || previewColumns[0],
        yAxis: yAxisColumn || previewColumns[1] || previewColumns[0],
        color: selectedColor,
      };
    }

    try {
      setSuccessMsg('');
      await createWidget({ dashboardId, queryId, title: title.trim(), type: chartType, chartConfig });
      setSuccessMsg('¡Widget agregado correctamente!');
      setTimeout(() => navigate(`/dashboards/${dashboardId}`), 1200);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error al guardar el widget.');
    }
  };

  if (isLoadingDashboard || isLoadingQueries) {
    return (
      <div className="py-20 flex justify-center items-center">
        <Loader2 className="animate-spin h-8 w-8" style={{ color: C.olive }} />
      </div>
    );
  }

  const chartTypes = [
    { type: 'bar', label: 'Barras', icon: BarChart },
    { type: 'line', label: 'Líneas', icon: LineChart },
    { type: 'pie', label: 'Tarta', icon: PieChart },
    { type: 'kpi', label: 'KPI', icon: HelpCircle },
    { type: 'table', label: 'Tabla', icon: FileText },
  ];

  const colorSwatches = ['#f7a501', '#23251d', '#3b82f6', '#10b981', '#ef4444'];

  return (
    <div className="space-y-6">
      {/* ── Header ─────────────────────────────────────── */}
      <div
        className="space-y-1 pb-5"
        style={{ borderBottom: `2px solid ${C.olive}` }}
      >
        <Link
          to={`/dashboards/${dashboardId}`}
          className="inline-flex items-center gap-1 text-xs font-semibold mb-2 transition-colors"
          style={{ color: C.muted }}
          onMouseEnter={e => (e.currentTarget.style.color = C.olive)}
          onMouseLeave={e => (e.currentTarget.style.color = C.muted)}
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Volver al Dashboard
        </Link>
        <h1 className="text-2xl font-extrabold flex items-center gap-2" style={{ color: C.olive }}>
          <Sliders className="h-6 w-6" style={{ color: C.yellow }} /> Creador de Widgets
        </h1>
        <p className="text-sm" style={{ color: C.muted }}>
          Diseña y previsualiza un gráfico interactivo a partir de tus consultas SQL guardadas.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* ── Columna izquierda: Ajustes (2/5) ─────────── */}
        <form
          onSubmit={handleSave}
          className="lg:col-span-2 space-y-5 rounded-2xl p-6 h-fit"
          style={{ backgroundColor: C.card, border: C.border, boxShadow: C.shadow }}
        >
          <h3
            className="text-xs font-bold uppercase tracking-wider pb-3 flex items-center gap-1.5"
            style={{ color: C.olive, borderBottom: `1.5px solid ${C.olive}` }}
          >
            <Sliders className="h-4 w-4" style={{ color: C.yellow }} /> Ajustes del Widget
          </h3>

          {/* Título */}
          <div>
            <SectionLabel>Título del Widget</SectionLabel>
            <RetroInput
              type="text"
              required
              placeholder="ej. Distribución de Ventas"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          {/* Consulta SQL */}
          <div>
            <SectionLabel>Consulta SQL Guardada</SectionLabel>
            <div className="relative">
              <Database
                className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none z-10"
                style={{ color: C.muted }}
              />
              <RetroSelect
                required
                value={queryId}
                onChange={(e) => setQueryId(e.target.value)}
                className="pl-9"
              >
                <option value="">Selecciona una consulta...</option>
                {savedQueries.map((query) => (
                  <option key={query.id} value={query.id}>
                    {query.name}
                  </option>
                ))}
              </RetroSelect>
            </div>
          </div>

          {/* Tipo de gráfico */}
          <div>
            <SectionLabel>Tipo de Visualización</SectionLabel>
            <div className="grid grid-cols-5 gap-2">
              {chartTypes.map(({ type, label, icon: Icon }) => {
                const isActive = chartType === type;
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setChartType(type)}
                    className="py-2 px-1 rounded-lg text-[10px] font-bold flex flex-col items-center justify-center gap-1 transition-all"
                    style={{
                      border: C.border,
                      backgroundColor: isActive ? C.yellow : C.bg,
                      color: C.olive,
                      boxShadow: isActive ? C.shadowSm : 'none',
                      transform: isActive ? 'translate(-1px,-1px)' : 'none',
                    }}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Configuración de columnas (solo si hay datos) */}
          {previewColumns.length > 0 && (
            <div className="space-y-4 pt-4" style={{ borderTop: `1.5px solid ${C.olive}` }}>
              <h4 className="text-xs font-bold" style={{ color: C.olive }}>Configuración de Columnas</h4>

              {chartType === 'kpi' ? (
                <>
                  <div>
                    <SectionLabel>Columna de Valor KPI</SectionLabel>
                    <RetroSelect value={kpiColumn} onChange={(e) => setKpiColumn(e.target.value)}>
                      {previewColumns.map((col) => <option key={col} value={col}>{col}</option>)}
                    </RetroSelect>
                  </div>
                  <div>
                    <SectionLabel>Etiqueta de KPI</SectionLabel>
                    <RetroInput
                      type="text"
                      placeholder="ej. Usuarios Activos"
                      value={kpiLabel}
                      onChange={(e) => setKpiLabel(e.target.value)}
                    />
                  </div>
                </>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <SectionLabel>{chartType === 'pie' ? 'Categoría' : 'Eje X (Categoría)'}</SectionLabel>
                      <RetroSelect value={xAxisColumn} onChange={(e) => setXAxisColumn(e.target.value)}>
                        {previewColumns.map((col) => <option key={col} value={col}>{col}</option>)}
                      </RetroSelect>
                    </div>
                    <div>
                      <SectionLabel>{chartType === 'pie' ? 'Valor' : 'Eje Y (Valor)'}</SectionLabel>
                      <RetroSelect value={yAxisColumn} onChange={(e) => setYAxisColumn(e.target.value)}>
                        {previewColumns.map((col) => <option key={col} value={col}>{col}</option>)}
                      </RetroSelect>
                    </div>
                  </div>

                  {chartType !== 'pie' && chartType !== 'table' && (
                    <div>
                      <SectionLabel>Color del Gráfico</SectionLabel>
                      <div className="flex items-center gap-3">
                        <input
                          type="color"
                          value={selectedColor}
                          onChange={(e) => setSelectedColor(e.target.value)}
                          className="h-8 w-10 rounded-lg cursor-pointer"
                          style={{ border: C.border }}
                        />
                        <div className="flex gap-1.5">
                          {colorSwatches.map((hex) => (
                            <button
                              key={hex}
                              type="button"
                              onClick={() => setSelectedColor(hex)}
                              className="h-5 w-5 rounded-full transition-all"
                              style={{
                                backgroundColor: hex,
                                border: selectedColor === hex ? `2px solid ${C.olive}` : '2px solid transparent',
                                boxShadow: selectedColor === hex ? '2px 2px 0px 0px #23251d' : 'none',
                              }}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* Éxito */}
          {successMsg && (
            <div
              className="rounded-xl p-3 text-xs font-bold"
              style={{ backgroundColor: '#d4f5e2', border: C.border, color: C.olive }}
            >
              {successMsg}
            </div>
          )}

          {/* Acciones */}
          <div className="flex items-center justify-end gap-3 pt-4" style={{ borderTop: `1.5px solid ${C.olive}` }}>
            <button
              type="button"
              onClick={() => navigate(`/dashboards/${dashboardId}`)}
              className="btn-retro-secondary px-4 py-2"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isCreatingWidget || !queryId || !title.trim() || isViewer}
              className="btn-retro-primary px-5 py-2"
            >
              {isCreatingWidget
                ? <Loader2 className="animate-spin h-4 w-4" />
                : <><Save className="h-4 w-4" /> Crear Widget</>
              }
            </button>
          </div>
        </form>

        {/* ── Columna derecha: Previsualización (3/5) ─── */}
        <div className="lg:col-span-3 space-y-4">
          <div
            className="rounded-2xl p-6 h-full flex flex-col min-h-[350px] relative"
            style={{ backgroundColor: C.bg, border: C.border, boxShadow: C.shadow }}
          >
            <h4
              className="text-[11px] font-bold uppercase tracking-widest pb-3 flex-shrink-0"
              style={{ color: C.muted, borderBottom: `1.5px solid ${C.olive}` }}
            >
              Previsualización en tiempo real
            </h4>

            <div className="flex-1 flex items-center justify-center p-4 min-h-0">
              {/* Cargando */}
              {isLoadingPreview && (
                <div className="flex flex-col items-center gap-2 text-xs" style={{ color: C.muted }}>
                  <Loader2 className="animate-spin h-6 w-6" style={{ color: C.olive }} />
                  <span>Cargando datos de la consulta...</span>
                </div>
              )}

              {/* Error */}
              {!isLoadingPreview && previewError && (
                <div
                  className="rounded-xl p-4 flex gap-3 text-sm w-full"
                  style={{ backgroundColor: '#ffdada', border: C.border, color: C.olive }}
                >
                  <AlertTriangle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                  <div className="space-y-1 text-left">
                    <h4 className="font-bold text-sm">Error al ejecutar la consulta</h4>
                    <p className="font-mono text-xs opacity-75 whitespace-pre-wrap">{previewError}</p>
                  </div>
                </div>
              )}

              {/* Gráfico */}
              {!isLoadingPreview && !previewError && previewData && (
                <div className="w-full h-full min-h-[220px]">
                  <ErrorBoundary>
                    <ChartRenderer
                      type={chartType}
                      chartConfig={
                        chartType === 'kpi'
                          ? { kpiColumn: kpiColumn || previewColumns[0], kpiLabel: kpiLabel || kpiColumn || previewColumns[0] }
                          : { xAxis: xAxisColumn || previewColumns[0], yAxis: yAxisColumn || previewColumns[1] || previewColumns[0], color: selectedColor }
                      }
                      data={previewData}
                    />
                  </ErrorBoundary>
                </div>
              )}

              {/* Empty state */}
              {!isLoadingPreview && !previewError && !previewData && (
                <div className="text-center text-xs py-10 max-w-xs space-y-2">
                  <div
                    className="h-14 w-14 rounded-2xl flex items-center justify-center mx-auto mb-3"
                    style={{ backgroundColor: C.card, border: C.border, boxShadow: C.shadowSm }}
                  >
                    <Sliders className="h-7 w-7" style={{ color: C.olive }} />
                  </div>
                  <p className="font-bold text-sm" style={{ color: C.olive }}>Sin datos de consulta</p>
                  <p className="text-[11px]" style={{ color: C.muted }}>
                    Selecciona una consulta SQL guardada para cargar los datos y mapear los campos del gráfico.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
