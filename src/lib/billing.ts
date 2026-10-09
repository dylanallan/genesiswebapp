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

// ---- Interac e-Transfer (manual) ----
export interface ManualPayment {
  id: string;
  plan: 'monthly' | 'yearly';
  amount_cents: number;
  currency: string;
  reference_code: string;
  status: 'pending' | 'confirmed' | 'rejected';
  created_at: string;
}

export async function createEtransferRequest(plan: 'monthly' | 'yearly'): Promise<ManualPayment> {
  const { data, error } = await supabase.rpc('create_etransfer_request', { p_plan: plan });
  if (error) throw new Error(/not configured/i.test(error.message) ? 'e-Transfer is not available yet.' : 'Could not create your e-Transfer request.');
  return data as ManualPayment;
}

export interface EtransferSettings { email: string; monthlyCents: number; yearlyCents: number }

export async function getEtransferSettings(): Promise<EtransferSettings | null> {
  const { data } = await supabase.from('app_settings').select('key,value').in('key', ['etransfer_email', 'etransfer_monthly_cents', 'etransfer_yearly_cents']);
  const get = (k: string) => (data ?? []).find((r: { key: string; value: unknown }) => r.key === k)?.value;
  const email = String(get('etransfer_email') ?? '');
  if (!email) return null; // not offered until an admin sets the receiving email
  return { email, monthlyCents: Number(get('etransfer_monthly_cents') ?? 0), yearlyCents: Number(get('etransfer_yearly_cents') ?? 0) };
}

export const formatCad = (cents: number) => `$${(cents / 100).toFixed(2)} CAD`;
