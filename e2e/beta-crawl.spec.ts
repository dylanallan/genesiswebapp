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

test('signed-out visitors see the home page and can open the sign-in form', async ({ browser }) => {
  const page = await (await browser.newContext()).newPage();
  await installMockBackend(page, state);
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Genesis takes you on the journey');
  await expect(page.getByText('Questions families ask')).toBeVisible();
  await page.getByRole('button', { name: 'Sign in' }).first().click();
  await expect(page.getByRole('heading', { name: /welcome to genesis heritage/i })).toBeVisible();
  await expect(page.getByLabel('Email')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Sign In', exact: true })).toBeVisible();
});

test('forgot password sends a reset email', async ({ browser }) => {
  const page = await (await browser.newContext()).newPage();
  await installMockBackend(page, state);
  await page.goto('/');
  await page.getByRole('button', { name: 'Sign in' }).first().click();
  await page.getByRole('button', { name: 'Forgot password?' }).click();
  await expect(page.getByLabel('Password')).toHaveCount(0);
  await page.getByLabel('Email').fill('someone@example.com');
  const [req] = await Promise.all([
    page.waitForRequest((r) => r.url().includes('/auth/v1/recover')),
    page.getByRole('button', { name: 'Email me a reset link' }).click(),
  ]);
  expect(JSON.parse(req.postData() ?? '{}').email).toBe('someone@example.com');
  await expect(page.getByText(/reset link is on its way/i)).toBeVisible();
});

test('"Start free" on the home page opens account creation', async ({ browser }) => {
  const page = await (await browser.newContext()).newPage();
  await installMockBackend(page, state);
  await page.goto('/');
  await page.getByRole('button', { name: /Start your family's story, free/ }).first().click();
  await expect(page.getByRole('button', { name: 'Create Account' })).toBeVisible();
  await page.getByRole('button', { name: /Back to the home page/ }).click();
  await expect(page.getByText('Questions families ask')).toBeVisible();
});

test('signed-in user lands on home and sees their plan', async ({ page }) => {
  current = 'home';
  await page.goto('/');
  await expect(page.getByRole('button', { name: /dashboard/i }).first()).toBeVisible();
  await expect(page.getByText('Free', { exact: true })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Upgrade' })).toBeVisible();
});

test('every dashboard feature opens without crashing', async ({ page }) => {
  test.setTimeout(15 * 60_000);
  current = 'dashboard';
  state.admin = true; // admins see every tool, so the crawl covers everything
  await page.goto('/dashboard');
  const categoryBand = page.locator('div.overflow-x-auto').nth(0);
  const band = page.locator('div.overflow-x-auto').nth(1);
  await expect(categoryBand.getByRole('button', { name: 'All tools (admin)' })).toBeVisible();
  // Customer menus, then one pass over every tool (the other admin groups are subsets of it).
  const categories = (await categoryBand.locator('button').allInnerTexts()).map((t) => t.trim())
    .filter((c) => !/^(Accounts & payments|Business tools|Monitoring|System|Demos)$/.test(c));

  const report: string[] = [];
  const seen = new Set<string>();
  fs.mkdirSync('test-results', { recursive: true });
  fs.writeFileSync('test-results/crawl-progress.txt', '');
  for (const category of categories) {
    await categoryBand.getByRole('button', { name: category, exact: true }).click();
    await expect(band.locator('button').first()).toBeVisible();
    const names = (await band.locator('button').allInnerTexts()).map((t) => t.trim());
    for (let i = 0; i < names.length; i++) {
      const key = `${category} > ${names[i]}`;
      if (seen.has(names[i]) && category.startsWith('All tools')) continue;
      seen.add(names[i]);
      current = `feature: ${key}`;
      fs.appendFileSync('test-results/crawl-progress.txt', `${key}\n`);
      await band.locator('button').nth(i).click({ timeout: 10_000 });
      await page.waitForTimeout(400);
      const body = await page.locator('main').first().innerText({ timeout: 10_000 });
      const crashed = /Component Error|Something went wrong|Application Error|not a valid React component/i.test(body);
      const empty = body.replace(/\s+/g, ' ').trim().length < 40;
      report.push(`${crashed ? 'CRASH' : empty ? 'EMPTY' : 'ok   '}  ${key}`);
      await page.keyboard.press('Escape'); // closes pop-up features, like a user would
      await page.waitForTimeout(150);
    }
  }
  state.admin = false;
  fs.writeFileSync('test-results/feature-report.txt', report.join('\n'));
  console.log(report.join('\n'));
  expect(report.filter((r) => !r.startsWith('ok'))).toEqual([]);
});

test('customers only see family-history menus', async ({ page }) => {
  current = 'customer-menu';
  await page.goto('/dashboard');
  const categoryBand = page.locator('div.overflow-x-auto').nth(0);
  await expect(categoryBand.getByRole('button', { name: 'Memories', exact: true })).toBeVisible();
  await expect(categoryBand.getByRole('button', { name: /admin|Business/ })).toHaveCount(0);
  await expect(page.getByRole('heading', { name: 'Welcome to Genesis Heritage' })).toBeVisible();
});

test('new user builds a quick tree from the welcome screen', async ({ page }) => {
  current = 'quick-tree';
  state.posted = {};
  await page.goto('/dashboard');
  await page.getByLabel('You', { exact: true }).fill('Dylan Batchelor');
  await page.getByLabel('Your mother', { exact: true }).fill('Ana López');
  await page.getByRole('button', { name: 'Save and find my first records' }).click();
  await expect(page.getByText(/2 people added/)).toBeVisible();
  const rows = state.posted.family_members as Array<{ first_name: string; parent_ids: string[]; id: string }>;
  expect(rows.map((r) => r.first_name)).toEqual(['Dylan', 'Ana']);
  expect(rows[0].parent_ids).toEqual([rows[1].id]);
});

test('importing an Ancestry GEDCOM file adds everyone to the tree', async ({ page }) => {
  current = 'gedcom-import';
  state.posted = {};
  await page.goto('/dashboard?feature=tree-import');
  const ged = ['0 HEAD', '1 SOUR Ancestry.com Family Trees', '0 @I1@ INDI', '1 NAME Rosa /Vega/', '1 FAMS @F1@', '0 @I2@ INDI', '1 NAME Luis /Vega/', '1 FAMC @F1@', '0 @F1@ FAM', '1 WIFE @I1@', '1 CHIL @I2@', '0 TRLR'].join('\n');
  await page.getByLabel('GEDCOM file').setInputFiles({ name: 'tree.ged', mimeType: 'text/plain', buffer: Buffer.from(ged) });
  await expect(page.getByText(/Found/)).toContainText('2 people');
  await page.getByRole('button', { name: /Add 2 people to my tree/ }).click();
  await expect(page.getByText(/2 people are now in your family tree/)).toBeVisible();
  const rows = state.posted.family_members as Array<{ first_name: string; parent_ids: string[]; id: string }>;
  expect(rows.find((r) => r.first_name === 'Luis')!.parent_ids).toEqual([rows.find((r) => r.first_name === 'Rosa')!.id]);
});

test('family tree chart shows generations and adds a missing parent', async ({ page }) => {
  current = 'tree-chart';
  const row = (id: string, first: string, last: string, gender: string, parents: string[], extra = {}) => ({
    id, first_name: first, middle_name: null, last_name: last, gender, birth_date: null, death_date: null, birth_location: null,
    relationship: null, parent_ids: parents, children_ids: [], spouse_ids: [], ...extra,
  });
  state.familyRows = [
    row('11111111-0000-4000-8000-000000000001', 'Dylan', 'Batchelor', 'male', ['11111111-0000-4000-8000-000000000002'], { relationship: 'self', birth_date: '1992-05-01' }),
    row('11111111-0000-4000-8000-000000000002', 'Ana', 'López', 'female', [], { birth_date: '1965-02-02', birth_location: 'Oaxaca, México' }),
  ];
  state.posted = {};
  try {
    await page.goto('/dashboard?feature=family-tree-chart');
    await expect(page.getByRole('button', { name: /Ana López/ })).toBeVisible();
    if (process.env.SHOTS) await page.screenshot({ path: 'test-results/tree-chart.png', fullPage: true });
    await page.getByRole('button', { name: 'Add father' }).first().click();
    await page.getByLabel('Full name').fill('Robert James Batchelor');
    const [req] = await Promise.all([
      page.waitForRequest((r) => r.url().includes('/rest/v1/rpc/add_parent')),
      page.getByRole('button', { name: 'Add to tree' }).click(),
    ]);
    expect(JSON.parse(req.postData() ?? '{}')).toMatchObject({
      p_child: '11111111-0000-4000-8000-000000000001', p_role: 'father', p_first: 'Robert', p_middle: 'James', p_last: 'Batchelor',
    });
    await expect(page.getByText(/added as Dylan Batchelor's father/)).toBeVisible();
  } finally {
    state.familyRows = undefined;
  }
});

test('family map pins birthplaces and draws the move between generations', async ({ page }) => {
  current = 'family-map';
  const row = (id: string, first: string, birth: string, place: string, parents: string[]) => ({
    id, first_name: first, middle_name: null, last_name: 'Vega', birth_date: birth, death_date: null, birth_location: place, death_location: null, parent_ids: parents,
  });
  state.familyRows = [
    row('22222222-0000-4000-8000-000000000001', 'Rosa', '1902-01-01', 'Oaxaca, México', []),
    row('22222222-0000-4000-8000-000000000002', 'Luis', '1950-01-01', 'Toronto, Canada', ['22222222-0000-4000-8000-000000000001']),
    row('22222222-0000-4000-8000-000000000003', 'Ana', '1960-01-01', 'Atlantis', ['22222222-0000-4000-8000-000000000001']),
  ];
  try {
    await page.goto('/dashboard?feature=family-map');
    await expect(page.getByText(/2\s*places/)).toBeVisible();
    await expect(page.getByText(/1\s*move between generations/)).toBeVisible();
    await expect(page.locator('path.leaflet-interactive')).toHaveCount(3); // two pins and one migration line
    await expect(page.getByText('1 place could not be found on the map')).toBeVisible();
    if (process.env.SHOTS) await page.screenshot({ path: 'test-results/family-map.png', fullPage: true });
    await page.getByRole('button', { name: /Play our family's journey/ }).click();
    await expect(page.getByText(/showing up to/)).toBeVisible();
  } finally {
    state.familyRows = undefined;
  }
});

test('old photo restoration shows a before and after', async ({ page }) => {
  current = 'photo-restore';
  await page.goto('/dashboard?feature=photo-restore');
  const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64');
  await page.getByLabel('Photo to restore').setInputFiles({ name: 'grandma.png', mimeType: 'image/png', buffer: png });
  const [req] = await Promise.all([
    page.waitForRequest((r) => r.url().includes('/functions/v1/restore-photo')),
    page.getByRole('button', { name: 'Restore photo' }).click(),
  ]);
  expect(JSON.parse(req.postData() ?? '{}').colourise).toBe(true);
  await expect(page.getByLabel('Slide to compare before and after')).toBeVisible();
  await expect(page.getByText(/Restored with AI/)).toBeVisible();
});

test('life story shows a timeline with ages and world events', async ({ page }) => {
  current = 'life-story';
  const row = (id: string, first: string, birth: string, extra = {}) => ({
    id, first_name: first, middle_name: null, last_name: 'Vega', gender: 'female', birth_date: birth, death_date: null,
    birth_location: null, death_location: null, parent_ids: [], spouse_ids: [], children_ids: [], ...extra,
  });
  state.familyRows = [
    row('33333333-0000-4000-8000-000000000001', 'Rosa', '1902-03-01', { birth_location: 'Oaxaca, México', death_date: '1980-01-01', children_ids: ['33333333-0000-4000-8000-000000000002'] }),
    row('33333333-0000-4000-8000-000000000002', 'Luis', '1930-05-05', { gender: 'male', parent_ids: ['33333333-0000-4000-8000-000000000001'] }),
  ];
  try {
    await page.goto('/dashboard?feature=life-story&person=33333333-0000-4000-8000-000000000001');
    await expect(page.getByRole('heading', { name: 'Rosa Vega' })).toBeVisible();
    await expect(page.getByText('Son Luis Vega is born')).toBeVisible();
    await expect(page.getByText('1930 · age 28')).toBeVisible();
    await expect(page.getByText('The Mexican Revolution (1910–1920)')).toBeVisible();
    await page.getByRole('button', { name: "Write Rosa's life story" }).click();
    await expect(page.getByText('Hello from the mock AI.')).toBeVisible();
  } finally {
    state.familyRows = undefined;
  }
});

test('family invite link: signed-out relative is asked to join, signed-in relative joins', async ({ page, browser }) => {
  current = 'invite';
  const visitor = await (await browser.newContext()).newPage();
  await installMockBackend(visitor, state);
  await visitor.goto('/join/tok123');
  await expect(visitor.getByText(/invited to join your family/)).toBeVisible();
  await expect(visitor.getByRole('button', { name: 'Create Account' })).toBeVisible();
  await page.goto('/join/tok123');
  await expect(page.getByRole('heading', { name: "Join Rosa's family?" })).toBeVisible();
  expect(state.calls.filter((c) => c.includes('accept_family_invite'))).toEqual([]);
  await page.getByRole('button', { name: 'Yes, join' }).click();
  await expect(page.getByText(/joined Rosa's family/)).toBeVisible();
});

test('privacy policy and terms are public', async ({ browser }) => {
  const page = await (await browser.newContext()).newPage();
  await installMockBackend(page, state);
  await page.goto('/privacy');
  await expect(page.getByRole('heading', { name: 'Privacy Policy' })).toBeVisible();
  await expect(page.getByText(/never sell it/)).toBeVisible();
  await page.goto('/terms');
  await expect(page.getByRole('heading', { name: 'Terms of Service' })).toBeVisible();
});

test('pricing page: free user can start PayPal checkout', async ({ page }) => {
  current = 'pricing';
  await page.goto('/pricing');
  await expect(page.getByRole('heading', { name: /choose your plan/i })).toBeVisible();
  const [req] = await Promise.all([
    page.waitForRequest((r) => r.url().includes('paypal-subscription') && (r.postData() ?? '').includes('"create"')),
    page.getByRole('button', { name: 'Subscribe with PayPal' }).first().click(),
  ]);
  expect(JSON.parse(req.postData() ?? '{}')).toEqual({ action: 'create', plan: 'monthly' });
});

test('pricing page: PayPal payment link and e-Transfer give a reference code', async ({ page }) => {
  current = 'pricing-manual';
  state.manualPayments = true;
  state.autoPayPal = false;
  try {
    await page.goto('/pricing');
    await expect(page.getByRole('button', { name: 'Subscribe with PayPal' })).toHaveCount(0);
    await page.getByRole('button', { name: /Pay with PayPal or card \(\$190\.00 CAD\)/ }).click();
    await expect(page.getByText('GEN-TEST01')).toBeVisible();
    await expect(page.getByRole('link', { name: 'Open PayPal checkout' })).toHaveAttribute('href', 'https://www.paypal.com/ncp/payment/TESTYEAR');
    await page.getByRole('button', { name: /Pay by Interac e-Transfer \(\$19\.00 CAD\)/ }).click();
    await expect(page.getByText('pay@example.com')).toBeVisible();
  } finally {
    state.manualPayments = false;
    state.autoPayPal = true;
  }
});

test('pricing page: subscriber sees Pro and can cancel', async ({ page }) => {
  current = 'pricing-pro';
  state.subscribed = true;
  await page.goto('/pricing');
  await expect(page.getByText(/You're on/)).toBeVisible();
  await expect(page.getByRole('button', { name: 'Cancel subscription' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Change payment method' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Upgrade' })).toHaveCount(0);
  state.subscribed = false;
});

test.afterAll(() => {
  fs.mkdirSync('test-results', { recursive: true });
  const unique = [...new Map(problems.map((p) => [`${p.where}|${p.text}`, p])).values()];
  fs.writeFileSync('test-results/problems.json', JSON.stringify(unique, null, 2));
  console.log(`\n${unique.length} distinct console/page errors recorded`);
});
