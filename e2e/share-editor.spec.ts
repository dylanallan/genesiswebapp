import { test, expect, type Page, type Route } from '@playwright/test';
import { installMockBackend, signIn, type MockState } from './support/mockBackend';

const OWNER = '77777777-0000-4000-8000-000000000001';
const HENRI = '77777777-0000-4000-8000-000000000011';
const LUCIE = '77777777-0000-4000-8000-000000000012';
const reply = (route: Route, body: unknown) =>
  route.fulfill({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify(body) });
const member = (id: string, first: string, extra = {}) => ({
  id, first_name: first, middle_name: null, last_name: 'Gagnon', birth_date: null, birth_location: null, death_date: null, death_location: null, relationship: null, notes: null, ...extra,
});

async function openSharedFamily(page: Page, role: string, members: unknown[]) {
  await page.route('**/rest/v1/rpc/my_shared_families', (r) => reply(r, [{ owner_id: OWNER, owner_name: 'Lise', role }]));
  await page.route('**/rest/v1/rpc/shared_family_snapshot', (r) => reply(r, { owner_name: 'Lise', role, members, stories: [], storybooks: [] }));
  await page.goto('/dashboard?feature=family-sharing');
  await page.getByRole('button', { name: "Lise's family" }).click();
  await expect(page.getByRole('heading', { name: "Lise's family" })).toBeVisible();
}

test('an editor fixes a date and adds a missing parent to a shared tree', async ({ page, context }) => {
  await signIn(context);
  await installMockBackend(page, { subscribed: false, calls: [] } as MockState);
  const saves: Record<string, unknown>[] = [];
  await page.route('**/rest/v1/rpc/shared_save_member', (r) => { saves.push(JSON.parse(r.request().postData() ?? '{}')); return reply(r, HENRI); });
  await openSharedFamily(page, 'editor', [member(HENRI, 'Henri', { birth_date: '1921-06-07' }), member(LUCIE, 'Lucie', { birth_date: '1985-02-03' })]);

  // Editors see living relatives' details.
  await expect(page.getByText(/1985/)).toBeVisible();
  await page.getByRole('button', { name: 'Edit' }).first().click();
  const form = page.getByRole('form', { name: 'Edit Henri Gagnon' });
  await form.getByLabel('Birthplace').fill('Chicoutimi');
  await form.getByRole('button', { name: 'Save' }).click();
  await expect(page.getByText('Saved.')).toBeVisible();
  expect(saves[0]).toMatchObject({ p_owner: OWNER, p_person: { id: HENRI, first_name: 'Henri', birth_date: '1921-06-07', birth_location: 'Chicoutimi' }, p_relative_of: null });

  const add = page.locator('form', { has: page.getByRole('heading', { name: 'Add a missing relative' }) });
  await add.getByLabel('This person is the').selectOption('parent');
  await add.getByLabel('Person in the tree').selectOption(HENRI);
  await add.getByLabel('First name').fill('Marie');
  await add.getByLabel('Last name').fill('Tremblay');
  await add.getByRole('button', { name: 'Add to the tree' }).click();
  await expect(page.getByText('Marie Tremblay was added to the tree.')).toBeVisible();
  expect(saves[1]).toMatchObject({ p_owner: OWNER, p_relative_of: HENRI, p_relation: 'parent', p_person: { first_name: 'Marie', last_name: 'Tremblay' } });
});

test('a view-only relative sees "Living" instead of details, and no edit buttons', async ({ page, context }) => {
  await signIn(context);
  await installMockBackend(page, { subscribed: false, calls: [] } as MockState);
  await openSharedFamily(page, 'viewer', [{ id: LUCIE, first_name: 'Lucie', middle_name: null, last_name: 'Gagnon', is_living: true }, member(HENRI, 'Henri', { birth_date: '1921-06-07', death_date: '1999-01-02' })]);
  await expect(page.getByText('Living')).toBeVisible();
  await expect(page.getByText('1921 – 1999')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Edit' })).toHaveCount(0);
  await expect(page.getByRole('heading', { name: 'Add a missing relative' })).toHaveCount(0);
  await expect(page.getByRole('heading', { name: 'Add a memory to this family' })).toHaveCount(0);
});

test('the owner can invite an editor and change what someone can do', async ({ page, context }) => {
  await signIn(context);
  const state: MockState = { subscribed: false, calls: [] };
  await installMockBackend(page, state);
  await page.route('**/rest/v1/rpc/my_family_members_shared', (r) => reply(r, [
    { id: '88888888-0000-4000-8000-000000000001', invitee_name: 'Cousin Marc', member_name: 'Marc', role: 'contributor', status: 'active', token: 't1', created_at: '2026-10-01T00:00:00Z' },
  ]));
  let patch: Record<string, unknown> | null = null;
  await page.route('**/rest/v1/family_shares*', async (r) => {
    if (r.request().method() === 'PATCH') { patch = JSON.parse(r.request().postData() ?? '{}'); return reply(r, []); }
    return r.fallback();
  });
  await page.goto('/dashboard?feature=family-sharing');
  await expect(page.getByText('Joined · can view and add')).toBeVisible();
  await page.getByLabel('What Marc can do').selectOption('editor');
  await expect.poll(() => patch).toEqual({ role: 'contributor', can_edit: true });

  await page.getByLabel('They can').selectOption('editor');
  await page.getByLabel('Who is it for? (optional)').fill('Uncle Paul');
  await page.getByRole('button', { name: 'Create invite link' }).click();
  await expect.poll(() => (state.posted?.family_shares ?? []).at(-1)).toEqual({ invitee_name: 'Uncle Paul', role: 'contributor', can_edit: true });
});
