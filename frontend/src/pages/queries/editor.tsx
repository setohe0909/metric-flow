import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import MonacoEditor from '@monaco-editor/react';
import { useDatasources } from '@/features/datasources/hooks/use-datasources';
import { useQueries } from '@/features/queries/hooks/use-queries';
import { useDashboards } from '@/features/dashboards/hooks/use-dashboards';
import type { QueryRunResponse } from '@/features/queries/hooks/use-queries';
import { ResultsTable } from '@/features/queries/components/results-table';
import { apiClient } from '@/lib/api-client';
import { Play, Save, Loader2, AlertTriangle, CheckCircle, Database, Terminal, Clock, Rows, Trash2, Sliders, X, FileText, EyeOff } from 'lucide-react';
import { ScheduleModal } from '@/features/queries/components/schedule-modal';

const DEFAULT_SQL = '-- Escribe tu consulta SQL aquí\nSELECT 1 as test;';

export default function QueryEditor() {
  const navigate = useNavigate();
  const { datasources, isLoading: isLoadingDss } = useDatasources();
  const { runQuery, isRunning, saveQuery, isSaving, savedQueries, isLoadingQueries, deleteQuery } = useQueries();
  const { dashboards } = useDashboards();

  const [selectedDsId, setSelectedDsId] = useState<string>('');
  const [sqlCode, setSqlCode] = useState<string>(DEFAULT_SQL);
  const [activeQueryId, setActiveQueryId] = useState<string | null>(null);
  
  // Estados de ejecución
  const [queryResult, setQueryResult] = useState<QueryRunResponse | null>(null);
  const [executionError, setExecutionError] = useState<string | null>(null);

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
      alert('Por favor selecciona una base de datos conectada.');
      return;
    }
    setExecutionError(null);
    setQueryResult(null);
    try {
      const editor = editorRef.current;
      const selection = editor?.getSelection();
      const selectedSql =
        selection && !selection.isEmpty()
          ? editor.getModel()?.getValueInRange(selection).trim()
          : '';
      const querySql = selectedSql || editor?.getValue() || sqlCode;
      const res = await runQuery({
        datasourceId: selectedDsId,
        querySql,
      });
      setQueryResult(res);
    } catch (err: any) {
      setExecutionError(
        err.response?.data?.message || 'Error al ejecutar la consulta SQL. Revisa tu sintaxis.'
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
      currentSql === DEFAULT_SQL
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
        currentSchema.forEach((t) => {
          suggestions.push({
            label: t.table,
            kind: monaco.languages.CompletionItemKind.Struct,
            insertText: t.table,
            detail: 'Tabla',
            range
          });

          // Agregar sugerencias de columnas
          t.columns.forEach((col) => {
            suggestions.push({
              label: col,
              kind: monaco.languages.CompletionItemKind.Field,
              insertText: col,
              detail: `Columna (tabla: ${t.table})`,
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
      <div className="flex flex-col gap-3 flex-shrink-0 border-b-2 border-[#23251d] pb-5">
        {/* Row 1: Title + Secondary Controls */}
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-[#23251d] flex items-center gap-2.5 font-mono">
              <Terminal className="h-6 w-6 text-[#f7a501]" /> SQL Editor
            </h1>
            <p className="text-xs text-[#4d4f46] mt-1 font-mono">
              Escribe consultas SQL libres y visualiza resultados instantáneamente.
            </p>
          </div>

          <div className="flex items-center gap-3 font-mono flex-shrink-0">
            {/* Selector de Conector */}
            <div className="flex items-center gap-2 bg-white border-2 border-[#23251d] rounded-xl px-3 py-1.5 min-w-[200px] shadow-[2px_2px_0px_0px_#23251d]">
              <Database className="h-4 w-4 text-[#f7a501] flex-shrink-0" />
              {isLoadingDss ? (
                <span className="text-xs text-slate-400">Cargando DBs...</span>
              ) : datasources.length === 0 ? (
                <span className="text-xs text-red-500 font-bold">Sin DBs conectadas</span>
              ) : (
                <select
                  value={selectedDsId}
                  onChange={(e) => setSelectedDsId(e.target.value)}
                  className="bg-transparent text-xs text-[#23251d] focus:outline-none w-full font-bold cursor-pointer"
                >
                  {datasources.map((ds) => (
                    <option key={ds.id} value={ds.id} className="bg-white text-[#23251d]">
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
                  <Clock className="h-3.5 w-3.5" /> Programar Reporte
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
                  <Sliders className="h-3.5 w-3.5" /> Crear Widget
                </button>
              </>
            )}

            <button
              onClick={() => setShowSaveModal(true)}
              disabled={!selectedDsId || isRunning}
              className="flex items-center gap-1.5 btn-retro-secondary font-mono text-xs disabled:opacity-50"
            >
              <Save className="h-3.5 w-3.5" /> Guardar Query
            </button>
          </div>
        </div>

        {/* Row 2: Primary Action */}
        <div>
          <button
            onClick={handleRun}
            disabled={isRunning || !selectedDsId}
            className="flex items-center gap-1.5 btn-retro-primary font-mono text-xs disabled:opacity-50"
          >
            {isRunning ? (
              <>
                <Loader2 className="animate-spin h-3.5 w-3.5 text-[#23251d]" /> Ejecutando...
              </>
            ) : (
              <>
                <Play className="h-3.5 w-3.5 text-[#23251d]" /> Ejecutar SQL (Ctrl+↵)
              </>
            )}
          </button>
        </div>
      </div>

      {/* Workspace Layout: Left Sidebar + Right Editor & Results */}
      <div className="flex flex-col md:flex-row gap-6 flex-1 min-h-0">
        {/* Left Sidebar: Saved Queries & Schema Explorer */}
        <div className="w-full md:w-72 flex-shrink-0 flex flex-col border-2 border-[#23251d] bg-white rounded-2xl overflow-hidden shadow-[4px_4px_0px_0px_#23251d]">
          {/* Tab Selection */}
          <div className="bg-[#e4e5de] border-b-2 border-[#23251d] flex text-xs font-bold font-mono">
            <button
              onClick={() => setSidebarTab('queries')}
              className={`flex-1 py-3 text-center border-r-2 border-[#23251d] flex items-center justify-center gap-1.5 transition-colors ${
                sidebarTab === 'queries' ? 'bg-white text-[#23251d]' : 'bg-[#e4e5de] text-[#4d4f46] hover:bg-white/50'
              }`}
            >
              <FileText className="h-3.5 w-3.5" /> Queries ({savedQueries.length})
            </button>
            <button
              onClick={() => setSidebarTab('schema')}
              className={`flex-1 py-3 text-center flex items-center justify-center gap-1.5 transition-colors ${
                sidebarTab === 'schema' ? 'bg-white text-[#23251d]' : 'bg-[#e4e5de] text-[#4d4f46] hover:bg-white/50'
              }`}
            >
              <Database className="h-3.5 w-3.5" /> Esquema ({schema.length})
            </button>
          </div>

          {/* Tab Body */}
          {sidebarTab === 'queries' ? (
            <div className="flex-1 overflow-y-auto p-3 space-y-2 font-mono">
              {isLoadingQueries ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="animate-spin h-5 w-5 text-[#f7a501]" />
                </div>
              ) : savedQueries.length === 0 ? (
                <div className="text-center py-8 px-2 text-[#4d4f46]">
                  <p className="text-xs">No hay consultas guardadas.</p>
                  <p className="text-[10px] opacity-75 mt-1">Usa "Guardar Query" para registrar una.</p>
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
                    className="group relative bg-[#f4f4f0] hover:bg-white border-2 border-[#23251d] rounded-xl p-3 cursor-pointer transition-all min-w-0 shadow-[2px_2px_0px_0px_#23251d] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none"
                  >
                    <div className="pr-6">
                      <h4 className="text-xs font-bold text-[#23251d] truncate">
                        {query.name}
                      </h4>
                      {query.description && (
                        <p className="text-[10px] text-[#4d4f46] mt-1 truncate">
                          {query.description}
                        </p>
                      )}
                      <span className="inline-block mt-2 text-[9px] font-extrabold text-[#23251d] bg-[#eeefe9] border border-[#23251d] px-1.5 py-0.5 rounded uppercase">
                        {datasources.find((ds) => ds.id === query.datasourceId)?.name || 'DB'}
                      </span>
                    </div>
                    
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm(`¿Estás seguro de eliminar la consulta "${query.name}"?`)) {
                          deleteQuery(query.id);
                        }
                      }}
                      className="absolute top-2.5 right-2.5 p-1 text-[#4d4f46] hover:text-red-500 hover:bg-red-500/10 rounded transition-all opacity-0 group-hover:opacity-100 focus:opacity-100 border border-transparent hover:border-[#23251d]"
                      title="Eliminar consulta"
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
                  <Loader2 className="animate-spin h-5 w-5 text-[#f7a501]" />
                </div>
              ) : schema.length === 0 ? (
                <div className="text-center py-8 px-2 text-[#4d4f46]">
                  <p className="text-xs">No hay tablas disponibles.</p>
                  <p className="text-[10px] opacity-75 mt-1">Selecciona una base de datos activa.</p>
                </div>
              ) : (
                schema.map((t) => (
                  <details
                    key={t.table}
                    className="group border-2 border-[#23251d] rounded-xl bg-white shadow-[2px_2px_0px_0px_#23251d] overflow-hidden text-xs"
                  >
                    <summary className="bg-[#f4f4f0] p-2.5 font-bold cursor-pointer hover:bg-[#e4e5de] flex items-center justify-between select-none">
                      <span className="truncate flex items-center gap-1.5 text-[#23251d]">
                        <Database className="h-3.5 w-3.5 text-[#f7a501]" /> {t.table}
                      </span>
                      <span className="text-[9px] bg-white border border-[#23251d] rounded px-1.5 py-0.5 text-[#23251d] font-bold">
                        {t.columns.length}
                      </span>
                    </summary>
                    <div className="p-2 border-t-2 border-[#23251d] bg-white space-y-1 max-h-48 overflow-y-auto">
                      <div className="flex gap-1.5 pb-2 mb-2 border-b border-[#23251d]/10">
                        <button
                          onClick={() => handleInsertText(`SELECT * FROM ${t.table} LIMIT 10;`)}
                          className="px-2 py-1 bg-[#f7a501] border-2 border-[#23251d] rounded text-[9px] font-bold shadow-[1px_1px_0px_0px_#23251d] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all cursor-pointer"
                        >
                          SELECT *
                        </button>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(t.table);
                            alert(`"${t.table}" copiado al portapapeles`);
                          }}
                          className="px-2 py-1 bg-white border-2 border-[#23251d] rounded text-[9px] font-bold shadow-[1px_1px_0px_0px_#23251d] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all cursor-pointer"
                        >
                          Copiar
                        </button>
                      </div>
                      {t.columns.map((col) => (
                        <div key={col} className="flex items-center justify-between p-1.5 hover:bg-[#f4f4f0] rounded border border-transparent hover:border-[#23251d]/10 group/col">
                          <span className="truncate text-[#23251d]">{col}</span>
                          <button
                            onClick={() => handleInsertText(col)}
                            className="text-[9px] font-extrabold text-[#f7a501] opacity-0 group-hover/col:opacity-100 transition-opacity hover:underline cursor-pointer"
                          >
                            Insertar
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
          <div className="border-2 border-[#23251d] rounded-2xl overflow-hidden bg-white shadow-[4px_4px_0px_0px_#23251d] relative min-h-0 flex flex-col">
            <div className="bg-[#e4e5de] px-4 py-2.5 border-b-2 border-[#23251d] flex items-center justify-between text-xs text-[#23251d] font-mono flex-shrink-0">
              <div className="flex items-center gap-1.5 shrink-0">
                <div className="w-3.5 h-3.5 rounded-full window-circle-red" />
                <div className="w-3.5 h-3.5 rounded-full window-circle-yellow" />
                <div className="w-3.5 h-3.5 rounded-full window-circle-green" />
              </div>
              <span className="font-extrabold uppercase text-[10px]">Console.sql</span>
              <span className="text-[10px] text-[#4d4f46]">Atajo: Ctrl+Enter</span>
            </div>
            <div className="flex-1 min-h-0">
              <MonacoEditor
                height="100%"
                language="sql"
                theme="vs-dark"
                value={sqlCode}
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
          <div className="border-2 border-[#23251d] rounded-2xl bg-white flex flex-col min-h-0 overflow-hidden shadow-[4px_4px_0px_0px_#23251d]">
            {/* Header Panel */}
            <div className="bg-[#e4e5de] px-4 py-2.5 border-b-2 border-[#23251d] flex items-center justify-between text-xs text-[#23251d] font-mono flex-shrink-0">
              <span className="font-extrabold uppercase text-[10px]">Resultado de la consulta</span>
              {queryResult && (
                <div className="flex items-center gap-4 text-[11px] text-[#23251d] font-bold">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5 text-[#f7a501]" /> {queryResult.durationMs} ms
                  </span>
                  <span className="flex items-center gap-1">
                    <Rows className="h-3.5 w-3.5 text-[#f7a501]" /> {queryResult.rowCount} filas
                  </span>
                </div>
              )}
            </div>

            {/* Tab Panel Body */}
            <div className="flex-1 overflow-y-auto p-4 min-h-0 bg-[#eeefe9]/40 bg-grid-dots">
              {isRunning && (
                <div className="h-full flex flex-col items-center justify-center gap-2 text-[#4d4f46] py-10 font-mono">
                  <Loader2 className="animate-spin h-6 w-6 text-[#f7a501]" />
                  <span className="text-xs font-bold">Procesando consulta...</span>
                </div>
              )}

              {!isRunning && executionError && (
                <div className="bg-red-50 border-2 border-[#23251d] rounded-xl p-4 flex gap-3 text-sm text-red-800 font-mono shadow-[2px_2px_0px_0px_#23251d]">
                  <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0" />
                  <div className="space-y-1">
                    <h4 className="font-extrabold">Error del compilador de Base de Datos</h4>
                    <p className="font-mono text-xs text-red-700 whitespace-pre-wrap">{executionError}</p>
                  </div>
                </div>
              )}

              {!isRunning && !executionError && queryResult && (
                <div className="space-y-3">
                  {/* Banner: datos filtrados por política de rol */}
                  {(queryResult as any).filtered && (
                    <div
                      className="flex items-start gap-3 px-4 py-3 border-2 border-[#23251d] rounded-xl text-xs font-mono"
                      style={{ backgroundColor: '#fff8e6', boxShadow: '2px 2px 0px 0px #f7a501' }}
                    >
                      <EyeOff className="h-4 w-4 flex-shrink-0 mt-0.5" style={{ color: '#f7a501' }} />
                      <div className="space-y-1">
                        <p className="font-extrabold" style={{ color: '#23251d' }}>
                          Estás viendo datos filtrados según tu rol en esta organización.
                        </p>
                        <div className="flex flex-wrap gap-3 text-[11px]" style={{ color: '#4d4f46' }}>
                          {(queryResult as any).appliedPolicy?.rowFilter && (
                            <span>
                              Filtro de filas:{' '}
                              <code
                                className="px-1.5 py-0.5 rounded border border-[#23251d]"
                                style={{ backgroundColor: 'white' }}
                              >
                                {(queryResult as any).appliedPolicy.rowFilter}
                              </code>
                            </span>
                          )}
                          {(queryResult as any).appliedPolicy?.allowedColumns && (
                            <span>
                              Columnas visibles:{' '}
                              <strong>{(queryResult as any).appliedPolicy.allowedColumns.length}</strong>{' '}
                              de las disponibles
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
                <div className="h-full flex flex-col items-center justify-center text-[#4d4f46] py-10 font-mono">
                  <Terminal className="h-8 w-8 text-[#23251d] mb-2 opacity-50" />
                  <span className="text-xs font-bold text-center max-w-sm">Escribe código SQL y haz clic en "Ejecutar SQL" para ver resultados.</span>
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
          <div className="fixed inset-0 bg-[#23251d]/60 backdrop-blur-sm" onClick={() => setShowSaveModal(false)} />

          {/* Card */}
          <div className="bg-[#eeefe9] border-2 border-[#23251d] rounded-2xl shadow-[6px_6px_0px_0px_#23251d] z-10 max-w-md w-full relative overflow-hidden">
            {/* Modal OS Title Bar */}
            <div className="bg-[#e4e5de] border-b-2 border-[#23251d] px-4 py-3 flex items-center justify-between">
              <div className="flex gap-1.5 shrink-0">
                <div className="w-3.5 h-3.5 rounded-full window-circle-red" />
                <div className="w-3.5 h-3.5 rounded-full window-circle-yellow" />
                <div className="w-3.5 h-3.5 rounded-full window-circle-green" />
              </div>
              <span className="text-xs font-bold text-[#23251d] font-mono">save-query.sh</span>
              <button
                onClick={() => setShowSaveModal(false)}
                className="text-[#4d4f46] hover:text-[#23251d]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-xs text-[#4d4f46] leading-relaxed font-mono">
                Registra tu query para poder vincularla a gráficos y tableros interactivos.
              </p>

              <form onSubmit={handleSave} className="space-y-4 font-mono">
                <div>
                  <label className="block text-[10px] font-bold text-[#4d4f46] uppercase tracking-wider mb-2 font-mono">Nombre</label>
                  <input
                    type="text"
                    required
                    value={saveName}
                    onChange={(e) => setSaveName(e.target.value)}
                    className="w-full px-3 py-2.5 border-2 border-[#23251d] rounded-xl bg-white text-[#23251d] placeholder-slate-400 focus:outline-none focus:border-[#f7a501] transition-all text-sm font-mono shadow-[2px_2px_0px_0px_#23251d]"
                    placeholder="ej. Usuarios Activos Diarios"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-[#4d4f46] uppercase tracking-wider mb-2 font-mono">Descripción (Opcional)</label>
                  <textarea
                    value={saveDescription}
                    onChange={(e) => setSaveDescription(e.target.value)}
                    className="w-full px-3 py-2.5 border-2 border-[#23251d] rounded-xl bg-white text-[#23251d] placeholder-slate-400 focus:outline-none focus:border-[#f7a501] transition-all text-sm h-20 font-mono shadow-[2px_2px_0px_0px_#23251d]"
                    placeholder="ej. Reporte semanal de crecimiento..."
                  />
                </div>

                {saveStatus === 'success' && (
                  <div className="rounded-xl bg-emerald-50 border-2 border-[#23251d] p-3 text-emerald-800 flex items-center gap-2 text-xs font-bold font-mono shadow-[2px_2px_0px_0px_#23251d]">
                    <CheckCircle className="h-4 w-4 text-emerald-600" /> ¡Consulta guardada con éxito!
                  </div>
                )}

                {saveStatus === 'error' && (
                  <div className="rounded-xl bg-red-50 border-2 border-[#23251d] p-3 text-red-800 flex items-center gap-2 text-xs font-bold font-mono shadow-[2px_2px_0px_0px_#23251d]">
                    <AlertTriangle className="h-4 w-4 text-red-600" /> Fallo al guardar la consulta.
                  </div>
                )}

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowSaveModal(false)}
                    className="btn-retro-secondary"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving || !saveName}
                    className="btn-retro-primary"
                  >
                    {isSaving ? <Loader2 className="animate-spin h-4 w-4 text-[#23251d]" /> : 'Guardar Consulta'}
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
          <div className="fixed inset-0 bg-[#23251d]/60 backdrop-blur-sm" onClick={() => setShowWidgetModal(false)} />
          
          <div className="bg-[#eeefe9] border-2 border-[#23251d] rounded-2xl shadow-[6px_6px_0px_0px_#23251d] z-10 max-w-sm w-full relative overflow-hidden">
            {/* Modal OS Title Bar */}
            <div className="bg-[#e4e5de] border-b-2 border-[#23251d] px-4 py-3 flex items-center justify-between">
              <div className="flex gap-1.5 shrink-0">
                <div className="w-3.5 h-3.5 rounded-full window-circle-red" />
                <div className="w-3.5 h-3.5 rounded-full window-circle-yellow" />
                <div className="w-3.5 h-3.5 rounded-full window-circle-green" />
              </div>
              <span className="text-xs font-bold text-[#23251d] font-mono">new-widget.sh</span>
              <button
                onClick={() => setShowWidgetModal(false)}
                className="text-[#4d4f46] hover:text-[#23251d]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-6 space-y-4 font-mono">
              <p className="text-xs text-[#4d4f46] leading-relaxed">
                Selecciona el dashboard de destino donde quieres agregar el gráfico de esta consulta.
              </p>

              {dashboards.length === 0 ? (
                <div className="space-y-4">
                  <div className="rounded-xl bg-red-50 border-2 border-[#23251d] p-3 text-red-800 text-xs text-center font-bold shadow-[2px_2px_0px_0px_#23251d]">
                    No tienes dashboards creados en esta organización.
                  </div>
                  <button
                    onClick={() => navigate('/dashboards')}
                    className="w-full btn-retro-primary text-xs"
                  >
                    Ir a Crear Dashboard
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-bold text-[#4d4f46] uppercase tracking-wider mb-2 font-mono">
                      Dashboard Destino
                    </label>
                    <select
                      value={selectedDashboardId}
                      onChange={(e) => setSelectedDashboardId(e.target.value)}
                      className="w-full px-3 py-2.5 border-2 border-[#23251d] rounded-xl bg-white text-[#23251d] focus:outline-none focus:border-[#f7a501] transition-all text-sm font-bold cursor-pointer"
                    >
                      {dashboards.map((dash) => (
                        <option key={dash.id} value={dash.id} className="bg-white text-[#23251d]">
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
                      Cancelar
                    </button>
                    <button
                      onClick={() => {
                        setShowWidgetModal(false);
                        navigate(`/dashboards/${selectedDashboardId}/widgets/new?queryId=${activeQueryId}`);
                      }}
                      disabled={!selectedDashboardId}
                      className="btn-retro-primary text-xs"
                    >
                      Continuar
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
