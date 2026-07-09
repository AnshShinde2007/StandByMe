import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from 'react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming, 
  withSpring, 
  FadeIn,
  runOnJS
} from 'react-native-reanimated';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import { Widget } from '../../types';
import { useTheme } from '../../theme/ThemeProvider';
import { Play, Pause, SkipBack, SkipForward, Music, Lock, Headphones, Speaker, Bluetooth } from 'lucide-react-native';
import {
  play,
  pause,
  next,
  previous,
  seekTo,
  checkNotificationAccess,
  promptNotificationAccess,
  addMediaUpdateListener,
  MediaState,
} from 'expo-media-session';

interface Props {
  widget: Widget;
}

type WidgetSettings = {
  showAlbumArt?: boolean;
  showProgressBar?: boolean;
  showArtist?: boolean;
  showAlbum?: boolean;
  roundedArtwork?: boolean;
  compact?: boolean;
};

// ─── Helpers ────────────────────────────────────────────────────────────────

function formatTime(seconds: number): string {
  if (!seconds || isNaN(seconds) || seconds < 0) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

const AnimatedPressable = Animated.createAnimatedComponent(TouchableOpacity);

function AnimatedButton({ children, onPress, style, scaleTo = 0.85, ...props }: any) {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));
  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={() => { scale.value = withSpring(scaleTo, { damping: 15 }); }}
      onPressOut={() => { scale.value = withSpring(1, { damping: 15 }); }}
      style={[style, animatedStyle]}
      activeOpacity={1}
      {...props}
    >
      {children}
    </AnimatedPressable>
  );
}

// ─── Widget ─────────────────────────────────────────────────────────────────

