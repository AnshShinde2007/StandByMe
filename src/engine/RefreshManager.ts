import { useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';

type Subscriber = {
  id: number;
  intervalMs: number;
  callback: () => void;
  lastTick: number;
};

class RefreshManagerService {
  private subscribers: Map<number, Subscriber> = new Map();
  private nextId = 1;
  private timer: ReturnType<typeof setInterval> | null = null;
  private isActive = true;

  constructor() {
    AppState.addEventListener('change', this.handleAppStateChange);
    this.start();
  }

  private handleAppStateChange = (nextAppState: AppStateStatus) => {
    this.isActive = nextAppState === 'active';
    if (this.isActive) {
      this.start();
    } else {
      this.stop();
    }
  };

  private start() {
    if (this.timer) return;
    this.timer = setInterval(this.tick, 1000);
  }

  private stop() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  private tick = () => {
    if (!this.isActive) return;
    const now = Date.now();
    this.subscribers.forEach((sub) => {
      if (now - sub.lastTick >= sub.intervalMs) {
        sub.callback();
        sub.lastTick = now;
      }
    });
  };

  subscribe(intervalMs: number, callback: () => void): number {
    const id = this.nextId++;
    this.subscribers.set(id, { id, intervalMs, callback, lastTick: Date.now() });
    
    // Call immediately on subscribe
    callback();
    
    return id;
  }

  unsubscribe(id: number) {
    this.subscribers.delete(id);
  }
}

export const RefreshManager = new RefreshManagerService();

export const useWidgetRefresh = (intervalMs: number, callback: () => void) => {
  const savedCallback = useRef(callback);

  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    const id = RefreshManager.subscribe(intervalMs, () => {
      savedCallback.current();
    });
    return () => RefreshManager.unsubscribe(id);
  }, [intervalMs]);
};
