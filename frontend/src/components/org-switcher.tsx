import { useState } from 'react';
import { useAuth } from '@/features/auth/hooks/use-auth';
import { useOrgStore } from '@/store/use-org-store';
import { useOrganization } from '@/features/organizations/hooks/use-organization';
import { ChevronDown, Building, Check, Plus, X, Loader2 } from 'lucide-react';

export default function OrgSwitcher() {
  const { organizations, activeOrg } = useAuth();
  const { setActiveOrg } = useOrgStore();
  const { createOrganization } = useOrganization();
  const [isOpen, setIsOpen] = useState(false);

  // Estados del modal de creación
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  if (!activeOrg) return null;

  const handleCreateOrg = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSaving(true);
    try {
      const newOrg = await createOrganization({ name: name.trim() });
      const orgPayload = {
        id: newOrg.id,
        name: newOrg.name,
        slug: newOrg.slug,
        role: 'owner',
      };
      // Cambiar a la organización creada
      setActiveOrg(orgPayload);
      setShowModal(false);
      setName('');
      window.location.reload();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error al crear la organización.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl bg-white border-2 border-[#23251d] text-[#23251d] hover:bg-[#f4f4f0] transition-all text-xs font-bold font-mono shadow-[2px_2px_0px_0px_#23251d] focus:outline-none cursor-pointer"
      >
        <div className="flex items-center gap-2 truncate">
          <div className="p-1 bg-[#f7a501] border border-[#23251d] text-[#23251d] rounded-lg">
            <Building className="h-3.5 w-3.5" />
          </div>
          <span className="truncate">{activeOrg.name}</span>
        </div>
        <ChevronDown className={`h-3.5 w-3.5 text-[#23251d] transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          {/* Backdrop to close */}
          <div className="fixed inset-0 z-20" onClick={() => setIsOpen(false)} />
          
          <div className="absolute left-0 right-0 mt-2 bg-white border-2 border-[#23251d] rounded-xl shadow-[4px_4px_0px_0px_#23251d] z-30 py-2 overflow-hidden font-mono text-xs">
            <div className="px-3 py-1 text-[10px] font-bold text-[#4d4f46] uppercase tracking-wider">
              Mis Organizaciones
            </div>
            
            <div className="max-h-[200px] overflow-y-auto mt-1">
              {organizations.map((org) => (
                <button
                  key={org.id}
                  onClick={() => {
                    setActiveOrg(org);
                    setIsOpen(false);
                    // Forzar recarga de queries y dashboards al cambiar tenant
                    window.location.reload();
                  }}
                  className="w-full flex items-center justify-between gap-2 px-3 py-2 text-[#23251d] hover:bg-[#f4f4f0] transition-colors text-left font-bold cursor-pointer"
                >
                  <span className="truncate">{org.name}</span>
                  {org.id === activeOrg.id && <Check className="h-4 w-4 text-[#f7a501] flex-shrink-0 stroke-[3px]" />}
                </button>
              ))}
            </div>

            <div className="border-t-2 border-[#23251d]/10 mt-1.5 pt-1.5 px-2">
              <button
                onClick={() => {
                  setIsOpen(false);
                  setShowModal(true);
                }}
                className="w-full flex items-center gap-2 px-2.5 py-2 text-[#4d4f46] hover:text-[#23251d] hover:bg-[#f4f4f0] rounded-lg transition-colors text-[10px] font-bold text-left cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5 text-[#f7a501]" />
                Crear Organización
              </button>
            </div>
          </div>
        </>
      )}

      {/* Modal de Creación de Org */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-[#23251d]/60 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          
          <div className="bg-[#eeefe9] border-2 border-[#23251d] rounded-2xl shadow-[6px_6px_0px_0px_#23251d] z-50 max-w-sm w-full relative overflow-hidden">
            {/* Modal OS Title Bar */}
            <div className="bg-[#e4e5de] border-b-2 border-[#23251d] px-4 py-3 flex items-center justify-between">
              <div className="flex gap-1.5 shrink-0">
                <div className="w-3.5 h-3.5 rounded-full window-circle-red" />
                <div className="w-3.5 h-3.5 rounded-full window-circle-yellow" />
                <div className="w-3.5 h-3.5 rounded-full window-circle-green" />
              </div>
              <span className="text-xs font-bold text-[#23251d] font-mono">new-org.sh</span>
              <button
                onClick={() => setShowModal(false)}
                className="text-[#4d4f46] hover:text-[#23251d]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-xs text-[#4d4f46] leading-relaxed font-mono">
                Crea una nueva organización aislada para albergar conectores de datos, consultas y dashboards separados.
              </p>

              <form onSubmit={handleCreateOrg} className="space-y-4 font-mono">
                <div>
                  <label className="block text-[10px] font-bold text-[#4d4f46] uppercase tracking-wider mb-2 font-mono">
                    Nombre de la Organización
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="ej. Mi Empresa B2B"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-2.5 border-2 border-[#23251d] rounded-xl bg-white text-[#23251d] placeholder-slate-400 focus:outline-none focus:border-[#f7a501] transition-all text-sm font-mono shadow-[2px_2px_0px_0px_#23251d]"
                  />
                </div>

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
                    {isSaving ? <Loader2 className="animate-spin h-4 w-4 text-[#23251d]" /> : 'Crear'}
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
