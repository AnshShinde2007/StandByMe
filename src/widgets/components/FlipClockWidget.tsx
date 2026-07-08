import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Widget } from '../../types';
import { useTheme } from '../../theme/ThemeProvider';
import { format } from 'date-fns';

interface Props { widget: Widget }

// ── Single flip card digit ────────────────────────────────────────────────────
const FlipDigit: React.FC<{ value: string; prevValue: string; color: string; bg: string; border: string }> = ({ value, prevValue, color, bg, border }) => {
  const flip = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (value !== prevValue) {
      flip.setValue(0);
      Animated.timing(flip, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start(() => flip.setValue(0));
    }
  }, [value]);

  const rotateY = flip.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '-90deg'] });

  return (
    <View style={[styles.card, { backgroundColor: bg, borderColor: border }]}>
      <Animated.Text
        style={[styles.digit, { color, transform: [{ perspective: 300 }, { rotateX: rotateY }] }, { fontVariant: ['tabular-nums'] }]}
      >
        {value}
      </Animated.Text>
      <View style={[styles.divider, { backgroundColor: border }]} />
    </View>
  );
};

// ── Flip Clock Widget ─────────────────────────────────────────────────────────
export const FlipClockWidget: React.FC<Props> = ({ widget }) => {
  const theme = useTheme();
  const [now, setNow] = useState(new Date());
  const [prev, setPrev] = useState(new Date());
  const settings = widget.settings as { showSeconds?: boolean; format24h?: boolean };

  useEffect(() => {
    const id = setInterval(() => {
      setPrev(new Date());
      setNow(new Date());
    }, 1000);
    return () => clearInterval(id);
  }, []);

  const fmt = settings.format24h
    ? (settings.showSeconds ? 'HH:mm:ss' : 'HH:mm')
    : (settings.showSeconds ? 'hh:mm:ss' : 'hh:mm');

  const timeStr = format(now, fmt);
  const prevStr = format(prev, fmt);

  const digits = timeStr.split('');
  const prevDigits = prevStr.split('');

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        {digits.map((d, i) =>
          d === ':' ? (
            <Text key={i} style={[styles.colon, { color: theme.colors.accent }]}>:</Text>
          ) : (
            <FlipDigit
              key={i}
              value={d}
              prevValue={prevDigits[i]}
              color={theme.colors.text}
              bg={theme.colors.surface}
              border={theme.colors.border}
            />
          )
        )}
      </View>
      {!settings.format24h && (
        <Text style={[styles.ampm, { color: theme.colors.textMuted }]}>
          {format(now, 'a').toUpperCase()}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 12 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  card: {
    width: 44,
    height: 60,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    overflow: 'hidden',
  },
  digit: { fontSize: 36, fontWeight: '700' },
  divider: { position: 'absolute', top: '50%', left: 0, right: 0, height: 1, opacity: 0.4 },
  colon: { fontSize: 36, fontWeight: '700', marginHorizontal: 2, marginBottom: 4 },
  ampm: { marginTop: 8, fontSize: 13 },
});
