// Languages for the app. English is the source text; a translation is looked up by the exact English string, so
// anything not yet translated simply shows in English. French (Canada) first; the choice is remembered per device.
import { useSyncExternalStore } from 'react';

export type Lang = 'en' | 'fr';
export const LANGS: { id: Lang; label: string }[] = [{ id: 'en', label: 'English' }, { id: 'fr', label: 'Français' }];
const KEY = 'genesis-lang';

function detect(): Lang {
  try {
    const saved = localStorage.getItem(KEY);
    if (saved === 'en' || saved === 'fr') return saved;
  } catch { /* storage blocked: fall back to the browser's language */ }
  try { return (navigator.language || '').toLowerCase().startsWith('fr') ? 'fr' : 'en'; } catch { return 'en'; }
}

let current: Lang = detect();
const listeners = new Set<() => void>();
// Bumped whenever what t() returns can change (language switched, French text arrived), so screens re-render.
let version = 0;
const changed = () => { version++; listeners.forEach((fn) => fn()); };

// The French text downloads only for people who use French, so the first page stays small for everyone else.
let FR: Record<string, string> | null = null;
let loading: Promise<void> | null = null;
export function loadFrench(): Promise<void> {
  loading ??= import('./i18n-fr').then((m) => { FR = m.FR; changed(); }, () => { loading = null; }); // offline: try again next time
  return loading;
}
if (current === 'fr') void loadFrench();

export const getLang = () => current;
export const locale = () => (current === 'fr' ? 'fr-CA' : 'en-CA');

export function setLang(lang: Lang) {
  current = lang;
  try { localStorage.setItem(KEY, lang); } catch { /* applies for this visit only */ }
  applyLang();
  if (lang === 'fr' && !FR) void loadFrench();
  changed();
}

export function applyLang() {
  if (typeof document !== 'undefined') document.documentElement.lang = locale();
}

/** Re-renders the component when the language changes; returns the current language. */
export function useLang(): Lang {
  useSyncExternalStore((fn) => { listeners.add(fn); return () => listeners.delete(fn); }, () => version, () => version);
  return current;
}

/** The text in the current language. `{name}` placeholders are filled from `vars`. */
export function t(english: string, vars?: Record<string, string | number>): string {
  let out = current === 'fr' ? FR?.[english] ?? english : english;
  if (vars) for (const [k, v] of Object.entries(vars)) out = out.split(`{${k}}`).join(String(v));
  return out;
}
