import React from 'react';
import { View, Text, StyleSheet, Switch, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import { WidgetRegistry } from '../engine/WidgetRegistry';
import { useWidgetStore } from '../store/widgetStore';
import { useTheme } from '../theme/ThemeProvider';

interface Props {
  widgetId: string;
  dashboardId: string;
  onClose: () => void;
}

export const WidgetSettingsModal: React.FC<Props> = ({ widgetId, dashboardId, onClose }) => {
  const theme = useTheme();
  const widgets = useWidgetStore((s) => s.widgetsByDashboard[dashboardId] ?? []);
  const widget = widgets.find((w) => w.id === widgetId);
  const updateWidgetSettings = useWidgetStore((s) => s.updateWidgetSettings);

  if (!widget) return null;

  const definition = WidgetRegistry.get(widget.type);
  if (!definition || !definition.settings || definition.settings.length === 0) {
    return (
      <View style={[styles.modal, { backgroundColor: theme.colors.surface }]}>
        <Text style={{ color: theme.colors.textMuted }}>No settings available for this widget.</Text>
        <TouchableOpacity style={[styles.btn, { backgroundColor: theme.colors.surfaceAlt }]} onPress={onClose}>
          <Text style={{ color: theme.colors.text }}>Close</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleChange = (key: string, value: any) => {
    updateWidgetSettings(widgetId, dashboardId, { [key]: value });
  };

  return (
    <View style={[styles.modal, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.colors.text }]}>{definition.displayName} Settings</Text>
        <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
          <Text style={{ color: theme.colors.textMuted, fontSize: 18, fontWeight: '700' }}>✕</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {definition.settings.map((setting) => {
          const value = widget.settings[setting.id] ?? setting.defaultValue;

          if (setting.type === 'toggle') {
            return (
              <View key={setting.id} style={styles.row}>
                <Text style={[styles.label, { color: theme.colors.text }]}>{setting.label}</Text>
                <Switch
                  value={!!value}
                  onValueChange={(v) => handleChange(setting.id, v)}
                  trackColor={{ true: theme.colors.accent, false: theme.colors.border }}
                  thumbColor="#fff"
                />
              </View>
            );
          }

          if (setting.type === 'number') {
            return (
              <View key={setting.id} style={styles.inputRow}>
                <Text style={[styles.label, { color: theme.colors.text }]}>{setting.label}</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: theme.colors.surfaceAlt, color: theme.colors.text }]}
                  keyboardType="numeric"
                  value={String(value)}
                  onChangeText={(v) => {
                    const parsed = parseInt(v, 10);
                    if (!isNaN(parsed)) handleChange(setting.id, parsed);
                  }}
                />
              </View>
            );
          }

          if (setting.type === 'text' || setting.type === 'select') {
            return (
              <View key={setting.id} style={styles.inputRow}>
                <Text style={[styles.label, { color: theme.colors.text }]}>{setting.label}</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: theme.colors.surfaceAlt, color: theme.colors.text }]}
                  value={String(value)}
                  onChangeText={(v) => handleChange(setting.id, v)}
                />
              </View>
            );
          }

          return null;
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  modal: {
    position: 'absolute',
    top: '20%',
    left: '20%',
    right: '20%',
    bottom: '20%',
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 20,
    zIndex: 9999,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(150,150,150,0.1)',
  },
  title: { fontSize: 18, fontWeight: '700' },
  closeBtn: { padding: 4 },
  content: { padding: 16 },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  inputRow: {
    marginBottom: 16,
  },
  label: { fontSize: 15, fontWeight: '500', marginBottom: 8 },
  input: {
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
  },
  btn: { padding: 12, borderRadius: 8, alignItems: 'center', marginTop: 16 },
});
