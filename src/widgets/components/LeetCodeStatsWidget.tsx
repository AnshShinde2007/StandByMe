import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import axios from 'axios';
import { Widget } from '../../types';
import { useTheme } from '../../theme/ThemeProvider';

interface Props { widget: Widget }

export const LeetCodeStatsWidget: React.FC<Props> = ({ widget }) => {
  const theme = useTheme();
  const settings = widget.settings as { username?: string; showEasy?: boolean; showMedium?: boolean; showHard?: boolean };
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<{ total: number; easy: number; medium: number; hard: number } | null>(null);

  const fetchStats = useCallback(async () => {
    if (!settings.username) {
      setError('Set username in settings');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      // Using a public API wrapper for LeetCode stats
      const res = await axios.get(`https://leetcode-stats-api.herokuapp.com/${settings.username}`);
      if (res.data.status === 'error') {
        setError(res.data.message || 'User not found');
        return;
      }
      
      setData({
        total: res.data.totalSolved,
        easy: res.data.easySolved,
        medium: res.data.mediumSolved,
        hard: res.data.hardSolved,
      });
    } catch {
      setError('Failed to fetch stats');
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
    return <View style={styles.center}><Text style={{ color: theme.colors.error, fontSize: 12, textAlign: 'center' }}>{error}</Text></View>;
  }

  if (!data) return null;

  return (
    <View style={[styles.container, { backgroundColor: 'transparent' }]}>
      <Text style={[styles.title, { color: theme.colors.textMuted }]}>LeetCode / {settings.username}</Text>
      
      <View style={styles.totalRow}>
        <Text style={[styles.totalNum, { color: theme.colors.text }]}>{data.total}</Text>
        <Text style={[styles.totalLabel, { color: theme.colors.textSubtle }]}> Solved</Text>
      </View>

      <View style={styles.statsList}>
        {settings.showEasy !== false && (
          <View style={styles.statRow}>
            <Text style={[styles.statLabel, { color: '#00b8a3' }]}>Easy</Text>
            <Text style={[styles.statNum, { color: theme.colors.text }, { fontVariant: ['tabular-nums'] }]}>{data.easy}</Text>
          </View>
        )}
        {settings.showMedium !== false && (
          <View style={styles.statRow}>
            <Text style={[styles.statLabel, { color: '#ffc01e' }]}>Medium</Text>
            <Text style={[styles.statNum, { color: theme.colors.text }, { fontVariant: ['tabular-nums'] }]}>{data.medium}</Text>
          </View>
        )}
        {settings.showHard !== false && (
          <View style={styles.statRow}>
            <Text style={[styles.statLabel, { color: '#ff375f' }]}>Hard</Text>
            <Text style={[styles.statNum, { color: theme.colors.text }, { fontVariant: ['tabular-nums'] }]}>{data.hard}</Text>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 14, justifyContent: 'center' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 12 },
  title: { fontSize: 11, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 },
  totalRow: { flexDirection: 'row', alignItems: 'flex-end', marginBottom: 16 },
  totalNum: { fontSize: 32, fontWeight: '700', lineHeight: 36 },
  totalLabel: { fontSize: 13, marginBottom: 4 },
  statsList: { gap: 6 },
  statRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  statLabel: { fontSize: 13, fontWeight: '600' },
  statNum: { fontSize: 14, fontWeight: '600' }
});
