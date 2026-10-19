import React from 'react';
import { Copy, Printer, Share2 } from 'lucide-react';
import { toast } from 'sonner';
import { formatGiftCode, type Gift } from '../lib/gifts';
import { locale, t, useLang } from '../lib/i18n';

const escapeHtml = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string));

export const redeemLink = (code: string) => `${window.location.origin}/redeem?code=${formatGiftCode(code)}`;

function cardText(gift: Gift) {
  const code = formatGiftCode(gift.code ?? '');
  return {
    title: gift.recipient_name ? t('A gift for {name}', { name: gift.recipient_name }) : t('A gift for you'),
    what: gift.months === 12 ? t('One year of Genesis Heritage Pro') : t('One month of Genesis Heritage Pro'),
    how: t('To use it, go to {link} and enter this code:', { link: `${window.location.origin}/redeem` }),
    code,
    until: gift.expires_at ? t('Use it before {date}.', { date: new Date(gift.expires_at).toLocaleDateString(locale()) }) : '',
  };
}

/** The gift code, ready to print as a card or send in a message. */
export const GiftCard: React.FC<{ gift: Gift }> = ({ gift }) => {
  useLang();
  if (!gift.code) return null;
  const c = cardText(gift);

  const print = () => {
    const w = window.open('', '_blank');
    if (!w) { toast.error(t('Your browser blocked the print window. Please allow pop-ups for this site.')); return; }
    w.document.write(`<!doctype html><html lang="${document.documentElement.lang}"><head><meta charset="utf-8"><title>${escapeHtml(c.title)}</title>
<style>body{font-family:Georgia,serif;background:#fff;color:#1f3a2e;margin:0}.card{max-width:560px;margin:40px auto;border:3px solid #2E5A44;border-radius:18px;padding:40px;text-align:center;background:#faf7f0}
h1{font-size:30px;margin:0 0 8px}.what{font-size:20px;margin:0 0 20px}.msg{font-style:italic;font-size:18px;margin:20px 0}.code{font-family:monospace;font-size:30px;letter-spacing:3px;background:#fff;border:1px dashed #2E5A44;padding:12px;border-radius:10px;margin:16px 0}
.small{font-size:14px;color:#3d4a43}@page{margin:12mm}</style></head><body><div class="card">
<h1>${escapeHtml(c.title)}</h1><p class="what">${escapeHtml(c.what)}</p>${gift.message ? `<p class="msg">“${escapeHtml(gift.message)}”</p>` : ''}
<p class="small">${escapeHtml(c.how)}</p><div class="code">${escapeHtml(c.code)}</div><p class="small">${escapeHtml(c.until)}</p></div>
<script>window.onload=function(){window.print()}</script></body></html>`);
    w.document.close();
  };

  const message = [c.title, c.what, gift.message ? `“${gift.message}”` : '', `${c.how} ${c.code}`, redeemLink(gift.code), c.until].filter(Boolean).join('\n');
  const share = async () => {
    try {
      if (navigator.share) { await navigator.share({ title: c.title, text: message }); return; }
    } catch { /* closed or not allowed: copy instead */ }
    try { await navigator.clipboard.writeText(message); toast.success(t('Copied. Paste it into a message or email.')); }
    catch { toast.error(t('Could not copy on this device.')); }
  };
  const copyCode = () => navigator.clipboard.writeText(c.code).then(() => toast.success(t('Copied')), () => toast.error(t('Could not copy on this device.')));

  return (
    <div className="rounded-xl border-2 border-[#2E5A44] bg-[#faf7f0] p-5 text-center space-y-2" data-testid="gift-card">
      <p className="text-lg font-semibold text-[#1f3a2e]">{c.title}</p>
      <p className="text-[#3d4a43]">{c.what}</p>
      {gift.message && <p className="italic text-[#3d4a43]">“{gift.message}”</p>}
      <p className="font-mono text-2xl tracking-widest bg-white border border-dashed border-[#2E5A44] rounded-lg py-2" aria-label={t('Gift code')}>{c.code}</p>
      {c.until && <p className="text-sm text-[#5c6660]">{c.until}</p>}
      <div className="flex flex-wrap justify-center gap-2 pt-1">
        <button onClick={print} className="inline-flex items-center gap-2 min-h-[44px] px-4 rounded-lg bg-[#2E5A44] text-white"><Printer className="w-4 h-4" aria-hidden /> {t('Print the card')}</button>
        <button onClick={share} className="inline-flex items-center gap-2 min-h-[44px] px-4 rounded-lg border border-[#2E5A44] text-[#2E5A44]"><Share2 className="w-4 h-4" aria-hidden /> {t('Send it')}</button>
        <button onClick={copyCode} className="inline-flex items-center gap-2 min-h-[44px] px-4 rounded-lg border"><Copy className="w-4 h-4" aria-hidden /> {t('Copy code')}</button>
      </div>
    </div>
  );
};

export default GiftCard;
