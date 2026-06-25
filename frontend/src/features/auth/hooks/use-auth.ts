import { useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { useOrgStore } from '@/store/use-org-store';
import { useNavigate } from 'react-router-dom';

interface LoginResponse {
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

type AuthProfile = LoginResponse['user'] & {
  organizations: LoginResponse['organization'][];
};

export function useAuth() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { setAuth, clearAuth, user, activeOrg, organizations } = useOrgStore();

  const loginMutation = useMutation({
    mutationFn: async (credentials: Record<string, string>) => {
      const { data } = await apiClient.post<LoginResponse>('/auth/login', credentials);
      return data;
    },
    onSuccess: (data) => {
      // Al loguearse, como el endpoint login solo devuelve una org en el payload (la default),
      // creamos un array de organizaciones temporal para el store.
      const org = data.organization;
      setAuth(data.user, data.token, [org], org);
      queryClient.invalidateQueries({ queryKey: ['auth-me'] });
      navigate(data.user.mustChangePassword ? '/change-password' : '/dashboards');
    },
  });

  // Query para validar sesión activa y obtener todas las organizaciones
  const { data: profile, isLoading } = useQuery<AuthProfile>({
    queryKey: ['auth-me'],
    queryFn: async () => {
      const { data } = await apiClient.get<AuthProfile>('/auth/me');
      return data;
    },
    enabled: !!localStorage.getItem('metricflow_token'),
    retry: false,
  });

  // Sincronizar el perfil después del render. useAuth se consume desde varios
  // componentes, así que verificamos el estado actual antes de hidratarlo.
  useEffect(() => {
    if (!profile || useOrgStore.getState().user) return;

    const savedOrgId = localStorage.getItem('metricflow_active_org_id');
    const savedOrg = profile.organizations.find(
      (organization: LoginResponse['organization']) =>
        organization.id === savedOrgId,
    );
    const organization = savedOrg || profile.organizations[0];
    const token = localStorage.getItem('metricflow_token');

    if (!organization || !token) return;

    setAuth(
      {
        id: profile.id,
        email: profile.email,
        firstName: profile.firstName,
        lastName: profile.lastName,
        mustChangePassword: profile.mustChangePassword,
      },
      token,
      profile.organizations,
      organization,
    );
  }, [profile, setAuth]);

  const logout = () => {
    clearAuth();
    queryClient.clear();
    navigate('/login');
  };

  const changePasswordMutation = useMutation({
    mutationFn: async (payload: {
      currentPassword: string;
      newPassword: string;
    }) => {
      const { data } = await apiClient.post<{
        token: string;
        mustChangePassword: boolean;
        organization: LoginResponse['organization'];
      }>('/auth/change-password', payload);
      return data;
    },
    onSuccess: (data) => {
      if (!user) return;
      const updatedUser = { ...user, mustChangePassword: false };
      setAuth(
        updatedUser,
        data.token,
        [data.organization],
        data.organization,
      );
      queryClient.invalidateQueries({ queryKey: ['auth-me'] });
      navigate('/dashboards', { replace: true });
    },
  });

  return {
    login: loginMutation.mutate,
    isLoggingIn: loginMutation.isPending,
    loginError: loginMutation.error,
    changePassword: changePasswordMutation.mutate,
    isChangingPassword: changePasswordMutation.isPending,
    changePasswordError: changePasswordMutation.error,
    logout,
    user,
    activeOrg,
    organizations,
    isLoadingProfile: isLoading,
    isAuthenticated: !!user,
  };
}
