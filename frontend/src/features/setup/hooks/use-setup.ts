import { useMutation, useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '@/lib/api-client';
import { useOrgStore } from '@/store/use-org-store';

interface SetupStatus {
  initialized: boolean;
}

interface BootstrapPayload {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  organizationName: string;
}

interface BootstrapResponse {
  token: string;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    mustChangePassword: boolean;
  };
  organization: {
    id: string;
    name: string;
    slug: string;
    role: string;
  };
}

export function useSetupStatus() {
  return useQuery({
    queryKey: ['setup-status'],
    queryFn: async () => {
      const { data } = await apiClient.get<SetupStatus>('/setup/status');
      return data;
    },
    staleTime: 30_000,
  });
}

export function useBootstrap() {
  const navigate = useNavigate();
  const setAuth = useOrgStore((state) => state.setAuth);

  return useMutation({
    mutationFn: async (payload: BootstrapPayload) => {
      const { data } = await apiClient.post<BootstrapResponse>(
        '/setup/bootstrap',
        payload,
      );
      return data;
    },
    onSuccess: (data) => {
      const organization = data.organization;
      setAuth(data.user, data.token, [organization], organization);
      navigate('/dashboards', { replace: true });
    },
  });
}
