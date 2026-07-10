import { Dashboard, AutomationRule, LayoutColumns } from '../types';
import { getDb } from './schema';

// ─────────────────────────────────────────────────────────────────────────────
// Dashboard Repository
// ─────────────────────────────────────────────────────────────────────────────

const rowToDashboard = (row: Record<string, unknown>): Dashboard => ({
  id: row.id as string,
  name: row.name as string,
  icon: (row.icon as string) || 'LayoutDashboard',
  themeId: row.theme_id as string,
  layoutColumns: (row.layout_columns as number) as LayoutColumns,
  wallpaper: row.wallpaper as string | null,
  automationRules: JSON.parse((row.automation_rules as string) ?? '[]') as AutomationRule[],
  sortOrder: row.sort_order as number,
  createdAt: row.created_at as string,
  updatedAt: row.updated_at as string,
});

export const dashboardRepo = {
  async getAll(): Promise<Dashboard[]> {
    const db = getDb();
    const rows = await db.getAllAsync<Record<string, unknown>>(
      'SELECT * FROM dashboards ORDER BY sort_order ASC, created_at ASC'
    );
    return rows.map(rowToDashboard);
  },

  async getById(id: string): Promise<Dashboard | null> {
    const db = getDb();
    const row = await db.getFirstAsync<Record<string, unknown>>(
      'SELECT * FROM dashboards WHERE id = ?',
      [id]
    );
    return row ? rowToDashboard(row) : null;
  },

  async create(dashboard: Dashboard): Promise<void> {
    const db = getDb();
    await db.runAsync(
      `INSERT INTO dashboards
        (id, name, icon, theme_id, layout_columns, wallpaper, automation_rules, sort_order, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        dashboard.id,
        dashboard.name,
        dashboard.icon,
        dashboard.themeId,
        dashboard.layoutColumns,
        dashboard.wallpaper ?? null,
        JSON.stringify(dashboard.automationRules),
        dashboard.sortOrder,
        dashboard.createdAt,
        dashboard.updatedAt,
      ]
    );
  },

  async update(dashboard: Dashboard): Promise<void> {
    const db = getDb();
    await db.runAsync(
      `UPDATE dashboards SET
        name = ?, icon = ?, theme_id = ?, layout_columns = ?, wallpaper = ?,
        automation_rules = ?, sort_order = ?, updated_at = ?
       WHERE id = ?`,
      [
        dashboard.name,
        dashboard.icon,
        dashboard.themeId,
        dashboard.layoutColumns,
        dashboard.wallpaper ?? null,
        JSON.stringify(dashboard.automationRules),
        dashboard.sortOrder,
        dashboard.updatedAt,
        dashboard.id,
      ]
    );
  },

  async delete(id: string): Promise<void> {
    const db = getDb();
    await db.runAsync('DELETE FROM dashboards WHERE id = ?', [id]);
  },

  async reorder(ids: string[]): Promise<void> {
    const db = getDb();
    await db.withTransactionAsync(async () => {
      for (let i = 0; i < ids.length; i++) {
        await db.runAsync('UPDATE dashboards SET sort_order = ? WHERE id = ?', [i, ids[i]]);
      }
    });
  },
};
