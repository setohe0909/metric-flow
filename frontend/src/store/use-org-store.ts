import { create } from 'zustand';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  mustChangePassword: boolean;
}

interface Organization {
  id: string;
  name: string;
  slug: string;
  role: string;
}

interface OrgState {
  user: User | null;
  token: string | null;
  organizations: Organization[];
  activeOrg: Organization | null;
  setAuth: (user: User, token: string, organizations: Organization[], activeOrg: Organization) => void;
  setActiveOrg: (org: Organization) => void;
  clearAuth: () => void;
}

export const useOrgStore = create<OrgState>((set) => ({
  user: null,
  token: localStorage.getItem('metricflow_token'),
  organizations: [],
  activeOrg: null,

  setAuth: (user, token, organizations, activeOrg) => {
    localStorage.setItem('metricflow_token', token);
    localStorage.setItem('metricflow_active_org_id', activeOrg.id);
    set({ user, token, organizations, activeOrg });
  },

  setActiveOrg: (org) => {
    localStorage.setItem('metricflow_active_org_id', org.id);
    set({ activeOrg: org });
  },

  clearAuth: () => {
    localStorage.removeItem('metricflow_token');
    localStorage.removeItem('metricflow_active_org_id');
    set({ user: null, token: null, organizations: [], activeOrg: null });
  },
}));
