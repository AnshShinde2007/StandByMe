import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Widget } from '../../types';
import { useTheme } from '../../theme/ThemeProvider';

interface Props { widget: Widget }

// Music controls are display-only on Android without a native media session module.
// This widget shows a polished UI that can be wired up when a native module is available.
export const MusicControlsWidget: React.FC<Props> = ({ widget }) => {
  const theme = useTheme();
  const settings = widget.settings as { showAlbumArt?: boolean; showProgressBar?: boolean; compact?: boolean };

  // Placeholder state — would come from native media session in production
  const trackName = 'Now Playing';
  const artist = 'Add a music app';
  const progress = 0.4;

  return (
    <View style={[styles.container, { backgroundColor: 'transparent' }]}>
      {settings.showAlbumArt && (
        <View style={[styles.albumArt, { backgroundColor: theme.colors.surfaceAlt }]}>
          <Text style={{ fontSize: 30 }}>🎵</Text>
        </View>
      )}

      <View style={styles.info}>
        <Text style={[styles.track, { color: theme.colors.text }]} numberOfLines={1}>{trackName}</Text>
        <Text style={[styles.artist, { color: theme.colors.textMuted }]} numberOfLines={1}>{artist}</Text>

        {settings.showProgressBar && (
          <View style={[styles.progressTrack, { backgroundColor: theme.colors.border }]}>
            <View style={[styles.progressFill, { width: `${progress * 100}%`, backgroundColor: theme.colors.accent }]} />
          </View>
        )}

        <View style={styles.controls}>
          {(['⏮', '⏸', '⏭'] as const).map((icon) => (
            <TouchableOpacity key={icon} style={[styles.ctrlBtn, { backgroundColor: theme.colors.surfaceAlt }]}>
              <Text style={[styles.ctrlIcon, { color: icon === '⏸' ? theme.colors.accent : theme.colors.text }]}>
                {icon}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, flexDirection: 'row', padding: 14, gap: 12, alignItems: 'center' },
  albumArt: { width: 60, height: 60, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  info: { flex: 1, gap: 4 },
  track: { fontSize: 15, fontWeight: '600' },
  artist: { fontSize: 13 },
  progressTrack: { height: 3, borderRadius: 2, marginVertical: 6, overflow: 'hidden' },
  progressFill: { height: 3, borderRadius: 2 },
  controls: { flexDirection: 'row', gap: 8, marginTop: 4 },
  ctrlBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  ctrlIcon: { fontSize: 16 },
});
