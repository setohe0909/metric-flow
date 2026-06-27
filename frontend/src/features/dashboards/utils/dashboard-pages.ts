import type { DashboardPage, DashboardWithPages } from '../types/dashboard-studio';

export function getDashboardPages(dashboard: DashboardWithPages): DashboardPage[] {
  const pages = dashboard.pages?.filter(Boolean) ?? [];
  if (pages.length > 0) {
    return [...pages].sort((a, b) => a.order - b.order);
  }

  return [
    {
      id: 'legacy-default-page',
      title: 'Resumen',
      slug: 'resumen',
      icon: 'layout-dashboard',
      order: 0,
      widgets: dashboard.widgets ?? [],
    },
  ];
}

export function getInitialPageId(dashboard: DashboardWithPages) {
  return getDashboardPages(dashboard)[0]?.id ?? '';
}

export function widgetNeedsData(type: string) {
  return !['text', 'markdown', 'divider', 'image', 'button', 'embed'].includes(type);
}
