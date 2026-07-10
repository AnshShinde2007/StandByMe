import React, { useEffect, useRef, useCallback, useState } from 'react';
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
  Pressable,
  Platform,
} from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import * as ScreenOrientation from 'expo-screen-orientation';
import { NavigationBar } from 'expo-navigation-bar';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import { StackNavigationProp } from '@react-navigation/stack';
import { useDashboardStore } from '../store/dashboardStore';
import { useWidgetStore } from '../store/widgetStore';
import { useEditorStore } from '../store/editorStore';
import { useTheme } from '../theme/ThemeProvider';
import { WidgetGrid } from '../widgets/WidgetGrid';
import { WidgetSettingsModal } from '../components/WidgetSettingsModal';
import { XmbSwitcher } from '../components/XmbSwitcher';
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
  const [isXmbOpen, setIsXmbOpen] = useState(false);
  const xmbProgress = useSharedValue(0);

  const dashboard = useDashboardStore((s) => s.dashboards.find((d) => d.id === s.activeDashboardId) ?? null);
  const switchToNext = useDashboardStore((s) => s.switchToNext);
  const switchToPrev = useDashboardStore((s) => s.switchToPrev);
  const loadWidgets = useWidgetStore((s) => s.loadWidgets);
  const isEditing = useEditorStore((s) => s.isEditing);
  const enterEditMode = useEditorStore((s) => s.enterEditMode);
  const editingSettingsWidgetId = useEditorStore((s) => s.editingSettingsWidgetId);
  const closeWidgetSettings = useEditorStore((s) => s.closeWidgetSettings);
  const { width, height: SCREEN_H } = useWindowDimensions();

  // Navigation Bar Immersive Mode logic
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showNavigationBar = useCallback(() => {
    if (Platform.OS === 'android') {
      NavigationBar.setHidden(false);
    }
  }, []);

  const hideNavigationBar = useCallback(() => {
    if (Platform.OS === 'android' && !isEditing) {
      NavigationBar.setHidden(true);
    }
  }, [isEditing]);

  const resetHideTimer = useCallback(() => {
    if (isEditing) return; // Do not hide while editing
    showNavigationBar();
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current);
    }
    hideTimerRef.current = setTimeout(() => {
      hideNavigationBar();
    }, 3000);
  }, [isEditing, hideNavigationBar, showNavigationBar]);

  useEffect(() => {
    if (isEditing || isXmbOpen) {
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
      showNavigationBar();
    } else {
      resetHideTimer();
    }
    return () => {
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    };
  }, [isEditing, isXmbOpen, resetHideTimer, showNavigationBar]);

  useFocusEffect(
    useCallback(() => {
      if (!isEditing) {
        resetHideTimer();
      }
      return () => {
        if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
        showNavigationBar();
      };
    }, [isEditing, resetHideTimer, showNavigationBar])
  );

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
          const maxCols = dashboard.layoutColumns ?? 4;
          const isFullScreenType = w.type === 'music_controls' || 
                                   w.type === 'weather' || 
                                   w.type === 'digital_clock' || 
                                   w.type === 'analog_clock' || 
                                   w.type === 'flip_clock';
                                   
          if (isFullScreenType && (w.colSpan !== maxCols || w.rowSpan !== 4)) {
            state.updateWidgetPosition(w.id, dashboard.id, 0, 0, maxCols, 4);
          }
        });
      });
    }
  }, [dashboard?.id]);

  useFocusEffect(
    useCallback(() => {
      ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE).catch(() => {});
      activateKeepAwakeAsync().catch(() => {});
      
      return () => {
        ScreenOrientation.unlockAsync().catch(() => {});
        deactivateKeepAwake().catch(() => {});
      };
    }, [])
  );

  // Swipe detection → switch dashboards (won't block child taps)
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onStartShouldSetPanResponderCapture: () => false,
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        // Only capture the touch if it's a clear horizontal swipe
        return Math.abs(gestureState.dx) > 20 && Math.abs(gestureState.dx) > Math.abs(gestureState.dy);
      },
      onMoveShouldSetPanResponderCapture: (evt, gestureState) => {
        return Math.abs(gestureState.dx) > 20 && Math.abs(gestureState.dx) > Math.abs(gestureState.dy);
      },
      onPanResponderGrant: () => {
        resetHideTimer();
      },
      onPanResponderRelease: (evt, gestureState) => {
        console.log("Swipe released", gestureState.dx);
        if (gestureState.dx < -50) {
          switchToNext();
        } else if (gestureState.dx > 50) {
          switchToPrev();
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

  const handleOpenXmb = () => {
    setIsXmbOpen(true);
    xmbProgress.value = withSpring(1, { damping: 20, stiffness: 200 });
  };

  const handleCloseXmb = () => {
    setIsXmbOpen(false);
    xmbProgress.value = withSpring(0, { damping: 20, stiffness: 200 });
  };

  const animatedDashboardStyle = useAnimatedStyle(() => {
    const scale = 1 - xmbProgress.value * 0.1; // scale to 0.9
    return {
      transform: [{ scale }],
    };
  });

  const animatedOverlayStyle = useAnimatedStyle(() => {
    return {
      opacity: xmbProgress.value * 0.6,
    };
  });

  const content = (
    <Pressable 
      style={styles.fill} 
      onLongPress={handleOpenXmb} 
      onPressIn={resetHideTimer}
      delayLongPress={600}
    >
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
    </Pressable>
  );

  const wrappedContent = (
    <>
      <Animated.View style={[styles.fill, animatedDashboardStyle]}>
        {bg ? (
          <ImageBackground source={{ uri: bg }} style={styles.fill} resizeMode="cover">
            <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0, 0, 0, 0.4)' }]} />
            {content}
          </ImageBackground>
        ) : (
          <View style={[styles.fill, { backgroundColor: theme.colors.background }]}>
            {content}
          </View>
        )}
        <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: 'black' }, animatedOverlayStyle]} />
      </Animated.View>
      
      {isXmbOpen && (
        <XmbSwitcher
          onClose={handleCloseXmb}
          onEdit={() => {
            handleCloseXmb();
            enterEditMode();
          }}
        />
      )}
    </>
  );

  return wrappedContent;
};

