import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { Widget } from '../../types';
import { useTheme } from '../../theme/ThemeProvider';
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

// ─── Widget ─────────────────────────────────────────────────────────────────

export const MusicControlsWidget: React.FC<Props> = ({ widget }) => {
  const theme = useTheme();
  const settings = (widget.settings ?? {}) as WidgetSettings;

  const [hasPermission, setHasPermission] = useState<boolean>(false);
  const [mediaState, setMediaState] = useState<MediaState | null>(null);
  // Local position interpolates between native updates to keep the bar smooth
  const [localPosition, setLocalPosition] = useState(0);
  const progressIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Permission check (also runs on foreground) ───────────────────────────

  const checkPermission = useCallback(() => {
    if (Platform.OS !== 'android') return; // module is Android-only
    try {
      const granted = checkNotificationAccess();
      setHasPermission(granted);
    } catch {
      setHasPermission(false);
    }
  }, []);

  useEffect(() => {
    checkPermission();
    // Poll permission every 2 s so the widget reacts quickly after the user
    // grants access in the system settings screen and returns to the app.
    const permTimer = setInterval(checkPermission, 2000);
    return () => clearInterval(permTimer);
  }, [checkPermission]);

  // ── Native media session listener ────────────────────────────────────────

  useEffect(() => {
    if (!hasPermission) return;

    const subscription = addMediaUpdateListener((state) => {
      // A title-less state means no active session
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

  // ── Optimistic play/pause toggle ─────────────────────────────────────────

  const handlePlayPause = useCallback(() => {
    if (!mediaState) return;
    if (mediaState.isPlaying) {
      pause();
    } else {
      play();
    }
    // Optimistic update — native callback will confirm shortly
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

  // ── Render: Permission gate ───────────────────────────────────────────────

  if (Platform.OS !== 'android') {
    return (
      <View style={[styles.container, styles.emptyContainer]}>
        <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>
          Android only
        </Text>
      </View>
    );
  }

  if (!hasPermission) {
    return (
      <View style={[styles.container, styles.emptyContainer, { backgroundColor: 'transparent' }]}>
        <View style={[styles.emptyIconBg, { backgroundColor: theme.colors.surfaceAlt }]}>
          <Text style={styles.emptyIconText}>🔒</Text>
        </View>
        <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>
          Access Required
        </Text>
        <Text style={[styles.emptySubtitle, { color: theme.colors.textMuted }]}>
          Grant Notification Access to control media playback.
        </Text>
        <TouchableOpacity
          style={[styles.grantBtn, { backgroundColor: theme.colors.accent }]}
          onPress={promptNotificationAccess}
        >
          <Text style={[styles.grantBtnText, { color: theme.colors.onAccent }]}>
            Open Settings
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ── Render: No Media ──────────────────────────────────────────────────────

  if (!mediaState) {
    return (
      <View style={[styles.container, styles.emptyContainer, { backgroundColor: 'transparent' }]}>
        <View style={[styles.emptyIconBg, { backgroundColor: theme.colors.surfaceAlt }]}>
          <Text style={styles.emptyIconText}>🎵</Text>
        </View>
        <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>
          No media playing
        </Text>
        <Text style={[styles.emptySubtitle, { color: theme.colors.textMuted }]}>
          Start music to control playback.
        </Text>
      </View>
    );
  }

  // ── Render: Playing ───────────────────────────────────────────────────────

  const { title, artist, album, artwork, duration, isPlaying } = mediaState;
  const progress = duration > 0 ? Math.min(localPosition / duration, 1) : 0;
  const artRadius = settings.roundedArtwork !== false ? 12 : 4;

  return (
    <View style={[styles.container, { backgroundColor: 'transparent' }]}>
      {/* Left: Album Art */}
      <View style={styles.leftColumn}>
        <View style={[styles.artContainer, { backgroundColor: theme.colors.surfaceAlt }]}>
          {artwork ? (
            <Image
              source={{ uri: artwork }}
              style={styles.artImage}
              resizeMode="cover"
            />
          ) : (
            <Text style={styles.artPlaceholderText}>🎵</Text>
          )}
        </View>
      </View>

      {/* Right: Info and Controls */}
      <View style={styles.rightColumn}>
        
        {/* Top: Info */}
        <View style={styles.infoArea}>
          <View style={styles.deviceRow}>
            <Text style={styles.deviceIcon}>🎧</Text>
            <Text style={[styles.deviceName, { color: theme.colors.textMuted }]}>
              {mediaState.packageName === 'com.spotify.music' ? 'Spotify' : 
               mediaState.packageName === 'com.google.android.apps.youtube.music' ? 'YouTube Music' : 
               'Local Media'}
            </Text>
          </View>
          <Text
            style={[styles.titleText, { color: theme.colors.text }]}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {title}
          </Text>
          {settings.showArtist !== false && !!artist && (
            <Text
              style={[styles.artistText, { color: theme.colors.textMuted }]}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {artist}
            </Text>
          )}
        </View>

        {/* Middle: Transport Controls */}
        <View style={styles.controlsArea}>
          <TouchableOpacity
            style={styles.ctrlBtn}
            onPress={handlePrevious}
            activeOpacity={0.7}
          >
            <Text style={[styles.ctrlIcon, { color: theme.colors.text }]}>⏮</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.ctrlBtnLg, 
              { backgroundColor: theme.colors.text } // solid contrasting background for the 'O'
            ]}
            onPress={handlePlayPause}
            activeOpacity={0.7}
          >
            <Text style={[styles.ctrlIconLg, { color: theme.colors.background }]}>
              {isPlaying ? '⏸' : '▶️'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.ctrlBtn}
            onPress={handleNext}
            activeOpacity={0.7}
          >
            <Text style={[styles.ctrlIcon, { color: theme.colors.text }]}>⏭</Text>
          </TouchableOpacity>
        </View>

        {/* Bottom: Progress Bar */}
        {settings.showProgressBar !== false && (
          <View style={styles.progressArea}>
            <View
              style={[styles.progressTrack, { backgroundColor: theme.colors.border }]}
            >
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${progress * 100}%`,
                    backgroundColor: theme.colors.text, // highly visible progress fill
                  },
                ]}
              />
            </View>
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
    padding: 16, // Reduced from 24 to give more room
    flexDirection: 'row',
    gap: 20, // Reduced from 32 to pull the right side further left
    alignItems: 'center',
  },
  leftColumn: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    height: '100%',
  },
  artContainer: {
    height: '100%', // Bound by height so it never clips vertically!
    aspectRatio: 1,
    maxWidth: 320, // Prevent it from becoming absurdly large on ultra-wide screens
    maxHeight: 320,
    borderRadius: 24,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  artImage: {
    width: '100%',
    height: '100%',
  },
  artPlaceholderText: {
    fontSize: 64,
  },
  rightColumn: {
    flex: 1.2,
    height: '100%',
    justifyContent: 'space-between', // Naturally spreads items to fit the exact screen height
    paddingVertical: 12,
  },
  infoArea: {
    width: '100%',
    alignItems: 'center',
  },
  deviceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 8,
  },
  deviceIcon: {
    fontSize: 16,
  },
  deviceName: {
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  titleText: {
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 4,
    textAlign: 'center',
  },
  artistText: {
    fontSize: 20,
    fontWeight: '500',
    textAlign: 'center',
  },
  controlsArea: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 32,
  },
  ctrlBtn: {
    padding: 12,
  },
  ctrlIcon: {
    fontSize: 32,
  },
  ctrlBtnLg: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  ctrlIconLg: {
    fontSize: 30,
  },
  progressArea: {
    width: '100%',
    gap: 8,
  },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: 6,
    borderRadius: 3,
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
  emptyIconText: {
    fontSize: 48,
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
