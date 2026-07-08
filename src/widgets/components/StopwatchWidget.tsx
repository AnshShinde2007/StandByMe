import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Widget } from '../../types';
import { useTheme } from '../../theme/ThemeProvider';

interface Props { widget: Widget }

export const StopwatchWidget: React.FC<Props> = ({ widget }) => {
  const theme = useTheme();
  const settings = widget.settings as { showLaps?: boolean };

  const [time, setTime] = useState(0); // in centiseconds (1/100s)
  const [isRunning, setIsRunning] = useState(false);
  const [laps, setLaps] = useState<{ id: number; time: number; split: number }[]>([]);
  const lastUpdate = useRef<number>(0);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRunning) {
      lastUpdate.current = Date.now();
      interval = setInterval(() => {
        const now = Date.now();
        const delta = Math.floor((now - lastUpdate.current) / 10);
        lastUpdate.current = now;
        setTime((t) => t + delta);
      }, 10); // Update every 10ms for smooth centiseconds
    }
    return () => clearInterval(interval);
  }, [isRunning]);

  const formatTime = (cs: number) => {
    const mins = Math.floor(cs / 6000);
    const secs = Math.floor((cs % 6000) / 100);
    const centi = cs % 100;
    return `${mins > 0 ? mins + ':' : ''}${mins > 0 ? secs.toString().padStart(2, '0') : secs}.${centi.toString().padStart(2, '0')}`;
  };

  const handleStartStop = () => setIsRunning(!isRunning);
  
  const handleLapReset = () => {
    if (isRunning) {
      // Lap
      const prevTotal = laps.length > 0 ? laps[0].time : 0;
      setLaps([{ id: laps.length + 1, time, split: time - prevTotal }, ...laps]);
    } else {
      // Reset
      setTime(0);
      setLaps([]);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: 'transparent' }]}>
      <Text style={[styles.time, { color: theme.colors.text }, { fontVariant: ['tabular-nums'] }]}>
        {formatTime(time)}
      </Text>

      <View style={styles.controls}>
        <TouchableOpacity style={[styles.btn, { backgroundColor: theme.colors.surfaceAlt }]} onPress={handleLapReset}>
          <Text style={[styles.btnText, { color: theme.colors.text }]}>
            {isRunning ? 'Lap' : 'Reset'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.btn, { backgroundColor: isRunning ? theme.colors.error : theme.colors.success }]} onPress={handleStartStop}>
          <Text style={[styles.btnText, { color: '#fff' }]}>
            {isRunning ? 'Stop' : 'Start'}
          </Text>
        </TouchableOpacity>
      </View>

      {settings.showLaps !== false && (
        <ScrollView style={styles.lapsList} showsVerticalScrollIndicator={false}>
          {laps.map((lap) => (
            <View key={lap.id} style={[styles.lapRow, { borderBottomColor: theme.colors.border }]}>
              <Text style={[styles.lapText, { color: theme.colors.textMuted }]}>Lap {lap.id}</Text>
              <Text style={[styles.lapText, { color: theme.colors.text }, { fontVariant: ['tabular-nums'] }]}>{formatTime(lap.split)}</Text>
              <Text style={[styles.lapText, { color: theme.colors.textSubtle }, { fontVariant: ['tabular-nums'] }]}>{formatTime(lap.time)}</Text>
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 12, alignItems: 'center' },
  time: { fontSize: 40, fontWeight: '200', marginVertical: 12 },
  controls: { flexDirection: 'row', gap: 16, marginBottom: 12 },
  btn: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center' },
  btnText: { fontSize: 14, fontWeight: '600' },
  lapsList: { flex: 1, width: '100%', marginTop: 8 },
  lapRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: StyleSheet.hairlineWidth },
  lapText: { fontSize: 12 },
});
