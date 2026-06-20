import { useTranslation } from 'react-i18next';
import { Languages } from 'lucide-react';

export default function LanguageToggle() {
  const { i18n, t } = useTranslation();
  const current = i18n.language?.startsWith('en') ? 'en' : 'fa';
  const next = current === 'fa' ? 'en' : 'fa';
  const handleClick = () => {
    i18n.changeLanguage(next);
  };
  return (
    <button
      type="button"
      onClick={handleClick}
      title={t('language.switchTo', { lang: t(`language.${next}`) })}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-900 hover:bg-slate-800 text-slate-200 text-xs font-semibold transition"
    >
      <Languages className="w-4 h-4 text-amber-400" />
      <span className="font-mono">{current === 'fa' ? 'EN' : 'FA'}</span>
    </button>
  );
}