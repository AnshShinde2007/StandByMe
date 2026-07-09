import React, { useRef, useCallback } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  PanResponder,
  TouchableOpacity,
  Text,
  Alert,
} from 'react-native';
import { Dashboard, Widget } from '../types';
import { useTheme } from '../theme/ThemeProvider';
import { useEditorStore } from '../store/editorStore';
import { useWidgetStore } from '../store/widgetStore';
import { WidgetRenderer } from './WidgetRenderer';
import { getWidgetMeta } from '../constants/widgets';
import { validateResize } from '../engine/PlacementEngine';

// ─────────────────────────────────────────────────────────────────────────────
// WidgetContainer — wraps each widget with theming + edit mode overlay
// ─────────────────────────────────────────────────────────────────────────────

interface Props {
  widget: Widget;
  dashboard: Dashboard;
  isEditing: boolean;
  x: number;
  y: number;
  width: number;
  height: number;
  cellW: number;
  cellH: number;
  cols: number;
  rows: number;
}

const CELL_GAP = 8;

export const WidgetContainer: React.FC<Props> = ({
  widget,
  dashboard,
  isEditing,
  x,
  y,
  width,
  height,
  cellW,
  cellH,
  cols,
  rows,
}) => {
  const theme = useTheme();
  const selectedWidgetId = useEditorStore((s) => s.selectedWidgetId);
  const selectWidget = useEditorStore((s) => s.selectWidget);
  const updateWidgetPosition = useWidgetStore((s) => s.updateWidgetPosition);
  const removeWidget = useWidgetStore((s) => s.removeWidget);
  const duplicateWidget = useWidgetStore((s) => s.duplicateWidget);

  const isSelected = selectedWidgetId === widget.id;

  // Animated position for drag
  const pan = useRef(new Animated.ValueXY({ x, y })).current;
  const dragStart = useRef({ x, y });

  // Sync pan with x/y if grid resizes
  React.useEffect(() => {
    pan.setValue({ x, y });
  }, [x, y, pan]);

  // Snap to nearest grid cell
  const snapToGrid = useCallback(
    (px: number, py: number) => {
      const col = Math.round((px - 12) / (cellW + CELL_GAP));
      const row = Math.round((py - 12) / (cellH + CELL_GAP));
      const clampedCol = Math.max(0, Math.min(cols - widget.colSpan, col));
      const clampedRow = Math.max(0, Math.min(rows - widget.rowSpan, row));
      return { col: clampedCol, row: clampedRow };
    },
    [cellW, cellH, cols, rows, widget.colSpan, widget.rowSpan]
  );

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => isEditing && !widget.locked,
      onMoveShouldSetPanResponder: () => isEditing && !widget.locked,

      onPanResponderGrant: () => {
        dragStart.current = { x: (pan.x as any)._value, y: (pan.y as any)._value };
        pan.setOffset(dragStart.current);
        pan.setValue({ x: 0, y: 0 });
        selectWidget(widget.id);
      },

      onPanResponderMove: Animated.event([null, { dx: pan.x, dy: pan.y }], {
        useNativeDriver: false,
      }),

      onPanResponderRelease: (_, gesture) => {
        pan.flattenOffset();
        const finalX = dragStart.current.x + gesture.dx;
        const finalY = dragStart.current.y + gesture.dy;
        const { col, row } = snapToGrid(finalX, finalY);

        const allWidgets = useWidgetStore.getState().widgetsByDashboard[dashboard.id] ?? [];
        const isValid = validateResize(
          allWidgets,
          widget.id,
          widget.colSpan,
          widget.rowSpan,
          cols,
          rows
        );

        const snappedX = 12 + col * (cellW + CELL_GAP);
        const snappedY = 12 + row * (cellH + CELL_GAP);

        if (isValid) {
          // Snap to new position and persist
          Animated.spring(pan, {
            toValue: { x: snappedX, y: snappedY },
            useNativeDriver: false,
            friction: 8,
          }).start();
          updateWidgetPosition(widget.id, dashboard.id, col, row, widget.colSpan, widget.rowSpan);
        } else {
          // Snap back to original position (collision detected)
          Animated.spring(pan, {
            toValue: { x: dragStart.current.x, y: dragStart.current.y },
            useNativeDriver: false,
            friction: 5,
            tension: 200,
          }).start();
        }
      },
    })
  ).current;

  const handleDelete = () => {
    Alert.alert('Remove Widget', `Remove "${getWidgetMeta(widget.type).displayName}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () => removeWidget(widget.id, dashboard.id),
      },
    ]);
  };

  const handleDuplicate = () => {
    duplicateWidget(widget.id, dashboard.id);
  };

  const containerStyle: any = {
    position: 'absolute',
    width,
    height,
    borderRadius: theme.cornerRadius,
    overflow: 'hidden',
    opacity: widget.opacity,
    // Add subtle glass-like border for premium feel
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    // Premium diffused shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 8,
  };

  if (isEditing) {
    return (
      <Animated.View
        style={[
          containerStyle,
          {
            left: pan.x,
            top: pan.y,
            borderWidth: isSelected ? 2 : 1,
            borderColor: isSelected ? theme.colors.accent : 'rgba(255, 255, 255, 0.06)',
            shadowColor: isSelected ? theme.colors.accent : '#000',
            shadowOffset: { width: 0, height: isSelected ? 8 : 12 },
            shadowOpacity: isSelected ? 0.4 : 0.15,
            shadowRadius: isSelected ? 16 : 24,
            elevation: isSelected ? 12 : 8,
          },
        ]}
        {...panResponder.panHandlers}
      >
        <View style={[styles.widgetBg, { backgroundColor: theme.colors.surface }]}>
          <WidgetRenderer widget={widget} />
          {/* Edit overlay */}
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            onPress={() => selectWidget(widget.id)}
            activeOpacity={0.7}
          />
          {/* Edit controls (shown when selected) */}
          {isSelected && (
            <View style={[styles.editControls, { backgroundColor: theme.colors.surface }]}>
              {widget.locked ? (
                <Text style={[styles.lockLabel, { color: theme.colors.textMuted }]}>🔒 Locked</Text>
              ) : null}
              <TouchableOpacity
                style={[styles.controlBtn, { backgroundColor: theme.colors.surfaceAlt }]}
                onPress={() => useEditorStore.getState().openWidgetSettings(widget.id)}
              >
                <Text style={[styles.controlBtnText, { color: theme.colors.text }]}>⚙</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.controlBtn, { backgroundColor: theme.colors.surfaceAlt }]} onPress={handleDuplicate}>
                <Text style={[styles.controlBtnText, { color: theme.colors.text }]}>⧉</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.controlBtn, { backgroundColor: '#ef4444' }]} onPress={handleDelete}>
                <Text style={[styles.controlBtnText, { color: '#fff' }]}>✕</Text>
              </TouchableOpacity>
            </View>
          )}
          {/* Lock icon */}
          {widget.locked && (
            <View style={styles.lockBadge}>
              <Text style={{ fontSize: 10 }}>🔒</Text>
            </View>
          )}
        </View>
      </Animated.View>
    );
  }

  // View mode — static position
  return (
    <View
      style={[
        containerStyle,
        { left: x, top: y },
      ]}
    >
      <View style={[styles.widgetBg, { backgroundColor: theme.colors.surface }]}>
        <WidgetRenderer widget={widget} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  widgetBg: {
    flex: 1,
    overflow: 'hidden',
  },
  editControls: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    borderRadius: 24, // Pill shape
    paddingHorizontal: 8,
    paddingVertical: 6,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  controlBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  controlBtnText: { fontSize: 14, fontWeight: '700' },
  lockLabel: { fontSize: 11, paddingHorizontal: 4 },
  lockBadge: {
    position: 'absolute',
    bottom: 6,
    right: 6,
  },
});
