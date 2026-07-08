import { create } from 'zustand';
import { ThemeTokens } from '../types';
import { BUILT_IN_THEMES, DEFAULT_THEME_ID, getThemeById } from '../constants/themes';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ─────────────────────────────────────────────────────────────────────────────
// Theme Store
// ─────────────────────────────────────────────────────────────────────────────

const ACTIVE_THEME_KEY = '@standbyme/active_theme_id';

interface ThemeState {
  activeThemeId: string;
  activeTheme: ThemeTokens;
  customThemes: ThemeTokens[];
  allThemes: ThemeTokens[];

  loadTheme: () => Promise<void>;
  setActiveTheme: (id: string) => Promise<void>;
  addCustomTheme: (theme: ThemeTokens) => Promise<void>;
  updateCustomTheme: (theme: ThemeTokens) => Promise<void>;
  deleteCustomTheme: (id: string) => Promise<void>;
  patchAccentColor: (dashboardThemeId: string, color: string) => void;
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  activeThemeId: DEFAULT_THEME_ID,
  activeTheme: getThemeById(DEFAULT_THEME_ID),
  customThemes: [],
  allThemes: BUILT_IN_THEMES,

  loadTheme: async () => {
    try {
      const stored = await AsyncStorage.getItem(ACTIVE_THEME_KEY);
      const id = stored ?? DEFAULT_THEME_ID;
      const { customThemes } = get();
      const all = [...BUILT_IN_THEMES, ...customThemes];
      const theme = all.find((t) => t.id === id) ?? BUILT_IN_THEMES[0];
      set({ activeThemeId: theme.id, activeTheme: theme });
    } catch {
      // Silently fall back to default
    }
  },

  setActiveTheme: async (id) => {
    const { allThemes } = get();
    const theme = allThemes.find((t) => t.id === id) ?? BUILT_IN_THEMES[0];
    set({ activeThemeId: theme.id, activeTheme: theme });
    await AsyncStorage.setItem(ACTIVE_THEME_KEY, theme.id);
  },

  addCustomTheme: async (theme) => {
    set((s) => ({
      customThemes: [...s.customThemes, theme],
      allThemes: [...BUILT_IN_THEMES, ...s.customThemes, theme],
    }));
  },

  updateCustomTheme: async (theme) => {
    set((s) => {
      const updated = s.customThemes.map((t) => (t.id === theme.id ? theme : t));
      const activeTheme = s.activeThemeId === theme.id ? theme : s.activeTheme;
      return {
        customThemes: updated,
        allThemes: [...BUILT_IN_THEMES, ...updated],
        activeTheme,
      };
    });
  },

  deleteCustomTheme: async (id) => {
    set((s) => {
      const updated = s.customThemes.filter((t) => t.id !== id);
      return {
        customThemes: updated,
        allThemes: [...BUILT_IN_THEMES, ...updated],
      };
    });
  },

  patchAccentColor: (dashboardThemeId, color) => {
    const { allThemes } = get();
    const base = allThemes.find((t) => t.id === dashboardThemeId) ?? BUILT_IN_THEMES[0];
    const patched: ThemeTokens = {
      ...base,
      accentColor: color,
      colors: { ...base.colors, accent: color },
    };
    set({ activeTheme: patched });
  },
}));
