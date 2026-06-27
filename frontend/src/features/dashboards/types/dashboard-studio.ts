export type DashboardWidget = {
  id: string;
  dashboardId?: string;
  pageId?: string | null;
  queryId?: string | null;
  title: string;
  type: string;
  chartConfig?: Record<string, any>;
  configVersion?: number;
  dataConfig?: Record<string, any> | null;
  visualConfig?: Record<string, any> | null;
  interactionConfig?: Record<string, any> | null;
  layoutX: number;
  layoutY: number;
  layoutW: number;
  layoutH: number;
  createdAt?: string;
  updatedAt?: string;
};

export type DashboardPage = {
  id: string;
  title: string;
  slug: string;
  icon?: string | null;
  order: number;
  config?: Record<string, any> | null;
  widgets: DashboardWidget[];
};

export type DashboardWithPages = {
  id: string;
  name: string;
  description?: string | null;
  pages?: DashboardPage[];
  widgets?: DashboardWidget[];
  [key: string]: any;
};
