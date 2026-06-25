import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

export interface RolePolicy {
  allowedColumns: string[] | null;
  rowFilter: string | null;
}

export interface AccessPolicies {
  READER?: RolePolicy;
  EDITOR?: RolePolicy;
}

export interface UpdatePoliciesPayload {
  datasourceId: string;
  policies: AccessPolicies;
}

export interface UpdatePoliciesResponse {
  id: string;
  name: string;
  accessPolicies: AccessPolicies | null;
  message: string;
}

export function useDatasourcePolicies() {
  const queryClient = useQueryClient();

  const updateMutation = useMutation({
    mutationFn: async ({ datasourceId, policies }: UpdatePoliciesPayload) => {
      const { data } = await apiClient.put<UpdatePoliciesResponse>(
        `/datasources/${datasourceId}/policies`,
        policies,
      );
      return data;
    },
    onSuccess: () => {
      // Refrescar la lista de conectores para que los badges se actualicen
      queryClient.invalidateQueries({ queryKey: ['datasources'] });
    },
  });

  return {
    updatePolicies: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
    updateError: updateMutation.error,
    updateSuccess: updateMutation.isSuccess,
  };
}
