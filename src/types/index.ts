// ─────────────────────────────────────────────────────────────────────────────
// StandBy Me — Shared Types
// ─────────────────────────────────────────────────────────────────────────────

export type WidgetType =
  | 'digital_clock'
  | 'analog_clock'
  | 'flip_clock'
  | 'weather'
  | 'calendar'
  | 'notes'
  | 'battery'
  | 'music_controls'
  | 'countdown'
  | 'pomodoro'
  | 'stopwatch'
  | 'habit_tracker'
  | 'quotes'
  | 'world_clock'
  | 'github_stats'
  | 'leetcode_stats';

// ── Widget ──────────────────────────────────────────────────────────────────

export interface Widget {
  id: string;
  dashboardId: string;
  type: WidgetType;
  /** grid column start (0-indexed) */
  col: number;
  /** grid row start (0-indexed) */
  row: number;
  /** width in grid columns */
  colSpan: number;
  /** height in grid rows */
  rowSpan: number;
  /** JSON settings blob, schema varies per widget type */
  settings: Record<string, unknown>;
  locked: boolean;
  refreshInterval: number; // seconds, 0 = no auto refresh
  opacity: number; // 0-1
  createdAt: string;
  updatedAt: string;
}

// ── Dashboard ────────────────────────────────────────────────────────────────

export type LayoutColumns = 2 | 4 | 6;

export interface AutomationRule {
  id: string;
  enabled: boolean;
  trigger: AutomationTrigger;
  /** Extra params per trigger type */
  params?: Record<string, unknown>;
}

export type AutomationTrigger =
  | 'charging'
  | 'landscape'
  | 'schedule'
  | 'wifi'
  | 'bluetooth'
  | 'manual';

export interface Dashboard {
  id: string;
  name: string;
  icon: string;
  themeId: string;
  layoutColumns: LayoutColumns;
  wallpaper: string | null; // URI or null for theme bg
  automationRules: AutomationRule[];
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

// ── Theme ────────────────────────────────────────────────────────────────────

export interface ThemeColors {
  background: string;
  surface: string;
  surfaceAlt: string;
  border: string;
  text: string;
  textMuted: string;
  textSubtle: string;
  accent: string;
  accentMuted: string;
  success: string;
  warning: string;
  error: string;
  onAccent: string;
}

export interface ThemeTokens {
  id: string;
  name: string;
  isBuiltIn: boolean;
  colors: ThemeColors;
  fontFamily: string;
  fontScale: number;          // 1.0 = default
  cornerRadius: number;       // dp
  blurIntensity: number;      // 0-20
  widgetOpacity: number;      // 0-1
  animationSpeed: number;     // 0.5 = fast, 1 = normal, 2 = slow
  accentColor: string;        // user override accent
}

// ── Habit Tracker ────────────────────────────────────────────────────────────

export interface HabitEntry {
  id: string;
  name: string;
  icon: string;
  color: string;
  completedDates: string[]; // ISO date strings YYYY-MM-DD
  createdAt: string;
}

// ── Notes ────────────────────────────────────────────────────────────────────

export interface Note {
  id: string;
  widgetId: string;
  content: string;
  updatedAt: string;
}

// ── Countdown ────────────────────────────────────────────────────────────────

export interface CountdownSettings {
  label: string;
  targetDate: string; // ISO string
}

// ── Weather ──────────────────────────────────────────────────────────────────

export interface WeatherData {
  city: string;
  temp: number;
  feelsLike: number;
  description: string;
  icon: string;
  humidity: number;
  windSpeed: number;
  high: number;
  low: number;
  fetchedAt: number; // timestamp ms
}

// ── Editor ───────────────────────────────────────────────────────────────────

export interface EditorState {
  isEditing: boolean;
  selectedWidgetId: string | null;
  draggedWidgetId: string | null;
}

// ── Import / Export ──────────────────────────────────────────────────────────

export interface DashboardExport {
  version: number;
  exportedAt: string;
  dashboard: Dashboard;
  widgets: Widget[];
  theme: ThemeTokens;
}

export interface AppBackup {
  version: number;
  exportedAt: string;
  dashboards: DashboardExport[];
  activeThemeId: string;
}
