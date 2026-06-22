import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/features/auth/hooks/use-auth';
import { useOrgStore } from '@/store/use-org-store';
import Sidebar from '@/components/sidebar';
import { Database, Loader2 } from 'lucide-react';

export default function AppLayout() {
  const { isAuthenticated, isLoadingProfile } = useAuth();
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
        style={{ backgroundColor: '#eeefe9' }}
      >
        <div
          className="p-3 rounded-2xl"
          style={{ backgroundColor: '#23251d', boxShadow: '4px 4px 0px 0px #f7a501' }}
        >
          <Database className="h-7 w-7" style={{ color: '#f7a501' }} />
        </div>
        <div className="flex items-center gap-2" style={{ color: '#23251d' }}>
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

  // Perfil cargó y no hay usuario válido → redirigir al login
  if (!isLoadingProfile && !isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#eeefe9] font-sans text-[#23251d]">
      {/* Sidebar navigation */}
      <Sidebar />

      {/* Main viewport */}
      <main className="flex-1 flex flex-col h-full overflow-y-auto bg-[#eeefe9] bg-grid-dots relative">
        <div className="p-8 max-w-7xl w-full mx-auto relative z-10">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
