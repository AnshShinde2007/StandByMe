import { create } from 'zustand';
import { Widget, WidgetType, LayoutColumns } from '../types';
import { widgetRepo } from '../db/widgetRepo';
import { getWidgetMeta } from '../constants/widgets';
import { generateId } from '../utils/id';
import { buildOccupancyMatrix, findPlacement } from '../engine/PlacementEngine';
import { WIDGET_SIZE_DIMENSIONS } from '../engine/types';
import { useDashboardStore } from './dashboardStore';

const GRID_ROWS = 4;

// ─────────────────────────────────────────────────────────────────────────────
// Widget Store
// ─────────────────────────────────────────────────────────────────────────────

interface WidgetState {
  /** Map of dashboardId → Widget[] */
  widgetsByDashboard: Record<string, Widget[]>;
  isLoading: boolean;

  loadWidgets: (dashboardId: string) => Promise<void>;
  addWidget: (dashboardId: string, type: WidgetType, col?: number, row?: number) => Promise<Widget>;
  updateWidget: (widget: Widget) => Promise<void>;
  updateWidgetSettings: (widgetId: string, settings: Record<string, unknown>) => Promise<void>;
  updateWidgetPosition: (widgetId: string, dashboardId: string, col: number, row: number, colSpan: number, rowSpan: number) => Promise<void>;
  removeWidget: (widgetId: string, dashboardId: string) => Promise<void>;
  duplicateWidget: (widgetId: string, dashboardId: string) => Promise<Widget | null>;
  getWidgetsForDashboard: (dashboardId: string) => Widget[];
}

export const useWidgetStore = create<WidgetState>((set, get) => ({
  widgetsByDashboard: {},
  isLoading: false,

  loadWidgets: async (dashboardId) => {
    set({ isLoading: true });
    try {
      const widgets = await widgetRepo.getByDashboard(dashboardId);
      set((s) => ({
        widgetsByDashboard: { ...s.widgetsByDashboard, [dashboardId]: widgets },
        isLoading: false,
      }));
    } catch (e) {
      set({ isLoading: false });
      throw e;
    }
  },

  addWidget: async (dashboardId, type, col, row) => {
    const meta = getWidgetMeta(type);
    const size = (meta as any).size ?? 'SMALL';
    const dims = WIDGET_SIZE_DIMENSIONS[size as keyof typeof WIDGET_SIZE_DIMENSIONS];

    // Auto-place: compute position if not explicitly provided
    let finalCol = col ?? 0;
    let finalRow = row ?? 0;

    if (col === undefined || row === undefined) {
      const dashState = useDashboardStore.getState();
      const dashboard = dashState.dashboards.find((d) => d.id === dashboardId);
      const cols: LayoutColumns = dashboard?.layoutColumns ?? 4;

      const existing = get().widgetsByDashboard[dashboardId] ?? [];
      const matrix = buildOccupancyMatrix(existing, cols, GRID_ROWS);
      const placement = findPlacement(matrix, size, cols);

      if (placement) {
        finalCol = placement.col;
        finalRow = placement.row;
      }
      // If no placement found, fallback to (0,0) — user can drag to reposition
    }

    const now = new Date().toISOString();
    const widget: Widget = {
      id: generateId(),
      dashboardId,
      type,
      col: finalCol,
      row: finalRow,
      colSpan: dims.cols,
      rowSpan: dims.rows,
      settings: { ...meta.defaultSettings },
      locked: false,
      refreshInterval: 0,
      opacity: 1.0,
      createdAt: now,
      updatedAt: now,
    };
    await widgetRepo.create(widget);
    set((s) => {
      const existing = s.widgetsByDashboard[dashboardId] ?? [];
      return {
        widgetsByDashboard: {
          ...s.widgetsByDashboard,
          [dashboardId]: [...existing, widget],
        },
      };
    });
    return widget;
  },

  updateWidget: async (widget) => {
    const updated = { ...widget, updatedAt: new Date().toISOString() };
    await widgetRepo.update(updated);
    set((s) => {
      const existing = s.widgetsByDashboard[widget.dashboardId] ?? [];
      return {
        widgetsByDashboard: {
          ...s.widgetsByDashboard,
          [widget.dashboardId]: existing.map((w) => (w.id === updated.id ? updated : w)),
        },
      };
    });
  },

  updateWidgetSettings: async (widgetId, settings) => {
    await widgetRepo.updateSettings(widgetId, settings);
    set((s) => {
      const updated: Record<string, Widget[]> = {};
      for (const [dId, widgets] of Object.entries(s.widgetsByDashboard)) {
        updated[dId] = widgets.map((w) =>
          w.id === widgetId
            ? { ...w, settings, updatedAt: new Date().toISOString() }
            : w
        );
      }
      return { widgetsByDashboard: updated };
    });
  },

  updateWidgetPosition: async (widgetId, dashboardId, col, row, colSpan, rowSpan) => {
    await widgetRepo.updatePosition(widgetId, col, row, colSpan, rowSpan);
    set((s) => {
      const existing = s.widgetsByDashboard[dashboardId] ?? [];
      return {
        widgetsByDashboard: {
          ...s.widgetsByDashboard,
          [dashboardId]: existing.map((w) =>
            w.id === widgetId
              ? { ...w, col, row, colSpan, rowSpan, updatedAt: new Date().toISOString() }
              : w
          ),
        },
      };
    });
  },

  removeWidget: async (widgetId, dashboardId) => {
    await widgetRepo.delete(widgetId);
    set((s) => {
      const existing = s.widgetsByDashboard[dashboardId] ?? [];
      return {
        widgetsByDashboard: {
          ...s.widgetsByDashboard,
          [dashboardId]: existing.filter((w) => w.id !== widgetId),
        },
      };
    });
  },

  duplicateWidget: async (widgetId, dashboardId) => {
    const existing = get().widgetsByDashboard[dashboardId] ?? [];
    const original = existing.find((w) => w.id === widgetId);
    if (!original) return null;
    const newId = generateId();
    const duplicate = await widgetRepo.duplicateWidget(original, newId);
    set((s) => ({
      widgetsByDashboard: {
        ...s.widgetsByDashboard,
        [dashboardId]: [...(s.widgetsByDashboard[dashboardId] ?? []), duplicate],
      },
    }));
    return duplicate;
  },

  getWidgetsForDashboard: (dashboardId) => {
    return get().widgetsByDashboard[dashboardId] ?? [];
  },
}));
