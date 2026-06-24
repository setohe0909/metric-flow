import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Layouts
import AppLayout from './layouts/app-layout';

// Pages
import Login from './pages/login';
import Setup from './pages/setup';
import PublicDashboardView from './pages/dashboards/public';
import DashboardList from './pages/dashboards/list';
import DashboardDetail from './pages/dashboards/detail';
import WidgetCreator from './pages/widgets/creator';
import QueryEditor from './pages/queries/editor';
import DatasourceManager from './pages/datasources/manager';
import OrgSettings from './pages/settings/organization';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: false,
    },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/setup" element={<Setup />} />
          <Route path="/login" element={<Login />} />
          <Route path="/shared/dashboard/:token" element={<PublicDashboardView />} />

          {/* Protected Routes */}
          <Route element={<AppLayout />}>
            <Route path="/dashboards" element={<DashboardList />} />
            <Route path="/dashboards/:id" element={<DashboardDetail />} />
            <Route path="/dashboards/:dashboardId/widgets/new" element={<WidgetCreator />} />
            <Route path="/queries" element={<QueryEditor />} />
            <Route path="/datasources" element={<DatasourceManager />} />
            <Route path="/settings" element={<OrgSettings />} />
            <Route path="/" element={<Navigate to="/dashboards" replace />} />
          </Route>

          {/* Fallback redirect */}
          <Route path="*" element={<Navigate to="/dashboards" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
