import { atom } from 'jotai';

export interface ColorScheme {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  text: string;
  border: string;
}

export const defaultColorSchemes: Record<'light' | 'dark', ColorScheme> = {
  light: {
    primary: '#ffffff',
    secondary: '#f1f5f9',
    accent: '#3b82f6',
    background: '#f8fafc',
    text: '#1e293b',
    border: '#e2e8f0'
  },
  dark: {
    primary: '#1e293b',
    secondary: '#334155',
    accent: '#3b82f6',
    background: '#0f172a',
    text: '#f8fafc',
    border: '#475569'
  }
};

export interface UserPreferences {
  theme: 'light' | 'dark';
  colorScheme: ColorScheme;
}

export const userPreferencesAtom = atom<UserPreferences>({
  theme: 'light',
  colorScheme: defaultColorSchemes.light
});

export const systemStateAtom = atom<Record<string, any>>({});