import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

export interface Datasource {
  id: string;
  name: string;
  type:
    | 'postgres'
    | 'mysql'
    | 'sqlserver'
    | 'sqlite'
    | 'csv'
    | 'bigquery'
    | 'snowflake';
  connectionSettings: {
    host?: string;
    port?: number;
    username?: string;
    database?: string;
    ssl?: boolean;
    filePath?: string;
    projectId?: string;
    serviceAccountJson?: string;
    account?: string;
    warehouse?: string;
    schema?: string;
  };
  createdAt: string;
}

export function useDatasources() {
  const queryClient = useQueryClient();

  // Listar conectores
  const { data: datasources = [], isLoading, error } = useQuery<Datasource[]>({
    queryKey: ['datasources'],
    queryFn: async () => {
      const { data } = await apiClient.get<Datasource[]>('/datasources');
      return data;
    },
  });

  // Crear conector
  const createMutation = useMutation({
    mutationFn: async (newDs: Record<string, unknown>) => {
      const { data } = await apiClient.post<Datasource>('/datasources', newDs);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['datasources'] });
    },
  });

  // Probar conexión
  const testMutation = useMutation({
    mutationFn: async (connSettings: Record<string, unknown>) => {
      const { data } = await apiClient.post<{ success: boolean; message: string }>('/datasources/test', connSettings);
      return data;
    },
  });

  // Eliminar conector
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { data } = await apiClient.delete(`/datasources/${id}`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['datasources'] });
    },
  });

  // Subir archivo (SQLite / CSV)
  const uploadMutation = useMutation({
    mutationFn: async (payload: { file: File; name: string; type: 'sqlite' | 'csv' }) => {
      const formData = new FormData();
      formData.append('file', payload.file);
      formData.append('name', payload.name);
      formData.append('type', payload.type);

      const { data } = await apiClient.post<any>('/datasources/upload-file', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['datasources'] });
    },
  });

  return {
    datasources,
    isLoading,
    error,
    createDatasource: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
    createError: createMutation.error,
    testConnection: testMutation.mutateAsync,
    isTesting: testMutation.isPending,
    testError: testMutation.error,
    deleteDatasource: deleteMutation.mutate,
    isDeleting: deleteMutation.isPending,
    uploadFile: uploadMutation.mutateAsync,
    isUploading: uploadMutation.isPending,
    uploadError: uploadMutation.error,
  };
}
