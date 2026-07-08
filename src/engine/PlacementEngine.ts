import { Widget } from '../types';
import { WidgetSize, WIDGET_SIZE_DIMENSIONS } from './types';

// ─────────────────────────────────────────────────────────────────────────────
// Placement Engine — pure, side-effect free
// ─────────────────────────────────────────────────────────────────────────────

export type OccupancyMatrix = string[][];

/**
 * Build a 2D occupancy matrix from existing widgets.
 * Each cell is either '0' (free) or the widget's ID (occupied).
 */
export function buildOccupancyMatrix(
  widgets: Widget[],
  cols: number,
  rows: number
): OccupancyMatrix {
  const matrix: OccupancyMatrix = Array.from({ length: rows }, () =>
    Array(cols).fill('0')
  );

  for (const w of widgets) {
    for (let r = w.row; r < w.row + w.rowSpan; r++) {
      for (let c = w.col; c < w.col + w.colSpan; c++) {
        if (r < rows && c < cols) {
          matrix[r][c] = w.id;
        }
      }
    }
  }

  return matrix;
}

/**
 * Scan top-to-bottom, left-to-right for the first rectangular region
 * that can fit the requested widget size.
 * Returns { col, row } or null if no space found.
 */
export function findPlacement(
  matrix: OccupancyMatrix,
  size: WidgetSize,
  cols: number
): { col: number; row: number } | null {
  const { cols: w, rows: h } = WIDGET_SIZE_DIMENSIONS[size];
  const totalRows = matrix.length;

  for (let r = 0; r <= totalRows - h; r++) {
    for (let c = 0; c <= cols - w; c++) {
      if (canFit(matrix, c, r, w, h)) {
        return { col: c, row: r };
      }
    }
  }
  return null;
}

/**
 * Check whether a w×h rectangle starting at (col, row) is entirely free.
 */
function canFit(
  matrix: OccupancyMatrix,
  col: number,
  row: number,
  w: number,
  h: number
): boolean {
  for (let r = row; r < row + h; r++) {
    for (let c = col; c < col + w; c++) {
      if (matrix[r]?.[c] !== '0') return false;
    }
  }
  return true;
}

/**
 * Validate whether resizing a widget to newColSpan × newRowSpan would
 * collide with any other widget on the grid.
 * Returns true if the resize is valid (no collision).
 */
export function validateResize(
  widgets: Widget[],
  widgetId: string,
  newColSpan: number,
  newRowSpan: number,
  cols: number,
  rows: number
): boolean {
  const widget = widgets.find((w) => w.id === widgetId);
  if (!widget) return false;

  // Build matrix excluding the widget being resized
  const others = widgets.filter((w) => w.id !== widgetId);
  const matrix = buildOccupancyMatrix(others, cols, rows);

  return canFit(matrix, widget.col, widget.row, newColSpan, newRowSpan);
}

/**
 * Get the canonical colSpan / rowSpan from a WidgetSize.
 */
export function getSizeDimensions(size: WidgetSize): { cols: number; rows: number } {
  return WIDGET_SIZE_DIMENSIONS[size];
}
