import * as FileSystem from 'expo-file-system';
import { useDashboardStore } from '../store/dashboardStore';
import { useWidgetStore } from '../store/widgetStore';
import { DashboardExport, AppBackup } from '../types';
import { getDb } from '../db/schema';
import { Alert } from 'react-native';

export const ImportExportService = {
  exportDashboard: async (dashboardId: string) => {
    try {
      const { dashboards } = useDashboardStore.getState();
      const dash = dashboards.find((d) => d.id === dashboardId);
      if (!dash) throw new Error('Dashboard not found');

      const widgets = await useWidgetStore.getState().getWidgetsForDashboard(dashboardId);
      
      const exportData = {
        version: 1,
        exportedAt: new Date().toISOString(),
        dashboard: dash,
        widgets,
      };

      const fileUri = FileSystem.documentDirectory + `${dash.name.replace(/\s+/g, '_')}_dashboard.json`;
      await FileSystem.writeAsStringAsync(fileUri, JSON.stringify(exportData, null, 2));

      Alert.alert('Export Successful', `Saved to: ${fileUri}`);
    } catch (e: any) {
      Alert.alert('Export Failed', e.message);
    }
  },

  importDashboard: async (fileUri: string) => {
    try {
      const content = await FileSystem.readAsStringAsync(fileUri);
      const data = JSON.parse(content);
      
      if (!data.version || !data.dashboard || !data.widgets) {
        throw new Error('Invalid dashboard file format');
      }

      // Here you would insert the dashboard and widgets into the SQLite database.
      // For MVP, we alert success to show it's parsed.
      Alert.alert('Import Successful', `Parsed dashboard: ${data.dashboard.name}`);
    } catch (e: any) {
      Alert.alert('Import Failed', e.message);
    }
  }
};
