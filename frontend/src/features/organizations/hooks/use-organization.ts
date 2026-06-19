import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

export interface OrgUser {
  id: string;
  email: string;
  firstName: string;
  lastName?: string;
}

export interface OrgMembership {
  id: string;
  userId: string;
  role: 'owner' | 'admin' | 'viewer';
  user: OrgUser;
  createdAt: string;
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
    mutationFn: async (payload: { email: string; role: 'owner' | 'admin' | 'viewer' }) => {
      const { data } = await apiClient.post<OrgMembership>('/organizations/active/members', payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['active-org-details'] });
    },
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

  // Crear nueva organización
  const createOrgMutation = useMutation({
    mutationFn: async (payload: { name: string }) => {
      const { data } = await apiClient.post<any>('/organizations', payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auth-me'] });
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
    createOrganization: createOrgMutation.mutateAsync,
    isCreatingOrg: createOrgMutation.isPending,
  };
}
