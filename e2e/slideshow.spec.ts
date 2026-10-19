import { test, expect, type Page } from '@playwright/test';
import { installMockBackend, signIn, type MockState } from './support/mockBackend';

async function photo(page: Page, colour: string): Promise<Buffer> {
  const b64 = await page.evaluate((c) => {
    const canvas = document.createElement('canvas');
    canvas.width = 300; canvas.height = 200;
    const g = canvas.getContext('2d')!;
    g.fillStyle = c; g.fillRect(0, 0, 300, 200);
    return canvas.toDataURL('image/png').split(',')[1];
  }, colour);
  return Buffer.from(b64, 'base64');
}

test('photos with captions become a slideshow video that can be downloaded', async ({ page, context }) => {
  test.setTimeout(90_000);
  await signIn(context);
  const state: MockState = { subscribed: false, calls: [], storageFiles: { 'family-photos': ['wedding.png'] } };
  await installMockBackend(page, state);
  await page.goto('/dashboard?feature=slideshow');
  await expect(page.getByRole('heading', { name: 'Make a slideshow video' })).toBeVisible();
  await page.getByLabel('Title').fill('The life of Rosa');

  await page.getByLabel('Photos for the slideshow').setInputFiles([
    { name: 'a.png', mimeType: 'image/png', buffer: await photo(page, '#a33') },
    { name: 'b.png', mimeType: 'image/png', buffer: await photo(page, '#33a') },
  ]);
  await expect(page.getByLabel('Caption for photo 2')).toBeVisible();
  await page.getByLabel('Caption for photo 1').fill('Rosa in Oaxaca, 1925');

  // Reorder, then remove one so two photos are left.
  await page.getByRole('button', { name: 'Move photo 2 up' }).click();
  await expect(page.getByLabel('Caption for photo 2')).toHaveValue('Rosa in Oaxaca, 1925');
  await page.getByLabel('Seconds per photo').selectOption('3');
  await expect(page.getByText('2 photos · about 0:10 long')).toBeVisible();

  await page.getByRole('button', { name: 'Make the video' }).click();
  await expect(page.getByText(/Making your video/)).toBeVisible();
  const result = page.getByTestId('slideshow-video');
  await expect(result).toBeVisible({ timeout: 40_000 });
  expect(Number(await result.getAttribute('data-size'))).toBeGreaterThan(1000);
  await expect(result.getByRole('link', { name: 'Download the video' })).toHaveAttribute('download', /^The life of Rosa\.(webm|mp4)$/);
});

test('saved photos can be added to a slideshow', async ({ page, context }) => {
  await signIn(context);
  const state: MockState = { subscribed: false, calls: [], storageFiles: { 'family-photos': ['wedding.png'] } };
  await installMockBackend(page, state);
  await page.goto('/dashboard?feature=slideshow');
  // Stored photos come from another address, so they must allow the video canvas to read them (Supabase does).
  const png = await photo(page, '#3a3');
  await page.route('**/icon-512x512.png*', (route) => route.fulfill({ status: 200, contentType: 'image/png', headers: { 'access-control-allow-origin': '*' }, body: png }));
  await page.getByRole('button', { name: 'Add my saved photos' }).click();
  await page.getByRole('img', { name: 'Add wedding.png' }).click();
  await expect(page.getByLabel('Caption for photo 1')).toBeVisible();
});

test('the slideshow maker in French', async ({ page, context }) => {
  await signIn(context);
  await context.addInitScript(() => localStorage.setItem('genesis-lang', 'fr'));
  await installMockBackend(page, { subscribed: false, calls: [] } as MockState);
  await page.goto('/dashboard?feature=slideshow');
  await expect(page.getByRole('heading', { name: 'Créer un diaporama vidéo' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Créer la vidéo' })).toBeDisabled();
});
