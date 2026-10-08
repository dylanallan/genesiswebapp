import { test, expect } from '@playwright/test';
import { collectProblems, installMockBackend, signIn, type MockState, type Problem } from './support/mockBackend';
import fs from 'node:fs';

// "Beta tester": signs in and opens EVERY dashboard feature, recording crashes, error boundaries
// and console errors. Run with:  npm run test:beta   (needs VITE_SUPABASE_URL=https://mock.supabase.co)
test.describe.configure({ mode: 'serial' });

const state: MockState = { subscribed: false, calls: [], chatQuotaExceeded: false };
const problems: Problem[] = [];
let current = 'startup';

test.beforeEach(async ({ page, context }) => {
  await signIn(context);
  await installMockBackend(page, state);
  collectProblems(page, problems, () => current);
});

test('signed-out visitors see the sign-in form', async ({ browser }) => {
  const page = await (await browser.newContext()).newPage();
  await installMockBackend(page, state);
  await page.goto('/');
  await expect(page.getByRole('heading', { name: /welcome to genesis heritage/i })).toBeVisible();
  await expect(page.getByLabel('Email')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Sign In', exact: true })).toBeVisible();
});

test('signed-in user lands on home and sees their plan', async ({ page }) => {
  current = 'home';
  await page.goto('/');
  await expect(page.getByRole('button', { name: /dashboard/i }).first()).toBeVisible();
  await expect(page.getByText('Free', { exact: true })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Upgrade' })).toBeVisible();
});

test('every dashboard feature opens without crashing', async ({ page }) => {
  test.setTimeout(10 * 60_000);
  current = 'dashboard';
  await page.goto('/dashboard');
  const band = page.locator('div.overflow-x-auto').nth(1);
  await expect(band.locator('button').first()).toBeVisible();
  const names = (await band.locator('button').allInnerTexts()).map((t) => t.trim());
  console.log(`Found ${names.length} features`);

  const report: string[] = [];
  for (let i = 0; i < names.length; i++) {
    current = `feature: ${names[i]}`;
    await band.locator('button').nth(i).click();
    await page.waitForTimeout(400);
    const body = await page.locator('main').innerText();
    const crashed = /Component Error|Something went wrong|Application Error|not a valid React component/i.test(body);
    const empty = body.replace(/\s+/g, ' ').trim().length < 40;
    report.push(`${crashed ? 'CRASH' : empty ? 'EMPTY' : 'ok   '}  ${names[i]}`);
    if (process.env.SHOTS) await page.screenshot({ path: `test-results/shots/${String(i).padStart(2, '0')}-${names[i].replace(/\W+/g, '_')}.png` });
  }
  fs.mkdirSync('test-results', { recursive: true });
  fs.writeFileSync('test-results/feature-report.txt', report.join('\n'));
  console.log(report.join('\n'));
  expect(report.filter((r) => !r.startsWith('ok'))).toEqual([]);
});

test('pricing page: free user can start checkout', async ({ page }) => {
  current = 'pricing';
  await page.goto('/pricing');
  await expect(page.getByRole('heading', { name: /choose your plan/i })).toBeVisible();
  const [req] = await Promise.all([
    page.waitForRequest((r) => r.url().includes('create-checkout-session')),
    page.getByRole('button', { name: 'Upgrade' }).first().click(),
  ]);
  expect(JSON.parse(req.postData() ?? '{}')).toEqual({ plan: 'monthly' });
});

test('pricing page: subscriber sees Pro and can manage billing', async ({ page }) => {
  current = 'pricing-pro';
  state.subscribed = true;
  await page.goto('/pricing');
  await expect(page.getByText(/You're on/)).toBeVisible();
  await expect(page.getByRole('button', { name: 'Manage billing' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Upgrade' })).toHaveCount(0);
  state.subscribed = false;
});

test.afterAll(() => {
  fs.mkdirSync('test-results', { recursive: true });
  const unique = [...new Map(problems.map((p) => [`${p.where}|${p.text}`, p])).values()];
  fs.writeFileSync('test-results/problems.json', JSON.stringify(unique, null, 2));
  console.log(`\n${unique.length} distinct console/page errors recorded`);
});
