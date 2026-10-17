// Where someone goes right after signing up. Someone who came from the "move from Ancestry" guide (?next=import)
// lands on the tree import instead of the general dashboard; someone buying or redeeming a gift goes back there. Remembered on this device, since an email confirmation
// link may open a new tab, and used once. The answer is kept for the rest of the visit, so a screen drawn twice
// still gets the same answer.
const KEY = 'genesis-next';
const PLACES: Record<string, string> = { import: '/dashboard?feature=tree-import', gift: '/gift', redeem: '/redeem' };
let taken: string | null | undefined;

/** Call on any page load: remembers ?next= if it names a known place. */
export function rememberNextStep(search = typeof window !== 'undefined' ? window.location.search : '') {
  try {
    const next = new URLSearchParams(search).get('next');
    if (next && PLACES[next]) localStorage.setItem(KEY, next);
  } catch { /* storage blocked: they land on the dashboard as usual */ }
}

/** The page to go to first after signing in, if one was remembered. Used once; the same answer for the rest of the visit. */
export function takeNextPath(): string | null {
  if (taken !== undefined) return taken;
  try {
    const next = localStorage.getItem(KEY);
    localStorage.removeItem(KEY);
    taken = next && PLACES[next] ? PLACES[next] : null;
  } catch { taken = null; }
  return taken;
}

/** The dashboard screen to open first, when the remembered page is one of them. */
export function takeNextFeature(): string | null {
  return takeNextPath()?.match(/^\/dashboard\?feature=([\w-]+)$/)?.[1] ?? null;
}
