import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDashboards } from '@/features/dashboards/hooks/use-dashboards';
import { LayoutDashboard, Plus, Trash2, Calendar, ChevronRight, X, Loader2 } from 'lucide-react';
import { useAuth } from '@/features/auth/hooks/use-auth';
import { SpotlightCard } from '@/components/spotlight-card';

export default function DashboardList() {
  const navigate = useNavigate();
  const { activeOrg } = useAuth();
  const { dashboards, isLoadingDashboards, createDashboard, deleteDashboard } = useDashboards();

  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const isViewer = activeOrg?.role === 'READER';

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isViewer || !name.trim()) return;

    setIsSaving(true);
    setErrorMsg('');
    try {
      const newDash = await createDashboard({
        name: name.trim(),
        description: description.trim() || undefined,
      });
      setShowModal(false);
      setName('');
      setDescription('');
      navigate(`/dashboards/${newDash.id}`);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Error al crear el dashboard.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (e: React.MouseEvent, id: string, dashName: string) => {
    e.stopPropagation();
    if (isViewer) return;

    if (confirm(`¿Estás seguro de eliminar el dashboard "${dashName}" y todos sus widgets?`)) {
      try {
        await deleteDashboard(id);
      } catch (err: any) {
        alert(err.response?.data?.message || 'Error al eliminar el dashboard.');
      }
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b-2 border-[var(--color-ink)] pb-6">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-[var(--color-ink)] flex items-center gap-2.5 font-mono">
            <LayoutDashboard className="h-6 w-6 text-[var(--color-accent)]" /> Dashboards
          </h1>
          <p className="text-xs text-[var(--color-muted-text)] mt-1 font-mono">Crea y administra tableros de control para tu equipo.</p>
        </div>
        {!isViewer && (
          <button
            onClick={() => setShowModal(true)}
            className="btn-retro-primary"
          >
            <Plus className="h-4 w-4 text-[var(--color-ink)]" /> Nuevo Dashboard
          </button>
        )}
      </div>

      {/* List / Grid */}
      {isLoadingDashboards ? (
        <div className="py-20 flex justify-center items-center">
          <Loader2 className="animate-spin h-8 w-8 text-[var(--color-accent)]" />
        </div>
      ) : dashboards.length === 0 ? (
        <div className="border-2 border-[var(--color-ink)] rounded-2xl p-16 flex flex-col items-center justify-center text-center bg-[var(--color-card)] shadow-[4px_4px_0px_0px_var(--color-ink)]">
          <div className="p-4 bg-[var(--color-surface)] border-2 border-[var(--color-ink)] rounded-2xl mb-4">
            <LayoutDashboard className="h-8 w-8 text-[var(--color-accent)]" />
          </div>
          <h3 className="text-base font-extrabold text-[var(--color-ink)] font-mono">No hay dashboards creados</h3>
          <p className="text-xs text-[var(--color-muted-text)] max-w-sm mt-1 mb-6 leading-relaxed font-mono">
            Comienza conectando tu base de datos en la sección de Conectores, guarda tu primera query y construye tu tablero.
          </p>
          {!isViewer && (
            <button
              onClick={() => setShowModal(true)}
              className="btn-retro-primary"
            >
              <Plus className="h-4 w-4 text-[var(--color-ink)]" /> Crear mi primer dashboard
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {dashboards.map((dash) => (
            <SpotlightCard
              key={dash.id}
              onClick={() => navigate(`/dashboards/${dash.id}`)}
              className="cursor-pointer min-h-[180px] hover:border-[var(--color-accent)] !p-0"
            >
              {/* Retro OS Header Bar */}
              <div className="bg-[var(--color-panel)] border-b-2 border-[var(--color-ink)] px-4 py-2.5 flex items-center justify-between gap-3">
                <div className="flex gap-1.5 shrink-0">
                  <div className="w-3.5 h-3.5 rounded-full window-circle-red" />
                  <div className="w-3.5 h-3.5 rounded-full window-circle-yellow" />
                  <div className="w-3.5 h-3.5 rounded-full window-circle-green" />
                </div>
                <span className="text-xs font-bold text-[var(--color-ink)] truncate font-mono flex-1 text-center">
                  {dash.name}.app
                </span>
                {!isViewer && (
                  <button
                    onClick={(e) => handleDelete(e, dash.id, dash.name)}
                    className="text-[var(--color-muted-text)] hover:text-red-500 hover:bg-red-500/10 p-1 rounded transition-all"
                    title="Eliminar dashboard"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              {/* Card Body */}
              <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                <div className="space-y-1">
                  <h3 className="text-base font-extrabold text-[var(--color-ink)] group-hover:text-[var(--color-accent)] transition-colors truncate font-mono">
                    {dash.name}
                  </h3>
                  {dash.description && (
                    <p className="text-xs text-[var(--color-muted-text)] line-clamp-2 leading-relaxed">
                      {dash.description}
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-between border-t border-[color-mix(in_srgb,var(--color-ink)_10%,transparent)] pt-4 text-[10px] text-[var(--color-muted-text)] font-bold uppercase tracking-wider font-mono">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5 text-[var(--color-muted-text)]" />
                    {new Date(dash.createdAt).toLocaleDateString()}
                  </span>
                  <span className="flex items-center gap-0.5 text-[var(--color-accent)] group-hover:translate-x-0.5 transition-transform font-extrabold">
                    Ver Tablero <ChevronRight className="h-3.5 w-3.5" />
                  </span>
                </div>
              </div>
            </SpotlightCard>
          ))}
        </div>
      )}

      {/* Modal de Creación */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-[var(--color-ink)]/60 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          
          <div className="bg-[var(--color-canvas)] border-2 border-[var(--color-ink)] rounded-2xl shadow-[6px_6px_0px_0px_var(--color-ink)] z-10 max-w-md w-full relative overflow-hidden">
            {/* Modal OS Title Bar */}
            <div className="bg-[var(--color-panel)] border-b-2 border-[var(--color-ink)] px-4 py-3 flex items-center justify-between">
              <div className="flex gap-1.5 shrink-0">
                <div className="w-3.5 h-3.5 rounded-full window-circle-red" />
                <div className="w-3.5 h-3.5 rounded-full window-circle-yellow" />
                <div className="w-3.5 h-3.5 rounded-full window-circle-green" />
              </div>
              <span className="text-xs font-bold text-[var(--color-ink)] font-mono">new-dashboard.sh</span>
              <button
                onClick={() => setShowModal(false)}
                className="text-[var(--color-muted-text)] hover:text-red-500"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-xs text-[var(--color-muted-text)] leading-relaxed font-mono">
                Un dashboard organiza múltiples widgets interactivos alimentados por tus bases de datos.
              </p>

              <form onSubmit={handleCreate} className="space-y-4">
                <div>
                  <label className="block text-[11px] font-bold text-[var(--color-muted-text)] uppercase tracking-wider mb-2 font-mono">
                    Nombre del Dashboard
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="ej. KPI Semanal de Crecimiento"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-2.5 border-2 border-[var(--color-ink)] rounded-xl bg-[var(--color-card)] text-[var(--color-ink)] placeholder-[var(--color-subtle-text)] focus:outline-none focus:border-[var(--color-accent)] transition-all text-sm font-mono shadow-[2px_2px_0px_0px_var(--color-ink)]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[var(--color-muted-text)] uppercase tracking-wider mb-2 font-mono">
                    Descripción (Opcional)
                  </label>
                  <textarea
                    placeholder="ej. Monitoreo de ingresos recurrentes mensuales y conversión..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full px-3 py-2.5 border-2 border-[var(--color-ink)] rounded-xl bg-[var(--color-card)] text-[var(--color-ink)] placeholder-[var(--color-subtle-text)] focus:outline-none focus:border-[var(--color-accent)] transition-all text-sm h-20 shadow-[2px_2px_0px_0px_var(--color-ink)]"
                  />
                </div>

                {errorMsg && (
                  <div className="rounded-xl bg-[var(--color-error-surface)] border-2 border-[var(--color-ink)] p-3 text-red-700 text-xs font-bold font-mono">
                    {errorMsg}
                  </div>
                )}

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="btn-retro-secondary"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving || !name.trim()}
                    className="btn-retro-primary"
                  >
                    {isSaving ? <Loader2 className="animate-spin h-4 w-4 text-[var(--color-ink)]" /> : 'Crear Dashboard'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
