// Gift subscriptions: buy Pro for someone, see the code once paid, and redeem a code (signed in or not).
import { test, expect, type Page } from '@playwright/test';
import { installMockBackend, signIn, type MockState } from './support/mockBackend';
import { FR } from '../src/lib/i18n-fr';

const fresh = (extra: Partial<MockState> = {}): MockState => ({ subscribed: false, calls: [], chatQuotaExceeded: false, manualPayments: true, ...extra });

const PAID_GIFT = {
  id: 'g1', code: 'ABCDEFGHJKMN', plan: 'yearly', months: 12, recipient_name: 'Grandma Rosa', recipient_email: null, message: 'Happy birthday!',
  status: 'paid', created_at: '2026-10-01T00:00:00Z', paid_at: '2026-10-02T00:00:00Z', expires_at: '2028-10-02T00:00:00Z', redeemed_at: null,
  reference_code: 'GIFT-AAA111', amount_cents: 19000, method: 'etransfer',
};

async function leftoverEnglish(page: Page): Promise<string[]> {
  const text = await page.locator('body').innerText();
  return Object.keys(FR).filter((en) => en.length > 24 && !en.includes('{') && text.includes(en));
}

test('signed-out visitors learn about gifts and are sent to make an account', async ({ page }) => {
  await installMockBackend(page, fresh());
  await page.goto('/gift');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Give the gift of family history');
  await expect(page.getByText('It works once.')).toBeVisible();
  await expect(page.getByRole('link', { name: 'Sign in or create a free account' })).toHaveAttribute('href', '/?start=signup&next=gift');
});

test('buying a gift: server price, payment steps, then the printable code once paid', async ({ page, context }) => {
  const state = fresh();
  await signIn(context);
  await installMockBackend(page, state);
  await page.goto('/gift');
  const form = page.getByTestId('gift-form');
  await form.getByLabel(/One year of Pro/).check();
  await form.getByLabel(/Who is it for/).fill('Grandma Rosa');
  await form.getByLabel(/A message for the card/).fill('Happy birthday!');
  await form.getByRole('button', { name: /Pay by Interac e-Transfer \(\$190\.00 CAD\)/ }).click();
  const steps = page.getByTestId('payment-instructions');
  await expect(steps).toContainText('GIFT-TEST01');
  await expect(steps).toContainText('pay@example.com');
  await expect(steps).toContainText('Your gifts');
  await expect(steps).not.toContainText('Pay again any time to extend'); // that note is about your own plan
  expect(state.posted?.create_gift_request?.[0]).toEqual({
    p_plan: 'yearly', p_method: 'etransfer', p_recipient_name: 'Grandma Rosa', p_recipient_email: null, p_message: 'Happy birthday!',
  });

  // Once the payment is confirmed the code shows, ready to print or send.
  state.gifts = [PAID_GIFT];
  await page.getByRole('button', { name: 'Refresh' }).click();
  const card = page.getByTestId('gift-card');
  await expect(card).toContainText('A gift for Grandma Rosa');
  await expect(card).toContainText('ABCD-EFGH-JKMN');
  await expect(card.getByRole('button', { name: 'Print the card' })).toBeVisible();
});

test('My account lists gifts given', async ({ page, context }) => {
  await signIn(context);
  await installMockBackend(page, fresh({ gifts: [PAID_GIFT, { ...PAID_GIFT, id: 'g2', code: null, status: 'pending', recipient_name: 'Uncle Luis', reference_code: 'GIFT-BBB222' }] }));
  await page.goto('/dashboard?feature=my-account');
  const gifts = page.getByTestId('account-gifts');
  await expect(gifts).toContainText('Ready to give');
  await expect(gifts).toContainText('ABCD-EFGH-JKMN');
  await expect(gifts).toContainText('Waiting for your payment');
  await expect(gifts).toContainText('GIFT-BBB222');
});

test('redeeming a code from a gift link while signed in', async ({ page, context }) => {
  const state = fresh({ redeem: { ok: true, months: 12, until: '2027-10-17T00:00:00Z' } });
  await signIn(context);
  await installMockBackend(page, state);
  await page.goto('/redeem?code=abcd-efgh-jkmn');
  await expect(page.getByLabel('Gift code')).toHaveValue('ABCD-EFGH-JKMN');
  await page.getByRole('button', { name: 'Use my gift' }).click();
  await expect(page.getByTestId('redeem-done')).toContainText('Your gift is ready!');
  expect(state.posted?.redeem_gift_code?.[0]).toEqual({ p_code: 'ABCD-EFGH-JKMN' });
});

test('a code that does not work explains why', async ({ page, context }) => {
  await signIn(context);
  await installMockBackend(page, fresh({ redeem: { ok: false, reason: 'This gift code has already been used.' } }));
  await page.goto('/redeem');
  await page.getByLabel('Gift code').fill('ABCDEFGHJKMN');
  await page.getByRole('button', { name: 'Use my gift' }).click();
  await expect(page.getByRole('alert')).toHaveText('This gift code has already been used.');
});

test('signed-out visitors keep their code while they make an account', async ({ page }) => {
  await installMockBackend(page, fresh());
  await page.goto('/redeem?code=ABCDEFGHJKMN');
  await page.getByRole('button', { name: 'Continue' }).click();
  await expect(page.getByRole('button', { name: 'Create Account' })).toBeVisible();
  expect(await page.evaluate(() => localStorage.getItem('genesis-gift-code'))).toBe('ABCDEFGHJKMN');
  // Once signed in they come back to the redeem page with the code filled in.
  await page.getByRole('button', { name: /Already have an account/ }).click();
  await page.getByLabel('Email').fill('rosa@example.com');
  await page.getByLabel('Password').fill('a long family password');
  await page.getByRole('button', { name: 'Sign In' }).click();
  await expect(page).toHaveURL(/\/redeem/);
  await expect(page.getByLabel('Gift code')).toHaveValue('ABCD-EFGH-JKMN');
});

test('admins see which payments are gifts', async ({ page, context }) => {
  await signIn(context);
  await installMockBackend(page, fresh({
    admin: true,
    adminPayments: [{ id: 'p1', user_id: 'u1', email: 'giver@example.com', method: 'etransfer', plan: 'yearly', amount_cents: 19000, currency: 'CAD',
      reference_code: 'GIFT-AAA111', status: 'pending', admin_note: null, created_at: '2026-10-01T00:00:00Z', confirmed_at: null }],
    giftRows: [{ payment_id: 'p1', recipient_name: 'Grandma Rosa' }],
  }));
  await page.goto('/dashboard?feature=admin-payments');
  await expect(page.getByRole('row', { name: /GIFT-AAA111/ })).toContainText('Gift for Grandma Rosa');
});

test('gift and redeem pages in French', async ({ page, context }) => {
  await context.addInitScript(() => localStorage.setItem('genesis-lang', 'fr'));
  await installMockBackend(page, fresh());
  await page.goto('/gift');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Offrez l’histoire de la famille en cadeau');
  expect(await leftoverEnglish(page)).toEqual([]);
  await page.goto('/redeem');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Utilisez votre code cadeau');
  expect(await leftoverEnglish(page)).toEqual([]);
});
