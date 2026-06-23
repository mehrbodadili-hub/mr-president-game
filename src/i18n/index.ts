import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import fa from './locales/fa.json';
import en from './locales/en.json';

if (!i18n.isInitialized) {
  i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
      resources: {
        fa: { translation: fa },
        en: { translation: en },
      },
      fallbackLng: 'fa',
      supportedLngs: ['fa', 'en'],
      interpolation: { escapeValue: false },
      detection: {
        order: ['localStorage', 'navigator'],
        lookupLocalStorage: 'president_lang',
        caches: ['localStorage'],
      },
    });
}

export function applyHtmlDir(lng: string) {
  if (typeof document === 'undefined') return;
  const dir = lng === 'fa' ? 'rtl' : 'ltr';
  document.documentElement.setAttribute('lang', lng);
  document.documentElement.setAttribute('dir', dir);
}

i18n.on('languageChanged', applyHtmlDir);
if (typeof document !== 'undefined') applyHtmlDir(i18n.language || 'fa');

export default i18n;

/**
 * Inline bilingual helper: returns the Persian string when the active language
 * is Persian, otherwise the English string. Used for dynamic narrative log
 * messages where a full key/JSON entry would be overkill.
 */
export function tl(fa: string, en: string): string {
  return (i18n.language || 'fa').startsWith('en') ? en : fa;
}