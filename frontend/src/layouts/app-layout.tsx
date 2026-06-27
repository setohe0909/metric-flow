import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/features/auth/hooks/use-auth';
import { useOrgStore } from '@/store/use-org-store';
import Sidebar from '@/components/sidebar';
import { Database, Loader2 } from 'lucide-react';

export default function AppLayout() {
  const { isAuthenticated, isLoadingProfile, user } = useAuth();
  // El token en el store es la señal más temprana de autenticación.
  // Mientras el perfil carga (y ya hay token), mostramos el loader
  // en lugar de redirigir — esto evita el race condition post-login.
  const token = useOrgStore((s) => s.token);
  const hasToken = !!token;

  // Si hay token pero el perfil aún no cargó → mostrar loader
  if (hasToken && isLoadingProfile) {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center gap-4"
        style={{ backgroundColor: 'var(--color-canvas)' }}
      >
        <div
          className="p-3 rounded-2xl"
          style={{ backgroundColor: 'var(--color-ink)', boxShadow: '4px 4px 0px 0px var(--color-accent)' }}
        >
          <Database className="h-7 w-7" style={{ color: 'var(--color-accent)' }} />
        </div>
        <div className="flex items-center gap-2" style={{ color: 'var(--color-ink)' }}>
          <Loader2 className="animate-spin h-4 w-4" />
          <span className="text-sm font-semibold">Cargando MetricFlow...</span>
        </div>
      </div>
    );
  }

  // Sin token y sin usuario → redirigir al login
  if (!hasToken && !isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Si hay token pero Zustand aún no hidrató el usuario desde /auth/me,
  // mantenemos el loader. Si el token es inválido, el interceptor 401 limpia
  // localStorage y en el siguiente render sí se redirige a /login.
  if (hasToken && !isAuthenticated) {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center gap-4"
        style={{ backgroundColor: 'var(--color-canvas)' }}
      >
        <div
          className="p-3 rounded-2xl"
          style={{ backgroundColor: 'var(--color-ink)', boxShadow: '4px 4px 0px 0px var(--color-accent)' }}
        >
          <Database className="h-7 w-7" style={{ color: 'var(--color-accent)' }} />
        </div>
        <div className="flex items-center gap-2" style={{ color: 'var(--color-ink)' }}>
          <Loader2 className="animate-spin h-4 w-4" />
          <span className="text-sm font-semibold">Cargando MetricFlow...</span>
        </div>
      </div>
    );
  }

  if (user?.mustChangePassword) {
    return <Navigate to="/change-password" replace />;
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[var(--color-canvas)] font-sans text-[var(--color-ink)]">
      {/* Sidebar navigation */}
      <Sidebar />

      {/* Main viewport */}
      <main className="flex-1 flex flex-col h-full overflow-y-auto bg-[var(--color-canvas)] bg-grid-dots relative">
        <div className="p-8 max-w-7xl w-full mx-auto relative z-10">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
