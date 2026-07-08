import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import {
  startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, format,
} from 'date-fns';
import { Widget } from '../../types';
import { useTheme } from '../../theme/ThemeProvider';

interface Props { widget: Widget }

export const CalendarWidget: React.FC<Props> = ({ widget }) => {
  const theme = useTheme();
  const settings = widget.settings as { startOnMonday?: boolean; showWeekNumbers?: boolean };
  const [viewDate, setViewDate] = useState(new Date());
  const today = new Date();

  const monthStart = startOfMonth(viewDate);
  const monthEnd = endOfMonth(viewDate);
  const calStart = startOfWeek(monthStart, { weekStartsOn: settings.startOnMonday ? 1 : 0 });
  const calEnd = endOfWeek(monthEnd, { weekStartsOn: settings.startOnMonday ? 1 : 0 });
  const days = eachDayOfInterval({ start: calStart, end: calEnd });

  const dayHeaders = settings.startOnMonday
    ? ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su']
    : ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

  return (
    <View style={[styles.container, { backgroundColor: 'transparent' }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => setViewDate(subMonths(viewDate, 1))} style={styles.navBtn}>
          <Text style={[styles.navArrow, { color: theme.colors.accent }]}>‹</Text>
        </TouchableOpacity>
        <Text style={[styles.monthTitle, { color: theme.colors.text }]}>
          {format(viewDate, 'MMMM yyyy')}
        </Text>
        <TouchableOpacity onPress={() => setViewDate(addMonths(viewDate, 1))} style={styles.navBtn}>
          <Text style={[styles.navArrow, { color: theme.colors.accent }]}>›</Text>
        </TouchableOpacity>
      </View>

      {/* Day headers */}
      <View style={styles.weekRow}>
        {dayHeaders.map((d) => (
          <Text key={d} style={[styles.dayHeader, { color: theme.colors.textSubtle }]}>{d}</Text>
        ))}
      </View>

      {/* Days */}
      <View style={styles.grid}>
        {days.map((day) => {
          const isToday = isSameDay(day, today);
          const inMonth = isSameMonth(day, viewDate);
          return (
            <View
              key={day.toISOString()}
              style={[
                styles.dayCell,
                isToday && { backgroundColor: theme.colors.accent, borderRadius: 100 },
              ]}
            >
              <Text
                style={[
                  styles.dayText,
                  { color: inMonth ? theme.colors.text : theme.colors.textSubtle },
                  isToday && { color: theme.colors.onAccent, fontWeight: '700' },
                ]}
              >
                {format(day, 'd')}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 12 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  navBtn: { padding: 4 },
  navArrow: { fontSize: 22, fontWeight: '300' },
  monthTitle: { fontSize: 15, fontWeight: '600' },
  weekRow: { flexDirection: 'row', marginBottom: 4 },
  dayHeader: { flex: 1, textAlign: 'center', fontSize: 11, fontWeight: '600' },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  dayCell: { width: `${100 / 7}%`, aspectRatio: 1, alignItems: 'center', justifyContent: 'center' },
  dayText: { fontSize: 12 },
});
