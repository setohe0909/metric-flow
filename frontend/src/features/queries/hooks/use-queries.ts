import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

export interface SavedQuery {
  id: string;
  name: string;
  description?: string;
  querySql: string;
  datasourceId: string;
  createdAt: string;
}

export interface QueryRunResponse {
  columns: string[];
  rows: Record<string, any>[];
  rowCount: number;
  durationMs: number;
  executionId: string;
}

export type QueryExportFormat = 'csv' | 'excel';

export function useQueries() {
  const queryClient = useQueryClient();

  // Listar consultas guardadas
  const { data: savedQueries = [], isLoading, error } = useQuery<SavedQuery[]>({
    queryKey: ['saved-queries'],
    queryFn: async () => {
      const { data } = await apiClient.get<SavedQuery[]>('/queries');
      return data;
    },
  });

  // Ejecutar SQL libre
  const runMutation = useMutation({
    mutationFn: async (payload: {
      datasourceId: string;
      querySql: string;
      executionId?: string;
    }) => {
      const { data } = await apiClient.post<QueryRunResponse>('/queries/run', payload);
      return data;
    },
  });

  const cancelMutation = useMutation({
    mutationFn: async (executionId: string) => {
      const { data } = await apiClient.post<{ executionId: string; status: string }>(
        `/queries/cancel/${executionId}`,
      );
      return data;
    },
  });

  const exportMutation = useMutation({
    mutationFn: async (payload: {
      datasourceId: string;
      querySql: string;
      format: QueryExportFormat;
    }) => {
      const response = await apiClient.post('/queries/export', payload, {
        responseType: 'blob',
      });

      const contentDisposition = response.headers['content-disposition'] as
        | string
        | undefined;
      const filenameMatch = contentDisposition?.match(/filename="([^"]+)"/i);

      return {
        blob: response.data as Blob,
        filename: filenameMatch?.[1] || `query-result.${payload.format === 'csv' ? 'csv' : 'xls'}`,
      };
    },
  });

  // Guardar consulta
  const saveMutation = useMutation({
    mutationFn: async (payload: Record<string, any>) => {
      const { data } = await apiClient.post<SavedQuery>('/queries', payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saved-queries'] });
    },
  });

  // Eliminar consulta guardada
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { data } = await apiClient.delete(`/queries/${id}`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saved-queries'] });
    },
  });

  return {
    savedQueries,
    isLoadingQueries: isLoading,
    queriesError: error,
    runQuery: runMutation.mutateAsync,
    isRunning: runMutation.isPending,
    runError: runMutation.error,
    cancelQuery: cancelMutation.mutateAsync,
    isCancelling: cancelMutation.isPending,
    exportQuery: exportMutation.mutateAsync,
    isExporting: exportMutation.isPending,
    saveQuery: saveMutation.mutateAsync,
    isSaving: saveMutation.isPending,
    deleteQuery: deleteMutation.mutate,
  };
}
