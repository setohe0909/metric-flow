import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { I18nProvider, LanguageSwitcher } from './lib/i18n';
import { ThemeProvider, ThemeToggle } from './lib/theme';

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
import ChangePassword from './pages/change-password';
import Docs from './pages/docs';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: false,
    },
  },
});

const protectedPreferenceControlPaths = ['/', '/dashboards', '/queries', '/datasources', '/settings', '/docs'];

function GlobalPreferenceControls() {
  const { pathname } = useLocation();
  const isHandledByPageChrome = protectedPreferenceControlPaths.some((path) =>
    path === '/' ? pathname === path : pathname === path || pathname.startsWith(`${path}/`),
  );

  if (isHandledByPageChrome) {
    return null;
  }

  return (
    <div className="fixed right-4 top-4 z-[100] flex items-center gap-2 print:hidden">
      <ThemeToggle />
      <LanguageSwitcher />
    </div>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <I18nProvider>
        <ThemeProvider>
          <BrowserRouter>
            <GlobalPreferenceControls />
            <Routes>
              {/* Public Routes */}
              <Route path="/setup" element={<Setup />} />
              <Route path="/login" element={<Login />} />
              <Route path="/change-password" element={<ChangePassword />} />
              <Route path="/shared/dashboard/:token" element={<PublicDashboardView />} />
              <Route path="/docs/*" element={<Docs />} />

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
        </ThemeProvider>
      </I18nProvider>
    </QueryClientProvider>
  );
}
