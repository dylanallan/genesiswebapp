import React, { useEffect, useState } from 'react';
import { MoreVertical, PlusSquare, Share, Smartphone, X } from 'lucide-react';
import { toast } from 'sonner';
import { t, useLang } from '../lib/i18n';
import { canOfferInstall, isInstalled, offerInstall, onInstallChange, platformFrom } from '../lib/install';

const HIDE_KEY = 'genesis-install-hidden';

// "Put Genesis on your phone": one button where the browser allows it, otherwise two picture steps.
// Hidden once Genesis is opened from the home screen, or when the person closes it.
export const InstallApp: React.FC = () => {
  useLang();
  const [canOffer, setCanOffer] = useState(canOfferInstall);
  const [hidden, setHidden] = useState(() => {
    try { return localStorage.getItem(HIDE_KEY) === '1'; } catch { return false; }
  });
  useEffect(() => onInstallChange(() => setCanOffer(canOfferInstall())), []);

  const platform = platformFrom(navigator.userAgent, navigator.maxTouchPoints);
  if (hidden || isInstalled() || (platform === 'desktop' && !canOffer)) return null;

  const hide = () => {
    setHidden(true);
    try { localStorage.setItem(HIDE_KEY, '1'); } catch { /* still hidden for this visit */ }
  };
  const install = async () => {
    if (await offerInstall()) toast.success(t('Genesis is on your home screen. Tap the green icon to open it.'));
  };

  const steps = platform === 'ios'
    ? [
        { icon: Share, text: t('Tap the Share button (the square with an arrow pointing up) at the bottom or top of the screen.') },
        { icon: PlusSquare, text: t('Scroll down and tap “Add to Home Screen”, then tap “Add”.') },
      ]
    : [
        { icon: MoreVertical, text: t('Tap the menu button (three dots) at the top right of the screen.') },
        { icon: PlusSquare, text: t('Tap “Install app” or “Add to Home screen”, then tap “Install”.') },
      ];

  return (
    <section aria-labelledby="install-title" className="relative rounded-xl border-2 border-genesis-200 bg-genesis-50 p-4 space-y-3" data-testid="install-app">
      <button onClick={hide} aria-label={t('Close')} className="absolute top-1 right-1 w-11 h-11 flex items-center justify-center text-gray-500 hover:text-gray-800">
        <X className="w-5 h-5" />
      </button>
      <h3 id="install-title" className="text-lg font-semibold flex items-center gap-2 pr-10">
        <Smartphone className="w-6 h-6 text-genesis-600" aria-hidden /> {t('Put Genesis on your phone')}
      </h3>
      <p className="text-gray-700">{t('Open Genesis with one tap from your home screen, like any other app. No app store and nothing to pay.')}</p>
      {canOffer ? (
        <button onClick={install} className="w-full sm:w-auto px-5 py-3 min-h-[44px] bg-genesis-600 text-white rounded-lg text-lg hover:bg-genesis-700">
          {t('Add Genesis to my home screen')}
        </button>
      ) : (
        <ol className="space-y-2">
          {steps.map((s, i) => (
            <li key={i} className="flex items-start gap-3 rounded-lg bg-white border p-3">
              <span className="flex items-center justify-center w-8 h-8 shrink-0 rounded-full bg-genesis-600 text-white font-semibold" aria-hidden>{i + 1}</span>
              <s.icon className="w-6 h-6 shrink-0 text-genesis-700 mt-1" aria-hidden />
              <span className="text-gray-800">{s.text}</span>
            </li>
          ))}
          {platform === 'ios' && <li className="text-sm text-gray-600">{t('On an iPhone, this works best in Safari.')}</li>}
        </ol>
      )}
    </section>
  );
};

export default InstallApp;
