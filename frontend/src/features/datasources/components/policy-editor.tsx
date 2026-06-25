import { useState } from 'react';
import { Shield, Save, Loader2, CheckCircle2, AlertCircle, X, Plus, Info } from 'lucide-react';
import { useDatasourcePolicies } from '../hooks/use-datasource-policies';
import type { AccessPolicies, RolePolicy } from '../hooks/use-datasource-policies';

interface PolicyEditorProps {
  datasourceId: string;
  datasourceName: string;
  initialPolicies: AccessPolicies | null;
  onClose: () => void;
}

type Role = 'READER' | 'EDITOR';

const ROLE_LABELS: Record<Role, { label: string; description: string; color: string }> = {
  READER: {
    label: 'Lector',
    description: 'Usuarios de solo lectura. Aplica la restricción más estricta.',
    color: '#f7a501',
  },
  EDITOR: {
    label: 'Editor',
    description: 'Usuarios que crean contenido y ejecutan consultas de lectura.',
    color: '#23251d',
  },
};

function useRolePolicyState(initial: RolePolicy | undefined) {
  const [enabled, setEnabled] = useState(!!initial);
  const [rowFilter, setRowFilter] = useState(initial?.rowFilter ?? '');
  const [columnInput, setColumnInput] = useState('');
  const [allowedColumns, setAllowedColumns] = useState<string[]>(initial?.allowedColumns ?? []);

  const addColumn = () => {
    const col = columnInput.trim();
    if (col && !allowedColumns.includes(col)) {
      setAllowedColumns((prev) => [...prev, col]);
      setColumnInput('');
    }
  };

  const removeColumn = (col: string) => {
    setAllowedColumns((prev) => prev.filter((c) => c !== col));
  };

  const toPolicy = (): RolePolicy => ({
    rowFilter: rowFilter.trim() || null,
    allowedColumns: allowedColumns.length > 0 ? allowedColumns : null,
  });

  return { enabled, setEnabled, rowFilter, setRowFilter, columnInput, setColumnInput, allowedColumns, addColumn, removeColumn, toPolicy };
}

