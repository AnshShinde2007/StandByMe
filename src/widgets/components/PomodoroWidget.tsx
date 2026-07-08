import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Widget } from '../../types';
import { useTheme } from '../../theme/ThemeProvider';

interface Props { widget: Widget }

type Phase = 'work' | 'short_break' | 'long_break';

export const PomodoroWidget: React.FC<Props> = ({ widget }) => {
  const theme = useTheme();
  const settings = widget.settings as {
    workMinutes?: number;
    shortBreakMinutes?: number;
    longBreakMinutes?: number;
    cyclesBeforeLong?: number;
    autoStart?: boolean;
  };

  const workMin = settings.workMinutes ?? 25;
  const shortMin = settings.shortBreakMinutes ?? 5;
  const longMin = settings.longBreakMinutes ?? 15;
  const cyclesToLong = settings.cyclesBeforeLong ?? 4;

  const [phase, setPhase] = useState<Phase>('work');
  const [timeLeft, setTimeLeft] = useState(workMin * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [cycles, setCycles] = useState(0);

  const phaseColors: Record<Phase, string> = {
    work: theme.colors.error, // Red for focus
    short_break: theme.colors.success, // Green for break
    long_break: theme.colors.accent, // Accent for long break
  };

  const activeColor = phaseColors[phase];

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => setTimeLeft((t) => t - 1), 1000);
    } else if (isRunning && timeLeft === 0) {
      // Phase transition
      if (phase === 'work') {
        const nextCycles = cycles + 1;
        setCycles(nextCycles);
        if (nextCycles % cyclesToLong === 0) {
          setPhase('long_break');
          setTimeLeft(longMin * 60);
        } else {
          setPhase('short_break');
          setTimeLeft(shortMin * 60);
        }
      } else {
        setPhase('work');
        setTimeLeft(workMin * 60);
      }
      if (!settings.autoStart) setIsRunning(false);
    }
    return () => clearInterval(interval);
  }, [isRunning, timeLeft, phase, cycles, workMin, shortMin, longMin, cyclesToLong, settings.autoStart]);

  const mins = Math.floor(timeLeft / 60);
  const secs = timeLeft % 60;
  const timeStr = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;

  const toggle = () => setIsRunning(!isRunning);
  const reset = () => {
    setIsRunning(false);
    setPhase('work');
    setCycles(0);
    setTimeLeft(workMin * 60);
  };

  const progress =
    phase === 'work'
      ? 1 - timeLeft / (workMin * 60)
      : phase === 'short_break'
      ? 1 - timeLeft / (shortMin * 60)
      : 1 - timeLeft / (longMin * 60);

  return (
    <View style={[styles.container, { backgroundColor: 'transparent' }]}>
      <Text style={[styles.phaseText, { color: activeColor }]}>
        {phase === 'work' ? 'FOCUS' : phase === 'short_break' ? 'SHORT BREAK' : 'LONG BREAK'}
      </Text>

      {/* Circular progress could go here, for now using a clean text layout */}
      <Text style={[styles.time, { color: theme.colors.text, fontVariant: ['tabular-nums'] }]}>
        {timeStr}
      </Text>

      <View style={[styles.progressBar, { backgroundColor: theme.colors.border }]}>
        <View style={[styles.progressFill, { width: `${progress * 100}%`, backgroundColor: activeColor }]} />
      </View>

      <View style={styles.controls}>
        <TouchableOpacity style={[styles.btn, { backgroundColor: theme.colors.surfaceAlt }]} onPress={reset}>
          <Text style={[styles.btnText, { color: theme.colors.textMuted }]}>Reset</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.btn, { backgroundColor: isRunning ? theme.colors.surfaceAlt : activeColor }]} onPress={toggle}>
          <Text style={[styles.btnText, { color: isRunning ? theme.colors.text : theme.colors.onAccent }]}>
            {isRunning ? 'Pause' : 'Start'}
          </Text>
        </TouchableOpacity>
      </View>

      <Text style={[styles.cycles, { color: theme.colors.textSubtle }]}>
        Cycle: {(cycles % cyclesToLong) + 1} / {cyclesToLong}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 12 },
  phaseText: { fontSize: 12, fontWeight: '700', letterSpacing: 1.5, marginBottom: 8 },
  time: { fontSize: 44, fontWeight: '200', marginBottom: 12 },
  progressBar: { width: '80%', height: 4, borderRadius: 2, overflow: 'hidden', marginBottom: 16 },
  progressFill: { height: 4, borderRadius: 2 },
  controls: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  btn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  btnText: { fontSize: 13, fontWeight: '600' },
  cycles: { fontSize: 11 },
});
