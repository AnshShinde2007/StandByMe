import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { DashboardScreen } from '../screens/DashboardScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { WidgetPickerScreen } from '../screens/WidgetPickerScreen';
import { ThemeEditorScreen } from '../screens/ThemeEditorScreen';

// Main Stack Navigator 
// ─────────────────────────────────────────────────────────────────────────────

export type MainStackParamList = {
  Dashboard: undefined;
  Settings: undefined;
  WidgetPicker: { dashboardId: string };
  ThemeEditor: { dashboardId: string; themeId: string };
};

const Stack = createStackNavigator<MainStackParamList>();

export const MainNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        cardStyle: { backgroundColor: 'transparent' },
        presentation: 'modal',
        cardStyleInterpolator: ({ current }) => ({
          cardStyle: { opacity: current.progress },
        }),
      }}
    >
      <Stack.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{ presentation: 'card', animation: 'none' }}
      />
      <Stack.Screen name="Settings" component={SettingsScreen} />
      <Stack.Screen name="WidgetPicker" component={WidgetPickerScreen} />
      <Stack.Screen name="ThemeEditor" component={ThemeEditorScreen} />
    </Stack.Navigator>
  );
};