export const MusicControlsWidget: React.FC<Props> = ({ widget }) => {
  const theme = useTheme();
  const settings = (widget.settings ?? {}) as WidgetSettings;

  const [hasPermission, setHasPermission] = useState<boolean>(false);
  const [mediaState, setMediaState] = useState<MediaState | null>(null);
  const [localPosition, setLocalPosition] = useState(0);
  const progressIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Animated values
  const progressAnim = useSharedValue(0);
  const isDragging = useSharedValue(false);
  const trackWidth = useSharedValue(0);

  // ── Permission check (also runs on foreground) ───────────────────────────

  const checkPermission = useCallback(() => {
    if (Platform.OS !== 'android') return;
    try {
      const granted = checkNotificationAccess();
      setHasPermission(granted);
    } catch {
      setHasPermission(false);
    }
  }, []);

  useEffect(() => {
    checkPermission();
    const permTimer = setInterval(checkPermission, 2000);
    return () => clearInterval(permTimer);
  }, [checkPermission]);

  // ── Native media session listener ────────────────────────────────────────

  useEffect(() => {
    if (!hasPermission) return;

    const subscription = addMediaUpdateListener((state) => {
      if (!state.title) {
        setMediaState(null);
        setLocalPosition(0);
      } else {
        setMediaState(state);
        setLocalPosition(state.position);
      }
    });

    return () => subscription.remove();
  }, [hasPermission]);

  // ── Local progress interpolation ─────────────────────────────────────────

  useEffect(() => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }

    if (mediaState?.isPlaying && (mediaState.duration ?? 0) > 0) {
      progressIntervalRef.current = setInterval(() => {
        setLocalPosition((prev) => {
          if (prev < mediaState.duration) return prev + 1;
          return prev;
        });
      }, 1000);
    }

    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
    };
  }, [mediaState?.isPlaying, mediaState?.duration]);

  // Update animated progress bar unless user is dragging
  useEffect(() => {
    if (mediaState && mediaState.duration > 0 && !isDragging.value) {
      const currentRatio = localPosition / mediaState.duration;
      if (mediaState.isPlaying) {
        progressAnim.value = withTiming(currentRatio, { duration: 1000 });
      } else {
        progressAnim.value = currentRatio;
      }
    }
  }, [localPosition, mediaState?.isPlaying, mediaState?.duration]);

  // ── Optimistic play/pause toggle ─────────────────────────────────────────

  const handlePlayPause = useCallback(() => {
    if (!mediaState) return;
    if (mediaState.isPlaying) {
      pause();
    } else {
      play();
    }
    setMediaState((prev) => prev ? { ...prev, isPlaying: !prev.isPlaying } : prev);
  }, [mediaState]);

  const handleNext = useCallback(() => { next(); }, []);
  const handlePrevious = useCallback(() => { previous(); }, []);

  const handleSeek = useCallback((ratio: number) => {
    if (!mediaState) return;
    const pos = Math.floor(ratio * mediaState.duration);
    seekTo(pos);
    setLocalPosition(pos);
  }, [mediaState]);

  // ── Slider Gestures ──────────────────────────────────────────────────────

  const panGesture = Gesture.Pan()
    .onBegin(() => {
      isDragging.value = true;
    })
    .onUpdate((e) => {
      if (trackWidth.value > 0) {
        const p = Math.max(0, Math.min(1, e.x / trackWidth.value));
        progressAnim.value = p;
      }
    })
    .onEnd((e) => {
      if (trackWidth.value > 0) {
        const p = Math.max(0, Math.min(1, e.x / trackWidth.value));
        runOnJS(handleSeek)(p);
      }
      isDragging.value = false;
    });

  const progressStyle = useAnimatedStyle(() => ({
    width: `${progressAnim.value * 100}%`,
  }));

  const thumbStyle = useAnimatedStyle(() => {
    return {
      left: `${progressAnim.value * 100}%`,
      transform: [
        { translateX: -8 },
        { scale: isDragging.value ? withSpring(1.5) : withSpring(1) }
      ]
    };
  });

  // ── Render: Empty states ────────────────────────────────────────────────

  if (Platform.OS !== 'android') {
    return (
      <View style={[styles.container, styles.emptyContainer]}>
        <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>Android only</Text>
      </View>
    );
  }

  if (!hasPermission) {
    return (
      <View style={[styles.container, styles.emptyContainer, { backgroundColor: 'transparent' }]}>
        <View style={[styles.emptyIconBg, { backgroundColor: theme.colors.surfaceAlt }]}>
          <Lock color={theme.colors.text} size={48} />
        </View>
        <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>Access Required</Text>
        <Text style={[styles.emptySubtitle, { color: theme.colors.textMuted }]}>
          Grant Notification Access to control media playback.
        </Text>
        <AnimatedButton
          style={[styles.grantBtn, { backgroundColor: theme.colors.accent }]}
          onPress={promptNotificationAccess}
        >
          <Text style={[styles.grantBtnText, { color: theme.colors.onAccent }]}>Open Settings</Text>
        </AnimatedButton>
      </View>
    );
  }

  if (!mediaState) {
    return (
      <View style={[styles.container, styles.emptyContainer, { backgroundColor: 'transparent' }]}>
        <View style={[styles.emptyIconBg, { backgroundColor: theme.colors.surfaceAlt }]}>
          <Music color={theme.colors.text} size={48} />
        </View>
        <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>No media playing</Text>
        <Text style={[styles.emptySubtitle, { color: theme.colors.textMuted }]}>
          Start music to control playback.
        </Text>
      </View>
    );
  }

  // ── Render: Playing ───────────────────────────────────────────────────────

  const { title, artist, artwork, duration, isPlaying, outputDeviceType, outputDeviceName } = mediaState;

  return (
    <View style={[styles.container, { backgroundColor: 'transparent' }]}>
      {/* Left: Album Art */}
      <View style={styles.leftColumn}>
        <Animated.View 
          key={artwork || 'empty'}
          entering={FadeIn.duration(400)} 
          style={[styles.artContainer, { backgroundColor: theme.colors.surfaceAlt }]}
        >
          {artwork ? (
            <Image
              source={{ uri: artwork }}
              style={styles.artImage}
              resizeMode="cover"
            />
          ) : (
            <Music color={theme.colors.textMuted} size={64} />
          )}
        </Animated.View>
      </View>

      {/* Right: Info and Controls */}
      <View style={styles.rightColumn}>
        
        {/* Top: Info */}
        <View style={styles.infoArea}>
          <View style={styles.deviceRow}>
            <Music color={theme.colors.textMuted} size={14} />
            <Text style={[styles.deviceSeparator, { color: theme.colors.textMuted }]}>•</Text>
            {outputDeviceType === 'Bluetooth' ? (
              <Bluetooth color={theme.colors.textMuted} size={14} />
            ) : outputDeviceType === 'Wired' ? (
              <Headphones color={theme.colors.textMuted} size={14} />
            ) : (
              <Speaker color={theme.colors.textMuted} size={14} />
            )}
            <Text style={[styles.deviceName, { color: theme.colors.textMuted }]}>
              {outputDeviceName || 'Speaker'}
            </Text>
          </View>
          
          <Animated.Text
            key={title}
            entering={FadeIn.duration(300)}
            style={[styles.titleText, { color: theme.colors.text }]}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {title}
          </Animated.Text>
          
          {settings.showArtist !== false && !!artist && (
            <Animated.Text
              key={artist}
              entering={FadeIn.duration(300)}
              style={[styles.artistText, { color: theme.colors.text }]}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {artist}
            </Animated.Text>
          )}
        </View>

        {/* Middle: Transport Controls */}
        <View style={styles.controlsArea}>
          <AnimatedButton style={styles.ctrlBtn} onPress={handlePrevious}>
            <SkipBack color={theme.colors.text} fill={theme.colors.text} size={24} />
          </AnimatedButton>

          <AnimatedButton
            style={[styles.ctrlBtnLg, { backgroundColor: theme.colors.accent }]}
            onPress={handlePlayPause}
            scaleTo={0.9}
          >
            {isPlaying ? (
              <Pause color={theme.colors.onAccent} fill={theme.colors.onAccent} size={36} />
            ) : (
              <Play color={theme.colors.onAccent} fill={theme.colors.onAccent} size={36} style={{ marginLeft: 4 }} />
            )}
          </AnimatedButton>

          <AnimatedButton style={styles.ctrlBtn} onPress={handleNext}>
            <SkipForward color={theme.colors.text} fill={theme.colors.text} size={24} />
          </AnimatedButton>
        </View>

        {/* Bottom: Progress Bar */}
        {settings.showProgressBar !== false && (
          <View style={styles.progressArea}>
            <GestureDetector gesture={panGesture}>
              <View 
                style={styles.progressHitSlop}
                onLayout={(e) => { trackWidth.value = e.nativeEvent.layout.width; }}
              >
                <View style={[styles.progressTrack, { backgroundColor: theme.colors.border }]}>
                  <Animated.View style={[styles.progressFill, { backgroundColor: theme.colors.text }, progressStyle]} />
                  <Animated.View style={[styles.progressThumb, { backgroundColor: theme.colors.text }, thumbStyle]} />
                </View>
              </View>
            </GestureDetector>
            
            <View style={styles.timeRow}>
              <Text style={[styles.timeText, { color: theme.colors.textMuted }]}>
                {formatTime(localPosition)}
              </Text>
              <Text style={[styles.timeText, { color: theme.colors.textMuted }]}>
                {formatTime(duration)}
              </Text>
            </View>
          </View>
        )}
      </View>
    </View>
  );
};

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    flexDirection: 'row',
    gap: 24,
    alignItems: 'center',
  },
  leftColumn: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    height: '100%',
  },
  artContainer: {
    height: '100%',
    aspectRatio: 1,
    maxWidth: 320,
    maxHeight: 320,
    borderRadius: 32,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
  },
  artImage: {
    width: '100%',
    height: '100%',
  },
  rightColumn: {
    flex: 1.2,
    height: '100%',
    justifyContent: 'center',
    gap: 28,
    paddingVertical: 8,
  },
  infoArea: {
    width: '100%',
    alignItems: 'center',
    gap: 4,
  },
  deviceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginBottom: 8,
    opacity: 0.8,
  },
  deviceSeparator: {
    fontSize: 14,
    marginHorizontal: 2,
  },
  deviceName: {
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  titleText: {
    fontSize: 34,
    fontWeight: '800',
    textAlign: 'center',
  },
  artistText: {
    fontSize: 18,
    fontWeight: '500',
    textAlign: 'center',
    opacity: 0.7,
  },
  controlsArea: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 48,
  },
  ctrlBtn: {
    padding: 12,
  },
  ctrlBtnLg: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  progressArea: {
    width: '100%',
    gap: 12,
    paddingHorizontal: 8,
  },
  progressHitSlop: {
    paddingVertical: 12,
    justifyContent: 'center',
  },
  progressTrack: {
    height: 8,
    borderRadius: 4,
    width: '100%',
  },
  progressFill: {
    height: 8,
    borderRadius: 4,
    position: 'absolute',
    left: 0,
    top: 0,
  },
  progressThumb: {
    width: 16,
    height: 16,
    borderRadius: 8,
    position: 'absolute',
    top: -4,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  timeText: {
    fontSize: 14,
    fontWeight: '500',
    fontVariant: ['tabular-nums'],
  },
  // --- Empty states ---
  emptyContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'column',
  },
  emptyIconBg: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 24,
  },
  grantBtn: {
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
  },
  grantBtnText: {
    fontWeight: '700',
    fontSize: 16,
  },
});
