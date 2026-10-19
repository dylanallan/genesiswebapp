// Accessibility: every customer screen is checked with axe (screen-reader labels, colour contrast, headings,
// form labels). Many Genesis users are older or have low vision, so this matters more than for most apps.
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { installMockBackend, signIn, type MockState } from './support/mockBackend';

// Every screen in the customer menu.
const ALL = ['welcome', 'tree-import', 'family-tree-chart', 'family-map', 'heritage-mix', 'family-facts', 'life-story', 'family-tree-viz',
  'tree-checkup', 'timeline-builder', 'family-contacts', 'family-sharing', 'dna-insights', 'cultural-stories', 'cultural-recipes',
  'traditions', 'celebrations', 'cultural-artifacts', 'family-photos', 'weekly-questions', 'slideshow', 'album-scan', 'photo-restore', 'photo-date', 'document-reader', 'media-gallery', 'family-interview',
  'voice-recorder', 'family-storybook', 'family-search', 'research-assistant', 'records-search', 'data-table', 'family-tree-voice',
  'my-account', 'privacy-center', 'ask-relative', 'record-hints'];
const FEATURES = process.env.A11Y_FEATURES?.split(',') ?? ALL;
const state: MockState = { subscribed: false, calls: [], chatQuotaExceeded: false };

const report = (violations: Awaited<ReturnType<AxeBuilder['analyze']>>['violations']) =>
  violations.map((v) => `${v.impact} ${v.id}: ${v.help} (${v.nodes.length}x) e.g. ${v.nodes[0]?.target.join(' ')} HTML ${v.nodes.map((n) => n.html.slice(0, 160)).join(' || ')}`);

test('home page', async ({ page }) => {
  await page.goto('/');
  const r = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
  console.log('A11Y home', JSON.stringify(report(r.violations)));
  expect(report(r.violations.filter((v) => v.impact === 'critical' || v.impact === 'serious'))).toEqual([]);
});

// Public pages people reach from search, ads and partner links.
for (const path of ['/switch', '/compare', '/partners', '/pricing', '/privacy', '/terms']) {
  test(`public page ${path}`, async ({ page }) => {
    await installMockBackend(page, state);
    await page.goto(path);
    await page.getByRole('heading', { level: 1 }).first().waitFor();
    await page.waitForTimeout(800);
    const r = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
    console.log(`A11Y ${path}`, JSON.stringify(report(r.violations)));
    expect(report(r.violations.filter((v) => v.impact === 'critical' || v.impact === 'serious'))).toEqual([]);
  });
}

test('relative’s answer page (no account)', async ({ page }) => {
  await installMockBackend(page, { ...state, memoryRequest: { token: 'aaaabbbbccccddddeeeeffff00001111', view: { from_name: 'Dylan', relative_name: 'Grandma Rosa', questions: ['Where did you grow up?'], answered: [], closed: false } } });
  await page.goto('/memories/aaaabbbbccccddddeeeeffff00001111');
  await page.getByTestId('answer-memories').waitFor();
  const r = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
  console.log('A11Y memories', JSON.stringify(report(r.violations)));
  expect(report(r.violations.filter((v) => v.impact === 'critical' || v.impact === 'serious'))).toEqual([]);
});

test.describe('signed in', () => {
  test.describe.configure({ timeout: 60_000 }); // the first screen also waits for the dev server to build
  test.beforeEach(async ({ context, page }) => { await signIn(context); await installMockBackend(page, state); });
  for (const f of FEATURES) {
    test(`screen ${f}`, async ({ page }) => {
      await page.goto(`/dashboard?feature=${f}`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1500); // let the helper's greeting finish fading in
      const r = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
      console.log(`A11Y ${f}`, JSON.stringify(report(r.violations)));
      expect(report(r.violations.filter((v) => v.impact === 'critical' || v.impact === 'serious'))).toEqual([]);
    });
  }
});

test.describe('keyboard only', () => {
  test.beforeEach(async ({ context, page }) => { await signIn(context); await installMockBackend(page, state); });

  test('the menu can be reached and used with Tab and Enter, and focus is always visible', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForTimeout(1000);
    let reached = false;
    for (let i = 0; i < 40 && !reached; i++) {
      await page.keyboard.press('Tab');
      reached = await page.evaluate(() => (document.activeElement?.textContent ?? '').trim() === 'My family');
    }
    expect(reached).toBe(true);
    // Something must show where the keyboard is (an outline or ring), or people get lost.
    await page.waitForTimeout(400); // menu buttons animate their styles for 0.2s
    const visible = await page.evaluate(() => {
      const el = document.activeElement as HTMLElement;
      const cs = getComputedStyle(el);
      return cs.outlineStyle !== 'none' && cs.outlineWidth !== '0px' || cs.boxShadow !== 'none';
    });
    expect(visible).toBe(true);
    await page.keyboard.press('Enter');
    const familyMenu = page.getByTestId('feature-menu');
    await expect(familyMenu.getByRole('button', { name: 'Family tree' })).toBeVisible();
    await familyMenu.getByRole('button', { name: 'Family tree' }).focus();
    await page.keyboard.press('Enter');
    await expect(page.getByText(/Your tree is empty/)).toBeVisible(); // the tree screen opened (this test family is empty)
  });
});
