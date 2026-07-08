import { Widget, WidgetType } from '../types';
import { getDb } from './schema';

// ─────────────────────────────────────────────────────────────────────────────
// Widget Repository
// ─────────────────────────────────────────────────────────────────────────────

const rowToWidget = (row: Record<string, unknown>): Widget => ({
  id: row.id as string,
  dashboardId: row.dashboard_id as string,
  type: row.type as WidgetType,
  col: row.col as number,
  row: row.row as number,
  colSpan: row.col_span as number,
  rowSpan: row.row_span as number,
  settings: JSON.parse((row.settings as string) ?? '{}'),
  locked: Boolean(row.locked),
  refreshInterval: row.refresh_interval as number,
  opacity: row.opacity as number,
  createdAt: row.created_at as string,
  updatedAt: row.updated_at as string,
});

export const widgetRepo = {
  async getByDashboard(dashboardId: string): Promise<Widget[]> {
    const db = getDb();
    const rows = await db.getAllAsync<Record<string, unknown>>(
      'SELECT * FROM widgets WHERE dashboard_id = ? ORDER BY created_at ASC',
      [dashboardId]
    );
    return rows.map(rowToWidget);
  },

  async getById(id: string): Promise<Widget | null> {
    const db = getDb();
    const row = await db.getFirstAsync<Record<string, unknown>>(
      'SELECT * FROM widgets WHERE id = ?',
      [id]
    );
    return row ? rowToWidget(row) : null;
  },

  async create(widget: Widget): Promise<void> {
    const db = getDb();
    await db.runAsync(
      `INSERT INTO widgets
        (id, dashboard_id, type, col, row, col_span, row_span, settings, locked, refresh_interval, opacity, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        widget.id,
        widget.dashboardId,
        widget.type,
        widget.col,
        widget.row,
        widget.colSpan,
        widget.rowSpan,
        JSON.stringify(widget.settings),
        widget.locked ? 1 : 0,
        widget.refreshInterval,
        widget.opacity,
        widget.createdAt,
        widget.updatedAt,
      ]
    );
  },

  async update(widget: Widget): Promise<void> {
    const db = getDb();
    await db.runAsync(
      `UPDATE widgets SET
        col = ?, row = ?, col_span = ?, row_span = ?,
        settings = ?, locked = ?, refresh_interval = ?,
        opacity = ?, updated_at = ?
       WHERE id = ?`,
      [
        widget.col,
        widget.row,
        widget.colSpan,
        widget.rowSpan,
        JSON.stringify(widget.settings),
        widget.locked ? 1 : 0,
        widget.refreshInterval,
        widget.opacity,
        widget.updatedAt,
        widget.id,
      ]
    );
  },

  async updatePosition(id: string, col: number, row: number, colSpan: number, rowSpan: number): Promise<void> {
    const db = getDb();
    const now = new Date().toISOString();
    await db.runAsync(
      'UPDATE widgets SET col = ?, row = ?, col_span = ?, row_span = ?, updated_at = ? WHERE id = ?',
      [col, row, colSpan, rowSpan, now, id]
    );
  },

  async updateSettings(id: string, settings: Record<string, unknown>): Promise<void> {
    const db = getDb();
    const now = new Date().toISOString();
    await db.runAsync(
      'UPDATE widgets SET settings = ?, updated_at = ? WHERE id = ?',
      [JSON.stringify(settings), now, id]
    );
  },

  async delete(id: string): Promise<void> {
    const db = getDb();
    await db.runAsync('DELETE FROM widgets WHERE id = ?', [id]);
  },

  async deleteByDashboard(dashboardId: string): Promise<void> {
    const db = getDb();
    await db.runAsync('DELETE FROM widgets WHERE dashboard_id = ?', [dashboardId]);
  },

  async duplicateWidget(widget: Widget, newId: string, newDashboardId?: string): Promise<Widget> {
    const now = new Date().toISOString();
    const duplicate: Widget = {
      ...widget,
      id: newId,
      dashboardId: newDashboardId ?? widget.dashboardId,
      col: widget.col + 1,
      row: widget.row + 1,
      createdAt: now,
      updatedAt: now,
    };
    await widgetRepo.create(duplicate);
    return duplicate;
  },
};
