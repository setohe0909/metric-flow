import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import MonacoEditor from '@monaco-editor/react';
import { useDatasources } from '@/features/datasources/hooks/use-datasources';
import { useQueries } from '@/features/queries/hooks/use-queries';
import { useDashboards } from '@/features/dashboards/hooks/use-dashboards';
import type { QueryRunResponse } from '@/features/queries/hooks/use-queries';
import { ResultsTable } from '@/features/queries/components/results-table';
import { apiClient } from '@/lib/api-client';
import { Play, Save, Loader2, AlertTriangle, CheckCircle, Database, Terminal, Clock, Rows, Trash2, Sliders, X, FileText, EyeOff, Download } from 'lucide-react';
import { ScheduleModal } from '@/features/queries/components/schedule-modal';
import { useI18n } from '@/lib/i18n';

const DEFAULT_SQL = '-- Escribe tu consulta SQL aquí\nSELECT 1 as test;';
const DEFAULT_SQL_EN = '-- Write your SQL query here\nSELECT 1 as test;';

export default function QueryEditor() {
  const { t } = useI18n();
  const defaultSql = t(DEFAULT_SQL);
  const navigate = useNavigate();
  const { datasources, isLoading: isLoadingDss } = useDatasources();
  const {
    runQuery,
    isRunning,
    cancelQuery,
    isCancelling,
    exportQuery,
    isExporting,
    saveQuery,
    isSaving,
    savedQueries,
    isLoadingQueries,
    deleteQuery,
  } = useQueries();
  const { dashboards } = useDashboards();

  const [selectedDsId, setSelectedDsId] = useState<string>('');
  const [sqlCode, setSqlCode] = useState<string>(defaultSql);
  const [activeQueryId, setActiveQueryId] = useState<string | null>(null);
  const editorValue = sqlCode === DEFAULT_SQL || sqlCode === DEFAULT_SQL_EN ? defaultSql : sqlCode;
  const [editorTheme, setEditorTheme] = useState<'light' | 'vs-dark'>(() =>
    typeof document !== 'undefined' && document.documentElement.dataset.theme === 'dark'
      ? 'vs-dark'
      : 'light',
  );
  

  // Estados de ejecución
  const [queryResult, setQueryResult] = useState<QueryRunResponse | null>(null);
  const [executionError, setExecutionError] = useState<string | null>(null);
  const [pendingExecutionId, setPendingExecutionId] = useState<string | null>(null);
  const [cancelMessage, setCancelMessage] = useState<string | null>(null);
  const [lastExecutedSql, setLastExecutedSql] = useState<string>('');

  // Estados de Guardado
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [saveName, setSaveName] = useState('');
  const [saveDescription, setSaveDescription] = useState('');
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [showScheduleModal, setShowScheduleModal] = useState(false);

  // Estados de Asociación de Widget
  const [showWidgetModal, setShowWidgetModal] = useState(false);
  const [selectedDashboardId, setSelectedDashboardId] = useState('');

  // Pestañas lateral izquierda: consultas vs esquema
  const [sidebarTab, setSidebarTab] = useState<'queries' | 'schema'>('queries');

  // Esquema de la base de datos seleccionada
  const [schema, setSchema] = useState<Array<{ table: string; columns: string[] }>>([]);
  const [isLoadingSchema, setIsLoadingSchema] = useState(false);

  // Referencias para el Monaco Editor y autocompletado
  const editorRef = useRef<any>(null);
  const schemaRef = useRef<Array<{ table: string; columns: string[] }>>([]);
  const monacoProviderRef = useRef<any>(null);

  // Keep Monaco in sync with the app-level data-theme attribute.
  useEffect(() => {
    const syncEditorTheme = () => {
      setEditorTheme(document.documentElement.dataset.theme === 'dark' ? 'vs-dark' : 'light');
    };
    syncEditorTheme();
    const observer = new MutationObserver(syncEditorTheme);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    return () => observer.disconnect();
  }, []);

  // Sincronizar schemaRef con el estado schema
  useEffect(() => {
    schemaRef.current = schema;
  }, [schema]);

  // Inicializar selección de conector por defecto
  useEffect(() => {
    if (datasources.length > 0 && !selectedDsId) {
      setSelectedDsId(datasources[0].id);
    }
  }, [datasources, selectedDsId]);

  // Cargar esquema cada vez que cambia la base de datos seleccionada
  useEffect(() => {
    if (!selectedDsId) {
      setSchema([]);
      return;
    }
    
    let active = true;
    setIsLoadingSchema(true);
    
    apiClient.get<Array<{ table: string; columns: string[] }>>(`/datasources/${selectedDsId}/schema`)
      .then(({ data }) => {
        if (active) {
          setSchema(data);
        }
      })
      .catch((err) => {
        console.error("Error al cargar el esquema de la base de datos:", err);
        if (active) {
          setSchema([]);
        }
      })
      .finally(() => {
        if (active) {
          setIsLoadingSchema(false);
        }
      });
      
    return () => {
      active = false;
    };
  }, [selectedDsId]);

  // Limpiar el proveedor de autocompletado al desmontar
  useEffect(() => {
    return () => {
      if (monacoProviderRef.current) {
        monacoProviderRef.current.dispose();
      }
    };
  }, []);

  const handleRun = async () => {
    if (!selectedDsId) {
      alert(t('Por favor selecciona una base de datos conectada.'));
      return;
    }
    setExecutionError(null);
    setQueryResult(null);
    setCancelMessage(null);
    try {
      const editor = editorRef.current;
      const selection = editor?.getSelection();
      const selectedSql =
        selection && !selection.isEmpty()
          ? editor.getModel()?.getValueInRange(selection).trim()
          : '';
      const querySql = selectedSql || editor?.getValue() || sqlCode;
      const executionId = crypto.randomUUID();
      setPendingExecutionId(executionId);
      const res = await runQuery({
        datasourceId: selectedDsId,
        querySql,
        executionId,
      });
      setQueryResult(res);
      setLastExecutedSql(querySql);
    } catch (err: any) {
      setExecutionError(
        err.response?.data?.message || t('Error al ejecutar la consulta SQL. Revisa tu sintaxis.')
      );
    } finally {
      setPendingExecutionId(null);
      setCancelMessage(null);
    }
  };

  const triggerBlobDownload = (blob: Blob, filename: string) => {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  };

  const handleExport = async (format: 'csv' | 'excel') => {
    if (!selectedDsId || !lastExecutedSql || !queryResult) {
      return;
    }

    try {
      const file = await exportQuery({
        datasourceId: selectedDsId,
        querySql: lastExecutedSql,
        format,
      });
      triggerBlobDownload(file.blob, file.filename);
    } catch (err: any) {
      setExecutionError(
        err.response?.data?.message || t('No fue posible exportar el resultado actual.'),
      );
    }
  };

  const handleCancelExecution = async () => {
    if (!pendingExecutionId) return;
    setCancelMessage(t('Cancelando consulta...'));
    try {
      await cancelQuery(pendingExecutionId);
    } catch (err: any) {
      setCancelMessage(
        err.response?.data?.message || t('No fue posible cancelar la consulta.'),
      );
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!saveName || !selectedDsId) return;
    setSaveStatus('idle');
    try {
      const newQuery = await saveQuery({
        datasourceId: selectedDsId,
        name: saveName,
        description: saveDescription,
        querySql: sqlCode,
      });
      setSaveStatus('success');
      setActiveQueryId(newQuery.id);
      setTimeout(() => {
        setShowSaveModal(false);
        setSaveName('');
        setSaveDescription('');
        setSaveStatus('idle');
      }, 1500);
    } catch (err) {
      setSaveStatus('error');
    }
  };

  // Insertar texto en el Monaco Editor
  const handleInsertText = (text: string) => {
    if (!editorRef.current) return;
    const editor = editorRef.current;
    const selection = editor.getSelection();
    if (!selection) return;

    const currentSql = editor.getValue();
    const range =
      currentSql === DEFAULT_SQL || currentSql === defaultSql
        ? editor.getModel()?.getFullModelRange()
        : selection;
    if (!range) return;

    editor.executeEdits('metricflow-schema-explorer', [
      {
        range,
        text,
        forceMoveMarkers: true,
      },
    ]);
    editor.focus();
  };

  // Trigger ejecución con Ctrl+Enter / Cmd+Enter y autocompletado
  const handleEditorDidMount = (editor: any, monaco: any) => {
    editorRef.current = editor;

    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => {
      handleRun();
    });

    // Deshacer proveedor previo si existe
    if (monacoProviderRef.current) {
      monacoProviderRef.current.dispose();
    }

    // Registrar proveedor de sugerencias dinámicas basadas en el esquema actual
    monacoProviderRef.current = monaco.languages.registerCompletionItemProvider('sql', {
      triggerCharacters: ['.', ' '],
      provideCompletionItems: (model: any, position: any) => {
        const word = model.getWordUntilPosition(position);
        const range = {
          startLineNumber: position.lineNumber,
          endLineNumber: position.lineNumber,
          startColumn: word.startColumn,
          endColumn: word.endColumn
        };

        const currentSchema = schemaRef.current || [];
        const suggestions: any[] = [];

        // Agregar sugerencias de tablas
        currentSchema.forEach((tableInfo) => {
          suggestions.push({
            label: tableInfo.table,
            kind: monaco.languages.CompletionItemKind.Struct,
            insertText: tableInfo.table,
            detail: t('Tabla'),
            range
          });

          // Agregar sugerencias de columnas
          tableInfo.columns.forEach((col) => {
            suggestions.push({
              label: col,
              kind: monaco.languages.CompletionItemKind.Field,
              insertText: col,
              detail: `${t('Columna')} (${t('tabla')}: ${tableInfo.table})`,
              range
            });
          });
        });

        return { suggestions };
      }
    });
  };

  return (
    <div className="space-y-6 flex flex-col h-[calc(100vh-6rem)] relative">
      {/* Top Action Bar */}
      <div className="flex flex-col gap-3 flex-shrink-0 border-b-2 border-[var(--color-border-strong)] pb-5">
        {/* Row 1: Title + Secondary Controls */}
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-[var(--color-ink)] flex items-center gap-2.5 font-mono">
              <Terminal className="h-6 w-6 text-[var(--color-accent)]" /> SQL Editor
            </h1>
            <p className="text-xs text-[var(--color-muted-text)] mt-1 font-mono">
              {t('Escribe consultas SQL libres y visualiza resultados instantáneamente.')}
            </p>
          </div>

          <div className="flex items-center gap-3 font-mono flex-shrink-0">
            {/* Selector de Conector */}
            <div className="flex items-center gap-2 bg-[var(--color-widget)] border-2 border-[var(--color-border-strong)] rounded-xl px-3 py-1.5 min-w-[200px] shadow-[var(--shadow-retro-soft)]">
              <Database className="h-4 w-4 text-[var(--color-accent)] flex-shrink-0" />
              {isLoadingDss ? (
                <span className="text-xs text-slate-400">{t('Cargando DBs...')}</span>
              ) : datasources.length === 0 ? (
                <span className="text-xs text-red-500 font-bold">{t('Sin DBs conectadas')}</span>
              ) : (
                <select
                  value={selectedDsId}
                  onChange={(e) => setSelectedDsId(e.target.value)}
                  className="bg-transparent text-xs text-[var(--color-ink)] focus:outline-none w-full font-bold cursor-pointer"
                >
                  {datasources.map((ds) => (
                    <option key={ds.id} value={ds.id} className="bg-[var(--color-widget)] text-[var(--color-ink)]">
                      {ds.name} ({ds.type.toUpperCase()})
                    </option>
                  ))}
                </select>
              )}
            </div>

            {activeQueryId && (
              <>
                <button
                  onClick={() => setShowScheduleModal(true)}
                  disabled={!selectedDsId || isRunning}
                  className="flex items-center gap-1.5 btn-retro-secondary font-mono text-xs disabled:opacity-50"
                >
                  <Clock className="h-3.5 w-3.5" /> {t('Programar Reporte')}
                </button>
                <button
                  onClick={() => {
                    if (dashboards.length > 0) {
                      setSelectedDashboardId(dashboards[0].id);
                    }
                    setShowWidgetModal(true);
                  }}
                  disabled={!selectedDsId || isRunning}
                  className="flex items-center gap-1.5 btn-retro-secondary font-mono text-xs disabled:opacity-50"
                >
                  <Sliders className="h-3.5 w-3.5" /> {t('Crear Widget')}
                </button>
              </>
            )}

            <button
              onClick={() => setShowSaveModal(true)}
              disabled={!selectedDsId || isRunning}
              className="flex items-center gap-1.5 btn-retro-secondary font-mono text-xs disabled:opacity-50"
            >
              <Save className="h-3.5 w-3.5" /> {t('Guardar consulta')}
            </button>
          </div>
        </div>

        {/* Row 2: Primary Action */}
        <div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleRun}
              disabled={isRunning || !selectedDsId}
              className="flex items-center gap-1.5 btn-retro-primary font-mono text-xs disabled:opacity-50"
            >
              {isRunning ? (
                <>
                  <Loader2 className="animate-spin h-3.5 w-3.5 text-[var(--color-on-accent)]" /> {t('Ejecutando...')}
                </>
              ) : (
                <>
                  <Play className="h-3.5 w-3.5 text-[var(--color-on-accent)]" /> {t('Ejecutar SQL (Ctrl+↵)')}
                </>
              )}
            </button>
            {isRunning && pendingExecutionId ? (
              <button
                onClick={handleCancelExecution}
                disabled={isCancelling}
                className="flex items-center gap-1.5 rounded-xl border-2 border-red-700 bg-[var(--color-widget)] px-4 py-2 font-mono text-xs font-bold text-red-700 shadow-[2px_2px_0px_0px_#b91c1c] disabled:opacity-50"
              >
                {isCancelling ? (
                  <Loader2 className="animate-spin h-3.5 w-3.5" />
                ) : (
                  <X className="h-3.5 w-3.5" />
                )}
                {isCancelling ? t('Cancelando...') : t('Cancelar')}
              </button>
            ) : null}
            {queryResult && !isRunning ? (
              <>
                <button
                  onClick={() => handleExport('csv')}
                  disabled={isExporting}
                  className="flex items-center gap-1.5 btn-retro-secondary font-mono text-xs disabled:opacity-50"
                >
                  {isExporting ? (
                    <Loader2 className="animate-spin h-3.5 w-3.5" />
                  ) : (
                    <Download className="h-3.5 w-3.5" />
                  )}
                  {t('Exportar CSV')}
                </button>
                <button
                  onClick={() => handleExport('excel')}
                  disabled={isExporting}
                  className="flex items-center gap-1.5 btn-retro-secondary font-mono text-xs disabled:opacity-50"
                >
                  {isExporting ? (
                    <Loader2 className="animate-spin h-3.5 w-3.5" />
                  ) : (
                    <Download className="h-3.5 w-3.5" />
                  )}
                  {t('Exportar Excel')}
                </button>
              </>
            ) : null}
          </div>
          {isRunning && cancelMessage ? (
            <p className="mt-2 text-xs font-mono text-red-700">{cancelMessage}</p>
          ) : null}
        </div>
      </div>

      {/* Workspace Layout: Left Sidebar + Right Editor & Results */}
      <div className="flex flex-col md:flex-row gap-6 flex-1 min-h-0">
        {/* Left Sidebar: Saved Queries & Schema Explorer */}
        <div className="w-full md:w-72 flex-shrink-0 flex flex-col border-2 border-[var(--color-border-strong)] bg-[var(--color-widget)] rounded-2xl overflow-hidden shadow-[var(--shadow-retro-strong)]">
          {/* Tab Selection */}
          <div className="bg-[var(--color-widget-header)] border-b-2 border-[var(--color-border-strong)] flex text-xs font-bold font-mono">
            <button
              onClick={() => setSidebarTab('queries')}
              className={`flex-1 py-3 text-center border-r-2 border-[var(--color-border-strong)] flex items-center justify-center gap-1.5 transition-colors ${
                sidebarTab === 'queries' ? 'bg-[var(--color-widget)] text-[var(--color-ink)]' : 'bg-[var(--color-widget-header)] text-[var(--color-muted-text)] hover:bg-[color-mix(in_srgb,var(--color-widget)_55%,transparent)]'
              }`}
            >
              <FileText className="h-3.5 w-3.5" /> {t('Consultas')} ({savedQueries.length})
            </button>
            <button
              onClick={() => setSidebarTab('schema')}
              className={`flex-1 py-3 text-center flex items-center justify-center gap-1.5 transition-colors ${
                sidebarTab === 'schema' ? 'bg-[var(--color-widget)] text-[var(--color-ink)]' : 'bg-[var(--color-widget-header)] text-[var(--color-muted-text)] hover:bg-[color-mix(in_srgb,var(--color-widget)_55%,transparent)]'
              }`}
            >
              <Database className="h-3.5 w-3.5" /> {t('Esquema')} ({schema.length})
            </button>
          </div>

          {/* Tab Body */}
          {sidebarTab === 'queries' ? (
            <div className="flex-1 overflow-y-auto p-3 space-y-2 font-mono">
              {isLoadingQueries ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="animate-spin h-5 w-5 text-[var(--color-accent)]" />
                </div>
              ) : savedQueries.length === 0 ? (
                <div className="text-center py-8 px-2 text-[var(--color-muted-text)]">
                  <p className="text-xs">{t('No hay consultas guardadas.')}</p>
                  <p className="text-[10px] opacity-75 mt-1">{t('Usa "Guardar consulta" para registrar una.')}</p>
                </div>
              ) : (
                savedQueries.map((query) => (
                  <div
                    key={query.id}
                    onClick={() => {
                      setSqlCode(query.querySql);
                      if (query.datasourceId) {
                        setSelectedDsId(query.datasourceId);
                      }
                      setActiveQueryId(query.id);
                    }}
                    className="group relative bg-[var(--color-muted-surface)] hover:bg-[var(--color-widget)] border-2 border-[var(--color-border-strong)] rounded-xl p-3 cursor-pointer transition-all min-w-0 shadow-[var(--shadow-retro-soft)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none"
                  >
                    <div className="pr-6">
                      <h4 className="text-xs font-bold text-[var(--color-ink)] truncate">
                        {query.name}
                      </h4>
                      {query.description && (
                        <p className="text-[10px] text-[var(--color-muted-text)] mt-1 truncate">
                          {query.description}
                        </p>
                      )}
                      <span className="inline-block mt-2 text-[9px] font-extrabold text-[var(--color-ink)] bg-[var(--color-surface)] border border-[var(--color-border-strong)] px-1.5 py-0.5 rounded uppercase">
                        {datasources.find((ds) => ds.id === query.datasourceId)?.name || 'DB'}
                      </span>
                    </div>
                    
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm(t('¿Estás seguro de eliminar la consulta?').replace('{name}', query.name))) {
                          deleteQuery(query.id);
                        }
                      }}
                      className="absolute top-2.5 right-2.5 p-1 text-[var(--color-muted-text)] hover:text-red-500 hover:bg-[color-mix(in_srgb,var(--color-danger)_14%,transparent)] rounded transition-all opacity-0 group-hover:opacity-100 focus:opacity-100 border border-transparent hover:border-[var(--color-border-strong)]"
                      title={t('Eliminar consulta')}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto p-3 space-y-3 font-mono">
              {isLoadingSchema ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="animate-spin h-5 w-5 text-[var(--color-accent)]" />
                </div>
              ) : schema.length === 0 ? (
                <div className="text-center py-8 px-2 text-[var(--color-muted-text)]">
                  <p className="text-xs">{t('No hay tablas disponibles.')}</p>
                  <p className="text-[10px] opacity-75 mt-1">{t('Selecciona una base de datos activa.')}</p>
                </div>
              ) : (
                schema.map((tableInfo) => (
                  <details
                    key={tableInfo.table}
                    className="group border-2 border-[var(--color-border-strong)] rounded-xl bg-[var(--color-widget)] shadow-[var(--shadow-retro-soft)] overflow-hidden text-xs"
                  >
                    <summary className="bg-[var(--color-muted-surface)] p-2.5 font-bold cursor-pointer hover:bg-[var(--color-widget-header)] flex items-center justify-between select-none">
                      <span className="truncate flex items-center gap-1.5 text-[var(--color-ink)]">
                        <Database className="h-3.5 w-3.5 text-[var(--color-accent)]" /> {tableInfo.table}
                      </span>
                      <span className="text-[9px] bg-[var(--color-widget)] border border-[var(--color-border-strong)] rounded px-1.5 py-0.5 text-[var(--color-ink)] font-bold">
                        {tableInfo.columns.length}
                      </span>
                    </summary>
                    <div className="p-2 border-t-2 border-[var(--color-border-strong)] bg-[var(--color-widget)] space-y-1 max-h-48 overflow-y-auto">
                      <div className="flex gap-1.5 pb-2 mb-2 border-b border-[color-mix(in_srgb,var(--color-border-strong)_10%,transparent)]">
                        <button
                          onClick={() => handleInsertText(`SELECT * FROM ${tableInfo.table} LIMIT 10;`)}
                          className="px-2 py-1 bg-[var(--color-accent)] border-2 border-[var(--color-border-strong)] rounded text-[9px] font-bold shadow-[1px_1px_0px_0px_var(--color-border-strong)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all cursor-pointer"
                        >
                          SELECT *
                        </button>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(tableInfo.table);
                            alert(t('Tabla copiada al portapapeles').replace('{table}', tableInfo.table));
                          }}
                          className="px-2 py-1 bg-[var(--color-widget)] border-2 border-[var(--color-border-strong)] rounded text-[9px] font-bold shadow-[1px_1px_0px_0px_var(--color-border-strong)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all cursor-pointer"
                        >
                          {t('Copiar')}
                        </button>
                      </div>
                      {tableInfo.columns.map((col) => (
                        <div key={col} className="flex items-center justify-between p-1.5 hover:bg-[var(--color-muted-surface)] rounded border border-transparent hover:border-[color-mix(in_srgb,var(--color-border-strong)_10%,transparent)] group/col">
                          <span className="truncate text-[var(--color-ink)]">{col}</span>
                          <button
                            onClick={() => handleInsertText(col)}
                            className="text-[9px] font-extrabold text-[var(--color-accent)] opacity-0 group-hover/col:opacity-100 transition-opacity hover:underline cursor-pointer"
                          >
                            {t('Insertar')}
                          </button>
                        </div>
                      ))}
                    </div>
                  </details>
                ))
              )}
            </div>
          )}
        </div>

        {/* Right Pane: Editor & Results Canvas */}
        <div className="grid grid-rows-2 gap-6 flex-1 min-h-0">
          {/* Row 1: Monaco Editor Console */}
          <div className="border-2 border-[var(--color-border-strong)] rounded-2xl overflow-hidden bg-[var(--color-widget)] shadow-[var(--shadow-retro-strong)] relative min-h-0 flex flex-col">
            <div className="bg-[var(--color-widget-header)] px-4 py-2.5 border-b-2 border-[var(--color-border-strong)] flex items-center justify-between text-xs text-[var(--color-ink)] font-mono flex-shrink-0">
              <div className="flex items-center gap-1.5 shrink-0">
                <div className="w-3.5 h-3.5 rounded-full window-circle-red" />
                <div className="w-3.5 h-3.5 rounded-full window-circle-yellow" />
                <div className="w-3.5 h-3.5 rounded-full window-circle-green" />
              </div>
              <span className="font-extrabold uppercase text-[10px]">Console.sql</span>
              <span className="text-[10px] text-[var(--color-muted-text)]">{t('Atajo: Ctrl+Enter')}</span>
            </div>
            <div className="flex-1 min-h-0">
              <MonacoEditor
                height="100%"
                language="sql"
                theme={editorTheme}
                value={editorValue}
                onChange={(value) => {
                  setSqlCode(value || '');
                  setActiveQueryId(null);
                }}
                onMount={handleEditorDidMount}
                options={{
                  minimap: { enabled: false },
                  fontSize: 13,
                  fontFamily: "ui-monospace, monospace",
                  lineNumbers: "on",
                  scrollBeyondLastLine: false,
                  automaticLayout: true,
                }}
              />
            </div>
          </div>

          {/* Row 2: Outputs & Results */}
          <div className="border-2 border-[var(--color-border-strong)] rounded-2xl bg-[var(--color-widget)] flex flex-col min-h-0 overflow-hidden shadow-[var(--shadow-retro-strong)]">
            {/* Header Panel */}
            <div className="bg-[var(--color-widget-header)] px-4 py-2.5 border-b-2 border-[var(--color-border-strong)] flex items-center justify-between text-xs text-[var(--color-ink)] font-mono flex-shrink-0">
              <span className="font-extrabold uppercase text-[10px]">{t('Resultado de la consulta')}</span>
              {queryResult && (
                <div className="flex items-center gap-4 text-[11px] text-[var(--color-ink)] font-bold">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5 text-[var(--color-accent)]" /> {queryResult.durationMs} ms
                  </span>
                  <span className="flex items-center gap-1">
                    <Rows className="h-3.5 w-3.5 text-[var(--color-accent)]" /> {queryResult.rowCount} {t('filas')}
                  </span>
                </div>
              )}
            </div>

            {/* Tab Panel Body */}
            <div className="flex-1 overflow-y-auto p-4 min-h-0 bg-[color-mix(in_srgb,var(--color-surface)_40%,transparent)] bg-grid-dots">
              {isRunning && (
                <div className="h-full flex flex-col items-center justify-center gap-2 text-[var(--color-muted-text)] py-10 font-mono">
                  <Loader2 className="animate-spin h-6 w-6 text-[var(--color-accent)]" />
                  <span className="text-xs font-bold">{t('Procesando consulta...')}</span>
                </div>
              )}

              {!isRunning && executionError && (
                <div className="bg-[var(--color-error-surface)] border-2 border-[var(--color-border-strong)] rounded-xl p-4 flex gap-3 text-sm text-red-800 font-mono shadow-[var(--shadow-retro-soft)]">
                  <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0" />
                  <div className="space-y-1">
                    <h4 className="font-extrabold">{t('Error del compilador de Base de Datos')}</h4>
                    <p className="font-mono text-xs text-red-700 whitespace-pre-wrap">{executionError}</p>
                  </div>
                </div>
              )}

              {!isRunning && !executionError && queryResult && (
                <div className="space-y-3">
                  {/* Banner: datos filtrados por política de rol */}
                  {(queryResult as any).filtered && (
                    <div
                      className="flex items-start gap-3 px-4 py-3 border-2 border-[var(--color-border-strong)] rounded-xl text-xs font-mono"
                      style={{ backgroundColor: 'color-mix(in srgb, var(--color-accent) 14%, var(--color-widget))', boxShadow: '2px 2px 0px 0px var(--color-accent)' }}
                    >
                      <EyeOff className="h-4 w-4 flex-shrink-0 mt-0.5" style={{ color: 'var(--color-accent)' }} />
                      <div className="space-y-1">
                        <p className="font-extrabold" style={{ color: 'var(--color-ink)' }}>
                          {t('Estás viendo datos filtrados según tu rol en esta organización.')}
                        </p>
                        <div className="flex flex-wrap gap-3 text-[11px]" style={{ color: '#4d4f46' }}>
                          {(queryResult as any).appliedPolicy?.rowFilter && (
                            <span>
                              {t('Filtro de filas:')}{' '}
                              <code
                                className="px-1.5 py-0.5 rounded border border-[var(--color-border-strong)]"
                                style={{ backgroundColor: 'white' }}
                              >
                                {(queryResult as any).appliedPolicy.rowFilter}
                              </code>
                            </span>
                          )}
                          {(queryResult as any).appliedPolicy?.allowedColumns && (
                            <span>
                              {t('Columnas visibles:')}{' '}
                              <strong>{(queryResult as any).appliedPolicy.allowedColumns.length}</strong>{' '}
                              {t('de las disponibles')}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                  <ResultsTable columns={queryResult.columns} rows={queryResult.rows} />
                </div>
              )}

              {!isRunning && !executionError && !queryResult && (
                <div className="h-full flex flex-col items-center justify-center text-[var(--color-muted-text)] py-10 font-mono">
                  <Terminal className="h-8 w-8 text-[var(--color-ink)] mb-2 opacity-50" />
                  <span className="text-xs font-bold text-center max-w-sm">{t('Escribe código SQL y haz clic en "Ejecutar SQL" para ver resultados.')}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Save Modal */}
      {showSaveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div className="fixed inset-0 bg-[color-mix(in_srgb,var(--color-ink)_60%,transparent)] backdrop-blur-sm" onClick={() => setShowSaveModal(false)} />

          {/* Card */}
          <div className="bg-[var(--color-surface)] border-2 border-[var(--color-border-strong)] rounded-2xl shadow-[6px_6px_0px_0px_var(--color-border-strong)] z-10 max-w-md w-full relative overflow-hidden">
            {/* Modal OS Title Bar */}
            <div className="bg-[var(--color-widget-header)] border-b-2 border-[var(--color-border-strong)] px-4 py-3 flex items-center justify-between">
              <div className="flex gap-1.5 shrink-0">
                <div className="w-3.5 h-3.5 rounded-full window-circle-red" />
                <div className="w-3.5 h-3.5 rounded-full window-circle-yellow" />
                <div className="w-3.5 h-3.5 rounded-full window-circle-green" />
              </div>
              <span className="text-xs font-bold text-[var(--color-ink)] font-mono">save-query.sh</span>
              <button
                onClick={() => setShowSaveModal(false)}
                className="text-[var(--color-muted-text)] hover:text-[var(--color-ink)]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-xs text-[var(--color-muted-text)] leading-relaxed font-mono">
                {t('Registra tu query para poder vincularla a gráficos y tableros interactivos.')}
              </p>

              <form onSubmit={handleSave} className="space-y-4 font-mono">
                <div>
                  <label className="block text-[10px] font-bold text-[var(--color-muted-text)] uppercase tracking-wider mb-2 font-mono">{t('Nombre')}</label>
                  <input
                    type="text"
                    required
                    value={saveName}
                    onChange={(e) => setSaveName(e.target.value)}
                    className="w-full px-3 py-2.5 border-2 border-[var(--color-border-strong)] rounded-xl bg-[var(--color-widget)] text-[var(--color-ink)] placeholder-[var(--color-subtle-text)] focus:outline-none focus:border-[var(--color-accent)] transition-all text-sm font-mono shadow-[var(--shadow-retro-soft)]"
                    placeholder={t('ej. Usuarios Activos Diarios')}
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-[var(--color-muted-text)] uppercase tracking-wider mb-2 font-mono">{t('Descripción (Opcional)')}</label>
                  <textarea
                    value={saveDescription}
                    onChange={(e) => setSaveDescription(e.target.value)}
                    className="w-full px-3 py-2.5 border-2 border-[var(--color-border-strong)] rounded-xl bg-[var(--color-widget)] text-[var(--color-ink)] placeholder-[var(--color-subtle-text)] focus:outline-none focus:border-[var(--color-accent)] transition-all text-sm h-20 font-mono shadow-[var(--shadow-retro-soft)]"
                    placeholder={t('ej. Reporte semanal de crecimiento...')}
                  />
                </div>

                {saveStatus === 'success' && (
                  <div className="rounded-xl bg-[color-mix(in_srgb,#22c55e_14%,var(--color-widget))] border-2 border-[var(--color-border-strong)] p-3 text-emerald-800 flex items-center gap-2 text-xs font-bold font-mono shadow-[var(--shadow-retro-soft)]">
                    <CheckCircle className="h-4 w-4 text-emerald-600" /> {t('¡Consulta guardada con éxito!')}
                  </div>
                )}

                {saveStatus === 'error' && (
                  <div className="rounded-xl bg-[var(--color-error-surface)] border-2 border-[var(--color-border-strong)] p-3 text-red-800 flex items-center gap-2 text-xs font-bold font-mono shadow-[var(--shadow-retro-soft)]">
                    <AlertTriangle className="h-4 w-4 text-red-600" /> {t('Fallo al guardar la consulta.')}
                  </div>
                )}

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowSaveModal(false)}
                    className="btn-retro-secondary"
                  >
                    {t('Cancelar')}
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving || !saveName}
                    className="btn-retro-primary"
                  >
                    {isSaving ? <Loader2 className="animate-spin h-4 w-4 text-[var(--color-on-accent)]" /> : t('Guardar consulta')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal para Seleccionar Dashboard */}
      {showWidgetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-[color-mix(in_srgb,var(--color-ink)_60%,transparent)] backdrop-blur-sm" onClick={() => setShowWidgetModal(false)} />
          
          <div className="bg-[var(--color-surface)] border-2 border-[var(--color-border-strong)] rounded-2xl shadow-[6px_6px_0px_0px_var(--color-border-strong)] z-10 max-w-sm w-full relative overflow-hidden">
            {/* Modal OS Title Bar */}
            <div className="bg-[var(--color-widget-header)] border-b-2 border-[var(--color-border-strong)] px-4 py-3 flex items-center justify-between">
              <div className="flex gap-1.5 shrink-0">
                <div className="w-3.5 h-3.5 rounded-full window-circle-red" />
                <div className="w-3.5 h-3.5 rounded-full window-circle-yellow" />
                <div className="w-3.5 h-3.5 rounded-full window-circle-green" />
              </div>
              <span className="text-xs font-bold text-[var(--color-ink)] font-mono">new-widget.sh</span>
              <button
                onClick={() => setShowWidgetModal(false)}
                className="text-[var(--color-muted-text)] hover:text-[var(--color-ink)]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-6 space-y-4 font-mono">
              <p className="text-xs text-[var(--color-muted-text)] leading-relaxed">
                {t('Selecciona el dashboard de destino donde quieres agregar el gráfico de esta consulta.')}
              </p>

              {dashboards.length === 0 ? (
                <div className="space-y-4">
                  <div className="rounded-xl bg-[var(--color-error-surface)] border-2 border-[var(--color-border-strong)] p-3 text-red-800 text-xs text-center font-bold shadow-[var(--shadow-retro-soft)]">
                    {t('No tienes dashboards creados en esta organización.')}
                  </div>
                  <button
                    onClick={() => navigate('/dashboards')}
                    className="w-full btn-retro-primary text-xs"
                  >
                    {t('Ir a Crear Dashboard')}
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-bold text-[var(--color-muted-text)] uppercase tracking-wider mb-2 font-mono">
                      {t('Dashboard Destino')}
                    </label>
                    <select
                      value={selectedDashboardId}
                      onChange={(e) => setSelectedDashboardId(e.target.value)}
                      className="w-full px-3 py-2.5 border-2 border-[var(--color-border-strong)] rounded-xl bg-[var(--color-widget)] text-[var(--color-ink)] focus:outline-none focus:border-[var(--color-accent)] transition-all text-sm font-bold cursor-pointer"
                    >
                      {dashboards.map((dash) => (
                        <option key={dash.id} value={dash.id} className="bg-[var(--color-widget)] text-[var(--color-ink)]">
                          {dash.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowWidgetModal(false)}
                      className="btn-retro-secondary"
                    >
                      {t('Cancelar')}
                    </button>
                    <button
                      onClick={() => {
                        setShowWidgetModal(false);
                        navigate(`/dashboards/${selectedDashboardId}/widgets/new?queryId=${activeQueryId}`);
                      }}
                      disabled={!selectedDashboardId}
                      className="btn-retro-primary text-xs"
                    >
                      {t('Continuar')}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal para Programación de Reportes */}
      {activeQueryId && (
        <ScheduleModal
          isOpen={showScheduleModal}
          onClose={() => setShowScheduleModal(false)}
          queryId={activeQueryId}
          queryName={savedQueries.find((q) => q.id === activeQueryId)?.name || ''}
        />
      )}
    </div>
  );
}
