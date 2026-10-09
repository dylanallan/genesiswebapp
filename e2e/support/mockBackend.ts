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
}

export async function signIn(context: BrowserContext) {
  await context.addInitScript((s) => localStorage.setItem('genesis.auth.token', JSON.stringify(s)), SESSION);
}

export async function installMockBackend(page: Page, state: MockState) {
  const json = (route: Route, body: unknown, status = 200, headers: Record<string, string> = {}) =>
    route.fulfill({ status, contentType: 'application/json', headers: { 'access-control-allow-origin': '*', ...headers }, body: JSON.stringify(body) });

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
        if (state.chatQuotaExceeded) return json(route, { error: 'Free daily limit reached. Upgrade to keep chatting.', code: 'UPGRADE_REQUIRED' }, 429);
        return json(route, { response: 'Hello from the mock AI.', provider: 'mock', model: 'mock-1', remaining: 9 });
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
    if (path === '/rest/v1/rpc/create_manual_payment_request') {
      const { p_plan, p_method } = JSON.parse(req.postData() ?? '{}');
      return json(route, {
        id: '22222222-2222-4222-8222-222222222222', method: p_method, plan: p_plan, amount_cents: p_plan === 'monthly' ? 1900 : 19000,
        currency: 'CAD', reference_code: 'GEN-TEST01', status: 'pending', created_at: '2026-01-01T00:00:00Z',
      });
    }
    if (path.startsWith('/rest/v1/rpc/')) return json(route, []);
    if (path.startsWith('/rest/v1/')) {
      const table = path.split('/')[3];
      const wantsObject = (req.headers()['accept'] ?? '').includes('vnd.pgrst.object');
      let rows: unknown[] = [];
      if (table === 'subscriptions' && state.subscribed) {
        rows = [{ user_id: USER.id, status: 'active', provider: 'paypal', current_period_end: '2030-01-01T00:00:00Z', cancel_at_period_end: false }];
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
      if (req.method() === 'POST' || req.method() === 'PATCH') rows = [{ id: '11111111-1111-4111-8111-111111111111' }];
      if (wantsObject) return rows.length ? json(route, rows[0]) : json(route, { code: 'PGRST116', message: 'no rows' }, 406);
      return json(route, rows, 200, { 'content-range': `0-${Math.max(rows.length - 1, 0)}/${rows.length}` });
    }
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
