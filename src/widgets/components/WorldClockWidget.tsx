import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Widget } from '../../types';
import { useTheme } from '../../theme/ThemeProvider';

interface Props { widget: Widget }

export const WorldClockWidget: React.FC<Props> = ({ widget }) => {
  const theme = useTheme();
  const settings = widget.settings as {
    timezones?: { label: string; tz: string }[];
    format24h?: boolean;
  };

  const tzs = settings.timezones?.length ? settings.timezones : [
    { label: 'New York', tz: 'America/New_York' },
    { label: 'London', tz: 'Europe/London' },
    { label: 'Tokyo', tz: 'Asia/Tokyo' },
  ];

  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const formatTz = (date: Date, timeZone: string, use24h: boolean) => {
    try {
      return new Intl.DateTimeFormat('en-US', {
        timeZone,
        hour: 'numeric',
        minute: '2-digit',
        hour12: !use24h,
      }).format(date);
    } catch {
      return 'Invalid TZ';
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: 'transparent' }]}>
      <Text style={[styles.header, { color: theme.colors.textMuted }]}>🌎 World Clock</Text>
      <View style={styles.list}>
        {tzs.slice(0, 4).map((item, i) => (
          <View key={i} style={[styles.row, { borderBottomColor: theme.colors.border, borderBottomWidth: i < tzs.length - 1 ? StyleSheet.hairlineWidth : 0 }]}>
            <Text style={[styles.label, { color: theme.colors.text }]} numberOfLines={1}>{item.label}</Text>
            <Text style={[styles.time, { color: theme.colors.accent }, { fontVariant: ['tabular-nums'] }]}>
              {formatTz(now, item.tz, settings.format24h ?? false)}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 14 },
  header: { fontSize: 11, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 },
  list: { flex: 1, justifyContent: 'center' },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8 },
  label: { fontSize: 14, fontWeight: '500', flex: 1 },
  time: { fontSize: 16, fontWeight: '600' },
});
