import React, { createContext, useContext } from 'react';
import { ThemeTokens } from '../types';
import { BUILT_IN_THEMES } from '../constants/themes';
import { useThemeStore } from '../store/themeStore';

// ─────────────────────────────────────────────────────────────────────────────
// Theme Context
// ─────────────────────────────────────────────────────────────────────────────

const ThemeContext = createContext<ThemeTokens>(BUILT_IN_THEMES[0]);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const theme = useThemeStore((s) => s.activeTheme);
  return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>;
};

export const useTheme = (): ThemeTokens => useContext(ThemeContext);
