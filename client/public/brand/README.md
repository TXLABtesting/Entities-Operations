# Brand assets (drop-in)

These files are served as static assets at `/brand/<file>` by Vite.
Replace the placeholders below with the real brand files (keep the **exact same
filenames**) and they will appear automatically — no code change needed.

| File | Used by | Notes |
|------|---------|-------|
| `logo-color.svg` | headers on Tracks / TracksList / WorkPlan / ReviewEdit | Full-colour logo on light backgrounds |
| `logo-white.svg` | Home hero, dark headers | White/monochrome logo for dark backgrounds |
| `logo.png`       | PowerPoint export (`exportPptx.ts`) | Raster logo (PNG) for slides |
| `landing.webp`   | Home page background | Full-bleed hero background image |

The previous build loaded these from an external Manus/Forge storage proxy
(`/manus-storage/...`) which requires `BUILT_IN_FORGE_API_URL` +
`BUILT_IN_FORGE_API_KEY`. Serving them locally removes that dependency.

If a logo file is missing, the UI falls back to a styled text wordmark instead of
showing a broken-image icon. If `landing.webp` is missing, the Home page uses a
designed gradient background.
