import React, { useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Circle, Line, G } from 'react-native-svg';
import { Widget } from '../../types';
import { useTheme } from '../../theme/ThemeProvider';
import { useWidgetRefresh } from '../../engine/RefreshManager';

interface Props { widget: Widget }

export const AnalogClockWidget: React.FC<Props> = ({ widget }) => {
  const theme = useTheme();
  const [now, setNow] = useState(new Date());

  useWidgetRefresh(1000, () => setNow(new Date()));

  const hours = now.getHours() % 12;
  const minutes = now.getMinutes();
  const seconds = now.getSeconds();

  const hourAngle = (hours * 60 + minutes) / 720 * 360 - 90;
  const minAngle = (minutes * 60 + seconds) / 3600 * 360 - 90;
  const secAngle = seconds / 60 * 360 - 90;

  const cx = 50;
  const cy = 50;
  const r = 42;

  const toXY = (angle: number, len: number) => ({
    x: cx + Math.cos((angle * Math.PI) / 180) * len,
    y: cy + Math.sin((angle * Math.PI) / 180) * len,
  });

  const hourEnd = toXY(hourAngle, 24);
  const minEnd = toXY(minAngle, 32);
  const secEnd = toXY(secAngle, 36);

  const tickMarks = Array.from({ length: 12 }).map((_, i) => {
    const angle = (i / 12) * 360 - 90;
    const inner = toXY(angle, r - 6);
    const outer = toXY(angle, r);
    return { inner, outer };
  });

  return (
    <View style={styles.container}>
      <Svg viewBox="0 0 100 100" style={styles.svg}>
        {/* Face */}
        <Circle cx={cx} cy={cy} r={r} fill={theme.colors.surface} stroke={theme.colors.border} strokeWidth="0.5" />

        {/* Tick marks */}
        {tickMarks.map((tick, i) => (
          <Line
            key={i}
            x1={tick.inner.x}
            y1={tick.inner.y}
            x2={tick.outer.x}
            y2={tick.outer.y}
            stroke={theme.colors.textSubtle}
            strokeWidth={i % 3 === 0 ? 1.5 : 0.8}
            strokeLinecap="round"
          />
        ))}

        {/* Hour hand */}
        <Line x1={cx} y1={cy} x2={hourEnd.x} y2={hourEnd.y}
          stroke={theme.colors.text} strokeWidth={3} strokeLinecap="round" />

        {/* Minute hand */}
        <Line x1={cx} y1={cy} x2={minEnd.x} y2={minEnd.y}
          stroke={theme.colors.text} strokeWidth={2} strokeLinecap="round" />

        {/* Second hand */}
        <Line x1={cx} y1={cy} x2={secEnd.x} y2={secEnd.y}
          stroke={theme.colors.accent} strokeWidth={1} strokeLinecap="round" />

        {/* Center dot */}
        <Circle cx={cx} cy={cy} r={2} fill={theme.colors.accent} />
      </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 8 },
  svg: { width: '100%', height: '100%', maxWidth: 160, maxHeight: 160 },
});
