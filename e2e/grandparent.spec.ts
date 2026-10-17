// A 75-year-old's first visit: no tech words, big enough buttons, and every step finds its way without help.
import { test, expect, type Page } from '@playwright/test';
import { installMockBackend, type MockState } from './support/mockBackend';

test.use({ viewport: { width: 390, height: 844 }, hasTouch: true }); // a phone, held by someone with less steady hands

// Main buttons should be at least 44 px tall (a fingertip), the usual rule for touch screens.
async function bigEnough(page: Page, name: string | RegExp) {
  const button = page.getByRole('button', { name }).first();
  await expect(button).toBeVisible();
  // Measured once any opening animation has settled.
  await expect.poll(async () => (await button.boundingBox())?.height ?? 0, { message: `button ${name} is tall enough to tap` }).toBeGreaterThanOrEqual(44);
}

test('a grandparent signs in, builds the tree, saves a story, invites family and makes the text bigger', async ({ page }) => {
  const state: MockState = { subscribed: false, calls: [], chatQuotaExceeded: false, posted: {} };
  await installMockBackend(page, state);

  // Sign in from the home page.
  await page.goto('/');
  await page.getByRole('button', { name: /Start your family's story, free/ }).first().click();
  await expect(page.getByRole('button', { name: 'Create Account' })).toBeVisible();
  await page.getByRole('button', { name: /Already have an account|Sign in/ }).first().click();
  await page.getByLabel('Email').fill('rosa@example.com');
  await page.getByLabel('Password').fill('a long family password');
  await page.getByRole('button', { name: 'Sign In' }).click();

  // Get started: themselves, a parent and a grandparent, in plain words.
  await page.goto('/dashboard');
  await expect(page.getByRole('heading', { name: 'Welcome to Genesis Heritage' })).toBeVisible();
  await page.getByLabel('You', { exact: true }).fill('Rosa Diaz');
  await page.getByLabel('Your mother', { exact: true }).fill('Ana Lopez');
  await page.getByLabel("Mother's mother", { exact: true }).fill('Maria Ruiz');
  await bigEnough(page, 'Save and find my first records');
  await page.getByRole('button', { name: 'Save and find my first records' }).click();
  await expect(page.getByText(/3 people added/)).toBeVisible();
  expect((state.posted!.family_members as Array<{ first_name: string }>).map((r) => r.first_name)).toEqual(['Rosa', 'Ana', 'Maria']);

  // Write down a story.
  await page.goto('/dashboard?feature=cultural-stories');
  await bigEnough(page, 'Add Story');
  await page.getByRole('button', { name: 'Add Story' }).first().click();
  await page.getByLabel(/^Title/).fill('Sundays at Grandma Maria’s');
  await page.getByLabel(/^Story Content/).fill('Every Sunday we made tamales together and she sang while we cooked.');
  await bigEnough(page, 'Save Story');
  await page.getByRole('button', { name: 'Save Story' }).click();
  await expect.poll(() => (state.posted!.cultural_stories as Array<{ title: string }> | undefined)?.[0]?.title).toBe('Sundays at Grandma Maria’s');

  // Invite a grandchild.
  await page.goto('/dashboard?feature=family-sharing');
  await page.getByLabel(/Who is it for/).fill('Grandson Leo');
  await bigEnough(page, 'Create invite link');
  await page.getByRole('button', { name: 'Create invite link' }).click();
  await expect.poll(() => (state.posted!.family_shares as Array<{ invitee_name: string }> | undefined)?.[0]?.invitee_name).toBe('Grandson Leo');

  // Bigger text, and it stays bigger.
  await page.goto('/dashboard?feature=my-account');
  await page.getByRole('radio', { name: 'Extra large' }).click();
  expect(await page.evaluate(() => document.documentElement.style.fontSize)).toBe('20px');
  await page.reload();
  expect(await page.evaluate(() => document.documentElement.style.fontSize)).toBe('20px');

  // No developer words anywhere they went.
  const text = await page.locator('body').innerText();
  expect(text).not.toMatch(/\b(undefined|null|NaN|GEDCOM|API|Supabase|webhook|JSON)\b/);
});
