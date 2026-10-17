// The app in French: each translated screen shows French, and no sentence that has a French version is left in English.
import { test, expect, type Page } from '@playwright/test';
import { installMockBackend, signIn, type MockState } from './support/mockBackend';
import { FR } from '../src/lib/i18n-fr';

// A fresh mock for each test, so one screen's actions never change what the next one sees.
const fresh = (): MockState => ({
  subscribed: false, calls: [], chatQuotaExceeded: false,
  memoryRequest: { token: 'aaaabbbbccccddddeeeeffff00001111', view: { from_name: 'Dylan', relative_name: 'Mamie Rose', questions: ['Où avez-vous grandi ?'], answered: [], closed: false } },
});

// English sentences that should have been translated (short words like "Pro" or names are fine either way).
async function leftoverEnglish(page: Page): Promise<string[]> {
  const text = await page.locator('body').innerText();
  return Object.keys(FR).filter((en) => en.length > 24 && !en.includes('{') && text.includes(en));
}

test.beforeEach(async ({ context }) => {
  await context.addInitScript(() => localStorage.setItem('genesis-lang', 'fr'));
});

test('home page in French', async ({ page }) => {
  await installMockBackend(page, fresh());
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Ancestry vous donne les bases. Genesis vous emmène dans le voyage.');
  await expect(page.getByRole('button', { name: 'M’inscrire à la liste d’attente' })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.lang)).toBe('fr-CA');
  expect(await leftoverEnglish(page)).toEqual([]);
  // The switch goes back to English and is remembered.
  await page.getByRole('button', { name: /Langue: English/ }).click();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Ancestry gives you the foundation, but Genesis takes you on the journey.');
});

test('sign-up in French', async ({ page }) => {
  await installMockBackend(page, fresh());
  await page.goto('/');
  await page.getByRole('button', { name: 'Commencez l’histoire de votre famille, gratuitement' }).first().click();
  await expect(page.getByRole('button', { name: 'Créer mon compte' })).toBeVisible();
  await expect(page.getByLabel('Mot de passe')).toBeVisible();
  expect(await leftoverEnglish(page)).toEqual([]);
});

test('menus in French when signed in', async ({ page, context }) => {
  await signIn(context);
  await installMockBackend(page, fresh());
  await page.goto('/dashboard?feature=family-tree-chart');
  await expect(page.getByTestId('category-menu').getByRole('button', { name: 'Ma famille' })).toBeVisible();
  await expect(page.getByTestId('feature-menu').getByRole('button', { name: 'Arbre généalogique' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Tableau de bord' })).toBeVisible();
});

test('a relative’s answer page in French', async ({ page }) => {
  await installMockBackend(page, fresh());
  await page.goto('/memories/aaaabbbbccccddddeeeeffff00001111');
  await expect(page.getByRole('heading', { name: 'Bonjour Mamie Rose' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Enregistrer ma réponse' })).toBeVisible();
  expect(await leftoverEnglish(page)).toEqual([]);
});

// The inside screens: each opens in French with no translated sentence left in English.
for (const feature of ['welcome', 'family-tree', 'family-tree-chart', 'cultural-stories', 'family-interview', 'ask-relative', 'record-hints', 'tree-checkup', 'my-account', 'privacy-center', 'life-story', 'family-map', 'photo-restore', 'heritage-mix', 'family-facts', 'family-search', 'family-sharing']) {
  test(`${feature} in French`, async ({ page, context }) => {
    await signIn(context);
    await installMockBackend(page, fresh());
    await page.goto(`/dashboard?feature=${feature}`);
    await expect(page.getByTestId('feature-menu')).toBeVisible();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(800);
    expect(await leftoverEnglish(page)).toEqual([]);
  });
}

// The privacy policy and terms, signed out, read entirely in French.
for (const [path, heading] of [['/privacy', 'Politique de confidentialité'], ['/terms', 'Conditions d’utilisation']]) {
  test(`${path} in French`, async ({ page }) => {
    await installMockBackend(page, fresh());
    await page.goto(path);
    await expect(page.getByRole('heading', { level: 1, name: heading })).toBeVisible();
    await expect(page.getByText(/Dernière mise à jour : 11 octobre 2026/)).toBeVisible();
    expect(await leftoverEnglish(page)).toEqual([]);
  });
}
