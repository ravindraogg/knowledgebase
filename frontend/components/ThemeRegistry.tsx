'use client';
import React, { createContext, useContext } from 'react';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { AppRouterCacheProvider } from '@mui/material-nextjs/v16-appRouter';
import { getMuiTheme } from '../lib/theme';

const ThemeContext = createContext({ mode: 'light' as const, toggleTheme: () => {} });
export function ThemeRegistry({ children }: { children: React.ReactNode }) {
  return (
    <AppRouterCacheProvider>
      <ThemeContext.Provider value={{ mode: 'light', toggleTheme: () => {} }}>
        <ThemeProvider theme={getMuiTheme()}>
          <CssBaseline />
          {children}
        </ThemeProvider>
      </ThemeContext.Provider>
    </AppRouterCacheProvider>
  );
}
export function useThemeContext() { return useContext(ThemeContext); }
