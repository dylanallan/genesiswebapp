import { test, expect } from '@playwright/test';
import { installMockBackend, signIn, type MockState } from './support/mockBackend';

// Most families will use a phone: key screens must fit a 390px-wide screen without sideways scrolling.
const state: MockState = { subscribed: false, calls: [], chatQuotaExceeded: false };
test.use({ viewport: { width: 390, height: 844 } });

for (const [name, path, signedIn] of [
  ['home page', '/', false],
  ['welcome screen', '/dashboard', true],
  ['pricing', '/pricing', true],
  ['privacy policy', '/privacy', false],
] as const) {
  test(`${name} fits a phone screen`, async ({ page, context }) => {
    if (signedIn) await signIn(context);
    await installMockBackend(page, state);
    await page.goto(path);
    await page.waitForLoadState('networkidle');
    if (process.env.SHOTS) await page.screenshot({ path: `test-results/mobile-${name.replace(/\W+/g, '-')}.png`, fullPage: true });
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow).toBeLessThanOrEqual(1);
  });
}