export function PolicyEditor({ datasourceId, datasourceName, initialPolicies, onClose }: PolicyEditorProps) {
  const { updatePolicies, isUpdating } = useDatasourcePolicies();
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [saveMessage, setSaveMessage] = useState('');
  const [activeTab, setActiveTab] = useState<Role>('READER');

  const READER = useRolePolicyState(initialPolicies?.READER);
  const EDITOR = useRolePolicyState(initialPolicies?.EDITOR);

  const roleState: Record<Role, ReturnType<typeof useRolePolicyState>> = { READER, EDITOR };

  const handleSave = async () => {
    setSaveStatus('idle');
    try {
      const policies: AccessPolicies = {};
      if (READER.enabled) policies.READER = READER.toPolicy();
      if (EDITOR.enabled) policies.EDITOR = EDITOR.toPolicy();

      const res = await updatePolicies({ datasourceId, policies });
      setSaveStatus('success');
      setSaveMessage(res.message);
      setTimeout(() => setSaveStatus('idle'), 2500);
    } catch (err: any) {
      setSaveStatus('error');
      setSaveMessage(err?.response?.data?.message ?? 'Error al guardar las políticas.');
    }
  };

  return (
    <div
      className="border-2 border-[#23251d] rounded-2xl overflow-hidden"
      style={{ boxShadow: '5px 5px 0px 0px #f7a501', backgroundColor: '#eeefe9' }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-5 py-3 border-b-2 border-[#23251d]"
        style={{ backgroundColor: '#e4e5de' }}
      >
        <div className="flex items-center gap-2">
          <Shield className="h-4 w-4" style={{ color: '#f7a501' }} />
          <span className="text-sm font-extrabold font-mono" style={{ color: '#23251d' }}>
            Políticas de acceso —{' '}
            <span className="font-normal opacity-70">{datasourceName}</span>
          </span>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-lg transition-colors hover:bg-black/10"
          title="Cerrar"
        >
          <X className="h-4 w-4" style={{ color: '#4d4f46' }} />
        </button>
      </div>

      {/* Info banner */}
      <div
        className="flex gap-2.5 items-start px-5 py-3 border-b-2 border-[#23251d]/20 text-[11px] font-mono"
        style={{ backgroundColor: '#f4f4f0', color: '#4d4f46' }}
      >
        <Info className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" style={{ color: '#f7a501' }} />
        <p>
          El <strong>administrador</strong> siempre ve todos los datos sin restricción.{' '}
          Configura abajo qué pueden ver los roles <strong>editor</strong> y <strong>lector</strong>.
        </p>
      </div>

      {/* Tab selector */}
      <div className="flex border-b-2 border-[#23251d] font-mono text-xs font-bold">
        {(['READER', 'EDITOR'] as Role[]).map((role) => {
          const rs = roleState[role];
          return (
            <button
              key={role}
              onClick={() => setActiveTab(role)}
              className={`flex-1 py-2.5 flex items-center justify-center gap-2 transition-colors border-r-2 last:border-r-0 border-[#23251d] ${
                activeTab === role
                  ? 'bg-white text-[#23251d]'
                  : 'bg-[#e4e5de] text-[#4d4f46] hover:bg-white/50'
              }`}
            >
              <span className="capitalize">{ROLE_LABELS[role].label}</span>
              {rs.enabled && (
                <span
                  className="text-[9px] px-1.5 py-0.5 rounded border-2 border-[#23251d] font-extrabold"
                  style={{ backgroundColor: '#f7a501', color: '#23251d' }}
                >
                  ACTIVO
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      {(['READER', 'EDITOR'] as Role[]).map((role) => {
        if (activeTab !== role) return null;
        const rs = roleState[role];
        const meta = ROLE_LABELS[role];

        return (
          <div key={role} className="p-5 space-y-5">
            <p className="text-[11px] font-mono" style={{ color: '#4d4f46' }}>
              {meta.description}
            </p>

            {/* Toggle de habilitación */}
            <label className="flex items-center gap-3 cursor-pointer select-none">
              <div
                onClick={() => rs.setEnabled(!rs.enabled)}
                className={`relative w-10 h-5 rounded-full border-2 border-[#23251d] transition-colors flex-shrink-0 cursor-pointer ${
                  rs.enabled ? 'bg-[#f7a501]' : 'bg-white'
                }`}
              >
                <div
                  className={`absolute top-0.5 w-3.5 h-3.5 rounded-full border-2 border-[#23251d] bg-white transition-all ${
                    rs.enabled ? 'left-[calc(100%-18px)]' : 'left-0.5'
                  }`}
                />
              </div>
              <span className="text-xs font-bold font-mono" style={{ color: '#23251d' }}>
                {rs.enabled ? 'Restricciones activas para este rol' : 'Sin restricciones (acceso total)'}
              </span>
            </label>

            {rs.enabled && (
              <div className="space-y-5 pt-1">
                {/* Row Filter */}
                <div>
                  <label className="block text-[10px] font-extrabold uppercase tracking-wider mb-1.5 font-mono" style={{ color: '#4d4f46' }}>
                    Filtro de filas (WHERE)
                  </label>
                  <input
                    type="text"
                    value={rs.rowFilter}
                    onChange={(e) => rs.setRowFilter(e.target.value)}
                    placeholder="ej. region = 'LATAM' o deleted_at IS NULL"
                    className="w-full px-3 py-2.5 border-2 border-[#23251d] rounded-xl bg-white text-[#23251d] placeholder-slate-400 focus:outline-none transition-all text-xs font-mono"
                    style={{ boxShadow: '2px 2px 0px 0px #23251d' }}
                    onFocus={(e) => (e.target.style.boxShadow = '3px 3px 0px 0px #f7a501')}
                    onBlur={(e) => (e.target.style.boxShadow = '2px 2px 0px 0px #23251d')}
                  />
                  <p className="text-[10px] font-mono mt-1" style={{ color: '#4d4f46' }}>
                    Se inyecta como <code className="bg-white border border-[#23251d] px-1 rounded">SELECT * FROM (&lt;tu_sql&gt;) WHERE …</code>
                  </p>
                </div>

                {/* Columnas permitidas */}
                <div>
                  <label className="block text-[10px] font-extrabold uppercase tracking-wider mb-1.5 font-mono" style={{ color: '#4d4f46' }}>
                    Columnas permitidas
                  </label>

                  {/* Chips de columnas */}
                  {rs.allowedColumns.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {rs.allowedColumns.map((col) => (
                        <span
                          key={col}
                          className="flex items-center gap-1 px-2 py-0.5 rounded border-2 border-[#23251d] text-[10px] font-bold font-mono"
                          style={{ backgroundColor: '#f7a501', color: '#23251d', boxShadow: '1px 1px 0px 0px #23251d' }}
                        >
                          {col}
                          <button onClick={() => rs.removeColumn(col)} className="hover:opacity-60">
                            <X className="h-2.5 w-2.5" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={rs.columnInput}
                      onChange={(e) => rs.setColumnInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') { e.preventDefault(); rs.addColumn(); }
                      }}
                      placeholder="nombre_columna (Enter para agregar)"
                      className="flex-1 px-3 py-2 border-2 border-[#23251d] rounded-xl bg-white text-[#23251d] placeholder-slate-400 focus:outline-none text-xs font-mono"
                      style={{ boxShadow: '2px 2px 0px 0px #23251d' }}
                      onFocus={(e) => (e.target.style.boxShadow = '3px 3px 0px 0px #f7a501')}
                      onBlur={(e) => (e.target.style.boxShadow = '2px 2px 0px 0px #23251d')}
                    />
                    <button
                      type="button"
                      onClick={rs.addColumn}
                      className="btn-retro-secondary text-xs px-3"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <p className="text-[10px] font-mono mt-1" style={{ color: '#4d4f46' }}>
                    Sin columnas = el rol ve todas las columnas del resultado.
                  </p>
                </div>
              </div>
            )}
          </div>
        );
      })}

      {/* Footer actions */}
      <div
        className="flex items-center justify-between gap-3 px-5 py-4 border-t-2 border-[#23251d] font-mono"
        style={{ backgroundColor: '#e4e5de' }}
      >
        {/* Feedback */}
        <div className="flex-1 min-w-0">
          {saveStatus === 'success' && (
            <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700">
              <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
              <span className="truncate">{saveMessage}</span>
            </div>
          )}
          {saveStatus === 'error' && (
            <div className="flex items-center gap-1.5 text-xs font-bold text-red-600">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <span className="truncate">{saveMessage}</span>
            </div>
          )}
        </div>
        <button
          onClick={handleSave}
          disabled={isUpdating}
          className="btn-retro-primary text-xs flex items-center gap-1.5 disabled:opacity-50 flex-shrink-0"
        >
          {isUpdating ? (
            <Loader2 className="animate-spin h-3.5 w-3.5 text-[#23251d]" />
          ) : (
            <Save className="h-3.5 w-3.5 text-[#23251d]" />
          )}
          Guardar políticas
        </button>
      </div>
    </div>
  );
}
