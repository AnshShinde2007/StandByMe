import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Widget } from '../../types';
import { useTheme } from '../../theme/ThemeProvider';
import { useWidgetRefresh } from '../../engine/RefreshManager';
import { format } from 'date-fns';

interface Props { widget: Widget }

export const DigitalClockWidget: React.FC<Props> = ({ widget }) => {
  const theme = useTheme();
  const [now, setNow] = useState(new Date());
  const settings = widget.settings as {
    showSeconds?: boolean;
    showDate?: boolean;
    format24h?: boolean;
    showAmPm?: boolean;
    fontSize?: 'small' | 'medium' | 'large';
  };

  useWidgetRefresh(1000, () => setNow(new Date()));

  const timeStr = settings.format24h
    ? format(now, settings.showSeconds ? 'HH:mm:ss' : 'HH:mm')
    : format(now, settings.showSeconds ? 'hh:mm:ss' : 'hh:mm');

  const amPm = format(now, 'a').toUpperCase();
  const dateStr = format(now, 'EEEE, MMM d');

  const fontSize = settings.fontSize === 'small' ? 36 : settings.fontSize === 'medium' ? 52 : 68;

  return (
    <View style={[styles.container, { backgroundColor: 'transparent' }]}>
      <View style={styles.timeRow}>
        <Text style={[styles.time, { color: theme.colors.text, fontSize }]} numberOfLines={1} adjustsFontSizeToFit>
          {timeStr}
        </Text>
        {!settings.format24h && settings.showAmPm && (
          <Text style={[styles.ampm, { color: theme.colors.accent }]}>{amPm}</Text>
        )}
      </View>
      {settings.showDate && (
        <Text style={[styles.date, { color: theme.colors.textMuted }]}>{dateStr}</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 12 },
  timeRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 6 },
  time: { fontWeight: '200', letterSpacing: -2 },
  ampm: { fontSize: 18, fontWeight: '600', marginBottom: 8 },
  date: { fontSize: 14, marginTop: 4, fontWeight: '400' },
});
