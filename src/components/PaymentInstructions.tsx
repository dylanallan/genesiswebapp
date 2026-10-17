import React from 'react';
import { Copy } from 'lucide-react';
import { toast } from 'sonner';
import { formatCad, type ManualPayment, type ManualPaymentSettings } from '../lib/billing';
import { t, useLang } from '../lib/i18n';

/** A translated sentence with {placeholders} filled by React elements (bold amounts, links). */
export function tParts(english: string, parts: Record<string, React.ReactNode>): React.ReactNode[] {
  return t(english).split(/(\{\w+\})/).map((piece, i) => {
    const key = /^\{(\w+)\}$/.exec(piece)?.[1];
    return <React.Fragment key={i}>{key && key in parts ? parts[key] : piece}</React.Fragment>;
  });
}

// How to pay a manual payment (Interac e-Transfer or a PayPal payment link) with its reference code.
// Used on the Plans page and the gift page, so both explain it the same way.
export const PaymentInstructions: React.FC<{ request: ManualPayment; manual: ManualPaymentSettings; done?: React.ReactNode; footnote?: boolean }> = ({ request, manual, done, footnote = true }) => {
  useLang();
  const amount = <strong>{formatCad(request.amount_cents)}</strong>;
  return (
    <section className="mt-8 rounded-xl border border-blue-200 bg-blue-50 p-6 text-blue-950" aria-live="polite" data-testid="payment-instructions">
      <h2 className="text-lg font-semibold mb-2">{request.method === 'paypal_link' ? t('Pay with PayPal') : t('Send your Interac e-Transfer')}</h2>
      <ol className="list-decimal pl-5 space-y-1 text-sm">
        <li>
          {t('Your reference code:')}{' '}
          <code className="rounded bg-white px-2 py-0.5 font-mono">{request.reference_code}</code>{' '}
          <button className="inline-flex items-center gap-1 underline" onClick={() => navigator.clipboard.writeText(request.reference_code).then(() => toast.success(t('Copied')))}>
            <Copy className="h-3 w-3" />{t('copy')}
          </button>
        </li>
        {request.method === 'paypal_link' ? (
          <li>
            <a className="font-semibold underline" href={manual.paypalLinks[request.plan]} target="_blank" rel="noopener noreferrer">{t('Open PayPal checkout')}</a>{' '}
            {tParts('and pay {amount} with your PayPal account or a card. Paste the reference code into the note box at checkout.', { amount })}
          </li>
        ) : (
          <li>{tParts('Send {amount} to {email} and put the reference code in the message.', { amount, email: <strong>{manual.etransferEmail}</strong> })}</li>
        )}
        <li>{done ?? t('We’ll switch on Pro as soon as the payment arrives (usually within one business day). This page will show it.')}</li>
      </ol>
      {footnote && <p className="mt-3 text-xs text-blue-800">{t('One-time payments do not renew automatically. Pay again any time to extend; days are never lost.')}</p>}
    </section>
  );
};

export default PaymentInstructions;
