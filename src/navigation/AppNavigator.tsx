import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { View, ActivityIndicator } from 'react-native';
import { initDb } from '../db/schema';
import { useDashboardStore } from '../store/dashboardStore';
import { useThemeStore } from '../store/themeStore';
import { MainNavigator } from './MainNavigator';
import { OnboardingScreen } from '../screens/OnboardingScreen';

// ─────────────────────────────────────────────────────────────────────────────
// Root Navigator
// ─────────────────────────────────────────────────────────────────────────────

const ONBOARDING_DONE_KEY = '@standbyme/onboarding_done';

export type RootStackParamList = {
  Onboarding: undefined;
  Main: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();

export const AppNavigator: React.FC = () => {
  const [isReady, setIsReady] = useState(false);
  const [onboardingDone, setOnboardingDone] = useState(false);

  const loadDashboards = useDashboardStore((s) => s.loadDashboards);
  const loadTheme = useThemeStore((s) => s.loadTheme);

  useEffect(() => {
    const init = async () => {
      try {
        await initDb();
        await Promise.all([loadDashboards(), loadTheme()]);
        const done = await AsyncStorage.getItem(ONBOARDING_DONE_KEY);
        setOnboardingDone(done === 'true');
      } catch (e) {
        console.error('App init error:', e);
      } finally {
        setIsReady(true);
      }
    };
    init();
  }, []);

  if (!isReady) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0a0a0f', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!onboardingDone ? (
          <Stack.Screen
            name="Onboarding"
            component={OnboardingScreen}
            options={{ gestureEnabled: false }}
          />
        ) : null}
        <Stack.Screen name="Main" component={MainNavigator} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};
