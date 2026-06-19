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

  const isViewer = activeOrg?.role === 'viewer';

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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b-2 border-[#23251d] pb-6">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-[#23251d] flex items-center gap-2.5 font-mono">
            <LayoutDashboard className="h-6 w-6 text-[#f7a501]" /> Dashboards
          </h1>
          <p className="text-xs text-[#4d4f46] mt-1 font-mono">Crea y administra tableros de control para tu equipo.</p>
        </div>
        {!isViewer && (
          <button
            onClick={() => setShowModal(true)}
            className="btn-retro-primary"
          >
            <Plus className="h-4 w-4 text-[#23251d]" /> Nuevo Dashboard
          </button>
        )}
      </div>

      {/* List / Grid */}
      {isLoadingDashboards ? (
        <div className="py-20 flex justify-center items-center">
          <Loader2 className="animate-spin h-8 w-8 text-[#f7a501]" />
        </div>
      ) : dashboards.length === 0 ? (
        <div className="border-2 border-[#23251d] rounded-2xl p-16 flex flex-col items-center justify-center text-center bg-white shadow-[4px_4px_0px_0px_#23251d]">
          <div className="p-4 bg-[#f4f4f0] border-2 border-[#23251d] rounded-2xl mb-4">
            <LayoutDashboard className="h-8 w-8 text-[#f7a501]" />
          </div>
          <h3 className="text-base font-extrabold text-[#23251d] font-mono">No hay dashboards creados</h3>
          <p className="text-xs text-[#4d4f46] max-w-sm mt-1 mb-6 leading-relaxed font-mono">
            Comienza conectando tu base de datos en la sección de Conectores, guarda tu primera query y construye tu tablero.
          </p>
          {!isViewer && (
            <button
              onClick={() => setShowModal(true)}
              className="btn-retro-primary"
            >
              <Plus className="h-4 w-4 text-[#23251d]" /> Crear mi primer dashboard
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {dashboards.map((dash) => (
            <SpotlightCard
              key={dash.id}
              onClick={() => navigate(`/dashboards/${dash.id}`)}
              className="cursor-pointer min-h-[180px] hover:border-[#f7a501] !p-0"
            >
              {/* Retro OS Header Bar */}
              <div className="bg-[#e4e5de] border-b-2 border-[#23251d] px-4 py-2.5 flex items-center justify-between gap-3">
                <div className="flex gap-1.5 shrink-0">
                  <div className="w-3.5 h-3.5 rounded-full window-circle-red" />
                  <div className="w-3.5 h-3.5 rounded-full window-circle-yellow" />
                  <div className="w-3.5 h-3.5 rounded-full window-circle-green" />
                </div>
                <span className="text-xs font-bold text-[#23251d] truncate font-mono flex-1 text-center">
                  {dash.name}.app
                </span>
                {!isViewer && (
                  <button
                    onClick={(e) => handleDelete(e, dash.id, dash.name)}
                    className="text-[#4d4f46] hover:text-red-500 hover:bg-red-500/10 p-1 rounded transition-all"
                    title="Eliminar dashboard"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              {/* Card Body */}
              <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                <div className="space-y-1">
                  <h3 className="text-base font-extrabold text-[#23251d] group-hover:text-[#f7a501] transition-colors truncate font-mono">
                    {dash.name}
                  </h3>
                  {dash.description && (
                    <p className="text-xs text-[#4d4f46] line-clamp-2 leading-relaxed">
                      {dash.description}
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-between border-t border-[#23251d]/10 pt-4 text-[10px] text-[#4d4f46] font-bold uppercase tracking-wider font-mono">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5 text-[#4d4f46]" />
                    {new Date(dash.createdAt).toLocaleDateString()}
                  </span>
                  <span className="flex items-center gap-0.5 text-[#f7a501] group-hover:translate-x-0.5 transition-transform font-extrabold">
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
          <div className="fixed inset-0 bg-[#23251d]/60 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          
          <div className="bg-[#eeefe9] border-2 border-[#23251d] rounded-2xl shadow-[6px_6px_0px_0px_#23251d] z-10 max-w-md w-full relative overflow-hidden">
            {/* Modal OS Title Bar */}
            <div className="bg-[#e4e5de] border-b-2 border-[#23251d] px-4 py-3 flex items-center justify-between">
              <div className="flex gap-1.5 shrink-0">
                <div className="w-3.5 h-3.5 rounded-full window-circle-red" />
                <div className="w-3.5 h-3.5 rounded-full window-circle-yellow" />
                <div className="w-3.5 h-3.5 rounded-full window-circle-green" />
              </div>
              <span className="text-xs font-bold text-[#23251d] font-mono">new-dashboard.sh</span>
              <button
                onClick={() => setShowModal(false)}
                className="text-[#4d4f46] hover:text-red-500"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-xs text-[#4d4f46] leading-relaxed font-mono">
                Un dashboard organiza múltiples widgets interactivos alimentados por tus bases de datos.
              </p>

              <form onSubmit={handleCreate} className="space-y-4">
                <div>
                  <label className="block text-[11px] font-bold text-[#4d4f46] uppercase tracking-wider mb-2 font-mono">
                    Nombre del Dashboard
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="ej. KPI Semanal de Crecimiento"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-2.5 border-2 border-[#23251d] rounded-xl bg-white text-[#23251d] placeholder-slate-400 focus:outline-none focus:border-[#f7a501] transition-all text-sm font-mono shadow-[2px_2px_0px_0px_#23251d]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#4d4f46] uppercase tracking-wider mb-2 font-mono">
                    Descripción (Opcional)
                  </label>
                  <textarea
                    placeholder="ej. Monitoreo de ingresos recurrentes mensuales y conversión..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full px-3 py-2.5 border-2 border-[#23251d] rounded-xl bg-white text-[#23251d] placeholder-slate-400 focus:outline-none focus:border-[#f7a501] transition-all text-sm h-20 shadow-[2px_2px_0px_0px_#23251d]"
                  />
                </div>

                {errorMsg && (
                  <div className="rounded-xl bg-red-100 border-2 border-[#23251d] p-3 text-red-700 text-xs font-bold font-mono">
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
                    {isSaving ? <Loader2 className="animate-spin h-4 w-4 text-[#23251d]" /> : 'Crear Dashboard'}
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
