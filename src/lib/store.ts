import { atom } from 'jotai';

export interface ColorScheme {
  name: string;
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  text: string;
}

export const defaultColorSchemes: ColorScheme[] = [
  {
    name: 'Light',
    primary: '#3b82f6',
    secondary: '#6b7280',
    accent: '#f59e0b',
    background: '#ffffff',
    text: '#1f2937'
  },
  {
    name: 'Dark',
    primary: '#60a5fa',
    secondary: '#9ca3af',
    accent: '#fbbf24',
    background: '#1f2937',
    text: '#f3f4f6'
  }
];

export interface LMSState {
  currentCourse: string | null;
  currentLesson: string | null;
  progress: Record<string, number>;
}

export const lmsStateAtom = atom<LMSState>({
  currentCourse: null,
  currentLesson: null,
  progress: {}
});

export const userPreferencesAtom = atom<Record<string, any>>({});
export const systemStateAtom = atom<Record<string, any>>({});