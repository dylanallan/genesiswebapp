import { atom } from 'jotai';

interface CacheConfig {
  ttl: number;
  maxSize: number;
}

export interface ColorScheme {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  text: string;
}

export const defaultColorSchemes: Record<'light' | 'dark', ColorScheme> = {
  light: {
    primary: '#3B82F6',
    secondary: '#6B7280',
    accent: '#10B981',
    background: '#FFFFFF',
    text: '#1F2937'
  },
  dark: {
    primary: '#60A5FA',
    secondary: '#9CA3AF',
    accent: '#34D399',
    background: '#111827',
    text: '#F9FAFB'
  }
};

class Cache<T> {
  private store: Map<string, { value: T; timestamp: number }>;
  private config: CacheConfig;

  constructor(config: CacheConfig) {
    this.store = new Map();
    this.config = config;
  }

  set(key: string, value: T): void {
    this.cleanup();
    this.store.set(key, {
      value,
      timestamp: Date.now()
    });
  }

  get(key: string): T | null {
    const item = this.store.get(key);
    if (!item) return null;

    if (Date.now() - item.timestamp > this.config.ttl) {
      this.store.delete(key);
      return null;
    }

    return item.value;
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, item] of this.store.entries()) {
      if (now - item.timestamp > this.config.ttl) {
        this.store.delete(key);
      }
    }

    if (this.store.size > this.config.maxSize) {
      const oldest = Array.from(this.store.entries())
        .sort(([, a], [, b]) => a.timestamp - b.timestamp)
        .slice(0, this.store.size - this.config.maxSize);

      for (const [key] of oldest) {
        this.store.delete(key);
      }
    }
  }
}

export const responseCache = new Cache<string>({
  ttl: 1000 * 60 * 60, // 1 hour
  maxSize: 1000
});

export const userPreferencesAtom = atom<{
  theme: 'light' | 'dark';
  colorScheme: ColorScheme;
}>({
  theme: 'light',
  colorScheme: defaultColorSchemes.light
});

export const systemStateAtom = atom<Record<string, any>>({});