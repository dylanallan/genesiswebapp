import { supabase } from './supabase';

async function callBilling<T>(body: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase.functions.invoke('paypal-subscription', { body });
  if (error) {
    let message = 'Something went wrong. Please try again.';
    try {
      const payload = await (error as { context?: Response }).context?.json();
      if (payload?.error) message = payload.error;
    } catch { /* use default message */ }
    throw new Error(message);
  }
  return data as T;
}

// PayPal: sends the browser to PayPal's own approval page.
export async function startCheckout(plan: 'monthly' | 'yearly') {
  const { url } = await callBilling<{ url?: string }>({ action: 'create', plan });
  if (!url) throw new Error('PayPal did not return a link. Please try again.');
  window.location.assign(url);
}

// Re-reads the subscription from PayPal (used when returning from PayPal, before the webhook lands).
export const syncPayPalSubscription = () => callBilling<{ status: string }>({ action: 'sync' });

// Stops renewal; access continues until the end of the period already paid for.
export const cancelPayPalSubscription = (reason?: string) => callBilling<{ status: string; currentPeriodEnd: string | null }>({ action: 'cancel', reason });

// Where PayPal customers change the card or bank account behind an automatic payment.
export const PAYPAL_MANAGE_URL = 'https://www.paypal.com/myaccount/autopay/';

// Whether automatic PayPal subscriptions are set up on the server (needs PayPal developer credentials).
// Anything other than an explicit "no" keeps the button, so a slow or failed check never hides it.
export async function paypalSubscriptionsEnabled(): Promise<boolean> {
  try {
    const { data } = await supabase.functions.invoke('paypal-subscription', { body: { action: 'config' } });
    return (data as { subscriptions?: boolean } | null)?.subscriptions !== false;
  } catch {
    return true;
  }
}

// ---- Manual payments: Interac e-Transfer and PayPal payment links, confirmed by an admin ----
export type ManualMethod = 'etransfer' | 'paypal_link';

export interface ManualPayment {
  id: string;
  method: ManualMethod;
  plan: 'monthly' | 'yearly';
  amount_cents: number;
  currency: string;
  reference_code: string;
  status: 'pending' | 'confirmed' | 'rejected';
  created_at: string;
}

export async function createManualPaymentRequest(plan: 'monthly' | 'yearly', method: ManualMethod): Promise<ManualPayment> {
  const { data, error } = await supabase.rpc('create_manual_payment_request', { p_plan: plan, p_method: method });
  if (error) {
    const label = method === 'etransfer' ? 'e-Transfer' : 'PayPal payment';
    throw new Error(/not configured/i.test(error.message) ? `${label} is not available yet.` : `Could not create your ${label} request.`);
  }
  return data as ManualPayment;
}

export const createEtransferRequest = (plan: 'monthly' | 'yearly') => createManualPaymentRequest(plan, 'etransfer');

export interface ManualPaymentSettings {
  etransferEmail: string;
  monthlyCents: number;
  yearlyCents: number;
  paypalLinks: { monthly: string; yearly: string };
}

export const MANUAL_SETTING_KEYS = [
  'etransfer_email', 'etransfer_monthly_cents', 'etransfer_yearly_cents', 'paypal_link_monthly_url', 'paypal_link_yearly_url',
];

// Returns null when no manual method is offered yet (no e-Transfer email and no PayPal links set).
export async function getManualPaymentSettings(): Promise<ManualPaymentSettings | null> {
  const { data } = await supabase.from('app_settings').select('key,value').in('key', MANUAL_SETTING_KEYS);
  const get = (k: string) => (data ?? []).find((r: { key: string; value: unknown }) => r.key === k)?.value;
  const settings = {
    etransferEmail: String(get('etransfer_email') ?? ''),
    monthlyCents: Number(get('etransfer_monthly_cents') ?? 0),
    yearlyCents: Number(get('etransfer_yearly_cents') ?? 0),
    paypalLinks: { monthly: String(get('paypal_link_monthly_url') ?? ''), yearly: String(get('paypal_link_yearly_url') ?? '') },
  };
  if (!(settings.monthlyCents > 0 && settings.yearlyCents > 0)) return null;
  if (!settings.etransferEmail && !settings.paypalLinks.monthly && !settings.paypalLinks.yearly) return null;
  return settings;
}

// Only PayPal's own payment pages may be opened from the Plans page.
export const isPayPalLink = (url: string) => /^https:\/\/(www\.)?paypal\.com\//i.test(url);

export const formatCad = (cents: number) => `$${(cents / 100).toFixed(2)} CAD`;
