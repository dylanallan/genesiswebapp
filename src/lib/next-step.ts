// Where someone goes right after signing up. Someone who came from the "move from Ancestry" guide (?next=import)
// lands on the tree import instead of the general dashboard. Remembered on this device, since an email confirmation
// link may open a new tab, and used once. The answer is kept for the rest of the visit, so a screen drawn twice
// still gets the same answer.
const KEY = 'genesis-next';
const PLACES: Record<string, string> = { import: 'tree-import' };
let taken: string | null | undefined;

/** Call on any page load: remembers ?next= if it names a known place. */
export function rememberNextStep(search = typeof window !== 'undefined' ? window.location.search : '') {
  try {
    const next = new URLSearchParams(search).get('next');
    if (next && PLACES[next]) localStorage.setItem(KEY, next);
  } catch { /* storage blocked: they land on the dashboard as usual */ }
}

/** The dashboard screen to open first after signing in, if one was remembered. Used once. */
export function takeNextFeature(): string | null {
  if (taken !== undefined) return taken;
  try {
    const next = localStorage.getItem(KEY);
    localStorage.removeItem(KEY);
    taken = next && PLACES[next] ? PLACES[next] : null;
  } catch { taken = null; }
  return taken;
}
