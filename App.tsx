import { registerRootComponent } from 'expo';
import React from 'react';
import { useKeepAwake } from 'expo-keep-awake';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppNavigator } from './src/navigation/AppNavigator';
import { ThemeProvider } from './src/theme/ThemeProvider';
import { useAutomationEngine } from './src/automation/AutomationEngine';

function AppContent() {
  useAutomationEngine();
  return <AppNavigator />;
}

import { GestureHandlerRootView } from 'react-native-gesture-handler';

export default function App() {
  useKeepAwake();
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider>
          <AppContent />
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

registerRootComponent(App);
