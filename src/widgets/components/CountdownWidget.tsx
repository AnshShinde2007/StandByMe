import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { differenceInSeconds, parseISO } from 'date-fns';
import { Widget } from '../../types';
import { useTheme } from '../../theme/ThemeProvider';

interface Props { widget: Widget }

const pad = (n: number) => String(n).padStart(2, '0');

export const CountdownWidget: React.FC<Props> = ({ widget }) => {
  const theme = useTheme();
  const settings = widget.settings as {
    label?: string;
    targetDate?: string;
    showDays?: boolean;
    showHours?: boolean;
    showMinutes?: boolean;
    showSeconds?: boolean;
  };

  const [remaining, setRemaining] = useState(0);

  useEffect(() => {
    const update = () => {
      if (!settings.targetDate) { setRemaining(0); return; }
      const target = parseISO(settings.targetDate);
      const diff = differenceInSeconds(target, new Date());
      setRemaining(Math.max(0, diff));
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [settings.targetDate]);

  const days = Math.floor(remaining / 86400);
  const hours = Math.floor((remaining % 86400) / 3600);
  const minutes = Math.floor((remaining % 3600) / 60);
  const seconds = remaining % 60;

  const units = [
    settings.showDays !== false && { label: 'Days', value: days },
    settings.showHours !== false && { label: 'Hrs', value: hours },
    settings.showMinutes !== false && { label: 'Min', value: minutes },
    settings.showSeconds && { label: 'Sec', value: seconds },
  ].filter(Boolean) as { label: string; value: number }[];

  const isExpired = remaining === 0 && Boolean(settings.targetDate);

  return (
    <View style={[styles.container, { backgroundColor: 'transparent' }]}>
      {settings.label && (
        <Text style={[styles.label, { color: theme.colors.textMuted }]}>{settings.label}</Text>
      )}
      {isExpired ? (
        <Text style={[styles.expired, { color: theme.colors.accent }]}>🎉 Time's up!</Text>
      ) : (
        <View style={styles.row}>
          {units.map((u, i) => (
            <React.Fragment key={u.label}>
              {i > 0 && <Text style={[styles.sep, { color: theme.colors.textSubtle }]}>:</Text>}
              <View style={styles.unit}>
                <Text style={[styles.value, { color: theme.colors.text }, { fontVariant: ['tabular-nums'] }]}>{pad(u.value)}</Text>
                <Text style={[styles.unitLabel, { color: theme.colors.textSubtle }]}>{u.label}</Text>
              </View>
            </React.Fragment>
          ))}
        </View>
      )}
      {!settings.targetDate && (
        <Text style={[styles.hint, { color: theme.colors.textSubtle }]}>Set a target date in settings</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 12 },
  label: { fontSize: 13, fontWeight: '500', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  sep: { fontSize: 28, fontWeight: '200', marginBottom: 12 },
  unit: { alignItems: 'center' },
  value: { fontSize: 36, fontWeight: '200', fontVariant: ['tabular-nums'] },
  unitLabel: { fontSize: 10, marginTop: 2 },
  expired: { fontSize: 24 },
  hint: { fontSize: 12, textAlign: 'center' },
});
