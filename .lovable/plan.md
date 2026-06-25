## Plan

Add an English version of the cover image and swap it based on the active language.

### Steps

1. Upload the attached English cover (`ChatGPT Image Jun 25, 2026, 04_13_42 PM.png`) via `lovable-assets` → create `src/assets/game_cover_en.jpg.asset.json`.
2. In `src/App.tsx`:
   - Import the new `coverAssetEn`.
   - Pick image based on `i18n.language` (`en` → English cover, otherwise the existing Persian cover).
3. Leave the Persian cover untouched for the Farsi UI.

No other behavior changes.