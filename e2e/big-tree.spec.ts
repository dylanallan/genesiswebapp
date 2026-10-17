// Every family screen must open quickly and stay usable with a very large imported tree.
import { test, expect } from '@playwright/test';
import { installMockBackend, signIn, type MockState } from './support/mockBackend';

const N = 10_000;
// A pedigree: person i's parents are people 2i+1 and 2i+2, so person 0 ("me") has about 13 generations of ancestors.
function rows() {
  const id = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
  return Array.from({ length: N }, (_, i) => {
    const gen = Math.floor(Math.log2(i + 1));
    const parents = [2 * i + 1, 2 * i + 2].filter((n) => n < N).map(id);
    return {
      id: id(i), first_name: `Name${i}`, middle_name: null, last_name: ['Vega', 'Kelly', 'Nowak'][i % 3], gender: i % 2 ? 'male' : 'female',
      birth_date: `${1995 - gen * 28}-0${(i % 9) + 1}-1${i % 9}`, death_date: gen > 2 ? `${2060 - gen * 28}-01-01` : null,
      birth_location: ['Cork, Ireland', 'Oaxaca, México', 'Toronto, ON'][i % 3], death_location: null, is_living: gen <= 2, notes: null,
      relationship: i === 0 ? 'self' : null, parent_ids: parents,
      spouse_ids: i === 0 ? [] : [id(i % 2 ? i + 1 : i - 1)].filter((x) => x !== id(N)),
      children_ids: i === 0 ? [] : [id(Math.floor((i - 1) / 2))],
    };
  });
}

// Each screen and something on it that only appears once the family has loaded.
const SCREENS: [string, RegExp][] = [
  ['family-tree-chart', /b\. 1967 ·/],
  ['family-tree-viz', /Showing 100 of 10000 people|Showing 100 of 10,000 people/],
  ['tree-checkup', /Checked 10,000 people|All 10,000 people look right/],
  ['heritage-mix', /Ireland|Mexico|Canada/],
  ['family-facts', /Longest life|Most common/],
  ['life-story', /Name0 Vega/],
  ['timeline-builder', /Showing 200 of [\d,]+ events/],
  ['family-map', /\d+ places?, \d+ moves?/],
];

// Most of the time measured here is the mock database sending 10,000 rows in pages of 1,000; the app's own work
// is well under a second (profiled). The limit catches a real freeze, not a busy test machine.
test.describe('large tree', () => {
  test.describe.configure({ mode: 'serial', timeout: 60_000 });
  const state: MockState = { subscribed: false, calls: [], chatQuotaExceeded: false, familyRows: rows() };
  test.beforeEach(async ({ context, page }) => { await signIn(context); await installMockBackend(page, state); });

  for (const [feature, loaded] of SCREENS) {
    test(`${feature} opens fast with ${N.toLocaleString()} people`, async ({ page }) => {
      const errors: string[] = [];
      page.on('pageerror', (e) => errors.push(e.message));
      const started = Date.now();
      await page.goto(`/dashboard?feature=${feature}`);
      await expect(page.getByText(loaded).first()).toBeVisible({ timeout: 15_000 });
      // the page must still respond to the person: the menu can be clicked
      await page.getByTestId('category-menu').getByRole('button').first().hover({ timeout: 8000 });
      const took = Date.now() - started;
      console.log(`${feature}: ${took} ms, ${await page.locator('*').count()} elements`);
      expect(errors).toEqual([]);
      expect(took).toBeLessThan(20_000);
    });
  }
});
