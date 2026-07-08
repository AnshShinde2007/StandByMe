import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Widget, HabitEntry } from '../../types';
import { useTheme } from '../../theme/ThemeProvider';
import { getDb } from '../../db/schema';
import { format, subDays, isSameDay, parseISO } from 'date-fns';

interface Props { widget: Widget }

export const HabitTrackerWidget: React.FC<Props> = ({ widget }) => {
  const theme = useTheme();
  const [habits, setHabits] = useState<HabitEntry[]>([]);
  const settings = widget.settings as { showStreak?: boolean; showWeekView?: boolean };

  const loadHabits = async () => {
    const db = getDb();
    const rows = await db.getAllAsync<Record<string, unknown>>('SELECT * FROM habits WHERE widget_id = ?', [widget.id]);
    setHabits(rows.map(r => ({
      id: r.id as string,
      name: r.name as string,
      icon: r.icon as string,
      color: r.color as string,
      completedDates: JSON.parse((r.completed_dates as string) || '[]'),
      createdAt: r.created_at as string,
    })));
  };

  useEffect(() => {
    loadHabits();
    // In a real app we'd want a listener or context to update habits when edited, 
    // for MVP we load once and manage local state for toggling.
  }, [widget.id]);

  const toggleDate = async (habitId: string, dateStr: string) => {
    const habit = habits.find(h => h.id === habitId);
    if (!habit) return;
    
    const newDates = habit.completedDates.includes(dateStr)
      ? habit.completedDates.filter(d => d !== dateStr)
      : [...habit.completedDates, dateStr];

    // Optimistic update
    setHabits(habits.map(h => h.id === habitId ? { ...h, completedDates: newDates } : h));

    const db = getDb();
    await db.runAsync('UPDATE habits SET completed_dates = ? WHERE id = ?', [JSON.stringify(newDates), habitId]);
  };

  const today = format(new Date(), 'yyyy-MM-dd');
  const pastWeek = Array.from({ length: 7 }).map((_, i) => format(subDays(new Date(), 6 - i), 'yyyy-MM-dd'));

  const calculateStreak = (dates: string[]) => {
    if (dates.length === 0) return 0;
    let streak = 0;
    let curr = new Date();
    while (true) {
      const d = format(curr, 'yyyy-MM-dd');
      if (dates.includes(d)) {
        streak++;
        curr = subDays(curr, 1);
      } else {
        // If today is missed, but yesterday was done, it's still an active streak (just not extended today yet)
        if (streak === 0 && format(curr, 'yyyy-MM-dd') === today) {
          curr = subDays(curr, 1);
          continue;
        }
        break;
      }
    }
    return streak;
  };

  // If no habits, show placeholder
  if (habits.length === 0) {
    return (
      <View style={[styles.empty, { backgroundColor: 'transparent' }]}>
        <Text style={[styles.emptyIcon, { color: theme.colors.accent }]}>✓</Text>
        <Text style={[styles.emptyText, { color: theme.colors.textMuted }]}>No habits yet.{'\n'}Add them in settings.</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: 'transparent' }]}>
      <Text style={[styles.header, { color: theme.colors.text }]}>Habits</Text>
      <ScrollView showsVerticalScrollIndicator={false} style={styles.scroll}>
        {habits.map(habit => {
          const streak = calculateStreak(habit.completedDates);
          const isDoneToday = habit.completedDates.includes(today);

          return (
            <View key={habit.id} style={styles.habitRow}>
              <TouchableOpacity
                style={[styles.habitInfo, { backgroundColor: theme.colors.surfaceAlt, borderColor: isDoneToday ? habit.color : theme.colors.border, borderWidth: 1 }]}
                onPress={() => toggleDate(habit.id, today)}
              >
                <Text style={{ fontSize: 16 }}>{habit.icon === 'Star' ? '⭐' : habit.icon}</Text>
                <Text style={[styles.habitName, { color: theme.colors.text }]} numberOfLines={1}>{habit.name}</Text>
                {settings.showStreak !== false && (
                  <View style={[styles.streakBadge, { backgroundColor: theme.colors.surface }]}>
                    <Text style={[styles.streakText, { color: streak > 0 ? habit.color : theme.colors.textSubtle }]}>🔥 {streak}</Text>
                  </View>
                )}
              </TouchableOpacity>

              {settings.showWeekView !== false && (
                <View style={styles.weekGrid}>
                  {pastWeek.map(dayStr => {
                    const done = habit.completedDates.includes(dayStr);
                    const isToday = dayStr === today;
                    return (
                      <View
                        key={dayStr}
                        style={[
                          styles.dayDot,
                          {
                            backgroundColor: done ? habit.color : theme.colors.surfaceAlt,
                            borderColor: isToday ? theme.colors.border : 'transparent',
                            borderWidth: isToday ? 1 : 0
                          }
                        ]}
                      />
                    );
                  })}
                </View>
              )}
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 12 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyIcon: { fontSize: 32, marginBottom: 8 },
  emptyText: { fontSize: 13, textAlign: 'center', lineHeight: 18 },
  header: { fontSize: 14, fontWeight: '600', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 },
  scroll: { flex: 1 },
  habitRow: { marginBottom: 10 },
  habitInfo: { flexDirection: 'row', alignItems: 'center', padding: 8, borderRadius: 10, gap: 8 },
  habitName: { flex: 1, fontSize: 13, fontWeight: '500' },
  streakBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 10 },
  streakText: { fontSize: 10, fontWeight: '600' },
  weekGrid: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4, paddingHorizontal: 4 },
  dayDot: { width: 10, height: 10, borderRadius: 5 },
});
