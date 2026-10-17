// The public "move from Ancestry/MyHeritage" guide and the comparison page, for visitors who are not signed in.
import { test, expect, type Page } from '@playwright/test';
import { installMockBackend, type MockState } from './support/mockBackend';
import { FR } from '../src/lib/i18n-fr';

const fresh = (): MockState => ({ subscribed: false, calls: [], chatQuotaExceeded: false });

async function leftoverEnglish(page: Page): Promise<string[]> {
  const text = await page.locator('body').innerText();
  return Object.keys(FR).filter((en) => en.length > 24 && !en.includes('{') && text.includes(en));
}

test('the switch guide explains both sites and leads to sign-up', async ({ page }) => {
  await installMockBackend(page, fresh());
  await page.goto('/switch');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Move your tree from Ancestry or MyHeritage in 5 minutes');
  await expect(page.getByRole('heading', { name: 'From Ancestry' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'From MyHeritage' })).toBeVisible();
  await expect(page.getByText(/not inside a GEDCOM file/)).toBeVisible();
  await page.getByRole('link', { name: /Create my free account and import/ }).click();
  await expect(page.getByRole('button', { name: 'Create Account' })).toBeVisible();
});

test('the comparison page marks unchecked competitor details instead of guessing', async ({ page }) => {
  await installMockBackend(page, fresh());
  await page.goto('/compare');
  const table = page.getByTestId('compare-table');
  await expect(table.getByRole('columnheader', { name: 'Ancestry' })).toBeVisible();
  await expect(table.getByRole('rowheader', { name: 'Price' })).toBeVisible();
  await expect(table.getByText('[check current price]')).toHaveCount(2);
  await expect(page.getByText(/Last checked:/)).toBeVisible();
});

test('the home page links to both', async ({ page }) => {
  await installMockBackend(page, fresh());
  await page.goto('/');
  await expect(page.getByRole('link', { name: 'Move from Ancestry or MyHeritage' })).toHaveAttribute('href', '/switch');
  await expect(page.getByRole('link', { name: 'Compare' })).toHaveAttribute('href', '/compare');
});

test.describe('in French', () => {
  test.beforeEach(async ({ context }) => {
    await context.addInitScript(() => localStorage.setItem('genesis-lang', 'fr'));
  });

  test('switch guide in French', async ({ page }) => {
    await installMockBackend(page, fresh());
    await page.goto('/switch');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Transférez votre arbre depuis Ancestry ou MyHeritage en 5 minutes');
    expect(await leftoverEnglish(page)).toEqual([]);
  });

  test('comparison page in French', async ({ page }) => {
    await installMockBackend(page, fresh());
    await page.goto('/compare');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Genesis, Ancestry et MyHeritage, côte à côte');
    await expect(page.getByText('[vérifier le prix actuel]')).toHaveCount(2);
    expect(await leftoverEnglish(page)).toEqual([]);
  });
});

test('partners page: an investor gets in touch and lands in the right group', async ({ page }) => {
  const state: MockState = { subscribed: false, calls: [], chatQuotaExceeded: false };
  await installMockBackend(page, state);
  await page.goto('/partners');
  await expect(page.getByRole('heading', { level: 1, name: 'Work with Genesis Heritage' })).toBeVisible();
  const form = page.getByTestId('waitlist-form');
  await form.getByLabel('An investor or buyer').check();
  await form.getByLabel('Email').fill('ana@fund.example');
  await form.getByLabel(/First name/).fill('Ana');
  await form.getByLabel(/Organization/).fill('Heritage Fund');
  await form.getByLabel(/What would you like to talk about/).fill('A call next week');
  await form.getByRole('button', { name: 'Get in touch' }).click();
  await expect(page.getByTestId('waitlist-joined')).toBeVisible();
  expect(state.posted?.join_waitlist?.at(-1)).toEqual({
    p_email: 'ana@fund.example', p_name: 'Ana', p_source: 'partners', p_ref: null, p_interest: 'investor', p_organization: 'Heritage Fund', p_note: 'A call next week',
  });
});
