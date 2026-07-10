import { create } from 'zustand';
import { Dashboard, AutomationRule, LayoutColumns } from '../types';
import { dashboardRepo } from '../db/dashboardRepo';
import { BUILT_IN_THEMES } from '../constants/themes';
import { generateId } from '../utils/id';

// ─────────────────────────────────────────────────────────────────────────────
// Dashboard Store
// ─────────────────────────────────────────────────────────────────────────────

interface DashboardState {
  dashboards: Dashboard[];
  activeDashboardId: string | null;
  isLoading: boolean;

  // Actions
  loadDashboards: () => Promise<void>;
  setActiveDashboard: (id: string) => void;
  createDashboard: (name: string, themeId?: string, layoutColumns?: LayoutColumns, icon?: string) => Promise<Dashboard>;
  updateDashboard: (dashboard: Dashboard) => Promise<void>;
  deleteDashboard: (id: string) => Promise<void>;
  reorderDashboards: (ids: string[]) => Promise<void>;
  updateAutomationRules: (dashboardId: string, rules: AutomationRule[]) => Promise<void>;
  getActiveDashboard: () => Dashboard | null;
  switchToNext: () => void;
  switchToPrev: () => void;
}

export const useDashboardStore = create<DashboardState>((set, get) => ({
  dashboards: [],
  activeDashboardId: null,
  isLoading: false,

  loadDashboards: async () => {
    set({ isLoading: true });
    try {
      const dashboards = await dashboardRepo.getAll();
      set({
        dashboards,
        activeDashboardId: dashboards[0]?.id ?? null,
        isLoading: false,
      });
    } catch (e) {
      set({ isLoading: false });
      throw e;
    }
  },

  setActiveDashboard: (id) => {
    set({ activeDashboardId: id });
  },

  createDashboard: async (name, themeId = BUILT_IN_THEMES[0].id, layoutColumns = 4, icon = 'LayoutDashboard') => {
    const now = new Date().toISOString();
    const { dashboards } = get();
    const dashboard: Dashboard = {
      id: generateId(),
      name,
      icon,
      themeId,
      layoutColumns,
      wallpaper: null,
      automationRules: [],
      sortOrder: dashboards.length,
      createdAt: now,
      updatedAt: now,
    };
    await dashboardRepo.create(dashboard);
    set((s) => ({
      dashboards: [...s.dashboards, dashboard],
      activeDashboardId: s.activeDashboardId ?? dashboard.id,
    }));
    return dashboard;
  },

  updateDashboard: async (dashboard) => {
    const updated = { ...dashboard, updatedAt: new Date().toISOString() };
    await dashboardRepo.update(updated);
    set((s) => ({
      dashboards: s.dashboards.map((d) => (d.id === updated.id ? updated : d)),
    }));
  },

  deleteDashboard: async (id) => {
    await dashboardRepo.delete(id);
    set((s) => {
      const remaining = s.dashboards.filter((d) => d.id !== id);
      const newActive =
        s.activeDashboardId === id
          ? (remaining[0]?.id ?? null)
          : s.activeDashboardId;
      return { dashboards: remaining, activeDashboardId: newActive };
    });
  },

  reorderDashboards: async (ids) => {
    await dashboardRepo.reorder(ids);
    set((s) => {
      const map = new Map(s.dashboards.map((d) => [d.id, d]));
      return { dashboards: ids.map((id) => map.get(id)!).filter(Boolean) };
    });
  },

  updateAutomationRules: async (dashboardId, rules) => {
    const { dashboards } = get();
    const dashboard = dashboards.find((d) => d.id === dashboardId);
    if (!dashboard) return;
    const updated = { ...dashboard, automationRules: rules, updatedAt: new Date().toISOString() };
    await dashboardRepo.update(updated);
    set((s) => ({
      dashboards: s.dashboards.map((d) => (d.id === dashboardId ? updated : d)),
    }));
  },

  getActiveDashboard: () => {
    const { dashboards, activeDashboardId } = get();
    return dashboards.find((d) => d.id === activeDashboardId) ?? null;
  },

  switchToNext: () => {
    const { dashboards, activeDashboardId } = get();
    if (dashboards.length <= 1) return;
    const idx = dashboards.findIndex((d) => d.id === activeDashboardId);
    const next = dashboards[(idx + 1) % dashboards.length];
    set({ activeDashboardId: next.id });
  },

  switchToPrev: () => {
    const { dashboards, activeDashboardId } = get();
    if (dashboards.length <= 1) return;
    const idx = dashboards.findIndex((d) => d.id === activeDashboardId);
    const prev = dashboards[(idx - 1 + dashboards.length) % dashboards.length];
    set({ activeDashboardId: prev.id });
  },
}));
