// Tapping Save twice quickly (easy on a slow phone) must save once, not twice.
import { test, expect, type Page } from '@playwright/test';
import { installMockBackend, signIn, type MockState } from './support/mockBackend';

const state: MockState = { subscribed: false, calls: [], chatQuotaExceeded: false };

test.beforeEach(async ({ context, page }) => {
  await signIn(context);
  await installMockBackend(page, state);
  // Make saving slow, like a weak phone signal, so a second tap lands while the first is still saving.
  await page.route(/\/rest\/v1\/(traditions|cultural_stories|family_contacts|timeline_events)/, async (route) => {
    if (route.request().method() === 'POST') await new Promise((r) => setTimeout(r, 800));
    await route.fallback();
  });
  state.posted = {};
});

const cases: { name: string; feature: string; table: string; fill: (page: Page) => Promise<void>; save: string }[] = [
  {
    name: 'traditions', feature: 'traditions', table: 'traditions', save: 'Save Tradition',
    fill: async (page) => {
      await page.getByRole('button', { name: /add tradition/i }).first().click();
      await page.getByPlaceholder('Enter tradition name').fill('Sunday tamales');
    },
  },
  {
    name: 'stories', feature: 'cultural-stories', table: 'cultural_stories', save: 'Save Story',
    fill: async (page) => {
      await page.getByRole('button', { name: /add story/i }).first().click();
      await page.getByPlaceholder('Enter story title').fill('The farm');
      await page.getByPlaceholder('Enter the full story text').fill('We had goats.');
    },
  },
  {
    name: 'contacts', feature: 'family-contacts', table: 'family_contacts', save: 'Save Contact',
    fill: async (page) => {
      await page.getByRole('button', { name: /add contact/i }).first().click();
      await page.getByPlaceholder('Enter contact name').fill('Aunt Lupe');
    },
  },
  {
    name: 'timeline events', feature: 'timeline-builder', table: 'timeline_events', save: 'Add Event',
    fill: async (page) => {
      await page.getByRole('button', { name: /add event/i }).first().click();
      await page.getByPlaceholder('Date').fill('1950-06-01');
      await page.getByPlaceholder('Event title').fill('Moved to Toronto');
    },
  },
];

for (const c of cases) {
  test(`${c.name}: two quick taps on save add it once`, async ({ page }) => {
    await page.goto(`/dashboard?feature=${c.feature}`);
    await c.fill(page);
    await page.getByRole('button', { name: c.save, exact: true }).last().dblclick();
    await page.waitForTimeout(1500);
    expect(state.posted?.[c.table] ?? []).toHaveLength(1);
  });
}
