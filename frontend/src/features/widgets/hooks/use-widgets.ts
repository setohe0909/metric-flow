import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

export interface WidgetPayload {
  dashboardId: string;
  queryId?: string;
  title: string;
  type: string; // table, bar, line, kpi, pie
  chartConfig: Record<string, any>;
  layoutX?: number;
  layoutY?: number;
  layoutW?: number;
  layoutH?: number;
}

export function useWidgets() {
  const queryClient = useQueryClient();

  // Crear widget
  const createMutation = useMutation({
    mutationFn: async (payload: WidgetPayload) => {
      const { data } = await apiClient.post<any>('/widgets', payload);
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['dashboard', variables.dashboardId] });
    },
  });

  // Editar widget
  const updateMutation = useMutation({
    mutationFn: async (payload: { id: string; dashboardId: string; data: Partial<WidgetPayload> }) => {
      const { data } = await apiClient.put<any>(`/widgets/${payload.id}`, payload.data);
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['dashboard', variables.dashboardId] });
    },
  });

  // Eliminar widget
  const deleteMutation = useMutation({
    mutationFn: async (payload: { id: string; dashboardId: string }) => {
      const { data } = await apiClient.delete(`/widgets/${payload.id}`);
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['dashboard', variables.dashboardId] });
    },
  });

  return {
    createWidget: createMutation.mutateAsync,
    isCreatingWidget: createMutation.isPending,
    updateWidget: updateMutation.mutateAsync,
    isUpdatingWidget: updateMutation.isPending,
    deleteWidget: deleteMutation.mutateAsync,
    isDeletingWidget: deleteMutation.isPending,
  };
}
