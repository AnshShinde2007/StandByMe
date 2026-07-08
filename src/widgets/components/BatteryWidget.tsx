import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import * as Battery from 'expo-battery';
import { Widget } from '../../types';
import { useTheme } from '../../theme/ThemeProvider';

interface Props { widget: Widget }

export const BatteryWidget: React.FC<Props> = ({ widget }) => {
  const theme = useTheme();
  const settings = widget.settings as {
    showPercentage?: boolean;
    showStatus?: boolean;
    style?: 'bar' | 'circle' | 'compact';
  };

  const [level, setLevel] = useState(1);
  const [state, setState] = useState<Battery.BatteryState>(Battery.BatteryState.UNKNOWN);

  useEffect(() => {
    let mounted = true;
    Battery.getBatteryLevelAsync().then((l) => { if (mounted) setLevel(l); });
    Battery.getBatteryStateAsync().then((s) => { if (mounted) setState(s); });

    const sub1 = Battery.addBatteryLevelListener(({ batteryLevel }) => {
      if (mounted) setLevel(batteryLevel);
    });
    const sub2 = Battery.addBatteryStateListener(({ batteryState }) => {
      if (mounted) setState(batteryState);
    });

    return () => {
      mounted = false;
      sub1.remove();
      sub2.remove();
    };
  }, []);

  const pct = Math.round(level * 100);
  const isCharging = state === Battery.BatteryState.CHARGING;
  const isFull = state === Battery.BatteryState.FULL;

  const barColor =
    pct > 50 ? '#22c55e' : pct > 20 ? '#f59e0b' : '#ef4444';

  const statusLabel = isFull ? '⚡ Full' : isCharging ? '⚡ Charging' : 'On Battery';

  if (settings.style === 'compact') {
    return (
      <View style={styles.compact}>
        <Text style={[styles.compactPct, { color: isCharging ? theme.colors.success : theme.colors.text }]}>
          {isCharging && '⚡'}{pct}%
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: 'transparent' }]}>
      {settings.showStatus && (
        <Text style={[styles.status, { color: isCharging ? theme.colors.success : theme.colors.textMuted }]}>
          {statusLabel}
        </Text>
      )}
      {settings.showPercentage && (
        <Text style={[styles.pct, { color: theme.colors.text }]}>{pct}%</Text>
      )}

      {/* Battery bar (style === 'bar') */}
      {settings.style === 'bar' ? (
        <View style={[styles.barTrack, { backgroundColor: theme.colors.border, width: '100%' }]}>
          <View
            style={[
              styles.barFill,
              { width: `${pct}%`, backgroundColor: isCharging ? theme.colors.accent : barColor },
            ]}
          />
        </View>
      ) : (
        /* Battery body icon (default) */
        <View style={styles.batteryWrapper}>
          <View style={[styles.batteryBody, { borderColor: theme.colors.textMuted }]}>
            <View style={[styles.batteryFill, { width: `${pct}%`, backgroundColor: isCharging ? theme.colors.accent : barColor }]} />
          </View>
          <View style={[styles.batteryTip, { backgroundColor: theme.colors.textMuted }]} />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 14, justifyContent: 'center', alignItems: 'center', gap: 8 },
  status: { fontSize: 12, fontWeight: '500' },
  pct: { fontSize: 36, fontWeight: '200' },
  barTrack: { height: 8, borderRadius: 4, overflow: 'hidden' },
  barFill: { height: 8, borderRadius: 4 },
  batteryWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '80%',
  },
  batteryBody: {
    height: 28,
    flex: 1,
    borderWidth: 2,
    borderRadius: 6,
    overflow: 'hidden',
    position: 'relative',
  },
  batteryFill: { position: 'absolute', left: 0, top: 0, bottom: 0 },
  batteryTip: { width: 4, height: 12, borderTopRightRadius: 2, borderBottomRightRadius: 2 },
  compact: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  compactPct: { fontSize: 22, fontWeight: '600' },
});
