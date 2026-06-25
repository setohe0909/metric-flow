import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

export interface Dashboard {
  id: string;
  name: string;
  description?: string;
  isPublic: boolean;
  publishedAt?: string | null;
  shareToken?: string;
  createdAt: string;
  widgets?: any[];
}

export function useDashboards() {
  const queryClient = useQueryClient();

  // Listar dashboards
  const { data: dashboards = [], isLoading, error } = useQuery<Dashboard[]>({
    queryKey: ['dashboards'],
    queryFn: async () => {
      const { data } = await apiClient.get<Dashboard[]>('/dashboards');
      return data;
    },
  });

  // Crear dashboard
  const createMutation = useMutation({
    mutationFn: async (payload: { name: string; description?: string }) => {
      const { data } = await apiClient.post<Dashboard>('/dashboards', payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboards'] });
    },
  });

  // Eliminar dashboard
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { data } = await apiClient.delete(`/dashboards/${id}`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboards'] });
    },
  });

  return {
    dashboards,
    isLoadingDashboards: isLoading,
    dashboardsError: error,
    createDashboard: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
    deleteDashboard: deleteMutation.mutateAsync,
    isDeleting: deleteMutation.isPending,
  };
}

export function useDashboard(id: string) {
  const queryClient = useQueryClient();

  const { data: dashboard, isLoading, error } = useQuery<Dashboard>({
    queryKey: ['dashboard', id],
    queryFn: async () => {
      const { data } = await apiClient.get<Dashboard>(`/dashboards/${id}`);
      return data;
    },
    enabled: !!id,
  });

  // Mutación para actualizar el diseño (layout) del dashboard
  const updateLayoutMutation = useMutation({
    mutationFn: async (layouts: { id: string; x: number; y: number; w: number; h: number }[]) => {
      const { data } = await apiClient.put(`/dashboards/${id}/layout`, { layouts });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard', id] });
    },
  });

  // Mutación para cambiar el estado público
  const togglePublicMutation = useMutation({
    mutationFn: async (isPublic: boolean) => {
      const { data } = await apiClient.put(`/dashboards/${id}/public`, { isPublic });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard', id] });
      queryClient.invalidateQueries({ queryKey: ['dashboards'] });
    },
  });

  const togglePublishedMutation = useMutation({
    mutationFn: async (published: boolean) => {
      const { data } = await apiClient.put<Dashboard>(
        `/dashboards/${id}/published`,
        { published },
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard', id] });
      queryClient.invalidateQueries({ queryKey: ['dashboards'] });
    },
  });

  return {
    dashboard,
    isLoadingDashboard: isLoading,
    dashboardError: error,
    updateDashboardLayout: updateLayoutMutation.mutateAsync,
    isUpdatingLayout: updateLayoutMutation.isPending,
    toggleShareDashboard: togglePublicMutation.mutateAsync,
    isTogglingShare: togglePublicMutation.isPending,
    togglePublishDashboard: togglePublishedMutation.mutateAsync,
    isTogglingPublish: togglePublishedMutation.isPending,
  };
}

export function usePublicDashboard(token: string) {
  const { data: dashboard, isLoading, error } = useQuery<Dashboard>({
    queryKey: ['public-dashboard', token],
    queryFn: async () => {
      const { data } = await apiClient.get<Dashboard>(`/dashboards/public/${token}`);
      return data;
    },
    enabled: !!token,
  });

  return {
    dashboard,
    isLoadingDashboard: isLoading,
    dashboardError: error,
  };
}
