import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

export interface Schedule {
  id: string;
  organizationId: string;
  queryId: string;
  name: string;
  cronExpression: string;
  recipients: string[];
  enabled: boolean;
  subject?: string;
  format: 'csv' | 'html' | 'json';
  lastRunAt?: string;
  nextRunAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ScheduleHistory {
  id: string;
  scheduledQueryId: string;
  executedAt: string;
  status: 'success' | 'error';
  errorMessage?: string;
  recipientsSent: string[];
}

export function useSchedules(queryId: string | null) {
  const queryClient = useQueryClient();

  // Listar programaciones de una query
  const { data: schedules = [], isLoading: isLoadingSchedules } = useQuery<Schedule[]>({
    queryKey: ['schedules', 'query', queryId],
    queryFn: async () => {
      if (!queryId) return [];
      const { data } = await apiClient.get<Schedule[]>(`/schedules/query/${queryId}`);
      return data;
    },
    enabled: !!queryId,
  });

  // Crear programación
  const createMutation = useMutation({
    mutationFn: async (payload: {
      queryId: string;
      name: string;
      cronExpression: string;
      recipients: string[];
      subject?: string;
      format?: string;
    }) => {
      const { data } = await apiClient.post<Schedule>('/schedules', payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedules', 'query', queryId] });
    },
  });

  // Actualizar programación
  const updateMutation = useMutation({
    mutationFn: async (payload: {
      id: string;
      name?: string;
      cronExpression?: string;
      recipients?: string[];
      subject?: string;
      format?: string;
      enabled?: boolean;
    }) => {
      const { id, ...data } = payload;
      const { data: res } = await apiClient.patch<Schedule>(`/schedules/${id}`, data);
      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedules', 'query', queryId] });
    },
  });

  // Eliminar programación
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { data } = await apiClient.delete(`/schedules/${id}`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedules', 'query', queryId] });
    },
  });

  return {
    schedules,
    isLoadingSchedules,
    createSchedule: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
    createError: createMutation.error,
    updateSchedule: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
    deleteSchedule: deleteMutation.mutateAsync,
    isDeleting: deleteMutation.isPending,
  };
}

export function useScheduleHistory(scheduleId: string | null) {
  const { data: history = [], isLoading: isLoadingHistory, refetch: refetchHistory } = useQuery<ScheduleHistory[]>({
    queryKey: ['schedules', scheduleId, 'history'],
    queryFn: async () => {
      if (!scheduleId) return [];
      const { data } = await apiClient.get<ScheduleHistory[]>(`/schedules/${scheduleId}/history`);
      return data;
    },
    enabled: !!scheduleId,
  });

  return {
    history,
    isLoadingHistory,
    refetchHistory,
  };
}
