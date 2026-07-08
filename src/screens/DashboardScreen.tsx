import React, { useEffect, useRef, useCallback } from 'react';
import {
  View,
  StyleSheet,
  StatusBar,
  Dimensions,
  PanResponder,
  ImageBackground,
  TouchableOpacity,
  Text,
  useWindowDimensions,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import * as ScreenOrientation from 'expo-screen-orientation';
import { StackNavigationProp } from '@react-navigation/stack';
import { useDashboardStore } from '../store/dashboardStore';
import { useWidgetStore } from '../store/widgetStore';
import { useEditorStore } from '../store/editorStore';
import { useTheme } from '../theme/ThemeProvider';
import { WidgetGrid } from '../widgets/WidgetGrid';
import { WidgetSettingsModal } from '../components/WidgetSettingsModal';
import { MainStackParamList } from '../navigation/MainNavigator';
import { Dashboard } from '../types';

// Removed static SCREEN_W for orientation support

type Nav = StackNavigationProp<MainStackParamList, 'Dashboard'>;

// ─────────────────────────────────────────────────────────────────────────────
// Dashboard Screen — fullscreen standby view
// ─────────────────────────────────────────────────────────────────────────────
export const DashboardScreen: React.FC = () => {
  const nav = useNavigation<Nav>();
  const theme = useTheme();
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const swipeStartX = useRef(0);

  const dashboard = useDashboardStore((s) => s.dashboards.find((d) => d.id === s.activeDashboardId) ?? null);
  const switchToNext = useDashboardStore((s) => s.switchToNext);
  const switchToPrev = useDashboardStore((s) => s.switchToPrev);
  const loadWidgets = useWidgetStore((s) => s.loadWidgets);
  const isEditing = useEditorStore((s) => s.isEditing);
  const enterEditMode = useEditorStore((s) => s.enterEditMode);
  const editingSettingsWidgetId = useEditorStore((s) => s.editingSettingsWidgetId);
  const closeWidgetSettings = useEditorStore((s) => s.closeWidgetSettings);
  const { width, height: SCREEN_H } = useWindowDimensions();

  useEffect(() => {
    if (dashboard?.id) {
      loadWidgets(dashboard.id).then(() => {
        // Auto-migrate 1x1 battery widgets to 2x2 (and shift to col 2)
        const state = useWidgetStore.getState();
        const widgets = state.widgetsByDashboard[dashboard.id] ?? [];
        widgets.forEach((w) => {
          if (w.type === 'battery' && w.colSpan === 1 && w.rowSpan === 1) {
            state.updateWidgetPosition(w.id, dashboard.id, 2, w.row, 2, 2);
          }
        });
      });
    }
  }, [dashboard?.id]);

  useFocusEffect(
    useCallback(() => {
      ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE);
      return () => {
        ScreenOrientation.unlockAsync();
      };
    }, [])
  );

  // Long-press detection → enter edit mode
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,

      onPanResponderGrant: (evt) => {
        swipeStartX.current = evt.nativeEvent.pageX;
        longPressTimer.current = setTimeout(() => {
          enterEditMode();
        }, 600);
      },

      onPanResponderMove: (evt) => {
        // Cancel long press if user moves
        const dx = Math.abs(evt.nativeEvent.pageX - swipeStartX.current);
        if (dx > 10 && longPressTimer.current) {
          clearTimeout(longPressTimer.current);
          longPressTimer.current = null;
        }
      },

      onPanResponderRelease: (evt) => {
        if (longPressTimer.current) {
          clearTimeout(longPressTimer.current);
          longPressTimer.current = null;
        }
        const dx = evt.nativeEvent.pageX - swipeStartX.current;
        if (Math.abs(dx) > Dimensions.get('window').width * 0.25) {
          dx < 0 ? switchToNext() : switchToPrev();
        }
      },
    })
  ).current;

  if (!dashboard) {
    return (
      <View style={[styles.empty, { backgroundColor: theme.colors.background }]}>
        <Text style={{ color: theme.colors.text, fontSize: 18 }}>No dashboards yet.</Text>
        <TouchableOpacity
          style={[styles.createBtn, { backgroundColor: theme.colors.accent }]}
          onPress={() => nav.navigate('Settings')}
        >
          <Text style={{ color: theme.colors.onAccent, fontWeight: '700' }}>Go to Settings</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const bg = dashboard.wallpaper;

  const content = (
    <View style={styles.fill} {...(!isEditing ? panResponder.panHandlers : {})}>
      <StatusBar hidden />
      {dashboard && (
        <WidgetGrid
          dashboard={dashboard}
          isEditing={isEditing}
        />
      )}
      {/* Edit mode overlay bar */}
      {isEditing && (
        <EditorOverlay dashboard={dashboard} nav={nav} />
      )}
      
      {/* Settings Modal Overlay */}
      {editingSettingsWidgetId && dashboard && (
        <WidgetSettingsModal
          widgetId={editingSettingsWidgetId}
          dashboardId={dashboard.id}
          onClose={closeWidgetSettings}
        />
      )}
    </View>
  );

  if (bg) {
    return (
      <ImageBackground source={{ uri: bg }} style={styles.fill} resizeMode="cover">
        {content}
      </ImageBackground>
    );
  }

  return (
    <View style={[styles.fill, { backgroundColor: theme.colors.background }]}>
      {content}
    </View>
  );
};

// ── Editor Overlay Bar ────────────────────────────────────────────────────────
const EditorOverlay: React.FC<{ dashboard: Dashboard | any; nav: Nav }> = ({ dashboard, nav }) => {
  const theme = useTheme();
  const exitEditMode = useEditorStore((s) => s.exitEditMode);
  const openWidgetPicker = useEditorStore((s) => s.openWidgetPicker);

  return (
    <View style={[styles.editorBar, { backgroundColor: theme.colors.surface, borderTopColor: theme.colors.border }]}>
      <TouchableOpacity
        style={[styles.editorBtn, { backgroundColor: theme.colors.surfaceAlt }]}
        onPress={() => {
          if (dashboard?.id) nav.navigate('WidgetPicker', { dashboardId: dashboard.id });
        }}
      >
        <Text style={[styles.editorBtnText, { color: theme.colors.text }]}>＋ Widget</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.editorBtn, { backgroundColor: theme.colors.surfaceAlt }]}
        onPress={() => {
          if (dashboard?.id)
            nav.navigate('ThemeEditor', { dashboardId: dashboard.id, themeId: dashboard.themeId });
        }}
      >
        <Text style={[styles.editorBtnText, { color: theme.colors.text }]}>🎨 Theme</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.editorBtn, { backgroundColor: theme.colors.surfaceAlt }]}
        onPress={() => nav.navigate('Settings')}
      >
        <Text style={[styles.editorBtnText, { color: theme.colors.text }]}>⚙️ Settings</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.editorBtn, { backgroundColor: theme.colors.accent }]}
        onPress={exitEditMode}
      >
        <Text style={[styles.editorBtnText, { color: theme.colors.onAccent }]}>✓ Done</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  fill: { flex: 1 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 },
  createBtn: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 10 },
  editorBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderTopWidth: 1,
  },
  editorBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  editorBtnText: { fontWeight: '600', fontSize: 14 },
});
