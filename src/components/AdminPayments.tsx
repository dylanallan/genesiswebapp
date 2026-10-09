import { useCallback, useEffect, useState } from 'react';
import { CheckCircle, XCircle, Loader2, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '../lib/supabase';
import { formatCad } from '../lib/billing';

interface Row {
  id: string; email: string; plan: string; amount_cents: number; reference_code: string;
  status: string; admin_note: string | null; created_at: string; confirmed_at: string | null;
}

// Admin: confirm Interac e-Transfers as they arrive, and set where customers send them.
export default function AdminPayments() {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [status, setStatus] = useState<'pending' | 'confirmed' | 'rejected'>('pending');
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState({ email: '', monthly: '', yearly: '' });

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.rpc('admin_list_manual_payments', { p_status: status });
    if (error) {
      const notAdmin = /admin/i.test(error.message);
      setIsAdmin(!notAdmin);
      if (!notAdmin) toast.error('Could not load payments');
    } else {
      setIsAdmin(true);
      setRows((data ?? []) as Row[]);
    }
    setLoading(false);
  }, [status]);

  useEffect(() => { void load(); }, [load]);

  useEffect(() => {
    supabase.from('app_settings').select('key,value').in('key', ['etransfer_email', 'etransfer_monthly_cents', 'etransfer_yearly_cents'])
      .then(({ data }: { data: Array<{ key: string; value: unknown }> | null }) => {
        const get = (k: string) => (data ?? []).find((r) => r.key === k)?.value;
        setSettings({
          email: String(get('etransfer_email') ?? ''),
          monthly: get('etransfer_monthly_cents') ? (Number(get('etransfer_monthly_cents')) / 100).toFixed(2) : '',
          yearly: get('etransfer_yearly_cents') ? (Number(get('etransfer_yearly_cents')) / 100).toFixed(2) : '',
        });
      });
  }, []);

  const review = async (row: Row, approve: boolean) => {
    const note = window.prompt(approve ? `Confirm ${formatCad(row.amount_cents)} from ${row.email} (${row.reference_code})? Optional note:` : 'Reason for rejecting (optional):', '');
    if (note === null) return;
    const { error } = await supabase.rpc('review_manual_payment', { p_payment_id: row.id, p_approve: approve, p_note: note || null });
    if (error) return toast.error(error.message);
    toast.success(approve ? `Pro activated for ${row.email}` : 'Payment rejected');
    void load();
  };

  const saveSettings = async () => {
    const monthly = Math.round(Number(settings.monthly) * 100);
    const yearly = Math.round(Number(settings.yearly) * 100);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(settings.email)) return toast.error('Enter a valid e-Transfer email');
    if (!(monthly > 0) || !(yearly > 0)) return toast.error('Enter both prices');
    const calls = [
      supabase.rpc('set_setting', { setting_key: 'etransfer_email', setting_value: settings.email, setting_category: 'billing', setting_data_type: 'string' }),
      supabase.rpc('set_setting', { setting_key: 'etransfer_monthly_cents', setting_value: monthly, setting_category: 'billing', setting_data_type: 'number' }),
      supabase.rpc('set_setting', { setting_key: 'etransfer_yearly_cents', setting_value: yearly, setting_category: 'billing', setting_data_type: 'number' }),
    ];
    const results = await Promise.all(calls);
    if (results.some((r: { error: unknown }) => r.error)) return toast.error('Could not save settings');
    toast.success('e-Transfer settings saved');
  };

  if (isAdmin === false) return <p className="rounded-xl border bg-white p-6 text-gray-600">This screen is for administrators.</p>;

  return (
    <div className="space-y-6">
      <section className="rounded-xl border bg-white p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold">Interac e-Transfer payments</h2>
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
            <thead><tr className="text-left text-gray-500"><th className="py-1">Reference</th><th>Customer</th><th>Plan</th><th>Amount</th><th>Requested</th><th /></tr></thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-t">
                  <td className="py-2 font-mono">{r.reference_code}</td>
                  <td>{r.email}</td>
                  <td>{r.plan}</td>
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
        <h2 className="text-lg font-semibold mb-3">e-Transfer settings</h2>
        <p className="text-sm text-gray-600 mb-3">The e-Transfer option appears on the Plans page once an email is set.</p>
        <div className="grid gap-3 sm:grid-cols-3">
          <label className="text-sm">Receiving email<input className="mt-1 w-full border rounded px-2 py-1" value={settings.email} onChange={(e) => setSettings({ ...settings, email: e.target.value })} /></label>
          <label className="text-sm">Monthly price (CAD)<input inputMode="decimal" className="mt-1 w-full border rounded px-2 py-1" value={settings.monthly} onChange={(e) => setSettings({ ...settings, monthly: e.target.value })} /></label>
          <label className="text-sm">Yearly price (CAD)<input inputMode="decimal" className="mt-1 w-full border rounded px-2 py-1" value={settings.yearly} onChange={(e) => setSettings({ ...settings, yearly: e.target.value })} /></label>
        </div>
        <button onClick={saveSettings} className="mt-4 rounded bg-blue-600 px-4 py-2 text-white">Save</button>
      </section>
    </div>
  );
}
