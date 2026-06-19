import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/features/auth/hooks/use-auth';
import Sidebar from '@/components/sidebar';
import { Loader2 } from 'lucide-react';

export default function AppLayout() {
  const { isAuthenticated, isLoadingProfile } = useAuth();

  if (isLoadingProfile) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-400 gap-3">
        <Loader2 className="animate-spin h-8 w-8 text-blue-500" />
        <span className="text-sm font-medium tracking-wide">Cargando QueryLens...</span>
      </div>
    );
  }

  if (!isAuthenticated) {
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
