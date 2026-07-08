import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { MainStackParamList } from '../navigation/MainNavigator';
import { useTheme } from '../theme/ThemeProvider';
import { useDashboardStore } from '../store/dashboardStore';
import { Dashboard } from '../types';

type Nav = StackNavigationProp<MainStackParamList, 'Settings'>;

export const SettingsScreen: React.FC = () => {
  const nav = useNavigation<Nav>();
  const theme = useTheme();
  const dashboards = useDashboardStore((s) => s.dashboards);
  const createDashboard = useDashboardStore((s) => s.createDashboard);
  const deleteDashboard = useDashboardStore((s) => s.deleteDashboard);
  const setActiveDashboard = useDashboardStore((s) => s.setActiveDashboard);
  const activeDashboardId = useDashboardStore((s) => s.activeDashboardId);

  const [newDashName, setNewDashName] = useState('');

  const handleCreate = async () => {
    if (!newDashName.trim()) return;
    await createDashboard(newDashName.trim());
    setNewDashName('');
  };

  const handleDelete = (dash: Dashboard) => {
    if (dashboards.length <= 1) {
      Alert.alert('Cannot Delete', 'You must have at least one dashboard.');
      return;
    }
    Alert.alert('Delete Dashboard', `Are you sure you want to delete "${dash.name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteDashboard(dash.id) }
    ]);
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={[styles.header, { borderBottomColor: theme.colors.border }]}>
        <TouchableOpacity onPress={() => nav.goBack()} style={styles.backBtn}>
          <Text style={[styles.backIcon, { color: theme.colors.text }]}>←</Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: theme.colors.text }]}>Settings</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView style={styles.content}>
        
        {/* Dashboards Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.accent }]}>My Dashboards</Text>
          
          <View style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
            {dashboards.map((dash, i) => (
              <View key={dash.id} style={[styles.dashRow, { borderBottomColor: theme.colors.border, borderBottomWidth: i < dashboards.length - 1 ? StyleSheet.hairlineWidth : 0 }]}>
                <TouchableOpacity style={styles.dashInfo} onPress={() => setActiveDashboard(dash.id)}>
                  <Text style={[styles.dashName, { color: theme.colors.text }]}>{dash.name}</Text>
                  {dash.id === activeDashboardId && (
                    <View style={[styles.activeBadge, { backgroundColor: theme.colors.accentMuted }]}>
                      <Text style={[styles.activeText, { color: theme.colors.accent }]}>Active</Text>
                    </View>
                  )}
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleDelete(dash)} style={styles.actionBtn}>
                  <Text style={[styles.actionIcon, { color: theme.colors.error }]}>✕</Text>
                </TouchableOpacity>
              </View>
            ))}
            
            <View style={[styles.createRow, { borderTopColor: theme.colors.border }]}>
              <TextInput
                style={[styles.input, { color: theme.colors.text }]}
                value={newDashName}
                onChangeText={setNewDashName}
                placeholder="New Dashboard Name..."
                placeholderTextColor={theme.colors.textSubtle}
              />
              <TouchableOpacity style={[styles.addBtn, { backgroundColor: theme.colors.accent }]} onPress={handleCreate}>
                <Text style={[styles.addBtnText, { color: theme.colors.onAccent }]}>Add</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Automations Section Placeholder */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.accent }]}>Automations</Text>
          <View style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border, padding: 16 }]}>
            <Text style={{ color: theme.colors.textMuted, fontSize: 13, lineHeight: 20 }}>
              Automations allow you to launch specific dashboards automatically when charging, connecting to Wi-Fi, or at scheduled times. (Coming soon in MVP extension)
            </Text>
          </View>
        </View>

        {/* Global Settings */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.accent }]}>App</Text>
          <View style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
            <TouchableOpacity style={[styles.dashRow, { borderBottomColor: theme.colors.border, borderBottomWidth: StyleSheet.hairlineWidth }]}>
              <Text style={[styles.dashName, { color: theme.colors.text }]}>Export All Dashboards</Text>
              <Text style={{ color: theme.colors.textMuted }}>→</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.dashRow}>
              <Text style={[styles.dashName, { color: theme.colors.text }]}>Import Dashboard</Text>
              <Text style={{ color: theme.colors.textMuted }}>→</Text>
            </TouchableOpacity>
          </View>
        </View>

      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 8, paddingTop: 44, paddingBottom: 16, borderBottomWidth: StyleSheet.hairlineWidth },
  backBtn: { padding: 8, width: 44, alignItems: 'center' },
  backIcon: { fontSize: 24, fontWeight: '300' },
  title: { fontSize: 18, fontWeight: '600' },
  content: { flex: 1, padding: 16 },
  section: { marginBottom: 32 },
  sectionTitle: { fontSize: 13, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12, marginLeft: 4 },
  card: { borderRadius: 16, borderWidth: 1, overflow: 'hidden' },
  dashRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16 },
  dashInfo: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  dashName: { fontSize: 16, fontWeight: '500' },
  activeBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  activeText: { fontSize: 11, fontWeight: '600' },
  actionBtn: { padding: 4 },
  actionIcon: { fontSize: 16, fontWeight: '700' },
  createRow: { flexDirection: 'row', alignItems: 'center', padding: 12, borderTopWidth: StyleSheet.hairlineWidth, gap: 12 },
  input: { flex: 1, fontSize: 15, paddingVertical: 8, paddingHorizontal: 12 },
  addBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10 },
  addBtnText: { fontSize: 13, fontWeight: '600' },
});
