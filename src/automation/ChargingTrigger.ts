import * as Battery from 'expo-battery';
import { useDashboardStore } from '../store/dashboardStore';

let batterySubscription: Battery.Subscription | null = null;

export const startChargingTrigger = () => {
  if (batterySubscription) return;

  batterySubscription = Battery.addBatteryStateListener(({ batteryState }) => {
    if (batteryState === Battery.BatteryState.CHARGING) {
      checkAndTriggerChargingRules();
    }
  });

  // Also check immediately
  Battery.getBatteryStateAsync().then((state) => {
    if (state === Battery.BatteryState.CHARGING) {
      checkAndTriggerChargingRules();
    }
  });
};

export const stopChargingTrigger = () => {
  if (batterySubscription) {
    batterySubscription.remove();
    batterySubscription = null;
  }
};

const checkAndTriggerChargingRules = () => {
  const { dashboards, setActiveDashboard } = useDashboardStore.getState();

  // Find a dashboard that has an enabled charging automation rule
  for (const dash of dashboards) {
    const chargingRule = dash.automationRules.find((r) => r.trigger === 'charging' && r.enabled);
    if (chargingRule) {
      setActiveDashboard(dash.id);
      break; // Only trigger the first one we find
    }
  }
};
