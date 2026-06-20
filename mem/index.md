# Project Memory

## Core
Bilingual app (Persian + English). All user-facing text MUST use `t('key')` via `useTranslation()` from `react-i18next`. Never hardcode Persian or English strings in components.
Whenever a string is added or changed: add the SAME key to BOTH `src/i18n/locales/fa.json` and `src/i18n/locales/en.json` in the same edit.
RTL for Persian, LTR for English. Use `i18n.language !== 'en'` (or `isRtl`) to gate `dir` and text-align classes.
Language toggle component lives at `src/components/LanguageToggle.tsx`. Selected language persists in `localStorage` under key `president_lang`.
Role names/abilities live under `roles.<roleType>.{name,dayAbility,nightAbility,chooser,description}` — never read `nameFa` etc. from `constants.ts` for display.

## Memories
- [i18n architecture](mem://design/i18n) — how the bilingual setup is wired
*** End Patch