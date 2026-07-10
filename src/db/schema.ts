import * as SQLite from 'expo-sqlite';

// ─────────────────────────────────────────────────────────────────────────────
// Database Schema — StandBy Me
// ─────────────────────────────────────────────────────────────────────────────

export const DB_NAME = 'standbyme.db';
export const SCHEMA_VERSION = 1;

const DASHBOARDS_TABLE = `
CREATE TABLE IF NOT EXISTS dashboards (
  id              TEXT PRIMARY KEY,
  name            TEXT NOT NULL,
  icon            TEXT NOT NULL DEFAULT 'LayoutDashboard',
  theme_id        TEXT NOT NULL DEFAULT 'amoled',
  layout_columns  INTEGER NOT NULL DEFAULT 4,
  wallpaper       TEXT,
  automation_rules TEXT NOT NULL DEFAULT '[]',
  sort_order      INTEGER NOT NULL DEFAULT 0,
  created_at      TEXT NOT NULL,
  updated_at      TEXT NOT NULL
);
`;

const WIDGETS_TABLE = `
CREATE TABLE IF NOT EXISTS widgets (
  id               TEXT PRIMARY KEY,
  dashboard_id     TEXT NOT NULL,
  type             TEXT NOT NULL,
  col              INTEGER NOT NULL DEFAULT 0,
  row              INTEGER NOT NULL DEFAULT 0,
  col_span         INTEGER NOT NULL DEFAULT 2,
  row_span         INTEGER NOT NULL DEFAULT 2,
  settings         TEXT NOT NULL DEFAULT '{}',
  locked           INTEGER NOT NULL DEFAULT 0,
  refresh_interval INTEGER NOT NULL DEFAULT 0,
  opacity          REAL NOT NULL DEFAULT 1.0,
  created_at       TEXT NOT NULL,
  updated_at       TEXT NOT NULL,
  FOREIGN KEY (dashboard_id) REFERENCES dashboards(id) ON DELETE CASCADE
);
`;

const CUSTOM_THEMES_TABLE = `
CREATE TABLE IF NOT EXISTS custom_themes (
  id              TEXT PRIMARY KEY,
  name            TEXT NOT NULL,
  tokens          TEXT NOT NULL,
  created_at      TEXT NOT NULL,
  updated_at      TEXT NOT NULL
);
`;

const HABITS_TABLE = `
CREATE TABLE IF NOT EXISTS habits (
  id              TEXT PRIMARY KEY,
  widget_id       TEXT NOT NULL,
  name            TEXT NOT NULL,
  icon            TEXT NOT NULL DEFAULT 'Star',
  color           TEXT NOT NULL DEFAULT '#6366f1',
  completed_dates TEXT NOT NULL DEFAULT '[]',
  created_at      TEXT NOT NULL
);
`;

const NOTES_TABLE = `
CREATE TABLE IF NOT EXISTS notes (
  id          TEXT PRIMARY KEY,
  widget_id   TEXT NOT NULL,
  content     TEXT NOT NULL DEFAULT '',
  updated_at  TEXT NOT NULL
);
`;

const META_TABLE = `
CREATE TABLE IF NOT EXISTS meta (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
`;

export const ALL_TABLES = [
  DASHBOARDS_TABLE,
  WIDGETS_TABLE,
  CUSTOM_THEMES_TABLE,
  HABITS_TABLE,
  NOTES_TABLE,
  META_TABLE,
];

let _db: SQLite.SQLiteDatabase | null = null;

export const getDb = (): SQLite.SQLiteDatabase => {
  if (!_db) throw new Error('Database not initialized. Call initDb() first.');
  return _db;
};

export const initDb = async (): Promise<void> => {
  _db = await SQLite.openDatabaseAsync(DB_NAME);

  // Enable WAL mode for better performance
  await _db.execAsync('PRAGMA journal_mode = WAL;');
  await _db.execAsync('PRAGMA foreign_keys = ON;');

  // Create all tables
  for (const sql of ALL_TABLES) {
    await _db.execAsync(sql);
  }

  // Ensure icon column exists (migration)
  try {
    await _db.execAsync("ALTER TABLE dashboards ADD COLUMN icon TEXT NOT NULL DEFAULT 'LayoutDashboard'");
  } catch (e) {
    // Column already exists
  }

  // Store schema version
  await _db.runAsync(
    `INSERT OR REPLACE INTO meta (key, value) VALUES ('schema_version', ?)`,
    [String(SCHEMA_VERSION)]
  );
};
