import { test } from '@playwright/test';
import { installMockBackend, signIn, type MockState } from './support/mockBackend';

// Takes the product screenshots used on the public home page (public/screens/*.png).
// Only runs when asked:  SITE_SHOTS=1 npx playwright test e2e/site-screenshots.spec.ts --project=chromium
test.skip(!process.env.SITE_SHOTS, 'only when refreshing the home page screenshots');
test.use({ viewport: { width: 1280, height: 900 }, deviceScaleFactor: 1.5 });

const id = (n: number) => `44444444-0000-4000-8000-${String(n).padStart(12, '0')}`;
const person = (n: number, first: string, last: string, gender: string, birth: string | null, place: string | null, extra: Record<string, unknown> = {}) => ({
  id: id(n), first_name: first, middle_name: null, last_name: last, gender, birth_date: birth, death_date: null, birth_location: place,
  death_location: null, relationship: null, parent_ids: [], children_ids: [], spouse_ids: [], is_living: true, notes: null, occupation: [], ...extra,
});
const family = [
  person(1, 'Sofia', 'Vega', 'female', '1992-04-12', 'Toronto, Canada', { relationship: 'self', parent_ids: [id(2), id(3)] }),
  person(2, 'Daniel', 'Vega', 'male', '1960-02-03', 'Los Angeles, California', { parent_ids: [id(4), id(5)], children_ids: [id(1)], spouse_ids: [id(3)] }),
  person(3, 'Margaret', "O'Brien", 'female', '1962-09-21', 'Halifax, Nova Scotia', { parent_ids: [id(6), id(7)], children_ids: [id(1)], spouse_ids: [id(2)] }),
  person(4, 'Luis', 'Vega', 'male', '1930-05-05', 'Los Angeles, California', { death_date: '2001-11-02', parent_ids: [id(8), id(9)], children_ids: [id(2)], spouse_ids: [id(5)] }),
  person(5, 'Carmen', 'Ruiz', 'female', '1933-07-14', 'Guadalajara, Jalisco, México', { death_date: '2015-03-30', children_ids: [id(2)], spouse_ids: [id(4)] }),
  person(6, 'Patrick', "O'Brien", 'male', '1928-03-17', 'Cork, Ireland', { death_date: '1999-08-01', children_ids: [id(3)], spouse_ids: [id(7)] }),
  person(7, 'Eileen', 'Walsh', 'female', '1931-12-02', 'Halifax, Nova Scotia', { death_date: '2010-05-05', children_ids: [id(3)], spouse_ids: [id(6)] }),
  person(8, 'Juan', 'Vega', 'male', '1898-06-24', 'Oaxaca, México', { death_date: '1965-02-10', children_ids: [id(4)], spouse_ids: [id(9)] }),
  person(9, 'Rosa', 'Vega', 'female', '1902-03-01', 'Oaxaca, México', { death_date: '1980-06-01', death_location: 'Los Angeles, California', children_ids: [id(4)], spouse_ids: [id(8)], parent_ids: [] }),
];
const state: MockState = { subscribed: true, calls: [], chatQuotaExceeded: false, familyRows: family };

test.beforeEach(async ({ page, context }) => {
  await signIn(context);
  await installMockBackend(page, state);
});

const shot = async (page: import('@playwright/test').Page, name: string) => {
  await page.addStyleTag({ content: 'nav { position: static !important; }' }); // headers must not cover the picture
  await page.waitForTimeout(800);
  await page.locator('main .lg\\:col-span-2 > div').last().screenshot({ path: `public/screens/${name}.png` });
};

test('tree chart', async ({ page }) => {
  await page.goto('/dashboard?feature=family-tree-chart');
  await page.getByRole('button', { name: /Rosa Vega/ }).waitFor();
  await shot(page, 'tree');
});

test('life story', async ({ page }) => {
  await page.goto(`/dashboard?feature=life-story&person=${id(9)}`);
  await page.getByText('The Mexican Revolution').waitFor();
  await shot(page, 'life-story');
});

test('research assistant', async ({ page }) => {
  state.recordHits = [
    { source: 'wikitree', sourceLabel: 'WikiTree', sourceId: 'Vega-1', title: 'Rosa Vega (1902–1980)', snippet: 'Born: Oaxaca, México · Died: Los Angeles, California', date: '1902', url: 'https://www.wikitree.com', attribution: 'WikiTree contributors', facts: { birthYear: 1902, deathYear: 1980, birthPlace: 'Oaxaca, México', deathPlace: 'Los Angeles, California' } },
    { source: 'chronicling-america', sourceLabel: 'Chronicling America', sourceId: 'n1', title: 'Los Angeles Herald, 1931: Vega family welcomes son', snippet: 'Mr. and Mrs. Juan Vega of Boyle Heights announce…', date: '1931', url: 'https://www.loc.gov', attribution: 'Library of Congress' },
    { source: 'wikitree', sourceLabel: 'WikiTree', sourceId: 'Vega-2', title: 'Rosa Vega (1950–2010)', snippet: 'Born: Madrid, España', date: '1950', url: 'https://www.wikitree.com', attribution: 'WikiTree contributors', facts: { birthYear: 1950, deathYear: 2010, birthPlace: 'Madrid, España' } },
  ];
  await page.goto(`/dashboard?feature=research-assistant&person=${id(9)}`);
  await page.getByText('Strong match', { exact: false }).first().waitFor();
  await shot(page, 'research');
  state.recordHits = undefined;
});

test('interview', async ({ page }) => {
  await page.goto('/dashboard?feature=family-interview');
  await page.getByText('Interview a relative').first().waitFor();
  await shot(page, 'interview');
});
