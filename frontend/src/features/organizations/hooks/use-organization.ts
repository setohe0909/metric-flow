import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

export interface OrgUser {
  id: string;
  email: string;
  firstName: string;
  lastName?: string;
  disabledAt?: string | null;
  mustChangePassword?: boolean;
}

export interface OrgMembership {
  id: string;
  userId: string;
  role: 'ADMIN' | 'EDITOR' | 'READER';
  user: OrgUser;
  createdAt: string;
}

interface MemberMutation {
  membershipId: string;
}

export interface ActiveOrgDetails {
  id: string;
  name: string;
  slug: string;
  createdAt: string;
  memberships: OrgMembership[];
}

export function useOrganization() {
  const queryClient = useQueryClient();

  // Obtener detalles de la organización activa
  const { data: orgDetails, isLoading, error } = useQuery<ActiveOrgDetails>({
    queryKey: ['active-org-details'],
    queryFn: async () => {
      const { data } = await apiClient.get<ActiveOrgDetails>('/organizations/active');
      return data;
    },
  });

  // Actualizar nombre de la organización
  const updateNameMutation = useMutation({
    mutationFn: async (payload: { name: string }) => {
      const { data } = await apiClient.put<any>('/organizations/active', payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['active-org-details'] });
      queryClient.invalidateQueries({ queryKey: ['auth-me'] });
    },
  });

  // Invitar/agregar miembro
  const inviteMemberMutation = useMutation({
    mutationFn: async (payload: { email: string; role: 'ADMIN' | 'EDITOR' | 'READER' }) => {
      const { data } = await apiClient.post<
        OrgMembership & { temporaryPassword: string | null }
      >('/organizations/active/members', payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['active-org-details'] });
    },
  });

  const updateRoleMutation = useMutation({
    mutationFn: async ({
      membershipId,
      role,
    }: MemberMutation & { role: OrgMembership['role'] }) => {
      const { data } = await apiClient.put(
        `/organizations/active/members/${membershipId}/role`,
        { role },
      );
      return data;
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ['active-org-details'] }),
  });

  const resetPasswordMutation = useMutation({
    mutationFn: async ({ membershipId }: MemberMutation) => {
      const { data } = await apiClient.post<{ temporaryPassword: string }>(
        `/organizations/active/members/${membershipId}/reset-password`,
      );
      return data;
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({
      membershipId,
      disabled,
    }: MemberMutation & { disabled: boolean }) => {
      const { data } = await apiClient.put(
        `/organizations/active/members/${membershipId}/status`,
        { disabled },
      );
      return data;
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ['active-org-details'] }),
  });

  // Eliminar miembro
  const removeMemberMutation = useMutation({
    mutationFn: async (membershipId: string) => {
      const { data } = await apiClient.delete(`/organizations/active/members/${membershipId}`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['active-org-details'] });
    },
  });

  return {
    orgDetails,
    isLoadingOrg: isLoading,
    orgError: error,
    updateOrgName: updateNameMutation.mutateAsync,
    isUpdatingName: updateNameMutation.isPending,
    inviteMember: inviteMemberMutation.mutateAsync,
    isInviting: inviteMemberMutation.isPending,
    removeMember: removeMemberMutation.mutateAsync,
    isRemoving: removeMemberMutation.isPending,
    updateMemberRole: updateRoleMutation.mutateAsync,
    resetMemberPassword: resetPasswordMutation.mutateAsync,
    setMemberDisabled: updateStatusMutation.mutateAsync,
  };
}
