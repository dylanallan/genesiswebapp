// Listen: stories and storybook chapters are read aloud with the device's voice, in Canadian French or English.
import { test, expect, type Page } from '@playwright/test';
import { installMockBackend, signIn, type MockState } from './support/mockBackend';

// A stand-in for the browser's speech engine that records what it was asked to say.
async function stubSpeech(page: Page) {
  await page.addInitScript(() => {
    const spoken: Array<{ text: string; lang: string }> = [];
    const queue: SpeechSynthesisUtterance[] = [];
    let paused = false;
    const tick = () => setTimeout(() => {
      if (paused) return;
      const u = queue.shift();
      if (!u) return;
      spoken.push({ text: u.text, lang: u.lang });
      setTimeout(() => { u.onend?.(new Event('end') as SpeechSynthesisEvent); tick(); }, 150);
    }, 0);
    class Utterance { text: string; lang = ''; voice = null; rate = 1; onend: ((e: Event) => void) | null = null; onerror = null; constructor(t: string) { this.text = t; } }
    Object.assign(window, { SpeechSynthesisUtterance: Utterance, __spoken: spoken, __queue: queue });
    Object.defineProperty(window, 'speechSynthesis', {
      value: {
        speak: (u: SpeechSynthesisUtterance) => { queue.push(u); if (queue.length === 1) tick(); },
        cancel: () => { queue.length = 0; },
        pause: () => { paused = true; },
        resume: () => { paused = false; tick(); },
        getVoices: () => [{ lang: 'fr-CA', name: 'Amélie' }, { lang: 'en-CA', name: 'Ava' }],
      },
    });
  });
}
const spoken = (page: Page) => page.evaluate(() => (window as unknown as { __spoken: Array<{ text: string; lang: string }> }).__spoken);

const story = {
  id: 's1', title: 'Les dimanches chez grand-maman', content: 'Chaque dimanche, toute la famille se réunissait. On mangeait de la tourtière.',
  storyteller: 'Rose', date_recorded: '2024-05-01', location: 'Québec', themes: [], language: '', translation: '', verification_status: 'unverified',
  created_at: '2024-05-01T00:00:00Z', updated_at: '2024-05-01T00:00:00Z',
};

test('a story is read aloud in Canadian French, with pause, resume and stop', async ({ page, context }) => {
  await context.addInitScript(() => localStorage.setItem('genesis-lang', 'fr'));
  await signIn(context);
  await stubSpeech(page);
  await installMockBackend(page, { subscribed: false, calls: [], chatQuotaExceeded: false, storyRows: [story] } as MockState);
  await page.goto('/dashboard?feature=cultural-stories');
  await page.getByRole('button', { name: 'Écouter' }).click();
  await expect(page.getByRole('status').filter({ hasText: 'Lecture à voix haute…' })).toBeVisible();
  await expect.poll(async () => (await spoken(page)).length).toBeGreaterThan(0);
  const first = (await spoken(page))[0];
  expect(first.lang).toBe('fr-CA');
  expect(first.text).toContain('Les dimanches chez grand-maman');

  await page.getByRole('button', { name: 'Pause' }).click();
  await expect(page.getByRole('button', { name: 'Reprendre' })).toBeVisible();
  await page.getByRole('button', { name: 'Reprendre' }).click();
  await page.getByRole('button', { name: 'Arrêter' }).click();
  await expect(page.getByRole('button', { name: 'Écouter' })).toBeVisible();
});

test('the whole storybook is read aloud in English, and a reading finishes by itself', async ({ page, context }) => {
  await signIn(context);
  await stubSpeech(page);
  await installMockBackend(page, {
    subscribed: false, calls: [], chatQuotaExceeded: false,
    storybookRows: [{ id: 'b1', title: 'The Tremblay Family Story', created_at: '2024-05-01T00:00:00Z', chapters: [
      { heading: 'Where we came from', body: 'The Tremblays farmed near Chicoutimi.' },
      { heading: 'Family stories', body: 'Grandpa told stories by the stove.' },
    ] }],
  } as MockState);
  await page.goto('/dashboard?feature=family-storybook');
  await page.getByRole('button', { name: /^The Tremblay Family Story/ }).click();
  await page.getByRole('button', { name: 'Listen to the whole book' }).click();
  // Every chapter is read, in order, and the button comes back when the book is done.
  await expect.poll(async () => (await spoken(page)).map((s) => s.text).join(' ')).toContain('by the stove');
  await expect(page.getByRole('button', { name: 'Listen to the whole book' })).toBeVisible({ timeout: 10000 });
  const said = await spoken(page);
  expect(said.every((s) => s.lang === 'en-CA')).toBe(true);
  const all = said.map((s) => s.text).join(' ');
  expect(all.indexOf('The Tremblay Family Story')).toBeLessThan(all.indexOf('Chicoutimi'));
  expect(all.indexOf('Chicoutimi')).toBeLessThan(all.indexOf('by the stove'));
  // Each chapter also has its own Listen button.
  await expect(page.getByRole('button', { name: 'Listen', exact: true })).toHaveCount(2);
});
