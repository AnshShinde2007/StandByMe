import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import axios from 'axios';
import { Widget } from '../../types';
import { useTheme } from '../../theme/ThemeProvider';

interface Props { widget: Widget }

export const GitHubStatsWidget: React.FC<Props> = ({ widget }) => {
  const theme = useTheme();
  const settings = widget.settings as { username?: string; showStreak?: boolean; showContribGraph?: boolean };
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<{ total: number; streak: number; graph: number[] } | null>(null);

  const fetchStats = useCallback(async () => {
    if (!settings.username) {
      setError('Set username in settings');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      // In a real app we'd parse the GitHub contribution SVG or use GraphQL API.
      // For MVP, we simulate a response after checking if user exists, since there's no official simple REST endpoint for streaks.
      await axios.get(`https://api.github.com/users/${settings.username}`);
      
      // Simulated contribution data for demo
      setData({
        total: Math.floor(Math.random() * 500) + 100,
        streak: Math.floor(Math.random() * 30),
        graph: Array.from({ length: 28 }).map(() => Math.floor(Math.random() * 5))
      });
    } catch {
      setError('User not found');
    } finally {
      setLoading(false);
    }
  }, [settings.username]);

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 60 * 60 * 1000); // 1 hour
    return () => clearInterval(interval);
  }, [fetchStats]);

  if (loading && !data) {
    return <View style={styles.center}><ActivityIndicator color={theme.colors.accent} /></View>;
  }

  if (error) {
    return <View style={styles.center}><Text style={{ color: theme.colors.error, fontSize: 12 }}>{error}</Text></View>;
  }

  if (!data) return null;

  return (
    <View style={[styles.container, { backgroundColor: 'transparent' }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.colors.text }]}>
          <Text style={{ color: theme.colors.accent }}>@</Text>{settings.username}
        </Text>
        <Text style={[styles.total, { color: theme.colors.textMuted }]}>{data.total} contribs</Text>
      </View>

      {settings.showStreak !== false && (
        <View style={styles.streakRow}>
          <Text style={[styles.streakIcon, { color: '#f59e0b' }]}>🔥</Text>
          <Text style={[styles.streakNum, { color: theme.colors.text }]}>{data.streak}</Text>
          <Text style={[styles.streakLabel, { color: theme.colors.textMuted }]}> Day Streak</Text>
        </View>
      )}

      {settings.showContribGraph !== false && (
        <View style={styles.graph}>
          {data.graph.map((level, i) => {
            let bg = theme.colors.surfaceAlt;
            if (level === 1) bg = '#0e4429';
            if (level === 2) bg = '#006d32';
            if (level === 3) bg = '#26a641';
            if (level === 4) bg = '#39d353';
            
            return (
              <View
                key={i}
                style={[
                  styles.cell,
                  { backgroundColor: bg, borderColor: theme.colors.border }
                ]}
              />
            );
          })}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 14, justifyContent: 'center' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  title: { fontSize: 14, fontWeight: '600' },
  total: { fontSize: 12 },
  streakRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  streakIcon: { fontSize: 18, marginRight: 6 },
  streakNum: { fontSize: 24, fontWeight: '700' },
  streakLabel: { fontSize: 13, alignSelf: 'flex-end', paddingBottom: 3 },
  graph: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  cell: { width: 12, height: 12, borderRadius: 2, borderWidth: 0.5 },
});