// ── Editor Overlay Bar ────────────────────────────────────────────────────────
const EditorOverlay: React.FC<{ dashboard: Dashboard | any; nav: Nav }> = ({ dashboard, nav }) => {
  const theme = useTheme();
  const exitEditMode = useEditorStore((s) => s.exitEditMode);

  return (
    <View style={styles.editorOverlayContainer}>
      <View style={[
        styles.editorPill, 
        { 
          backgroundColor: theme.colors.surface, 
          borderColor: theme.colors.border,
          shadowColor: '#000',
        }
      ]}>
        <TouchableOpacity
          style={[styles.editorBtn, { backgroundColor: theme.colors.surfaceAlt }]}
          onPress={() => {
            if (dashboard?.id) nav.navigate('WidgetPicker', { dashboardId: dashboard.id });
          }}
        >
          <Text style={[styles.editorBtnText, { color: theme.colors.text }]}>＋ Add</Text>
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
        <View style={styles.divider} />
        <TouchableOpacity
          style={[styles.editorBtn, { backgroundColor: theme.colors.accent }]}
          onPress={exitEditMode}
        >
          <Text style={[styles.editorBtnText, { color: theme.colors.onAccent }]}>✓ Done</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  fill: { flex: 1 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 },
  createBtn: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 10 },
  editorOverlayContainer: {
    position: 'absolute',
    bottom: 32,
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editorPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 32, // Perfect pill shape
    borderWidth: 1,
    elevation: 20,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
  },
  editorBtn: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24, // Matches the pill
  },
  editorBtnText: { fontWeight: '700', fontSize: 14 },
  divider: {
    width: 1,
    height: 24,
    backgroundColor: 'rgba(150, 150, 150, 0.3)',
    marginHorizontal: 4,
  },
});
