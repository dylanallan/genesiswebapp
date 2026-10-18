import { test, expect } from '@playwright/test';
import { installMockBackend, signIn, type MockState } from './support/mockBackend';

const IPHONE = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1';
const ANDROID = 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Mobile Safari/537.36';

test('on an iPhone, Get started shows the two steps to add Genesis to the home screen, and can be closed', async ({ browser }) => {
  const context = await browser.newContext({ userAgent: IPHONE, viewport: { width: 390, height: 844 }, hasTouch: true });
  const page = await context.newPage();
  await signIn(context);
  await installMockBackend(page, { subscribed: false, calls: [] } as MockState);
  await page.goto('/dashboard?feature=welcome');
  const card = page.getByTestId('install-app');
  await expect(card.getByRole('heading', { name: 'Put Genesis on your phone' })).toBeVisible();
  await expect(card.getByText(/Tap the Share button/)).toBeVisible();
  await expect(card.getByText(/Add to Home Screen/)).toBeVisible();
  await card.getByRole('button', { name: 'Close' }).click();
  await expect(card).toHaveCount(0);
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Welcome to Genesis Heritage' })).toBeVisible();
  await expect(page.getByTestId('install-app')).toHaveCount(0);
  await context.close();
});

test('on Android, one button opens the browser’s own install box', async ({ browser }) => {
  const context = await browser.newContext({ userAgent: ANDROID, viewport: { width: 412, height: 915 }, hasTouch: true });
  const page = await context.newPage();
  await signIn(context);
  await installMockBackend(page, { subscribed: false, calls: [] } as MockState);
  await page.goto('/dashboard?feature=welcome');
  const card = page.getByTestId('install-app');
  await expect(card.getByText(/three dots/)).toBeVisible(); // no install offer yet: picture steps
  // The browser offers to install (as Chrome does once the site qualifies).
  await page.evaluate(() => {
    const e = new Event('beforeinstallprompt') as Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };
    e.prompt = async () => { (window as unknown as { prompted: boolean }).prompted = true; };
    e.userChoice = Promise.resolve({ outcome: 'accepted' });
    window.dispatchEvent(e);
  });
  await card.getByRole('button', { name: 'Add Genesis to my home screen' }).click();
  await expect.poll(() => page.evaluate(() => (window as unknown as { prompted?: boolean }).prompted)).toBe(true);
  await expect(page.getByText(/Genesis is on your home screen/)).toBeVisible();
  await context.close();
});

test('on a computer without an install offer, the card stays out of the way', async ({ page, context }) => {
  await signIn(context);
  await installMockBackend(page, { subscribed: false, calls: [] } as MockState);
  await page.goto('/dashboard?feature=welcome');
  await expect(page.getByRole('heading', { name: 'Welcome to Genesis Heritage' })).toBeVisible();
  await expect(page.getByTestId('install-app')).toHaveCount(0);
});
