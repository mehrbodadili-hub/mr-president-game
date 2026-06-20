# Plan: Port "آقای رئیس‌جمهور - دستیار بازی" into Lovable

I'll bring your AI Studio game over exactly as it is — same screens, same Persian text, same logic, same look. The only changes are the minimum needed to make it run inside the Lovable (TanStack Start) project.

## What gets copied as-is

From the uploaded zip, all gameplay code moves over unchanged:

- `src/App.tsx` (~4358 lines — the full game controller)
- `src/types.ts`, `src/constants.ts`, `src/utils.ts`
- All 12 components in `src/components/` (Day0Setup, NightWizard, ChaosPhase, PlayerCard, RoleTable, SearchManager, SpeakingTimer, GameGuide, CollapsibleGuide, ConditionsModal, Night0Terrorist)
- The cover image `regenerated_image_1780649811869.jpg` (uploaded to Lovable's CDN so the repo stays small; the other 3 unused cover images are dropped)
- Persian RTL styling, Vazirmatn Google Font, dark background, custom gold-glow animation, custom scrollbar — all kept identical
- Login (Mehrbod / Said), localStorage persistence, dev panel, execution modes, simulated winner — all kept identical

## Minimum integration changes

1. **Mount under TanStack Start routing.** `src/routes/index.tsx` becomes a thin wrapper that renders the ported `App` component on the client only (the game heavily uses `localStorage` / `window`, so it runs after mount to avoid SSR mismatches). The `<html lang="en">` shell in `__root.tsx` gets `dir="rtl"` and the page `<title>` updates to "آقای رئیس‌جمهور - دستیار بازی".
2. **Styles.** Vazirmatn font `<link>` goes into `__root.tsx` head (per Tailwind v4 rules — no remote `@import` in CSS). The body background `#050608`, font, gold-glow keyframes, and custom scrollbar move into `src/styles.css`.
3. **Dependencies.** Install `motion` and `@google/genai` (lucide-react is already present). `express`, `dotenv`, `tsx` from the original are dev-server-only and not needed here.
4. **Asset reference.** The single `new URL('./assets/images/...', import.meta.url)` cover-image import is replaced with the Lovable CDN URL from the uploaded asset pointer. No code logic changes.
5. **Cleanup.** The current placeholder home page (blank-app SVG) is removed.

## What is NOT changing

- No redesign, no refactor, no feature additions or removals
- No backend / Lovable Cloud — the game is purely client-side with localStorage, same as the original
- No new auth system — the existing hardcoded login stays exactly as you have it
- Game rules, role logic, night/day phases, chaos phase, search manager, timer — untouched

## Technical notes

- TanStack Start runs SSR; the game expects `localStorage` at module scope of several `useState` initializers. The wrapper route gates rendering with a `useEffect` mounted flag so `App` only renders in the browser. This is a one-line guard — no edits inside `App.tsx`.
- `import.meta.env.DEV` still works under Vite 7 / TanStack Start, so the dev-mode panel detection keeps functioning.
- Tailwind v4 is already configured here; the original also used Tailwind v4, so utility classes port over unchanged.
- Lovable login chrome around the published app is separate from the in-game login screen — both will exist; the in-game one is preserved as you built it.

After implementing, I'll run the project build to confirm everything compiles, then you can open the preview and log in with your existing credentials.

