import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, useWindowDimensions } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { MainStackParamList } from '../navigation/MainNavigator';
import { useTheme } from '../theme/ThemeProvider';
import { useThemeStore } from '../store/themeStore';
import { useDashboardStore } from '../store/dashboardStore';

// Removed static height

type Nav = StackNavigationProp<MainStackParamList, 'ThemeEditor'>;
type Route = RouteProp<MainStackParamList, 'ThemeEditor'>;

export const ThemeEditorScreen: React.FC = () => {
  const nav = useNavigation<Nav>();
  const route = useRoute<Route>();
  const activeTheme = useTheme();
  const { height } = useWindowDimensions();
  
  const allThemes = useThemeStore((s) => s.allThemes);
  const setActiveTheme = useThemeStore((s) => s.setActiveTheme);
  const updateDashboard = useDashboardStore((s) => s.updateDashboard);
  const getActiveDashboard = useDashboardStore((s) => s.getActiveDashboard);
  
  const dashboard = getActiveDashboard();

  const handleSelectTheme = async (themeId: string) => {
    await setActiveTheme(themeId);
    if (dashboard) {
      await updateDashboard({ ...dashboard, themeId });
    }
  };

  return (
    <View style={styles.modalBg}>
      <TouchableOpacity style={styles.backdrop} onPress={() => nav.goBack()} activeOpacity={1} />
      
      <View style={[styles.sheet, { height: height * 0.7, backgroundColor: activeTheme.colors.background, borderColor: activeTheme.colors.border }]}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: activeTheme.colors.text }]}>Dashboard Theme</Text>
          <TouchableOpacity onPress={() => nav.goBack()} style={styles.closeBtn}>
            <Text style={[styles.closeIcon, { color: activeTheme.colors.textMuted }]}>✕</Text>
          </TouchableOpacity>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          <Text style={[styles.sectionTitle, { color: activeTheme.colors.textMuted }]}>Presets</Text>
          
          <View style={styles.themeGrid}>
            {allThemes.map((theme) => {
              const isSelected = theme.id === activeTheme.id;
              return (
                <TouchableOpacity
                  key={theme.id}
                  style={[
                    styles.themeCard,
                    { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
                    isSelected && { borderColor: activeTheme.colors.accent, borderWidth: 2 },
                  ]}
                  onPress={() => handleSelectTheme(theme.id)}
                  activeOpacity={0.8}
                >
                  <View style={[styles.themePreview, { backgroundColor: theme.colors.background }]}>
                    <View style={[styles.previewBar, { backgroundColor: theme.colors.accent, width: '70%' }]} />
                    <View style={[styles.previewBar, { backgroundColor: theme.colors.textMuted, width: '50%' }]} />
                    <View style={{ flexDirection: 'row', gap: 4, marginTop: 4 }}>
                      <View style={[styles.previewChip, { backgroundColor: theme.colors.surface }]} />
                      <View style={[styles.previewChip, { backgroundColor: theme.colors.accentMuted }]} />
                    </View>
                  </View>
                  <Text style={[styles.themeName, { color: theme.colors.text }]}>{theme.name}</Text>
                  {isSelected && (
                    <View style={[styles.checkmark, { backgroundColor: activeTheme.colors.accent }]}>
                      <Text style={{ color: '#fff', fontSize: 10, fontWeight: '700' }}>✓</Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>

          {/* In a fuller version, we'd add customisation sliders here for blur, opacity, corner radius, etc. */}
          
        </ScrollView>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  modalBg: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)' },
  sheet: { 
    borderTopLeftRadius: 24, 
    borderTopRightRadius: 24, 
    borderTopWidth: 1,
    overflow: 'hidden'
  },
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    padding: 20, 
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(150,150,150,0.2)'
  },
  title: { fontSize: 20, fontWeight: '700' },
  closeBtn: { padding: 8 },
  closeIcon: { fontSize: 18, fontWeight: '600' },
  scrollContent: { padding: 20, paddingBottom: 40 },
  sectionTitle: { fontSize: 13, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 16 },
  themeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  themeCard: {
    width: '48%',
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    position: 'relative',
  },
  themePreview: {
    height: 60,
    borderRadius: 8,
    padding: 8,
    marginBottom: 8,
    gap: 4,
  },
  previewBar: { height: 6, borderRadius: 3 },
  previewChip: { height: 16, flex: 1, borderRadius: 4 },
  themeName: { fontSize: 14, fontWeight: '600', textAlign: 'center' },
  checkmark: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
