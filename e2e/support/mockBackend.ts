import type { BrowserContext, Page, Route } from '@playwright/test';

// A tiny stand-in for Supabase so the whole UI can be exercised without real credentials.
export const MOCK_URL = 'https://mock.supabase.co';
const USER = {
  id: '00000000-0000-4000-8000-000000000001',
  aud: 'authenticated',
  role: 'authenticated',
  email: 'beta@example.com',
  app_metadata: {},
  user_metadata: {},
  created_at: '2024-01-01T00:00:00Z',
};
const SESSION = {
  access_token: 'mock.access.token',
  refresh_token: 'mock-refresh',
  token_type: 'bearer',
  expires_in: 3600 * 24 * 365,
  expires_at: Math.floor(Date.now() / 1000) + 3600 * 24 * 365,
  user: USER,
};

export interface MockState {
  subscribed: boolean;
  calls: string[]; // every backend call, "METHOD path"
  chatQuotaExceeded: boolean;
  manualPayments?: boolean; // e-Transfer email and PayPal payment links are configured
  autoPayPal?: boolean;     // automatic PayPal subscriptions are configured (default true)
  admin?: boolean;          // the signed-in user is an admin
  familyRows?: unknown[];   // rows returned for family_members
  recordHits?: unknown[];   // hits returned by records-search
  storyRows?: unknown[];    // rows returned for cultural_stories
  posted?: Record<string, unknown[]>; // bodies of POSTs, by table
  storageFiles?: Record<string, string[]>;
  waitlistRows?: unknown[];
  memoryRequest?: { token: string; view: unknown }; // what get_memory_request returns for that token  // rows returned for waitlist_signups (admin view) // files in each storage bucket, as paths under the user's folder
}

export async function signIn(context: BrowserContext) {
  await context.addInitScript((s) => localStorage.setItem('genesis.auth.token', JSON.stringify(s)), SESSION);
}

