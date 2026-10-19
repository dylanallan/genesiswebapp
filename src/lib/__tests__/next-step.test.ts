import { beforeEach, describe, expect, it, vi } from 'vitest';

// A small in-memory stand-in for the browser's localStorage (tests run without a browser).
const store = new Map<string, string>();
const localStorage = {
  getItem: (k: string) => store.get(k) ?? null, setItem: (k: string, v: string) => void store.set(k, v),
  removeItem: (k: string) => void store.delete(k), clear: () => store.clear(),
};
vi.stubGlobal('localStorage', localStorage);

describe('next step after signing up', () => {
  beforeEach(() => { vi.resetModules(); localStorage.clear(); });

  it('remembers a known place once, and gives the same answer for the rest of the visit', async () => {
    const m = await import('../next-step');
    m.rememberNextStep('?start=signup&next=import');
    expect(m.takeNextPath()).toBe('/dashboard?feature=tree-import');
    expect(m.takeNextFeature()).toBe('tree-import');
    expect(m.takeNextPath()).toBe('/dashboard?feature=tree-import');
    expect(localStorage.getItem('genesis-next')).toBeNull();
  });

  it('ignores unknown places, including built-in object names', async () => {
    const m = await import('../next-step');
    for (const bad of ['constructor', '__proto__', 'toString', 'https://evil.example']) m.rememberNextStep(`?next=${encodeURIComponent(bad)}`);
    expect(localStorage.getItem('genesis-next')).toBeNull();
    localStorage.setItem('genesis-next', 'constructor');
    expect(m.takeNextPath()).toBeNull();
  });
});
