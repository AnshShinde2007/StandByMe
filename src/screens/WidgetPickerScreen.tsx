import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, useWindowDimensions } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { MainStackParamList } from '../navigation/MainNavigator';
import { useTheme } from '../theme/ThemeProvider';
import { WIDGET_CATEGORIES, getWidgetsByCategory } from '../constants/widgets';
import { useWidgetStore } from '../store/widgetStore';
import { WIDGET_SIZE_COLORS } from '../engine/types';

// Removed static height

type Nav = StackNavigationProp<MainStackParamList, 'WidgetPicker'>;
type Route = RouteProp<MainStackParamList, 'WidgetPicker'>;

export const WidgetPickerScreen: React.FC = () => {
  const nav = useNavigation<Nav>();
  const route = useRoute<Route>();
  const theme = useTheme();
  const { height } = useWindowDimensions();
  const addWidget = useWidgetStore((s) => s.addWidget);
  
  const dashboardId = route.params.dashboardId;

  const handleAdd = async (type: any) => {
    // Add widget to 0,0 - it will snap to the next available space (or overlap for MVP, user can drag it)
    await addWidget(dashboardId, type, 0, 0);
    nav.goBack();
  };

  return (
    <View style={styles.modalBg}>
      <TouchableOpacity style={styles.backdrop} onPress={() => nav.goBack()} activeOpacity={1} />
      
      <View style={[styles.sheet, { height: height * 0.85, backgroundColor: theme.colors.background, borderColor: theme.colors.border }]}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.colors.text }]}>Add Widget</Text>
          <TouchableOpacity onPress={() => nav.goBack()} style={styles.closeBtn}>
            <Text style={[styles.closeIcon, { color: theme.colors.textMuted }]}>✕</Text>
          </TouchableOpacity>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          {WIDGET_CATEGORIES.map((cat) => {
            const widgets = getWidgetsByCategory(cat.id);
            if (widgets.length === 0) return null;
            
            return (
              <View key={cat.id} style={styles.categoryBlock}>
                <View style={styles.catHeader}>
                  <Text style={[styles.catIcon, { color: theme.colors.accent }]}>{cat.icon}</Text>
                  <Text style={[styles.catTitle, { color: theme.colors.text }]}>{cat.label}</Text>
                </View>
                
                <View style={styles.widgetGrid}>
                  {widgets.map((w) => (
                    <TouchableOpacity
                      key={w.type}
                      style={[styles.widgetCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
                      onPress={() => handleAdd(w.type)}
                      activeOpacity={0.7}
                    >
                      <View style={[styles.wIconWrap, { backgroundColor: theme.colors.surfaceAlt }]}>
                        {/* We use emojis or simple text since Lucide requires more setup, for MVP we use basic string icons defined in registry or simple fallbacks */}
                        <Text style={{ fontSize: 24, color: theme.colors.accent }}>✨</Text>
                      </View>
                      <View style={styles.wInfo}>
                        <Text style={[styles.wName, { color: theme.colors.text }]} numberOfLines={1}>{w.displayName}</Text>
                        <View style={[styles.sizeBadge, { backgroundColor: WIDGET_SIZE_COLORS[(w as any).size as import('../engine/types').WidgetSize] ?? '#6366f1' }]}>
                          <Text style={styles.sizeBadgeText}>{(w as any).size ?? 'SMALL'}</Text>
                        </View>
                      </View>
                      <Text style={[styles.wDesc, { color: theme.colors.textSubtle }]} numberOfLines={2}>
                        {w.description}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            );
          })}
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
  categoryBlock: { marginBottom: 24 },
  catHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  catIcon: { fontSize: 16 },
  catTitle: { fontSize: 16, fontWeight: '600' },
  widgetGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  widgetCard: { 
    width: '48%', 
    padding: 12, 
    borderRadius: 16, 
    borderWidth: 1 
  },
  wIconWrap: { width: 48, height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  wInfo: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  wName: { fontSize: 14, fontWeight: '600', flex: 1 },
  sizeBadge: { borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2, marginLeft: 6 },
  sizeBadgeText: { fontSize: 10, fontWeight: '700', color: '#fff' },
  wDesc: { fontSize: 12, lineHeight: 16 },
});
