import { test, expect } from '@playwright/test';
import { installMockBackend, signIn, type MockState } from './support/mockBackend';

const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64');
const reply = (route: import('@playwright/test').Route, body: unknown) =>
  route.fulfill({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify(body) });

test('an old photo gets a range of years, its clues and a clear "this is a guess"', async ({ page, context }) => {
  await signIn(context);
  await installMockBackend(page, { subscribed: false, calls: [] } as MockState);
  let n = 0;
  await page.route('**/functions/v1/date-photo', (route) => {
    n += 1;
    if (n === 1) return reply(route, { estimate: { earliest: 1920, latest: 1929, confidence: 'medium', clues: ['Drop-waist dresses', 'A sepia cabinet card'], written_date: 'June 1924', not_a_photo: false } });
    if (n === 2) return reply(route, { estimate: { earliest: 1935, latest: 1950, confidence: 'low', clues: [], not_a_photo: false } });
    return reply(route, { estimate: { earliest: 0, latest: 0, confidence: 'low', clues: [], not_a_photo: true } });
  });
  await page.goto('/dashboard?feature=photo-date');
  await page.getByLabel('Photo to date').setInputFiles({ name: 'wedding.png', mimeType: 'image/png', buffer: png });

  await page.getByRole('button', { name: 'Estimate the date' }).click();
  const result = page.getByTestId('photo-date');
  await expect(result.getByText('The 1920s')).toBeVisible();
  await expect(result.getByText('A fair guess from several clues.')).toBeVisible();
  await expect(result.getByText(/Written on the photo: June 1924/)).toBeVisible();
  await expect(result.getByText('A sepia cabinet card')).toBeVisible();
  await expect(result.getByText(/This is an estimate, not a fact/)).toBeVisible();

  await page.getByRole('button', { name: 'Estimate the date' }).click();
  await expect(result.getByText('1935 to 1950')).toBeVisible();
  await expect(result.getByText('A rough guess: the clues are few.')).toBeVisible();

  await page.getByRole('button', { name: 'Estimate the date' }).click();
  await expect(page.getByText(/doesn’t look like a photograph/)).toBeVisible();
});

test('photo dating in French', async ({ page, context }) => {
  await signIn(context);
  await context.addInitScript(() => localStorage.setItem('genesis-lang', 'fr'));
  await installMockBackend(page, { subscribed: false, calls: [] } as MockState);
  await page.route('**/functions/v1/date-photo', (route) => reply(route, { estimate: { earliest: 1940, latest: 1949, confidence: 'high', clues: [] } }));
  await page.goto('/dashboard?feature=photo-date');
  await expect(page.getByRole('heading', { name: 'Quand cette photo a-t-elle été prise ?' })).toBeVisible();
  await page.getByLabel('Photo à dater').setInputFiles({ name: 'noces.png', mimeType: 'image/png', buffer: png });
  await page.getByRole('button', { name: 'Estimer la date' }).click();
  await expect(page.getByText('Les années 1940')).toBeVisible();
});
