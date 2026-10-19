import { test, expect, type Page } from '@playwright/test';
import { installMockBackend, signIn, type MockState } from './support/mockBackend';

// A 400 × 300 "album page" drawn in the browser: two coloured prints side by side.
async function albumPage(page: Page): Promise<Buffer> {
  const b64 = await page.evaluate(() => {
    const c = document.createElement('canvas');
    c.width = 400; c.height = 300;
    const g = c.getContext('2d')!;
    g.fillStyle = '#eee'; g.fillRect(0, 0, 400, 300);
    g.fillStyle = '#a33'; g.fillRect(20, 40, 160, 200);
    g.fillStyle = '#33a'; g.fillRect(220, 60, 160, 120);
    return c.toDataURL('image/png').split(',')[1];
  });
  return Buffer.from(b64, 'base64');
}

test('an album page is split into separate photos, which can be turned, skipped and saved', async ({ page, context }) => {
  await signIn(context);
  await installMockBackend(page, { subscribed: false, calls: [] } as MockState);
  await page.route('**/functions/v1/find-photos', (route) => route.fulfill({
    status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' },
    body: JSON.stringify({ photos: [{ box_2d: [200, 550, 600, 950], turn: 0 }, { box_2d: [133, 50, 800, 450], turn: 90 }] }),
  }));
  const uploads: string[] = [];
  page.on('request', (r) => { if (r.method() === 'POST' && r.url().includes('/storage/v1/object/family-photos/')) uploads.push(decodeURIComponent(r.url())); });

  await page.goto('/dashboard?feature=album-scan');
  await page.getByLabel('Photo of the album page').setInputFiles({ name: 'album.png', mimeType: 'image/png', buffer: await albumPage(page) });
  await expect(page.getByRole('img', { name: 'Your album page' })).toBeVisible();
  await page.getByRole('button', { name: 'Find the photos' }).click();

  await expect(page.getByText(/2 photos found/)).toBeVisible();
  // Reading order: the left print first, already turned upright (taller than wide becomes wider than tall).
  const first = page.getByRole('img', { name: 'Photo 1' });
  const size = () => first.evaluate((img: HTMLImageElement) => ({ w: img.naturalWidth, h: img.naturalHeight }));
  await expect.poll(async () => { const s = await size(); return s.w > s.h; }).toBe(true);
  await page.getByRole('button', { name: 'Turn photo 1' }).click();
  await expect.poll(async () => { const s = await size(); return s.h > s.w; }).toBe(true);

  await page.getByRole('checkbox', { name: 'Keep' }).nth(1).uncheck();
  await page.getByRole('button', { name: 'Save 1 photo' }).click();
  await expect(page.getByText('1 photo saved to your private photos.').first()).toBeVisible();
  expect(uploads.filter((u) => u.includes('album-page'))).toHaveLength(1);
  expect(uploads.filter((u) => u.includes('album-photo'))).toHaveLength(1);
});

test('a page with no photos says how to try again', async ({ page, context }) => {
  await signIn(context);
  await installMockBackend(page, { subscribed: false, calls: [] } as MockState);
  await page.route('**/functions/v1/find-photos', (route) => route.fulfill({
    status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify({ photos: [] }),
  }));
  await page.goto('/dashboard?feature=album-scan');
  await page.getByLabel('Photo of the album page').setInputFiles({ name: 'blank.png', mimeType: 'image/png', buffer: await albumPage(page) });
  await page.getByRole('button', { name: 'Find the photos' }).click();
  await expect(page.getByText(/No separate photos were found/)).toBeVisible();
});
