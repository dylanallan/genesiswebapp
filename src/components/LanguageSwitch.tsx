import React from 'react';
import { Globe2 } from 'lucide-react';
import { LANGS, setLang, t, useLang } from '../lib/i18n';

/** "English / Français" switch. Remembered on this device. */
export const LanguageSwitch: React.FC<{ className?: string }> = ({ className = '' }) => {
  const lang = useLang();
  const other = LANGS.find((l) => l.id !== lang)!;
  return (
    <button type="button" onClick={() => setLang(other.id)} lang={other.id === 'fr' ? 'fr' : 'en'}
      aria-label={`${t('Language')}: ${other.label}`} className={`inline-flex items-center gap-1 hover:underline ${className}`}>
      <Globe2 className="w-4 h-4" aria-hidden="true" /> {other.label}
    </button>
  );
};

export default LanguageSwitch;
