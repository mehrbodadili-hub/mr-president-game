import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import fa from './locales/fa.json';

if (!i18n.isInitialized) {
  i18n
    .use(initReactI18next)
    .init({
      resources: {
        fa: { translation: fa },
      },
      lng: 'fa',
      fallbackLng: 'fa',
      supportedLngs: ['fa'],
      interpolation: { escapeValue: false },
    });
}

export function applyHtmlDir(lng: string) {
  if (typeof document === 'undefined') return;
  document.documentElement.setAttribute('lang', 'fa');
  document.documentElement.setAttribute('dir', 'rtl');
  void lng;
}

i18n.on('languageChanged', applyHtmlDir);
if (typeof document !== 'undefined') applyHtmlDir(i18n.language || 'fa');

export default i18n;

/**
 * Inline bilingual helper (Persian-only mode): always returns the Persian
 * string. The English argument is ignored and kept for call-site compatibility.
 */
export function tl(fa: string, en: string): string {
  void en;
  return fa;
}