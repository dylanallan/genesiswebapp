// Gift subscriptions: pay for a month or a year of Pro for someone else, who redeems a 12-character code.
// Payment goes through the same manual payments as the Plans page (e-Transfer or PayPal payment link, confirmed by an admin).
import { supabase } from './supabase';
import type { ManualMethod, ManualPayment } from './billing';

export type GiftPlan = 'monthly' | 'yearly';

export interface Gift {
  id: string;
  code: string | null; // shown only once the payment is confirmed
  plan: GiftPlan;
  months: number;
  recipient_name: string | null;
  recipient_email: string | null;
  message: string | null;
  status: 'pending' | 'paid' | 'redeemed' | 'cancelled';
  created_at: string;
  paid_at: string | null;
  expires_at: string | null;
  redeemed_at: string | null;
  reference_code: string;
  amount_cents: number;
  method: ManualMethod;
}

export interface GiftRequest { recipientName?: string; recipientEmail?: string; message?: string }

/** Starts a gift and returns the payment to make (same reference-code flow as the Plans page). */
export async function createGiftRequest(plan: GiftPlan, method: ManualMethod, gift: GiftRequest): Promise<ManualPayment> {
  const { data, error } = await supabase.rpc('create_gift_request', {
    p_plan: plan, p_method: method,
    p_recipient_name: gift.recipientName?.trim() || null, p_recipient_email: gift.recipientEmail?.trim() || null, p_message: gift.message?.trim() || null,
  });
  if (error) {
    if (/not configured/i.test(error.message)) throw new Error('This way of paying is not available yet.');
    if (/email/i.test(error.message)) throw new Error('Please check the email address, or leave it empty.');
    if (/too many/i.test(error.message)) throw new Error('You have several gifts waiting for payment. Please pay for those first.');
    throw new Error('We couldn’t start your gift. Please try again.');
  }
  return (data as { payment: ManualPayment }).payment;
}

export async function myGifts(): Promise<Gift[]> {
  const { data, error } = await supabase.rpc('my_gifts');
  if (error) throw new Error('We couldn’t load your gifts.');
  return (data ?? []) as Gift[];
}

export type RedeemResult = { ok: true; months: number; until: string } | { ok: false; reason: string };

export async function redeemGiftCode(code: string): Promise<RedeemResult> {
  const { data, error } = await supabase.rpc('redeem_gift_code', { p_code: code });
  if (error || !data) return { ok: false, reason: 'We couldn’t check that code just now. Please try again.' };
  return data as RedeemResult;
}

/** Letters and digits only, upper case: "abcd-efgh jkmn" -> "ABCDEFGHJKMN". */
export const cleanGiftCode = (code: string) => code.toUpperCase().replace(/[^A-Z0-9]/g, '');

/** Easier to read aloud and type: ABCD-EFGH-JKMN. */
export const formatGiftCode = (code: string) => cleanGiftCode(code).replace(/(.{4})(?=.)/g, '$1-');

// A code someone opened from a gift link, kept on this device while they make an account.
const KEY = 'genesis-gift-code';
export function rememberGiftCode(code: string) {
  try { localStorage.setItem(KEY, cleanGiftCode(code)); } catch { /* storage blocked: they type it again */ }
}
// Taken once per visit and then remembered, so a screen drawn twice still gets the code.
let taken: string | undefined;
export function takeGiftCode(): string {
  if (taken !== undefined) return taken;
  try { taken = localStorage.getItem(KEY) ?? ''; localStorage.removeItem(KEY); } catch { taken = ''; }
  return taken;
}
