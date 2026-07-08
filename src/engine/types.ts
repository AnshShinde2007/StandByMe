import React from 'react';
import { Widget, WidgetType } from '../types';

// ─────────────────────────────────────────────────────────────────────────────
// Widget Size System
// ─────────────────────────────────────────────────────────────────────────────

export type WidgetSize = 'SMALL' | 'MEDIUM' | 'LARGE' | 'WIDE' | 'HERO';

export const WIDGET_SIZE_DIMENSIONS: Record<WidgetSize, { cols: number; rows: number }> = {
  SMALL:  { cols: 2, rows: 2 },
  MEDIUM: { cols: 4, rows: 2 },
  LARGE:  { cols: 4, rows: 4 },
  WIDE:   { cols: 6, rows: 2 },
  HERO:   { cols: 6, rows: 4 },
};

export const WIDGET_SIZE_COLORS: Record<WidgetSize, string> = {
  SMALL:  '#6366f1',
  MEDIUM: '#0ea5e9',
  LARGE:  '#10b981',
  WIDE:   '#f59e0b',
  HERO:   '#ef4444',
};

// ─────────────────────────────────────────────────────────────────────────────

export type WidgetCategory =
  | 'time'
  | 'info'
  | 'productivity'
  | 'health'
  | 'media'
  | 'developer'
  | 'lifestyle'
  | 'utility';

export type SettingType = 'toggle' | 'number' | 'text' | 'select' | 'color';

export interface SettingDefinition {
  id: string;
  label: string;
  type: SettingType;
  defaultValue: any;
  options?: { label: string; value: any }[];
  min?: number;
  max?: number;
}

export interface WidgetDefinition {
  type: WidgetType;
  displayName: string;
  description: string;
  icon: string;
  category: WidgetCategory;

  /** Canonical size — the Grid Engine converts this to col/row spans */
  size: WidgetSize;

  requiresInternet: boolean;

  settings: SettingDefinition[];

  Component: React.FC<{ widget: Widget }>;
}
