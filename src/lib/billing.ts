import { supabase } from './supabase';

// Calls an Edge Function that returns { url } and sends the browser there (Stripe-hosted page).
async function redirectViaFunction(name: string, body: Record<string, unknown> = {}) {
  const { data, error } = await supabase.functions.invoke(name, { body });
  if (error) {
    let message = 'Something went wrong. Please try again.';
    try {
      const payload = await (error as { context?: Response }).context?.json();
      if (payload?.error) message = payload.error;
    } catch { /* use default message */ }
    throw new Error(message);
  }
  if (!data?.url) throw new Error('Billing service did not return a link. Please try again.');
  window.location.assign(data.url);
}

export const startCheckout = (plan: 'monthly' | 'yearly') => redirectViaFunction('create-checkout-session', { plan });
export const openBillingPortal = () => redirectViaFunction('create-portal-session');
