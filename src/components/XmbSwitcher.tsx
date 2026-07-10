import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions, Pressable } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
  interpolate,
  Extrapolate,
} from 'react-native-reanimated';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import * as LucideIcons from 'lucide-react-native';
import { useDashboardStore } from '../store/dashboardStore';
import { useTheme } from '../theme/ThemeProvider';

const { width: SCREEN_W } = Dimensions.get('window');
const ITEM_WIDTH = 120;
const ITEM_SPACING = 20;

interface XmbSwitcherProps {
  onClose: () => void;
  onEdit: () => void;
}

export const XmbSwitcher: React.FC<XmbSwitcherProps> = ({ onClose, onEdit }) => {
  const dashboards = useDashboardStore((s) => s.dashboards);
  const activeDashboardId = useDashboardStore((s) => s.activeDashboardId);
  const setActiveDashboard = useDashboardStore((s) => s.setActiveDashboard);
  const theme = useTheme();

  const initialIndex = dashboards.findIndex((d) => d.id === activeDashboardId);
  const currentIndex = useSharedValue(initialIndex >= 0 ? initialIndex : 0);
  const translateX = useSharedValue(-currentIndex.value * (ITEM_WIDTH + ITEM_SPACING));
  const opacity = useSharedValue(0);

  useEffect(() => {
    opacity.value = withTiming(1, { duration: 300 });
  }, []);

  const handleIndexChange = (newIndex: number) => {
    if (newIndex >= 0 && newIndex < dashboards.length) {
      const d = dashboards[newIndex];
      if (d.id !== activeDashboardId) {
        setActiveDashboard(d.id);
      }
    }
  };

  const startX = useSharedValue(0);

  const panGesture = Gesture.Pan()
    .onStart(() => {
      startX.value = translateX.value;
    })
    .onUpdate((event) => {
      translateX.value = startX.value + event.translationX;
      
      const floatIndex = -translateX.value / (ITEM_WIDTH + ITEM_SPACING);
      const roundedIndex = Math.round(floatIndex);
      const clampedIndex = Math.max(0, Math.min(dashboards.length - 1, roundedIndex));
      
      if (clampedIndex !== currentIndex.value) {
        currentIndex.value = clampedIndex;
        runOnJS(handleIndexChange)(clampedIndex);
      }
    })
    .onEnd((event) => {
      const projectedX = translateX.value + event.velocityX * 0.2;
      const floatIndex = -projectedX / (ITEM_WIDTH + ITEM_SPACING);
      const targetIndex = Math.round(floatIndex);
      const clampedIndex = Math.max(0, Math.min(dashboards.length - 1, targetIndex));
      
      const targetTranslateX = -clampedIndex * (ITEM_WIDTH + ITEM_SPACING);
      translateX.value = withSpring(targetTranslateX, {
        damping: 20,
        stiffness: 200,
        mass: 0.5,
      });

      if (clampedIndex !== currentIndex.value) {
        currentIndex.value = clampedIndex;
        runOnJS(handleIndexChange)(clampedIndex);
      }
    });

  const animatedContainerStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const animatedTrackStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  // Helper to render icon by name
  const renderIcon = (name: string, color: string, size: number) => {
    const IconComponent = (LucideIcons as any)[name] || LucideIcons.LayoutDashboard;
    return <IconComponent color={color} size={size} strokeWidth={1.5} />;
  };

  return (
    <Animated.View style={[styles.overlay, animatedContainerStyle]}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      
      <View style={styles.centerIndicator} pointerEvents="none" />
      
      <GestureDetector gesture={panGesture}>
        <Animated.View style={styles.trackContainer}>
          <Animated.View style={[styles.track, animatedTrackStyle]}>
            {dashboards.map((dashboard, index) => {
              const animatedItemStyle = useAnimatedStyle(() => {
                const itemPos = -index * (ITEM_WIDTH + ITEM_SPACING);
                const distance = Math.abs(translateX.value - itemPos);
                const scale = interpolate(
                  distance,
                  [0, ITEM_WIDTH + ITEM_SPACING],
                  [1.2, 0.9],
                  Extrapolate.CLAMP
                );
                const itemOpacity = interpolate(
                  distance,
                  [0, ITEM_WIDTH + ITEM_SPACING],
                  [1, 0.6],
                  Extrapolate.CLAMP
                );
                const translateY = interpolate(
                  distance,
                  [0, ITEM_WIDTH + ITEM_SPACING],
                  [-10, 0],
                  Extrapolate.CLAMP
                );

                return {
                  transform: [{ scale }, { translateY }],
                  opacity: itemOpacity,
                };
              });

              return (
                <Animated.View key={dashboard.id} style={[styles.item, animatedItemStyle]}>
                  <Pressable
                    onPress={() => {
                      if (currentIndex.value === index) {
                        onClose(); // Select active and close
                      } else {
                        // Snap to this one
                        translateX.value = withSpring(-index * (ITEM_WIDTH + ITEM_SPACING));
                        currentIndex.value = index;
                        handleIndexChange(index);
                      }
                    }}
                    onLongPress={() => {
                      if (currentIndex.value === index) {
                        onEdit(); // Edit current
                      }
                    }}
                    style={styles.itemContent}
                  >
                    <View style={[styles.iconWrapper, { borderColor: theme.colors.border, backgroundColor: 'rgba(0,0,0,0.3)' }]}>
                      {renderIcon(dashboard.icon, theme.colors.text, 40)}
                    </View>
                    <Text style={[styles.label, { color: theme.colors.text }]} numberOfLines={1}>
                      {dashboard.name}
                    </Text>
                  </Pressable>
                </Animated.View>
              );
            })}
          </Animated.View>
        </Animated.View>
      </GestureDetector>
      
      {/* Edit Hint */}
      <View style={styles.hintContainer} pointerEvents="none">
         <Text style={[styles.hintText, { color: theme.colors.textMuted }]}>
           Tap to select • Long press to edit
         </Text>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  backdrop: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  trackContainer: {
    width: '100%',
    height: 200,
    justifyContent: 'center',
  },
  track: {
    flexDirection: 'row',
    alignItems: 'center',
    // Center the first item initially by shifting by SCREEN_W / 2 - ITEM_WIDTH / 2
    paddingLeft: Dimensions.get('window').width / 2 - ITEM_WIDTH / 2,
    paddingRight: Dimensions.get('window').width / 2 - ITEM_WIDTH / 2,
  },
  item: {
    width: ITEM_WIDTH,
    marginRight: ITEM_SPACING,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemContent: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  iconWrapper: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 10,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  centerIndicator: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: ITEM_WIDTH + 40,
    height: 160,
    marginTop: -80,
    marginLeft: -(ITEM_WIDTH + 40) / 2,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  hintContainer: {
    position: 'absolute',
    bottom: 40,
    alignItems: 'center',
    width: '100%',
  },
  hintText: {
    fontSize: 14,
    fontWeight: '500',
    opacity: 0.8,
  }
});
