import { test, expect } from '@playwright/test';
import { installMockBackend, signIn, type MockState } from './support/mockBackend';

// A small family with long names and places, so the pages have something real to lay out.
const person = (id: string, first: string, last: string, gender: string, birth: string, place: string, parents: string[], extra = {}) => ({
  id, first_name: first, middle_name: null, last_name: last, gender, birth_date: birth, death_date: null, birth_location: place, death_location: null,
  relationship: null, is_living: true, parent_ids: parents, children_ids: [], spouse_ids: [], ...extra,
});
const FAMILY = [
  person('66666666-0000-4000-8000-000000000001', 'Maximiliano', 'Hernández-Batchelor', 'male', '1992-05-01', 'Toronto, Ontario, Canada',
    ['66666666-0000-4000-8000-000000000002', '66666666-0000-4000-8000-000000000003'], { relationship: 'self' }),
  person('66666666-0000-4000-8000-000000000002', 'Robert', 'Batchelor', 'male', '1960-02-02', 'Glasgow, Scotland', [], { spouse_ids: ['66666666-0000-4000-8000-000000000003'] }),
  person('66666666-0000-4000-8000-000000000003', 'Guadalupe', 'Hernández', 'female', '1962-03-03', 'San Juan Bautista Tuxtepec, Oaxaca, México', [], { spouse_ids: ['66666666-0000-4000-8000-000000000002'] }),
];

// Most families will use a phone: key screens must fit a 390px-wide screen without sideways scrolling.
const state: MockState = { subscribed: false, calls: [], chatQuotaExceeded: false };
test.use({ viewport: { width: 390, height: 844 } });

for (const [name, path, signedIn] of [
  ['home page', '/', false],
  ['welcome screen', '/dashboard', true],
  ['pricing', '/pricing', true],
  ['privacy policy', '/privacy', false],
  ['family tree', '/dashboard?feature=family-tree-chart', true],
  ['heritage breakdown', '/dashboard?feature=heritage-mix', true],
  ['family facts', '/dashboard?feature=family-facts', true],
  ['life story', '/dashboard?feature=life-story', true],
] as const) {
  test(`${name} fits a phone screen`, async ({ page, context }) => {
    if (signedIn) await signIn(context);
    state.familyRows = FAMILY;
    await installMockBackend(page, state);
    await page.goto(path);
    await page.waitForLoadState('networkidle');
    await expect(page.getByText(/Loading your family/)).toHaveCount(0, { timeout: 15000 });
    if (process.env.SHOTS) await page.screenshot({ path: `test-results/mobile-${name.replace(/\W+/g, '-')}.png`, fullPage: true });
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow).toBeLessThanOrEqual(1);
  });
}

test('the help button on a phone jumps to the family history helper', async ({ page, context }) => {
  await signIn(context);
  state.familyRows = FAMILY;
  await installMockBackend(page, state);
  await page.goto('/dashboard?feature=family-facts');
  // Wait until the page has settled, as a person would, before tapping.
  await expect(page.getByTestId('family-facts')).toBeVisible();
  await page.waitForLoadState('networkidle');
  await page.getByRole('button', { name: 'Ask the family history helper' }).click();
  await expect(page.getByPlaceholder(/Ask about an ancestor/)).toBeInViewport();
});
