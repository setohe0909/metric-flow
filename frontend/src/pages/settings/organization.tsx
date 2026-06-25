import React, { useState, useEffect } from 'react';
import { useOrganization } from '@/features/organizations/hooks/use-organization';
import { useAuth } from '@/features/auth/hooks/use-auth';
import {
  Settings,
  Building2,
  UserPlus,
  Users,
  Trash2,
  Loader2,
  Save,
  Mail,
  CheckCircle,
  AlertTriangle,
  Shield,
  Crown,
  Eye,
  KeyRound,
  Power,
} from 'lucide-react';

export default function OrgSettings() {
  const { activeOrg, user: currentUser } = useAuth();
  const {
    orgDetails,
    isLoadingOrg,
    updateOrgName,
    isUpdatingName,
    inviteMember,
    isInviting,
    removeMember,
    updateMemberRole,
    resetMemberPassword,
    setMemberDisabled,
  } = useOrganization();

  const [orgName, setOrgName] = useState('');
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'ADMIN' | 'EDITOR' | 'READER'>('READER');
  const [inviteStatus, setInviteStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [inviteError, setInviteError] = useState('');
  const [temporaryPassword, setTemporaryPassword] = useState<string | null>(
    null,
  );

  const isAdmin = activeOrg?.role === 'ADMIN';

  useEffect(() => {
    if (orgDetails?.name) {
      setOrgName(orgDetails.name);
    }
  }, [orgDetails]);

  const handleUpdateName = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin || !orgName.trim() || orgName === orgDetails?.name) return;
    setSaveStatus('idle');
    try {
      await updateOrgName({ name: orgName.trim() });
      setSaveStatus('success');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch {
      setSaveStatus('error');
    }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin || !inviteEmail.trim()) return;
    setInviteStatus('idle');
    setInviteError('');
    try {
      const created = await inviteMember({
        email: inviteEmail.trim(),
        role: inviteRole,
      });
      setTemporaryPassword(created.temporaryPassword);
      setInviteStatus('success');
      setInviteEmail('');
      setTimeout(() => setInviteStatus('idle'), 2000);
    } catch (err: any) {
      setInviteStatus('error');
      setInviteError(err.response?.data?.message || 'Error al enviar la invitación.');
    }
  };

  const handleResetPassword = async (membershipId: string) => {
    const result = await resetMemberPassword({ membershipId });
    setTemporaryPassword(result.temporaryPassword);
  };

  const handleRemoveMember = async (membershipId: string, memberEmail: string) => {
    if (!isAdmin) return;
    if (confirm(`¿Estás seguro de remover a ${memberEmail} de la organización?`)) {
      try {
        await removeMember(membershipId);
      } catch (err: any) {
        alert(err.response?.data?.message || 'Error al remover al miembro.');
      }
    }
  };

  const roleConfig: Record<string, { label: string; icon: React.ElementType; classes: string }> = {
    ADMIN: {
      label: 'Administrador',
      icon: Crown,
      classes: 'bg-[#f7a501]/15 text-[#7b3e00] border-[#f7a501] border',
    },
    EDITOR: {
      label: 'Editor',
      icon: Shield,
      classes: 'bg-[#23251d]/10 text-[#23251d] border-[#23251d]/30 border',
    },
    READER: {
      label: 'Lector',
      icon: Eye,
      classes: 'bg-[#eeefe9] text-[#4d4f46] border-[#23251d]/20 border',
    },
  };

  return (
    <div className="space-y-6 font-mono">
      {/* ── Page Header ── */}
      <div className="border-b-2 border-[#23251d] pb-5">
        <h1 className="text-2xl font-extrabold tracking-tight text-[#23251d] flex items-center gap-2.5">
          <Settings className="h-6 w-6 text-[#f7a501]" /> Ajustes
        </h1>
        <p className="text-xs text-[#4d4f46] mt-1">
          Administra tu organización, roles e invita a miembros del equipo.
        </p>
      </div>

      {isLoadingOrg ? (
        <div className="py-16 flex flex-col items-center justify-center gap-3 text-[#4d4f46]">
          <Loader2 className="animate-spin h-7 w-7 text-[#f7a501]" />
          <span className="text-xs font-bold">Cargando configuración...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* ── Left Column ── */}
          <div className="lg:col-span-1 space-y-5">

            {/* Org Profile Card */}
            <div className="border-2 border-[#23251d] rounded-2xl overflow-hidden shadow-[4px_4px_0px_0px_#23251d] bg-white">
              {/* Card Title Bar */}
              <div className="bg-[#e4e5de] border-b-2 border-[#23251d] px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2 font-extrabold text-[#23251d] text-sm">
                  <Building2 className="h-4 w-4 text-[#f7a501]" /> Perfil de la Organización
                </div>
                <div className="flex gap-1">
                  <div className="w-3 h-3 rounded-full window-circle-red" />
                  <div className="w-3 h-3 rounded-full window-circle-yellow" />
                  <div className="w-3 h-3 rounded-full window-circle-green" />
                </div>
              </div>

              <form onSubmit={handleUpdateName} className="p-5 space-y-4">
                <div>
                  <label className="block text-[10px] font-extrabold text-[#4d4f46] uppercase tracking-wider mb-1.5">
                    Nombre comercial
                  </label>
                  <input
                    type="text"
                    disabled={!isAdmin}
                    required
                    value={orgName}
                    onChange={(e) => setOrgName(e.target.value)}
                    className="w-full px-3 py-2.5 border-2 border-[#23251d] rounded-xl bg-[#eeefe9] text-[#23251d] placeholder-[#4d4f46]/50 focus:outline-none focus:border-[#f7a501] focus:shadow-[0_0_0_3px_rgba(247,165,1,0.15)] transition-all text-sm font-mono disabled:opacity-50 disabled:cursor-not-allowed"
                    placeholder="Mi Empresa S.A."
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-extrabold text-[#4d4f46] uppercase tracking-wider mb-1.5">
                    Identificador (Slug)
                  </label>
                  <input
                    type="text"
                    disabled
                    value={orgDetails?.slug || ''}
                    className="w-full px-3 py-2.5 border-2 border-[#23251d]/20 rounded-xl bg-[#eeefe9]/60 text-[#4d4f46] text-sm font-mono cursor-not-allowed"
                  />
                  <p className="text-[10px] text-[#4d4f46]/70 mt-1.5">
                    Identificador interno del workspace.
                  </p>
                </div>

                {saveStatus === 'success' && (
                  <div className="bg-[#d4f5e1] border-2 border-[#23251d] rounded-xl p-3 flex items-center gap-2 text-[#0a5e2a] text-xs font-extrabold shadow-[2px_2px_0px_0px_#23251d]">
                    <CheckCircle className="h-4 w-4 flex-shrink-0" /> Nombre actualizado con éxito.
                  </div>
                )}

                {saveStatus === 'error' && (
                  <div className="bg-red-50 border-2 border-[#23251d] rounded-xl p-3 flex items-center gap-2 text-red-700 text-xs font-extrabold shadow-[2px_2px_0px_0px_#23251d]">
                    <AlertTriangle className="h-4 w-4 flex-shrink-0" /> Error al actualizar el nombre.
                  </div>
                )}

                {isAdmin && (
                  <button
                    type="submit"
                    disabled={isUpdatingName || !orgName.trim() || orgName === orgDetails?.name}
                    className="btn-retro-primary w-full justify-center text-xs disabled:opacity-50"
                  >
                    {isUpdatingName ? (
                      <Loader2 className="animate-spin h-3.5 w-3.5" />
                    ) : (
                      <>
                        <Save className="h-3.5 w-3.5" /> Guardar Cambios
                      </>
                    )}
                  </button>
                )}
              </form>
            </div>

            {/* Invite Member Card */}
            {isAdmin && (
              <div className="border-2 border-[#23251d] rounded-2xl overflow-hidden shadow-[4px_4px_0px_0px_#23251d] bg-white">
                <div className="bg-[#e4e5de] border-b-2 border-[#23251d] px-4 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-2 font-extrabold text-[#23251d] text-sm">
                    <UserPlus className="h-4 w-4 text-[#f7a501]" /> Invitar Miembro
                  </div>
                  <div className="flex gap-1">
                    <div className="w-3 h-3 rounded-full window-circle-red" />
                    <div className="w-3 h-3 rounded-full window-circle-yellow" />
                    <div className="w-3 h-3 rounded-full window-circle-green" />
                  </div>
                </div>

                <form onSubmit={handleInvite} className="p-5 space-y-4">
                  <div>
                    <label className="block text-[10px] font-extrabold text-[#4d4f46] uppercase tracking-wider mb-1.5">
                      Correo Electrónico
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-[#4d4f46]" />
                      <input
                        type="email"
                        required
                        placeholder="ejemplo@empresa.com"
                        value={inviteEmail}
                        onChange={(e) => setInviteEmail(e.target.value)}
                        className="w-full pl-9 pr-3 py-2.5 border-2 border-[#23251d] rounded-xl bg-[#eeefe9] text-[#23251d] placeholder-[#4d4f46]/50 focus:outline-none focus:border-[#f7a501] focus:shadow-[0_0_0_3px_rgba(247,165,1,0.15)] transition-all text-sm font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-extrabold text-[#4d4f46] uppercase tracking-wider mb-1.5">
                      Rol Asignado
                    </label>
                    <select
                      value={inviteRole}
                      onChange={(e) => setInviteRole(e.target.value as any)}
                      className="w-full px-3 py-2.5 border-2 border-[#23251d] rounded-xl bg-[#eeefe9] text-[#23251d] focus:outline-none focus:border-[#f7a501] focus:shadow-[0_0_0_3px_rgba(247,165,1,0.15)] transition-all text-sm font-mono font-bold cursor-pointer"
                    >
                      <option value="READER" className="bg-white text-[#23251d]">Lector</option>
                      <option value="EDITOR" className="bg-white text-[#23251d]">Editor</option>
                      <option value="ADMIN" className="bg-white text-[#23251d]">Administrador</option>
                    </select>
                  </div>

                  {inviteStatus === 'success' && (
                    <div className="bg-[#d4f5e1] border-2 border-[#23251d] rounded-xl p-3 flex items-center gap-2 text-[#0a5e2a] text-xs font-extrabold shadow-[2px_2px_0px_0px_#23251d]">
                      <CheckCircle className="h-4 w-4 flex-shrink-0" /> Miembro agregado exitosamente.
                    </div>
                  )}

                  {temporaryPassword && (
                    <div role="status" className="rounded-xl border-2 border-[#23251d] bg-[#fff4d6] p-3 text-xs">
                      <strong>Contraseña temporal — se muestra una sola vez:</strong>
                      <code className="mt-2 block break-all rounded bg-white p-2 font-mono">
                        {temporaryPassword}
                      </code>
                    </div>
                  )}

                  {inviteStatus === 'error' && (
                    <div className="bg-red-50 border-2 border-[#23251d] rounded-xl p-3 flex items-center gap-2 text-red-700 text-xs font-extrabold shadow-[2px_2px_0px_0px_#23251d]">
                      <AlertTriangle className="h-4 w-4 flex-shrink-0" /> {inviteError}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isInviting || !inviteEmail.trim()}
                    className="btn-retro-primary w-full justify-center text-xs disabled:opacity-50"
                  >
                    {isInviting ? (
                      <Loader2 className="animate-spin h-3.5 w-3.5" />
                    ) : (
                      <>
                        <UserPlus className="h-3.5 w-3.5" /> Invitar a MetricFlow
                      </>
                    )}
                  </button>
                </form>
              </div>
            )}
          </div>

          {/* ── Right Column: Members Table ── */}
          <div className="lg:col-span-2">
            <div className="border-2 border-[#23251d] rounded-2xl overflow-hidden shadow-[4px_4px_0px_0px_#23251d] bg-white h-full flex flex-col">
              {/* Card Title Bar */}
              <div className="bg-[#e4e5de] border-b-2 border-[#23251d] px-4 py-3 flex items-center justify-between flex-shrink-0">
                <div className="flex items-center gap-2 font-extrabold text-[#23251d] text-sm">
                  <Users className="h-4 w-4 text-[#f7a501]" /> Miembros Activos
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[10px] font-extrabold text-[#23251d] bg-[#f7a501] border border-[#23251d] px-2 py-0.5 rounded-full uppercase">
                    {orgDetails?.memberships?.length ?? 0} total
                  </span>
                  <div className="flex gap-1">
                    <div className="w-3 h-3 rounded-full window-circle-red" />
                    <div className="w-3 h-3 rounded-full window-circle-yellow" />
                    <div className="w-3 h-3 rounded-full window-circle-green" />
                  </div>
                </div>
              </div>

              {/* Table */}
              <div className="flex-1 overflow-auto min-h-0">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="sticky top-0 z-10">
                    <tr className="bg-[#eeefe9] border-b-2 border-[#23251d]">
                      <th className="py-3 px-4 text-[10px] font-extrabold text-[#4d4f46] uppercase tracking-wider">
                        Usuario
                      </th>
                      <th className="py-3 px-4 text-[10px] font-extrabold text-[#4d4f46] uppercase tracking-wider">
                        Email
                      </th>
                      <th className="py-3 px-4 text-[10px] font-extrabold text-[#4d4f46] uppercase tracking-wider">
                        Rol
                      </th>
                      <th className="py-3 px-4 text-[10px] font-extrabold text-[#4d4f46] uppercase tracking-wider">
                        Miembro desde
                      </th>
                      {isAdmin && (
                        <th className="py-3 px-4 text-[10px] font-extrabold text-[#4d4f46] uppercase tracking-wider text-right">
                          Acciones
                        </th>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {orgDetails?.memberships.map((membership, idx) => {
                      const user = membership.user;
                      const role = roleConfig[membership.role] || roleConfig.READER;
                      const RoleIcon = role.icon;

                      return (
                        <tr
                          key={membership.id}
                          className={`border-b border-[#23251d]/10 transition-colors hover:bg-[#eeefe9] ${
                            idx % 2 === 0 ? 'bg-white' : 'bg-[#f8f8f4]'
                          }`}
                        >
                          <td className="py-3.5 px-4 font-extrabold text-[#23251d] whitespace-nowrap">
                            {user.firstName} {user.lastName || ''}
                          </td>
                          <td className="py-3.5 px-4 text-[#4d4f46] truncate max-w-[180px]">
                            {user.email}
                          </td>
                          <td className="py-3.5 px-4">
                            {isAdmin && user.id !== currentUser?.id ? (
                              <select
                                value={membership.role}
                                onChange={(event) =>
                                  updateMemberRole({
                                    membershipId: membership.id,
                                    role: event.target.value as
                                      | 'ADMIN'
                                      | 'EDITOR'
                                      | 'READER',
                                  })
                                }
                                className="rounded border border-[#23251d] bg-white px-2 py-1"
                              >
                                <option value="ADMIN">Administrador</option>
                                <option value="EDITOR">Editor</option>
                                <option value="READER">Lector</option>
                              </select>
                            ) : (
                              <span
                                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] uppercase font-extrabold ${role.classes}`}
                              >
                                <RoleIcon className="h-2.5 w-2.5" />
                                {role.label}
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-[#4d4f46] text-[11px]">
                            {new Date(membership.createdAt).toLocaleDateString('es', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                            })}
                          </td>
                          {isAdmin && (
                            <td className="py-3.5 px-4 text-right">
                              {currentUser?.id !== user.id && (
                                <div className="flex justify-end gap-1">
                                  <button
                                    onClick={() =>
                                      handleResetPassword(membership.id)
                                    }
                                    className="p-1.5 rounded-lg hover:bg-[#fff4d6]"
                                    title="Restablecer contraseña"
                                  >
                                    <KeyRound className="h-3.5 w-3.5" />
                                  </button>
                                  <button
                                    onClick={() =>
                                      setMemberDisabled({
                                        membershipId: membership.id,
                                        disabled: !user.disabledAt,
                                      })
                                    }
                                    className="p-1.5 rounded-lg hover:bg-[#fff4d6]"
                                    title={
                                      user.disabledAt
                                        ? 'Reactivar usuario'
                                        : 'Desactivar usuario'
                                    }
                                  >
                                    <Power className="h-3.5 w-3.5" />
                                  </button>
                                  <button
                                    onClick={() =>
                                      handleRemoveMember(
                                        membership.id,
                                        user.email,
                                      )
                                    }
                                    className="p-1.5 text-[#4d4f46] hover:text-red-600 hover:bg-red-50 rounded-lg"
                                    title="Remover miembro"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                              )}
                            </td>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                {/* Empty State */}
                {(!orgDetails?.memberships || orgDetails.memberships.length === 0) && (
                  <div className="flex flex-col items-center justify-center py-16 text-[#4d4f46]">
                    <Users className="h-8 w-8 mb-3 opacity-30" />
                    <p className="text-xs font-bold">No hay miembros en la organización</p>
                    <p className="text-[10px] opacity-70 mt-1">Usa el formulario de invitación para agregar personas.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