export async function installMockBackend(page: Page, state: MockState) {
  const json = (route: Route, body: unknown, status = 200, headers: Record<string, string> = {}) =>
    route.fulfill({ status, contentType: 'application/json', headers: { 'access-control-allow-origin': '*', 'access-control-expose-headers': 'content-range', ...headers }, body: JSON.stringify(body) });

  await page.route(`${MOCK_URL}/**`, async (route) => {
    const req = route.request();
    const url = new URL(req.url());
    const path = url.pathname;
    state.calls.push(`${req.method()} ${path}`);

    if (req.method() === 'OPTIONS') {
      return route.fulfill({
        status: 204,
        headers: {
          'access-control-allow-origin': '*',
          'access-control-allow-headers': '*',
          'access-control-allow-methods': '*',
        },
      });
    }
    if (path.startsWith('/auth/v1/user')) return json(route, USER);
    if (path.startsWith('/auth/v1/token')) return json(route, SESSION);
    if (path.startsWith('/auth/v1/logout')) return route.fulfill({ status: 204, headers: { 'access-control-allow-origin': '*' } });

    if (path.startsWith('/functions/v1/')) {
      const fn = path.split('/')[3];
      if (fn === 'ai-router') {
        (state.posted ??= {})['ai-router'] = [...(state.posted['ai-router'] ?? []), JSON.parse(req.postData() ?? 'null')];
        if (state.chatQuotaExceeded) return json(route, { error: 'Free daily limit reached. Upgrade to keep chatting.', code: 'UPGRADE_REQUIRED' }, 429);
        return json(route, { response: 'Hello from the mock AI.', provider: 'mock', model: 'mock-1', remaining: 9 });
      }
      if (fn === 'records-search' && state.recordHits) return json(route, { hits: state.recordHits, sources: [] });
      if (fn === 'restore-photo') return json(route, { bucket: 'family-photos', path: `${USER.id}/restored-1.png` });
      if (fn === 'geocode-places') {
        const known: Record<string, { lat: number; lon: number }> = { 'oaxaca, méxico': { lat: 17.07, lon: -96.72 }, 'toronto, canada': { lat: 43.65, lon: -79.38 } };
        const places: string[] = JSON.parse(req.postData() ?? '{}').places ?? [];
        const results = Object.fromEntries(places.map((p) => [p.trim().toLowerCase(), known[p.trim().toLowerCase()] ?? { lat: null, lon: null }]));
        return json(route, { results, pending: 0 });
      }
      if (fn === 'voice-synthesis') {
        return route.fulfill({ status: 200, contentType: 'audio/mpeg', headers: { 'access-control-allow-origin': '*' }, body: Buffer.from([0xff, 0xfb, 0x90, 0x00]) });
      }
      if (fn === 'paypal-subscription') {
        if (JSON.parse(req.postData() ?? '{}').action === 'config') return json(route, { subscriptions: state.autoPayPal !== false });
        return json(route, { url: 'https://www.sandbox.paypal.test/approve', status: state.subscribed ? 'active' : 'pending' });
      }
      return json(route, { status: 'healthy', data: [], results: [] });
    }

    if (path === '/rest/v1/rpc/has_pro_access') return json(route, state.subscribed);
    if (path === '/rest/v1/rpc/is_admin') return json(route, state.admin === true);
    if (path === '/rest/v1/rpc/preview_family_invite') return json(route, { owner_name: 'Rosa', role: 'contributor', own: false, joined: false });
    if (path === '/rest/v1/rpc/accept_family_invite') return json(route, { owner_id: USER.id, owner_name: 'Rosa', role: 'contributor' });
    if (path === '/rest/v1/rpc/create_manual_payment_request') {
      const { p_plan, p_method } = JSON.parse(req.postData() ?? '{}');
      return json(route, {
        id: '22222222-2222-4222-8222-222222222222', method: p_method, plan: p_plan, amount_cents: p_plan === 'monthly' ? 1900 : 19000,
        currency: 'CAD', reference_code: 'GEN-TEST01', status: 'pending', created_at: '2026-01-01T00:00:00Z',
      });
    }
    if (path === '/rest/v1/rpc/get_memory_request') {
      const { p_token } = JSON.parse(req.postData() ?? '{}');
      return json(route, p_token === state.memoryRequest?.token ? state.memoryRequest.view : null);
    }
    if (path === '/rest/v1/rpc/answer_memory_request') {
      (state.posted ??= {}).answer_memory_request = [...(state.posted.answer_memory_request ?? []), JSON.parse(req.postData() ?? 'null')];
      return json(route, true);
    }
    if (path === '/rest/v1/rpc/join_waitlist' || path === '/rest/v1/rpc/join_waitlist_v2') {
      const body = JSON.parse(req.postData() ?? '{}');
      (state.posted ??= {}).join_waitlist = [...(state.posted.join_waitlist ?? []), body];
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]{2,}$/.test(String(body.p_email ?? '').trim())) return json(route, { ok: false, reason: 'Please enter a valid email address.' });
      return json(route, { ok: true, already: false, code: 'abc12345', position: 42, invited: 0 });
    }
    if (path === '/rest/v1/rpc/merge_family_members' || path === '/rest/v1/rpc/undo_family_merge') {
      (state.posted ??= {})[path.slice(13)] = [...(state.posted[path.slice(13)] ?? []), JSON.parse(req.postData() ?? 'null')];
      return json(route, '44444444-4444-4444-8444-444444444444');
    }
    if (path.startsWith('/rest/v1/rpc/')) return json(route, []);
    if (path.startsWith('/rest/v1/')) {
      const table = path.split('/')[3];
      const wantsObject = (req.headers()['accept'] ?? '').includes('vnd.pgrst.object');
      let rows: unknown[] = [];
      if (table === 'subscriptions' && state.subscribed) {
        rows = [{ user_id: USER.id, status: 'active', provider: 'paypal', current_period_end: '2030-01-01T00:00:00Z', cancel_at_period_end: false }];
      }
      if (table === 'family_members' && ['GET', 'HEAD'].includes(req.method()) && state.familyRows) rows = state.familyRows;
      if (table === 'cultural_stories' && req.method() === 'GET' && state.storyRows) rows = state.storyRows;
      if (table === 'waitlist_signups' && req.method() === 'GET' && state.waitlistRows) rows = state.waitlistRows;
      // Hints the page saved come back when it reloads, as the database would return them.
      if (table === 'record_hints' && req.method() === 'GET') {
        rows = (state.posted?.record_hints ?? []).map((h, i) => ({ id: `hint-${i}`, status: 'new', ...(h as object) }));
      }
      if (table === 'app_settings' && state.manualPayments) {
        rows = [
          { key: 'etransfer_email', value: 'pay@example.com' },
          { key: 'etransfer_monthly_cents', value: 1900 },
          { key: 'etransfer_yearly_cents', value: 19000 },
          { key: 'paypal_link_monthly_url', value: 'https://www.paypal.com/ncp/payment/TESTMONTH' },
          { key: 'paypal_link_yearly_url', value: 'https://www.paypal.com/ncp/payment/TESTYEAR' },
        ];
      }
      if (req.method() === 'POST') {
        const body = JSON.parse(req.postData() ?? 'null');
        (state.posted ??= {})[table] = [...(state.posted[table] ?? []), ...(Array.isArray(body) ? body : [body])];
      }
      if (req.method() === 'POST' || req.method() === 'PATCH') rows = [{ id: '11111111-1111-4111-8111-111111111111', token: 'tok123' }];
      if (table === 'memory_requests' && req.method() === 'POST') {
        const body = JSON.parse(req.postData() ?? '{}');
        rows = [{ ...body, id: '22222222-0000-4000-8000-000000000001', token: 'aaaabbbbccccddddeeeeffff00001111', created_at: new Date().toISOString(), closed_at: null }];
      }
      if (wantsObject) return rows.length ? json(route, rows[0]) : json(route, { code: 'PGRST116', message: 'no rows' }, 406);
      // Page like the real database: ?offset=&limit= (from .range() and .limit()).
      const total = rows.length;
      const offset = Number(url.searchParams.get('offset') ?? 0);
      const limit = url.searchParams.has('limit') ? Number(url.searchParams.get('limit')) : total;
      rows = rows.slice(offset, offset + limit);
      return json(route, rows, 200, { 'content-range': `${offset}-${Math.max(offset + rows.length - 1, offset)}/${total}` });
    }
    if (path.startsWith('/storage/v1/object/sign/')) return json(route, { signedURL: '/icons/icon-512x512.png' });
    if (path.startsWith('/storage/v1/object/list/')) {
      const bucket = path.split('/')[5];
      const prefix = (JSON.parse(req.postData() ?? '{}').prefix ?? '') as string;
      const under = prefix.split('/').slice(1).join('/');
      const names = new Map<string, boolean>(); // name -> is a file
      for (const f of state.storageFiles?.[bucket] ?? []) {
        if (under && !f.startsWith(`${under}/`)) continue;
        const rest = under ? f.slice(under.length + 1) : f;
        const [head, ...tail] = rest.split('/');
        names.set(head, tail.length === 0);
      }
      return json(route, [...names].map(([name, file]) => ({ name, id: file ? `id-${name}` : null })));
    }
    if (path.startsWith('/storage/v1/object/') && req.method() === 'GET' && state.storageFiles) {
      return route.fulfill({ status: 200, contentType: 'application/octet-stream', headers: { 'access-control-allow-origin': '*' }, body: Buffer.from(`file:${path.split('/').pop()}`) });
    }
    if (path.startsWith('/storage/v1/object/') && req.method() === 'POST') return json(route, { Key: path.replace('/storage/v1/object/', ''), Id: 'mock-file' });
    if (path.startsWith('/storage/v1/')) return json(route, []);
    return json(route, {});
  });

  // Anything leaving the app to a third party is blocked in tests so nothing is spent or sent.
  await page.route(/^https?:\/\/(?!localhost|127\.0\.0\.1|mock\.supabase\.co)/, (route) => {
    const u = route.request().url();
    if (/fonts\.(googleapis|gstatic)\.com/.test(u)) return route.abort();
    return route.abort();
  });
}

export interface Problem { where: string; kind: string; text: string }

export function collectProblems(page: Page, bucket: Problem[], where: () => string) {
  page.on('pageerror', (e) => bucket.push({ where: where(), kind: 'pageerror', text: e.message }));
  page.on('console', (m) => {
    if (m.type() !== 'error') return;
    const text = m.text();
    if (/Failed to load resource|net::ERR_FAILED|ERR_BLOCKED/.test(text)) return; // blocked third parties
    bucket.push({ where: where(), kind: 'console.error', text: text.slice(0, 300) });
  });
}
