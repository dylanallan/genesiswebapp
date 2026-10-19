import { test, expect, type Route } from '@playwright/test';
import { installMockBackend, signIn, type MockState } from './support/mockBackend';

const TOKEN = 'abcdef0123456789abcdef0123456789';
const reply = (route: Route, body: unknown) =>
  route.fulfill({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify(body) });
const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

test('a year of weekly questions is set up, and the sender sees this week’s question with ways to send it', async ({ page, context }) => {
  await signIn(context);
  const state: MockState = { subscribed: false, calls: [] };
  await installMockBackend(page, state);
  const started = new Date(); started.setDate(started.getDate() - 7);
  let created = false;
  await page.route('**/rest/v1/story_series?*', async (route) => {
    if (route.request().method() === 'POST') { created = true; return route.fallback(); }
    return reply(route, created ? [{ id: 's1', token: TOKEN, relative_name: 'Grandma Rosa', questions: ['Where were you born?', 'What was your first job?', 'How did you meet Grandpa?'], start_on: iso(started), created_at: new Date().toISOString(), closed_at: null }] : []);
  });
  await page.route('**/rest/v1/story_series_answers?*', (route) => reply(route, [{ series_id: 's1' }]));

  await page.goto('/dashboard?feature=weekly-questions');
  await expect(page.getByRole('heading', { name: 'Weekly story questions' })).toBeVisible();
  await expect(page.getByText(/^52 questions, one a week/)).toBeVisible();

  await page.getByRole('button', { name: 'Change the questions' }).click();
  await page.getByRole('button', { name: 'Remove question 1', exact: true }).click();
  await page.getByLabel('Add your own question').fill('What was Grandpa’s favourite joke?');
  await page.getByRole('button', { name: 'Add', exact: true }).click();
  await expect(page.getByText(/^52 questions, one a week/)).toBeVisible();

  await page.getByLabel('Who is it for?').fill('Grandma Rosa');
  await page.getByLabel('Your name, as they know you').fill('Léa');
  await page.getByRole('button', { name: 'Start weekly questions' }).click();
  await expect(page.getByText('Weekly questions are ready for Grandma Rosa. Send them the link below.')).toBeVisible();

  const sent = (state.posted?.story_series ?? [])[0] as { relative_name: string; from_name: string; questions: string[]; start_on: string };
  expect(sent.relative_name).toBe('Grandma Rosa');
  expect(sent.from_name).toBe('Léa');
  expect(sent.questions).toHaveLength(52);
  expect(sent.questions[0]).toBe('What are your earliest memories?');
  expect(sent.questions.at(-1)).toBe('What was Grandpa’s favourite joke?');
  expect(sent.start_on).toBe(iso(new Date()));

  const card = page.getByTestId('series-card');
  await expect(card.getByText('Week 2 of 3 · 1 answered')).toBeVisible();
  await expect(card.getByText('What was your first job?')).toBeVisible();
  await expect(card.getByText(/^Next question opens on/)).toBeVisible();
  const sms = await card.getByRole('link', { name: 'Text message' }).getAttribute('href');
  expect(decodeURIComponent(sms ?? '')).toContain(`this week’s family story question is ready: “What was your first job?”`);
  expect(decodeURIComponent(sms ?? '')).toContain(`/weekly/${TOKEN}`);
  await expect(card.getByRole('link', { name: 'Turn the answers into a family book' })).toBeVisible();
});

test('the relative answers this week’s question without an account and is told when the next one opens', async ({ page }) => {
  await installMockBackend(page, { subscribed: false, calls: [] } as MockState);
  const next = new Date(); next.setDate(next.getDate() + 3);
  let answered: number[] = [0];
  const answers: unknown[] = [];
  await page.route('**/rest/v1/rpc/get_story_series', (route) => reply(route, {
    from_name: 'Léa', relative_name: 'Grandma Rosa', questions: ['Where were you born?', 'What was your first job?'], total: 52, next_on: iso(next), answered, closed: false,
  }));
  await page.route('**/rest/v1/rpc/answer_story_series', (route) => { answers.push(JSON.parse(route.request().postData() ?? '{}')); answered = [0, 1]; return reply(route, true); });

  await page.goto(`/weekly/${TOKEN}`);
  await expect(page.getByRole('heading', { name: 'Hello Grandma Rosa' })).toBeVisible();
  await expect(page.getByText('A new question opens every week. Keep this link to come back.')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'What was your first job?' })).toBeVisible();
  await page.getByRole('textbox').fill('I sold newspapers on rue Saint-Jean.');
  await page.getByRole('button', { name: 'Save my answer' }).click();
  await expect(page.getByText('Saved. Thank you!')).toBeVisible();
  expect(answers[0]).toEqual({ p_token: TOKEN, p_index: 1, p_text: 'I sold newspapers on rue Saint-Jean.' });
  await expect(page.getByText(/That’s this week’s question done\. Thank you, Grandma Rosa! The next one opens on/)).toBeVisible();
});

test('weekly questions in French', async ({ page, context }) => {
  await signIn(context);
  await context.addInitScript(() => localStorage.setItem('genesis-lang', 'fr'));
  await installMockBackend(page, { subscribed: false, calls: [] } as MockState);
  await page.goto('/dashboard?feature=weekly-questions');
  await expect(page.getByRole('heading', { name: 'Questions de la semaine' })).toBeVisible();
  await expect(page.getByText('Quels sont vos tout premiers souvenirs ?')).toBeVisible();
});
