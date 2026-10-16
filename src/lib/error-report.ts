// Sends a short note to our database when something breaks in a person's browser, so we can fix it without
// waiting for them to tell us. Signed-in people only; the database caps how many reports one person can send.
import { supabase } from './supabase';

const IGNORE = [/ResizeObserver loop/i, /Loading chunk \d+ failed/i, /^Script error\.?$/i, /AbortError/i];
const sent = new Set<string>();

export function reportError(error: unknown, location?: string): void {
  try {
    const message = (error instanceof Error ? `${error.name}: ${error.message}` : String(error ?? '')).slice(0, 500);
    if (!message || IGNORE.some((r) => r.test(message)) || sent.has(message) || sent.size >= 20) return;
    sent.add(message);
    const stack = error instanceof Error && error.stack ? error.stack.split('\n').slice(0, 6).join('\n') : '';
    void supabase.rpc('report_client_error', {
      p_message: message,
      p_location: [location, stack].filter(Boolean).join('\n').slice(0, 2000) || null,
      p_page: `${window.location.pathname}${window.location.search}`.slice(0, 300),
      p_user_agent: navigator.userAgent.slice(0, 300),
    }).then(() => undefined, () => undefined);
  } catch {
    // Reporting must never cause a problem of its own.
  }
}

let installed = false;
export function installErrorReporting(): void {
  if (installed) return;
  installed = true;
  window.addEventListener('error', (e) => reportError(e.error ?? e.message, 'window'));
  window.addEventListener('unhandledrejection', (e) => reportError(e.reason, 'promise'));
}
