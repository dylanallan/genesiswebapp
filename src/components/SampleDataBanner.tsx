import { t, useLang } from '../lib/i18n';

// Shown on demo / showcase screens whose numbers are illustrative rather than the user's own data.
export default function SampleDataBanner({ what = 'figures on this page' }: { what?: string }) {
  useLang();
  return (
    <div role="note" className="mb-4 rounded-lg border border-amber-300 bg-amber-50 px-4 py-2 text-sm text-amber-900">
      <strong>{t('Sample data:')}</strong> {t('the {what} are illustrative examples for demonstration, not your account’s results.', { what: t(what) })}
    </div>
  );
}
