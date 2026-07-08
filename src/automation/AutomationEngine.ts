import { useEffect } from 'react';
import { startChargingTrigger, stopChargingTrigger } from './ChargingTrigger';
// Schedule and other triggers would be imported here

export const useAutomationEngine = () => {
  useEffect(() => {
    // Start all automation listeners
    startChargingTrigger();
    
    // Cleanup on unmount
    return () => {
      stopChargingTrigger();
    };
  }, []);
};
