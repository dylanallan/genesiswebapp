import { test, expect } from '@playwright/test';
import { installMockBackend, signIn, type MockState } from './support/mockBackend';

const ROSA = '44444444-0000-4000-8000-000000000001';
const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64');
const reading = {
  kind: 'baptism', language: 'French', unclear: false,
  transcription: 'Le douze mars mil huit cent quarante, nous prêtre soussigné avons baptisé Marie Rosa Tremblay',
  translation: 'On 12 March 1840, I, the undersigned priest, baptised Marie Rosa Tremblay',
  summary: 'The baptism of Marie Rosa Tremblay in Saint-Roch.',
  date: '1840-03-12', place: 'Saint-Roch de Québec',
  people: [{ name: 'Marie Rosa Tremblay', role: 'child' }, { name: 'Joseph Tremblay', role: 'father' }],
};

test('an old baptism record is read, translated and saved to the right person', async ({ page, context }) => {
  const state: MockState = {
    subscribed: false, calls: [],
    familyRows: [{ id: ROSA, first_name: 'Rosa', last_name: 'Tremblay', birth_date: null, birth_location: null, death_date: null, death_location: null, notes: 'Loved to sing.' }],
  };
  await signIn(context);
  await installMockBackend(page, state);
  let sent: Record<string, unknown> | null = null;
  await page.route('**/functions/v1/read-document', async (route) => {
    sent = JSON.parse(route.request().postData() ?? '{}');
    await route.fulfill({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify({ reading }) });
  });

  await page.goto('/dashboard?feature=document-reader');
  await page.getByLabel('Photo of the document').setInputFiles({ name: 'bapteme.png', mimeType: 'image/png', buffer: png });
  await page.getByRole('button', { name: 'Read the document' }).click();

  const result = page.getByTestId('document-reading');
  await expect(result.getByRole('heading', { name: 'Baptism record' })).toBeVisible();
  await expect(result.getByText('The baptism of Marie Rosa Tremblay in Saint-Roch.')).toBeVisible();
  await expect(result.getByText(/^On 12 March 1840/)).toBeVisible();
  await expect(result.getByText(/^Le douze mars/)).toBeVisible();
  expect(sent).toMatchObject({ lang: 'en' });

  // The person named in the record is picked, the baptism date is offered (unticked) and the place is ticked.
  await expect(page.getByLabel('Person')).toHaveValue(ROSA);
  const asBirth = page.getByRole('checkbox', { name: /Set birth date to 1840-03-12/ });
  await expect(asBirth).not.toBeChecked();
  await expect(page.getByText(/Births were usually a day or two earlier/)).toBeVisible();
  await expect(page.getByRole('checkbox', { name: /Set birthplace to Saint-Roch de Québec/ })).toBeChecked();

  const [patch] = await Promise.all([
    page.waitForRequest((r) => r.url().includes('/rest/v1/family_members') && r.method() === 'PATCH'),
    page.getByRole('button', { name: 'Save to Rosa Tremblay' }).click(),
  ]);
  expect(patch.url()).toContain(`id=eq.${ROSA}`);
  const body = JSON.parse(patch.postData() ?? '{}');
  expect(body.birth_location).toBe('Saint-Roch de Québec');
  expect(body.birth_date).toBeUndefined();
  expect(body.notes).toMatch(/^Loved to sing\.\n\n---\n\nFrom a baptism record \(1840-03-12\)/);
  expect(body.notes).toContain('Original text:\nLe douze mars');
  await expect(page.getByText('Saved to Rosa Tremblay.')).toBeVisible();
});

test('a blurry photo gets a gentle warning, and a refused read shows the reason', async ({ page, context }) => {
  const state: MockState = { subscribed: false, calls: [] };
  await signIn(context);
  await installMockBackend(page, state);
  let calls = 0;
  await page.route('**/functions/v1/read-document', async (route) => {
    calls += 1;
    if (calls === 1) {
      await route.fulfill({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify({ reading: { ...reading, unclear: true } }) });
    } else {
      await route.fulfill({ status: 429, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify({ error: 'Free accounts can do 3 documents a day. Upgrade to Pro to do more.', code: 'UPGRADE_REQUIRED' }) });
    }
  });
  await page.goto('/dashboard?feature=document-reader');
  await page.getByLabel('Photo of the document').setInputFiles({ name: 'flou.png', mimeType: 'image/png', buffer: png });
  await page.getByRole('button', { name: 'Read the document' }).click();
  await expect(page.getByText(/Parts of this photo were hard to read/)).toBeVisible();
  await expect(page.getByText(/Add people to your family tree first/)).toBeVisible();

  await page.getByRole('button', { name: 'Read the document' }).click();
  await expect(page.getByText('Free accounts can do 3 documents a day. Upgrade to Pro to do more.')).toBeVisible();
});

test('the document reader is in French for French speakers', async ({ page, context }) => {
  const state: MockState = { subscribed: false, calls: [] };
  await signIn(context);
  await context.addInitScript(() => localStorage.setItem('genesis-lang', 'fr'));
  await installMockBackend(page, state);
  await page.goto('/dashboard?feature=document-reader');
  await expect(page.getByRole('heading', { name: 'Lire un vieux document' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Lire le document' })).toBeVisible();
});
