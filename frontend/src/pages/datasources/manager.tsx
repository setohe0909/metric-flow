import React, { useState } from 'react';
import { useDatasources } from '@/features/datasources/hooks/use-datasources';
import type { Datasource } from '@/features/datasources/hooks/use-datasources';
import { PolicyEditor } from '@/features/datasources/components/policy-editor';
import { useAuth } from '@/features/auth/hooks/use-auth';
import { SpotlightCard } from '@/components/spotlight-card';
import { Database, Plus, Trash2, Shield, Play, Save, CheckCircle2, AlertCircle, Loader2, UploadCloud, File, X, Info } from 'lucide-react';

export default function DatasourceManager() {
  const {
    datasources,
    isLoading,
    createDatasource,
    isCreating,
    testConnection,
    isTesting,
    deleteDatasource,
    uploadFile,
    isUploading,
  } = useDatasources();

  const { activeOrg } = useAuth();
  const userRole = (activeOrg as any)?.role ?? 'READER';
  const isOwner = userRole === 'ADMIN';

  // ID del datasource cuyo PolicyEditor está abierto (null = ninguno)
  const [expandedPolicyId, setExpandedPolicyId] = useState<string | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [dbType, setDbType] = useState<'postgres' | 'mysql' | 'sqlserver' | 'sqlite' | 'csv' | 'bigquery' | 'snowflake'>('postgres');
  const [name, setName] = useState('');
  const [host, setHost] = useState('');
  const [port, setPort] = useState(5432);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [database, setDatabase] = useState('');
  const [ssl, setSsl] = useState(false);
  const [filePath, setFilePath] = useState('');
  
  // BigQuery specific fields
  const [projectId, setProjectId] = useState('');
  const [serviceAccountJson, setServiceAccountJson] = useState('');

  // Snowflake specific fields
  const [account, setAccount] = useState('');
  const [warehouse, setWarehouse] = useState('');
  const [schema, setSchema] = useState('');
  
  // Estados para subida de archivos
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Estados de validación visual
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successWarning, setSuccessWarning] = useState<string | null>(null);

  const resetForm = () => {
    setName('');
    setHost('');
    setDbType('postgres');
    setPort(5432);
    setUsername('');
    setPassword('');
    setDatabase('');
    setSsl(false);
    setFilePath('');
    setSelectedFile(null);
    setIsDragging(false);
    setTestResult(null);
    setErrorMessage(null);
    setProjectId('');
    setServiceAccountJson('');
    setAccount('');
    setWarehouse('');
    setSchema('');
  };

  const handleDbTypeChange = (type: 'postgres' | 'mysql' | 'sqlserver' | 'sqlite' | 'csv' | 'bigquery' | 'snowflake') => {
    setDbType(type);
    setTestResult(null);
    setSelectedFile(null);
    if (type === 'postgres') setPort(5432);
    else if (type === 'mysql') setPort(3306);
    else if (type === 'sqlserver') setPort(1433);
  };

  const buildConnectionSettings = () => {
    if (dbType === 'sqlite' || dbType === 'csv') {
      return { filePath };
    }
    if (dbType === 'bigquery') {
      return {
        projectId,
        serviceAccountJson,
        database,
      };
    }
    if (dbType === 'snowflake') {
      return {
        account,
        username,
        password,
        database,
        warehouse,
        schema: schema || 'PUBLIC',
      };
    }
    if (dbType === 'sqlserver') {
      return {
        host,
        port: Number(port),
        username,
        password,
        database,
        ssl,
        schema: schema || undefined,
      };
    }
    return {
      host,
      port: Number(port),
      username,
      password,
      database,
      ssl,
    };
  };

  const handleTest = async () => {
    setTestResult(null);
    setErrorMessage(null);
    try {
      const payload = {
        type: dbType,
        ...buildConnectionSettings(),
      };
      const res = await testConnection(payload);
      if (res.success) {
        setTestResult({ success: true, message: '¡Conexión establecida correctamente!' });
      }
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err.response?.data?.message || 'Error al conectar con la base de datos.',
      });
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessWarning(null);
    if (!name) {
      setErrorMessage('El nombre del conector es obligatorio.');
      return;
    }

    try {
      if (dbType === 'sqlite' || dbType === 'csv') {
        if (!selectedFile) {
          setErrorMessage('Por favor selecciona o arrastra un archivo.');
          return;
        }
        await uploadFile({
          file: selectedFile,
          name,
          type: dbType,
        });
      } else {
        const payload = {
          name,
          type: dbType,
          connectionSettings: buildConnectionSettings(),
        };
        const res = await createDatasource(payload);
        if (res && (res as any).warning) {
          setSuccessWarning((res as any).warning);
        }
      }
      setShowForm(false);
      resetForm();
    } catch (err: any) {
      setErrorMessage(err.response?.data?.message || 'Ocurrió un error al guardar el conector.');
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
      const allowed = dbType === 'csv' ? ['.csv'] : ['.sqlite', '.db'];
      if (!allowed.includes(ext)) {
        setErrorMessage(`Archivo no permitido. Debe ser un archivo ${dbType === 'csv' ? 'CSV (.csv)' : 'SQLite (.sqlite, .db)'}`);
        return;
      }
      setSelectedFile(file);
      if (!name) {
        setName(file.name.substring(0, file.name.lastIndexOf('.')) || file.name);
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      if (!name) {
        setName(file.name.substring(0, file.name.lastIndexOf('.')) || file.name);
      }
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b-2 border-[var(--color-border-strong)] pb-6">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-[var(--color-ink)] flex items-center gap-2.5 font-mono">
            <Database className="h-6 w-6 text-[var(--color-accent)]" /> Conectores
          </h1>
          <p className="text-xs text-[var(--color-muted-text)] mt-1 font-mono">
            Conecta y administra tus fuentes de datos para realizar reportes interactivos.
          </p>
        </div>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="btn-retro-primary font-mono text-xs"
          >
            <Plus className="h-4 w-4 text-[var(--color-on-accent)]" /> Nueva Conexión
          </button>
        )}
      </div>

      {successWarning && (
        <div className="rounded-xl bg-[color-mix(in_srgb,var(--color-accent)_16%,var(--color-widget))] border-2 border-[var(--color-border-strong)] p-4 flex gap-3 text-xs font-bold font-mono text-amber-800 shadow-[3px_3px_0px_0px_var(--color-border-strong)]">
          <Info className="h-5 w-5 flex-shrink-0 text-amber-600" />
          <div className="space-y-1">
            <p>Conexión guardada con advertencia de conectividad:</p>
            <p className="font-normal opacity-90 text-[11px] bg-amber-100/50 p-2 rounded border border-amber-200">{successWarning}</p>
          </div>
          <button onClick={() => setSuccessWarning(null)} className="ml-auto text-amber-600 hover:text-amber-800">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {showForm ? (
        /* Formulario de Conexión */
        <div className="bg-[var(--color-surface)] border-2 border-[var(--color-border-strong)] rounded-2xl shadow-[6px_6px_0px_0px_var(--color-border-strong)] overflow-hidden max-w-2xl">
          {/* Form OS Title Bar */}
          <div className="bg-[var(--color-widget-header)] border-b-2 border-[var(--color-border-strong)] px-4 py-3 flex items-center justify-between">
            <div className="flex gap-1.5 shrink-0">
              <div className="w-3.5 h-3.5 rounded-full window-circle-red" />
              <div className="w-3.5 h-3.5 rounded-full window-circle-yellow" />
              <div className="w-3.5 h-3.5 rounded-full window-circle-green" />
            </div>
            <span className="text-xs font-bold text-[var(--color-ink)] font-mono">new-connection.sh</span>
            <button
              onClick={() => {
                setShowForm(false);
                resetForm();
              }}
              className="text-[var(--color-muted-text)] hover:text-[var(--color-ink)]"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <form onSubmit={handleSave} className="p-6 space-y-6">
            {/* Tipo de conector */}
            <div>
              <label className="block text-[10px] font-bold text-[var(--color-muted-text)] uppercase tracking-wider mb-2 font-mono">
                Tipo de Base de Datos
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {(['postgres', 'mysql', 'sqlserver', 'sqlite', 'csv', 'bigquery', 'snowflake'] as const).map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => handleDbTypeChange(type)}
                    className={`py-3 px-4 rounded-xl border-2 text-xs font-bold flex flex-col items-center justify-center gap-2 transition-all font-mono shadow-[var(--shadow-retro-soft)] hover:shadow-[1px_1px_0px_0px_var(--color-border-strong)] hover:translate-x-[1px] hover:translate-y-[1px] ${
                      dbType === type
                        ? 'border-[var(--color-border-strong)] bg-[var(--color-accent)] text-[var(--color-on-accent)]'
                        : 'border-[var(--color-border-strong)] bg-[var(--color-widget)] text-[var(--color-muted-text)] hover:bg-[var(--color-muted-surface)]'
                    }`}
                  >
                    <Database className="h-5 w-5" />
                    <span className="capitalize">
                      {type === 'postgres'
                        ? 'PostgreSQL'
                        : type === 'mysql'
                        ? 'MySQL'
                        : type === 'sqlserver'
                        ? 'SQL Server'
                        : type === 'sqlite'
                        ? 'SQLite'
                        : type === 'csv'
                        ? 'CSV'
                        : type === 'bigquery'
                        ? 'BigQuery'
                        : 'Snowflake'}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Nombre del conector */}
            <div>
              <label className="block text-[10px] font-bold text-[var(--color-muted-text)] uppercase tracking-wider mb-2 font-mono">
                Nombre descriptivo
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2.5 border-2 border-[var(--color-border-strong)] rounded-xl bg-[var(--color-widget)] text-[var(--color-ink)] placeholder-[var(--color-subtle-text)] focus:outline-none focus:border-[var(--color-accent)] transition-all text-sm font-mono shadow-[var(--shadow-retro-soft)]"
                placeholder="ej. Base de Datos de Ventas - Prod"
              />
            </div>

            {dbType === 'sqlite' || dbType === 'csv' ? (
              /* Drag and drop zone para SQLite / CSV */
              <div className="space-y-3">
                <label className="block text-[10px] font-bold text-[var(--color-muted-text)] uppercase tracking-wider mb-2 font-mono">
                  Subir Archivo {dbType === 'csv' ? 'CSV' : 'SQLite'}
                </label>
                
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer flex flex-col items-center justify-center min-h-[160px] relative font-mono ${
                    isDragging
                      ? 'border-[var(--color-accent)] bg-[color-mix(in_srgb,var(--color-accent)_10%,transparent)] text-[var(--color-accent)]'
                      : selectedFile
                      ? 'border-emerald-600 bg-[color-mix(in_srgb,#22c55e_10%,var(--color-widget))] text-[var(--color-ink)]'
                      : 'border-[var(--color-border-strong)] bg-[var(--color-widget)] hover:bg-[var(--color-muted-surface)] text-[var(--color-muted-text)]'
                  } shadow-[var(--shadow-retro-soft)]`}
                >
                  <input
                    type="file"
                    accept={dbType === 'csv' ? '.csv' : '.sqlite,.db'}
                    onChange={handleFileChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  />
                  
                  {selectedFile ? (
                    <div className="flex flex-col items-center gap-3">
                      <div className="p-3 bg-[color-mix(in_srgb,#22c55e_12%,var(--color-widget))] border-2 border-emerald-600 rounded-xl text-[var(--color-ink)]">
                        <File className="h-8 w-8" />
                      </div>
                      <div className="z-20 text-center">
                        <p className="text-sm font-bold text-emerald-800 max-w-[280px] truncate">
                          {selectedFile.name}
                        </p>
                        <p className="text-xs text-emerald-600 font-semibold mt-1">
                          {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setSelectedFile(null);
                        }}
                        className="mt-2 text-[10px] flex items-center gap-1 text-[var(--color-ink)] bg-[var(--color-danger)] border-2 border-[var(--color-border-strong)] px-2.5 py-1 rounded-lg transition-all z-20 shadow-[1px_1px_0px_0px_var(--color-border-strong)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none"
                      >
                        <X className="h-3 w-3" /> Quitar archivo
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2.5 pointer-events-none">
                      <div className="p-3 bg-[var(--color-muted-surface)] border-2 border-[var(--color-border-strong)] rounded-xl text-[var(--color-accent)]">
                        <UploadCloud className="h-8 w-8 text-[var(--color-ink)]" />
                      </div>
                      <div>
                        <p className="text-xs font-extrabold text-[var(--color-ink)]">
                          Arrastra tu archivo aquí o haz clic para buscar
                        </p>
                        <p className="text-[10px] text-[var(--color-muted-text)] mt-1.5">
                          Soporta {dbType === 'csv' ? 'CSV (.csv)' : 'SQLite (.sqlite, .db)'} hasta 20MB
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : dbType === 'bigquery' ? (
              /* Campos para BigQuery */
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-[var(--color-muted-text)] uppercase tracking-wider mb-2 font-mono">
                      ID del Proyecto GCP
                    </label>
                    <input
                      type="text"
                      required
                      value={projectId}
                      onChange={(e) => setProjectId(e.target.value)}
                      className="w-full px-3 py-2.5 border-2 border-[var(--color-border-strong)] rounded-xl bg-[var(--color-widget)] text-[var(--color-ink)] placeholder-[var(--color-subtle-text)] focus:outline-none focus:border-[var(--color-accent)] transition-all text-sm font-mono shadow-[var(--shadow-retro-soft)]"
                      placeholder="my-gcp-project"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-[var(--color-muted-text)] uppercase tracking-wider mb-2 font-mono">
                      Dataset (Base de Datos)
                    </label>
                    <input
                      type="text"
                      required
                      value={database}
                      onChange={(e) => setDatabase(e.target.value)}
                      className="w-full px-3 py-2.5 border-2 border-[var(--color-border-strong)] rounded-xl bg-[var(--color-widget)] text-[var(--color-ink)] placeholder-[var(--color-subtle-text)] focus:outline-none focus:border-[var(--color-accent)] transition-all text-sm font-mono shadow-[var(--shadow-retro-soft)]"
                      placeholder="my_dataset"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-[var(--color-muted-text)] uppercase tracking-wider mb-2 font-mono">
                    Service Account Key JSON
                  </label>
                  <textarea
                    required
                    rows={4}
                    value={serviceAccountJson}
                    onChange={(e) => setServiceAccountJson(e.target.value)}
                    className="w-full px-3 py-2.5 border-2 border-[var(--color-border-strong)] rounded-xl bg-[var(--color-widget)] text-[var(--color-ink)] placeholder-[var(--color-subtle-text)] focus:outline-none focus:border-[var(--color-accent)] transition-all text-sm font-mono shadow-[var(--shadow-retro-soft)]"
                    placeholder='{ "type": "service_account", "project_id": ... }'
                  />
                </div>
              </>
            ) : dbType === 'snowflake' ? (
              /* Campos para Snowflake */
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-[var(--color-muted-text)] uppercase tracking-wider mb-2 font-mono">
                      Identificador de Cuenta
                    </label>
                    <input
                      type="text"
                      required
                      value={account}
                      onChange={(e) => setAccount(e.target.value)}
                      className="w-full px-3 py-2.5 border-2 border-[var(--color-border-strong)] rounded-xl bg-[var(--color-widget)] text-[var(--color-ink)] placeholder-[var(--color-subtle-text)] focus:outline-none focus:border-[var(--color-accent)] transition-all text-sm font-mono shadow-[var(--shadow-retro-soft)]"
                      placeholder="xy12345.us-east-2.aws"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-[var(--color-muted-text)] uppercase tracking-wider mb-2 font-mono">
                      Warehouse (Almacén)
                    </label>
                    <input
                      type="text"
                      required
                      value={warehouse}
                      onChange={(e) => setWarehouse(e.target.value)}
                      className="w-full px-3 py-2.5 border-2 border-[var(--color-border-strong)] rounded-xl bg-[var(--color-widget)] text-[var(--color-ink)] placeholder-[var(--color-subtle-text)] focus:outline-none focus:border-[var(--color-accent)] transition-all text-sm font-mono shadow-[var(--shadow-retro-soft)]"
                      placeholder="COMPUTE_WH"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-[var(--color-muted-text)] uppercase tracking-wider mb-2 font-mono">
                      Usuario
                    </label>
                    <input
                      type="text"
                      required
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="w-full px-3 py-2.5 border-2 border-[var(--color-border-strong)] rounded-xl bg-[var(--color-widget)] text-[var(--color-ink)] placeholder-[var(--color-subtle-text)] focus:outline-none focus:border-[var(--color-accent)] transition-all text-sm font-mono shadow-[var(--shadow-retro-soft)]"
                      placeholder="usuario"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-[var(--color-muted-text)] uppercase tracking-wider mb-2 font-mono">
                      Contraseña
                    </label>
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full px-3 py-2.5 border-2 border-[var(--color-border-strong)] rounded-xl bg-[var(--color-widget)] text-[var(--color-ink)] placeholder-[var(--color-subtle-text)] focus:outline-none focus:border-[var(--color-accent)] transition-all text-sm font-mono shadow-[var(--shadow-retro-soft)]"
                      placeholder="••••••••"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-[var(--color-muted-text)] uppercase tracking-wider mb-2 font-mono">
                      Base de Datos
                    </label>
                    <input
                      type="text"
                      required
                      value={database}
                      onChange={(e) => setDatabase(e.target.value)}
                      className="w-full px-3 py-2.5 border-2 border-[var(--color-border-strong)] rounded-xl bg-[var(--color-widget)] text-[var(--color-ink)] placeholder-[var(--color-subtle-text)] focus:outline-none focus:border-[var(--color-accent)] transition-all text-sm font-mono shadow-[var(--shadow-retro-soft)]"
                      placeholder="MY_DATABASE"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-[var(--color-muted-text)] uppercase tracking-wider mb-2 font-mono">
                      Esquema (Schema)
                    </label>
                    <input
                      type="text"
                      value={schema}
                      onChange={(e) => setSchema(e.target.value)}
                      className="w-full px-3 py-2.5 border-2 border-[var(--color-border-strong)] rounded-xl bg-[var(--color-widget)] text-[var(--color-ink)] placeholder-[var(--color-subtle-text)] focus:outline-none focus:border-[var(--color-accent)] transition-all text-sm font-mono shadow-[var(--shadow-retro-soft)]"
                      placeholder="PUBLIC (opcional)"
                    />
                  </div>
                </div>
              </>
            ) : (
              /* Campos para bases de datos relacionales (Postgres / MySQL / SQL Server) */
              <>
                <div className="grid grid-cols-3 gap-4">
                  <div className="col-span-2">
                    <label className="block text-[10px] font-bold text-[var(--color-muted-text)] uppercase tracking-wider mb-2 font-mono">
                      Host / Endpoint
                    </label>
                    <input
                      type="text"
                      required
                      value={host}
                      onChange={(e) => setHost(e.target.value)}
                      className="w-full px-3 py-2.5 border-2 border-[var(--color-border-strong)] rounded-xl bg-[var(--color-widget)] text-[var(--color-ink)] placeholder-[var(--color-subtle-text)] focus:outline-none focus:border-[var(--color-accent)] transition-all text-sm font-mono shadow-[var(--shadow-retro-soft)]"
                      placeholder="rds.amazonaws.com o localhost"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-[var(--color-muted-text)] uppercase tracking-wider mb-2 font-mono">
                      Puerto
                    </label>
                    <input
                      type="number"
                      required
                      value={port}
                      onChange={(e) => setPort(Number(e.target.value))}
                      className="w-full px-3 py-2.5 border-2 border-[var(--color-border-strong)] rounded-xl bg-[var(--color-widget)] text-[var(--color-ink)] placeholder-[var(--color-subtle-text)] focus:outline-none focus:border-[var(--color-accent)] transition-all text-sm font-mono shadow-[var(--shadow-retro-soft)]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-[var(--color-muted-text)] uppercase tracking-wider mb-2 font-mono">
                      Usuario
                    </label>
                    <input
                      type="text"
                      required
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="w-full px-3 py-2.5 border-2 border-[var(--color-border-strong)] rounded-xl bg-[var(--color-widget)] text-[var(--color-ink)] placeholder-[var(--color-subtle-text)] focus:outline-none focus:border-[var(--color-accent)] transition-all text-sm font-mono shadow-[var(--shadow-retro-soft)]"
                      placeholder={dbType === 'sqlserver' ? 'sa' : 'postgres'}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-[var(--color-muted-text)] uppercase tracking-wider mb-2 font-mono">
                      Contraseña
                    </label>
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full px-3 py-2.5 border-2 border-[var(--color-border-strong)] rounded-xl bg-[var(--color-widget)] text-[var(--color-ink)] placeholder-[var(--color-subtle-text)] focus:outline-none focus:border-[var(--color-accent)] transition-all text-sm font-mono shadow-[var(--shadow-retro-soft)]"
                      placeholder="••••••••"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-[var(--color-muted-text)] uppercase tracking-wider mb-2 font-mono">
                    Nombre de la Base de Datos
                  </label>
                  <input
                    type="text"
                    required
                    value={database}
                    onChange={(e) => setDatabase(e.target.value)}
                    className="w-full px-3 py-2.5 border-2 border-[var(--color-border-strong)] rounded-xl bg-[var(--color-widget)] text-[var(--color-ink)] placeholder-[var(--color-subtle-text)] focus:outline-none focus:border-[var(--color-accent)] transition-all text-sm font-mono shadow-[var(--shadow-retro-soft)]"
                    placeholder="production_db"
                  />
                </div>

                {dbType === 'sqlserver' && (
                  <div>
                    <label className="block text-[10px] font-bold text-[var(--color-muted-text)] uppercase tracking-wider mb-2 font-mono">
                      Schema por defecto
                    </label>
                    <input
                      type="text"
                      value={schema}
                      onChange={(e) => setSchema(e.target.value)}
                      className="w-full px-3 py-2.5 border-2 border-[var(--color-border-strong)] rounded-xl bg-[var(--color-widget)] text-[var(--color-ink)] placeholder-[var(--color-subtle-text)] focus:outline-none focus:border-[var(--color-accent)] transition-all text-sm font-mono shadow-[var(--shadow-retro-soft)]"
                      placeholder="dbo (opcional)"
                    />
                  </div>
                )}

                <div className="flex items-center gap-2 py-1">
                  <input
                    id="ssl"
                    type="checkbox"
                    checked={ssl}
                    onChange={(e) => setSsl(e.target.checked)}
                    className="h-4 w-4 rounded border-2 border-[var(--color-border-strong)] bg-[var(--color-widget)] text-[var(--color-accent)] focus:ring-0 cursor-pointer"
                  />
                  <label htmlFor="ssl" className="text-xs font-bold font-mono text-[var(--color-ink)] flex items-center gap-1.5 cursor-pointer">
                    <Shield className="h-4 w-4 text-[var(--color-accent)]" /> Requerir conexión segura (TLS/SSL)
                  </label>
                </div>
              </>
            )}

            {/* Mensajes de feedback */}
            {testResult && (
              <div
                className={`rounded-xl p-4 border-2 font-mono text-xs font-bold shadow-[var(--shadow-retro-soft)] ${
                  testResult.success
                    ? 'bg-[color-mix(in_srgb,#22c55e_14%,var(--color-widget))] border-[var(--color-border-strong)] text-[var(--color-ink)] flex items-center gap-2'
                    : 'bg-[var(--color-error-surface)] border-[var(--color-border-strong)] text-[var(--color-ink)] flex items-center gap-2'
                }`}
              >
                {testResult.success ? <CheckCircle2 className="h-5 w-5 text-emerald-600" /> : <AlertCircle className="h-5 w-5 text-red-600" />}
                <span>{testResult.message}</span>
              </div>
            )}

            {errorMessage && (
              <div className="rounded-xl p-4 border-2 bg-[var(--color-error-surface)] border-[var(--color-border-strong)] text-[var(--color-ink)] flex items-center gap-2 text-xs font-bold font-mono shadow-[var(--shadow-retro-soft)]">
                <AlertCircle className="h-5 w-5 text-red-600" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Acciones */}
            <div className="flex items-center justify-end gap-3 border-t-2 border-[color-mix(in_srgb,var(--color-border-strong)_10%,transparent)] pt-4 font-mono">
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  resetForm();
                }}
                className="btn-retro-secondary"
              >
                Cancelar
              </button>

              {dbType !== 'sqlite' && dbType !== 'csv' && (
                <button
                  type="button"
                  onClick={handleTest}
                  disabled={
                    isTesting ||
                    (dbType === 'bigquery'
                      ? !projectId || !serviceAccountJson || !database
                      : dbType === 'snowflake'
                      ? !account || !username || !password || !database || !warehouse
                      : !host || !username || !password || !database)
                  }
                  className="flex items-center gap-1.5 btn-retro-secondary disabled:opacity-50"
                >
                  {isTesting ? (
                    <Loader2 className="animate-spin h-4 w-4" />
                  ) : (
                    <>
                      <Play className="h-4 w-4 text-[var(--color-accent)]" /> Probar Conexión
                    </>
                  )}
                </button>
              )}

              <button
                type="submit"
                disabled={isCreating || isUploading}
                className="flex items-center gap-1.5 btn-retro-primary disabled:opacity-50"
              >
                {isCreating || isUploading ? (
                  <Loader2 className="animate-spin h-4 w-4" />
                ) : (
                  <>
                    <Save className="h-4 w-4 text-[var(--color-on-accent)]" /> Guardar Conexión
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      ) : (
        /* Listado de Conectores */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {isLoading ? (
            <div className="col-span-2 py-12 flex justify-center">
              <Loader2 className="animate-spin h-8 w-8 text-[var(--color-accent)]" />
            </div>
          ) : datasources.length === 0 ? (
            <div className="col-span-2 border-2 border-dashed border-[var(--color-border-strong)] rounded-2xl p-12 flex flex-col items-center justify-center text-center bg-[var(--color-widget)] shadow-[var(--shadow-retro-strong)] font-mono">
              <div className="p-4 bg-[var(--color-muted-surface)] border-2 border-[var(--color-border-strong)] rounded-2xl mb-4">
                <Database className="h-8 w-8 text-[var(--color-accent)]" />
              </div>
              <h3 className="text-base font-extrabold text-[var(--color-ink)]">No hay conectores registrados</h3>
              <p className="text-xs text-[var(--color-muted-text)] max-w-sm mt-1 mb-6 leading-relaxed">
                Conecta PostgreSQL, MySQL, SQL Server o SQLite para empezar a crear consultas SQL.
              </p>
              <button
                onClick={() => setShowForm(true)}
                className="btn-retro-primary"
              >
                <Plus className="h-4 w-4 text-[var(--color-on-accent)]" /> Agregar primer conector
              </button>
            </div>
          ) : (
            datasources.map((ds: Datasource) => (
              <div key={ds.id} className="flex flex-col gap-3">
                <SpotlightCard
                  className="min-h-[140px] hover:border-[var(--color-accent)] !p-0"
                >
                  {/* Retro OS Header Bar */}
                  <div className="bg-[var(--color-widget-header)] border-b-2 border-[var(--color-border-strong)] px-4 py-2.5 flex items-center justify-between gap-3">
                    <div className="flex gap-1.5 shrink-0">
                      <div className="w-3 h-3 rounded-full window-circle-red" />
                      <div className="w-3 h-3 rounded-full window-circle-yellow" />
                      <div className="w-3 h-3 rounded-full window-circle-green" />
                    </div>
                    <span className="text-xs font-bold text-[var(--color-ink)] truncate font-mono flex-1 text-center">
                      {ds.name}.db
                    </span>
                    <button
                      onClick={() => {
                        if (confirm(`¿Estás seguro de eliminar el conector "${ds.name}"?`)) {
                          deleteDatasource(ds.id);
                        }
                      }}
                      className="text-[var(--color-muted-text)] hover:text-red-500 hover:bg-[color-mix(in_srgb,var(--color-danger)_14%,transparent)] p-1.5 rounded-lg border-2 border-transparent hover:border-[var(--color-border-strong)] transition-all"
                      title="Eliminar conector"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  {/* Card Body */}
                  <div className="p-5 flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="text-base font-extrabold text-[var(--color-ink)] font-mono truncate">{ds.name}</h3>
                      <p className="text-xs text-[var(--color-muted-text)] capitalize mt-2 flex flex-wrap items-center gap-1.5 font-mono">
                        <span className="px-2 py-0.5 bg-[var(--color-muted-surface)] border-2 border-[var(--color-border-strong)] rounded font-bold text-[10px] text-[var(--color-ink)] uppercase">
                          {ds.type}
                        </span>
                        {(ds as any).connectionSettings?.host && (
                          <span className="bg-[var(--color-widget)] px-2 py-0.5 border-2 border-[var(--color-border-strong)] rounded text-[10px] font-bold text-[var(--color-ink)]">
                            {(ds as any).connectionSettings.host}
                          </span>
                        )}
                        {(ds as any).connectionSettings?.database && (
                          <span className="bg-[var(--color-widget)] px-2 py-0.5 border-2 border-[var(--color-border-strong)] rounded text-[10px] font-bold text-[var(--color-ink)]">
                            DB: {(ds as any).connectionSettings.database}
                          </span>
                        )}
                        {/* Badge de políticas activas */}
                        {(ds as any).hasPolicies && (
                          <span
                            className="flex items-center gap-1 px-2 py-0.5 border-2 border-[var(--color-border-strong)] rounded text-[10px] font-bold font-mono"
                            style={{ backgroundColor: 'var(--color-accent)', color: 'var(--color-on-accent)' }}
                          >
                            <Shield className="h-2.5 w-2.5" />
                            Políticas activas
                          </span>
                        )}
                      </p>
                    </div>

                    {/* Botón de políticas — solo para owner */}
                    {isOwner && (
                      <div className="mt-4 pt-4 border-t-2 border-[color-mix(in_srgb,var(--color-border-strong)_10%,transparent)]">
                        <button
                          onClick={() =>
                            setExpandedPolicyId(
                              expandedPolicyId === ds.id ? null : ds.id,
                            )
                          }
                          className="flex items-center gap-1.5 text-[10px] font-bold font-mono px-3 py-1.5 border-2 border-[var(--color-border-strong)] rounded-lg transition-all"
                          style={{
                            backgroundColor: expandedPolicyId === ds.id ? 'var(--color-accent)' : 'transparent',
                            color: expandedPolicyId === ds.id ? 'var(--color-on-accent)' : 'var(--color-ink)',
                            boxShadow: '2px 2px 0px 0px var(--color-border-strong)',
                          }}
                        >
                          <Shield className="h-3 w-3" />
                          {expandedPolicyId === ds.id ? 'Cerrar políticas' : 'Configurar acceso'}
                        </button>
                      </div>
                    )}
                  </div>
                </SpotlightCard>

                {/* PolicyEditor — desplegable bajo la card */}
                {isOwner && expandedPolicyId === ds.id && (
                  <PolicyEditor
                    datasourceId={ds.id}
                    datasourceName={ds.name}
                    initialPolicies={(ds as any).accessPolicies ?? null}
                    onClose={() => setExpandedPolicyId(null)}
                  />
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
