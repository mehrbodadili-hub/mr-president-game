## Fix game cover image framing

The `<img>` at `src/App.tsx:2479` is wrapped in a `<div>` with border, background, shadow, and rounded corners (line 2478). The user wants only the image shown, no frame around it.

**Change (App.tsx around lines 2477–2487):**

Replace the wrapping `<div className="relative w-full max-w-sm mx-auto rounded-2xl overflow-hidden border border-amber-500/25 mb-6 bg-slate-950 shadow-2xl animate-fadeIn">` with a minimal wrapper carrying only sizing/spacing:

```tsx
<div className="w-full max-w-sm mx-auto mb-6 animate-fadeIn">
  <img
    src={coverImg}
    referrerPolicy="no-referrer"
    alt="Mr. President Game Cover"
    loading="lazy"
    decoding="async"
    className="w-full h-auto block"
  />
</div>
```

This removes the border, background, shadow, and rounded corners around the image so only the image itself is displayed.
