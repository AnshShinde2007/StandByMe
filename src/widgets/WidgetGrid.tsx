import React, { useMemo } from 'react';
import { View, StyleSheet, useWindowDimensions } from 'react-native';
import { Dashboard, Widget } from '../types';
import { useWidgetStore } from '../store/widgetStore';
import { useTheme } from '../theme/ThemeProvider';
import { WidgetContainer } from './WidgetContainer';

// Removed static Dimensions

// Padding around the grid
const GRID_PADDING = 12;
// Gap between cells
const CELL_GAP = 8;
// Number of rows (fixed, height-driven)
const GRID_ROWS = 4;

// ─────────────────────────────────────────────────────────────────────────────
// WidgetGrid — absolute-positioned grid layout
// ─────────────────────────────────────────────────────────────────────────────

interface WidgetGridProps {
  dashboard: Dashboard;
  isEditing: boolean;
}

const EMPTY_ARRAY: any[] = [];

export const WidgetGrid: React.FC<WidgetGridProps> = ({ dashboard, isEditing }) => {
  const theme = useTheme();
  const { width: SCREEN_W, height: SCREEN_H } = useWindowDimensions();
  const widgets = useWidgetStore((s) => s.widgetsByDashboard[dashboard.id] ?? EMPTY_ARRAY);

  const cols = dashboard.layoutColumns;

  const cellW = useMemo(
    () => (SCREEN_W - GRID_PADDING * 2 - CELL_GAP * (cols - 1)) / cols,
    [cols, SCREEN_W]
  );
  // Use full height so widgets don't squish; the editor bar will overlay them
  const availableH = SCREEN_H;
  const cellH = useMemo(
    () => (availableH - GRID_PADDING * 2 - CELL_GAP * (GRID_ROWS - 1)) / GRID_ROWS,
    [availableH]
  );

  const getPosition = (widget: Widget) => {
    const x = GRID_PADDING + widget.col * (cellW + CELL_GAP);
    const y = GRID_PADDING + widget.row * (cellH + CELL_GAP);
    const w = widget.colSpan * cellW + (widget.colSpan - 1) * CELL_GAP;
    const h = widget.rowSpan * cellH + (widget.rowSpan - 1) * CELL_GAP;
    return { x, y, w, h };
  };

  return (
    <View style={styles.container}>
      {/* Grid overlay lines (edit mode only) */}
      {isEditing && (
        <GridOverlay
          cols={cols}
          rows={GRID_ROWS}
          cellW={cellW}
          cellH={cellH}
          availableH={availableH}
          theme={theme}
          SCREEN_W={SCREEN_W}
        />
      )}

      {/* Widgets */}
      {widgets.map((widget) => {
        const { x, y, w, h } = getPosition(widget);
        return (
          <WidgetContainer
            key={widget.id}
            widget={widget}
            dashboard={dashboard}
            isEditing={isEditing}
            x={x}
            y={y}
            width={w}
            height={h}
            cellW={cellW}
            cellH={cellH}
            cols={cols}
            rows={GRID_ROWS}
          />
        );
      })}
    </View>
  );
};

// ── Grid Overlay ──────────────────────────────────────────────────────────────
interface GridOverlayProps {
  cols: number;
  rows: number;
  cellW: number;
  cellH: number;
  availableH: number;
  theme: ReturnType<typeof useTheme>;
  SCREEN_W: number;
}

const GridOverlay: React.FC<GridOverlayProps> = ({ cols, rows, cellW, cellH, availableH, theme, SCREEN_W }) => {
  const lines: React.ReactNode[] = [];

  // Vertical lines
  for (let c = 0; c <= cols; c++) {
    const x = GRID_PADDING + c * (cellW + CELL_GAP) - (c > 0 ? CELL_GAP / 2 : 0);
    lines.push(
      <View
        key={`v${c}`}
        style={{
          position: 'absolute',
          left: x,
          top: GRID_PADDING,
          width: 1,
          height: availableH - GRID_PADDING * 2,
          backgroundColor: theme.colors.border,
          opacity: 0.4,
        }}
      />
    );
  }

  // Horizontal lines
  for (let r = 0; r <= rows; r++) {
    const y = GRID_PADDING + r * (cellH + CELL_GAP) - (r > 0 ? CELL_GAP / 2 : 0);
    lines.push(
      <View
        key={`h${r}`}
        style={{
          position: 'absolute',
          top: y,
          left: GRID_PADDING,
          height: 1,
          width: SCREEN_W - GRID_PADDING * 2,
          backgroundColor: theme.colors.border,
          opacity: 0.4,
        }}
      />
    );
  }

  return <>{lines}</>;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },
});
