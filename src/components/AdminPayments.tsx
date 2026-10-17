import { useCallback, useEffect, useState } from 'react';
import { CheckCircle, XCircle, Loader2, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '../lib/supabase';
import { formatCad, isPayPalLink, MANUAL_SETTING_KEYS } from '../lib/billing';

interface Row {
  id: string; email: string; method: 'etransfer' | 'paypal_link'; plan: string; amount_cents: number; reference_code: string;
  status: string; admin_note: string | null; created_at: string; confirmed_at: string | null;
}

// Admin: confirm e-Transfers and PayPal payment-link payments as they arrive, and set how customers pay.
export default function AdminPayments() {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [status, setStatus] = useState<'pending' | 'confirmed' | 'rejected'>('pending');
  const [rows, setRows] = useState<Row[]>([]);
  // Which payments buy a gift (the code goes to someone else; the payer does not get Pro).
  const [gifts, setGifts] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState({ email: '', monthly: '', yearly: '', linkMonthly: '', linkYearly: '' });

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.rpc('admin_list_manual_payments', { p_status: status });
    if (error) {
      const notAdmin = /admin/i.test(error.message);
      setIsAdmin(!notAdmin);
      if (!notAdmin) toast.error('Could not load payments');
    } else {
      setIsAdmin(true);
      const list = (data ?? []) as Row[];
      setRows(list);
      const ids = list.map((r) => r.id);
      const { data: giftRows } = ids.length
        ? await supabase.from('gift_codes').select('payment_id,recipient_name').in('payment_id', ids)
        : { data: [] };
      setGifts(Object.fromEntries(((giftRows ?? []) as Array<{ payment_id: string; recipient_name: string | null }>).map((g) => [g.payment_id, g.recipient_name ?? ''])));
    }
    setLoading(false);
  }, [status]);

  useEffect(() => { void load(); }, [load]);

  useEffect(() => {
    supabase.from('app_settings').select('key,value').in('key', MANUAL_SETTING_KEYS)
      .then(({ data }: { data: Array<{ key: string; value: unknown }> | null }) => {
        const get = (k: string) => (data ?? []).find((r) => r.key === k)?.value;
        setSettings({
          email: String(get('etransfer_email') ?? ''),
          monthly: get('etransfer_monthly_cents') ? (Number(get('etransfer_monthly_cents')) / 100).toFixed(2) : '',
          yearly: get('etransfer_yearly_cents') ? (Number(get('etransfer_yearly_cents')) / 100).toFixed(2) : '',
          linkMonthly: String(get('paypal_link_monthly_url') ?? ''),
          linkYearly: String(get('paypal_link_yearly_url') ?? ''),
        });
      });
  }, []);

  const review = async (row: Row, approve: boolean) => {
    const giftNote = row.id in gifts ? 'This is a GIFT: the buyer gets a code to give away, not Pro. ' : '';
    const note = window.prompt(approve ? `${giftNote}Confirm ${formatCad(row.amount_cents)} by ${row.method === 'paypal_link' ? 'PayPal' : 'e-Transfer'} from ${row.email} (${row.reference_code})? Optional note:` : 'Reason for rejecting (optional):', '');
    if (note === null) return;
    const { error } = await supabase.rpc('review_manual_payment', { p_payment_id: row.id, p_approve: approve, p_note: note || null });
    if (error) return toast.error(error.message);
    const gift = row.id in gifts;
    toast.success(approve ? (gift ? `Gift code ready for ${row.email} to give` : `Pro activated for ${row.email}`) : 'Payment rejected');
    void load();
  };

  const saveSettings = async () => {
    const monthly = Math.round(Number(settings.monthly) * 100);
    const yearly = Math.round(Number(settings.yearly) * 100);
    if (settings.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(settings.email)) return toast.error('Enter a valid e-Transfer email');
    if (!(monthly > 0) || !(yearly > 0)) return toast.error('Enter both prices');
    for (const link of [settings.linkMonthly, settings.linkYearly]) {
      if (link && !isPayPalLink(link)) return toast.error('PayPal links must start with https://www.paypal.com/');
    }
    const calls = [
      supabase.rpc('set_setting', { setting_key: 'etransfer_email', setting_value: settings.email, setting_category: 'billing', setting_data_type: 'string' }),
      supabase.rpc('set_setting', { setting_key: 'etransfer_monthly_cents', setting_value: monthly, setting_category: 'billing', setting_data_type: 'number' }),
      supabase.rpc('set_setting', { setting_key: 'etransfer_yearly_cents', setting_value: yearly, setting_category: 'billing', setting_data_type: 'number' }),
      supabase.rpc('set_setting', { setting_key: 'paypal_link_monthly_url', setting_value: settings.linkMonthly.trim(), setting_category: 'billing', setting_data_type: 'string' }),
      supabase.rpc('set_setting', { setting_key: 'paypal_link_yearly_url', setting_value: settings.linkYearly.trim(), setting_category: 'billing', setting_data_type: 'string' }),
    ];
    const results = await Promise.all(calls);
    if (results.some((r: { error: unknown }) => r.error)) return toast.error('Could not save settings');
    toast.success('Payment settings saved');
  };

  if (isAdmin === false) return <p className="rounded-xl border bg-white p-6 text-gray-600">This screen is for administrators.</p>;

  return (
    <div className="space-y-6">
      <section className="rounded-xl border bg-white p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold">Payments to confirm</h2>
          <div className="flex items-center gap-2">
            <select aria-label="Status" className="border rounded px-2 py-1 text-sm" value={status} onChange={(e) => setStatus(e.target.value as typeof status)}>
              <option value="pending">Waiting for payment</option>
              <option value="confirmed">Confirmed</option>
              <option value="rejected">Rejected</option>
            </select>
            <button onClick={load} className="p-1 text-gray-600" aria-label="Refresh"><RefreshCw className="h-4 w-4" /></button>
          </div>
        </div>
        {loading ? <Loader2 className="animate-spin" /> : rows.length === 0 ? (
          <p className="text-gray-600 text-sm">Nothing here.</p>
        ) : (
          <table className="w-full text-sm">
            <thead><tr className="text-left text-gray-500"><th className="py-1">Reference</th><th>Method</th><th>Customer</th><th>Plan</th><th>Amount</th><th>Requested</th><th /></tr></thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-t">
                  <td className="py-2 font-mono">{r.reference_code}</td>
                  <td>{r.method === 'paypal_link' ? 'PayPal' : 'e-Transfer'}</td>
                  <td>{r.email}</td>
                  <td>{r.plan}{r.id in gifts && <span className="ml-1 rounded bg-amber-100 px-1.5 text-xs text-amber-900" title={gifts[r.id] ? `Gift for ${gifts[r.id]}` : 'Gift'}>Gift{gifts[r.id] ? ` for ${gifts[r.id]}` : ''}</span>}</td>
                  <td>{formatCad(r.amount_cents)}</td>
                  <td>{new Date(r.created_at).toLocaleDateString()}</td>
                  <td className="text-right whitespace-nowrap">
                    {r.status === 'pending' ? (
                      <>
                        <button onClick={() => review(r, true)} className="inline-flex items-center gap-1 rounded bg-green-600 px-2 py-1 text-white"><CheckCircle className="h-4 w-4" />Received</button>{' '}
                        <button onClick={() => review(r, false)} className="inline-flex items-center gap-1 rounded border px-2 py-1"><XCircle className="h-4 w-4" />Reject</button>
                      </>
                    ) : <span className="text-gray-500">{r.admin_note ?? r.status}</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section className="rounded-xl border bg-white p-6">
        <h2 className="text-lg font-semibold mb-3">One-time payment settings</h2>
        <p className="text-sm text-gray-600 mb-3">
          The e-Transfer option appears on the Plans page once an email is set. The PayPal option appears once a PayPal
          payment link is set (create one in PayPal for the same price, and add a note field called “Reference code”).
          Before pressing Received for a PayPal payment, check that it arrived in PayPal with the matching code.
        </p>
        <div className="grid gap-3 sm:grid-cols-3">
          <label className="text-sm">Receiving email<input className="mt-1 w-full border rounded px-2 py-1" value={settings.email} onChange={(e) => setSettings({ ...settings, email: e.target.value })} /></label>
          <label className="text-sm">Monthly price (CAD)<input inputMode="decimal" className="mt-1 w-full border rounded px-2 py-1" value={settings.monthly} onChange={(e) => setSettings({ ...settings, monthly: e.target.value })} /></label>
          <label className="text-sm">Yearly price (CAD)<input inputMode="decimal" className="mt-1 w-full border rounded px-2 py-1" value={settings.yearly} onChange={(e) => setSettings({ ...settings, yearly: e.target.value })} /></label>
          <label className="text-sm sm:col-span-3">PayPal payment link, monthly<input className="mt-1 w-full border rounded px-2 py-1" placeholder="https://www.paypal.com/ncp/payment/…" value={settings.linkMonthly} onChange={(e) => setSettings({ ...settings, linkMonthly: e.target.value })} /></label>
          <label className="text-sm sm:col-span-3">PayPal payment link, yearly<input className="mt-1 w-full border rounded px-2 py-1" placeholder="https://www.paypal.com/ncp/payment/…" value={settings.linkYearly} onChange={(e) => setSettings({ ...settings, linkYearly: e.target.value })} /></label>
        </div>
        <button onClick={saveSettings} className="mt-4 rounded bg-blue-600 px-4 py-2 text-white">Save</button>
      </section>
    </div>
  );
}
