// "Put Genesis on your phone": works out which steps to show, and keeps the browser's install offer
// (Android and desktop Chrome/Edge) so a button can show it later. Imported once from main.tsx so the offer isn't missed.

export type Platform = 'ios' | 'android' | 'desktop';

export function platformFrom(ua: string, maxTouchPoints = 0): Platform {
  if (/iPhone|iPad|iPod/i.test(ua)) return 'ios';
  // iPads ask for the desktop site and report themselves as a Mac with a touch screen.
  if (/Macintosh/i.test(ua) && maxTouchPoints > 1) return 'ios';
  if (/Android/i.test(ua)) return 'android';
  return 'desktop';
}

interface InstallOffer extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

let offer: InstallOffer | null = null;
const listeners = new Set<() => void>();
const changed = () => listeners.forEach((fn) => fn());

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault(); // we show our own, clearer button instead of the browser's mini bar
    offer = e as InstallOffer;
    changed();
  });
  window.addEventListener('appinstalled', () => { offer = null; changed(); });
}

export const canOfferInstall = () => offer !== null;
export function onInstallChange(fn: () => void) { listeners.add(fn); return () => { listeners.delete(fn); }; }

// Shows the browser's own "Install Genesis Heritage?" box. True if the person said yes.
export async function offerInstall(): Promise<boolean> {
  if (!offer) return false;
  const o = offer;
  offer = null;
  changed();
  await o.prompt();
  return (await o.userChoice).outcome === 'accepted';
}

// Already opened from the home screen icon.
export function isInstalled(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia?.('(display-mode: standalone)').matches || (navigator as Navigator & { standalone?: boolean }).standalone === true;
}
