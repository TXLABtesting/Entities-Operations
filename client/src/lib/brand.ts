/**
 * Brand asset paths, resolved against Vite's BASE_URL so the app works both at
 * the domain root (local dev, custom domain) and under a sub-path (GitHub Pages
 * project site, e.g. /Entities-Operations/).
 *
 * Drop the real files into client/public/brand/ with these exact names.
 */
const BASE = (import.meta.env.BASE_URL || "/").replace(/\/$/, "");

/** Prefix a public-folder path with the configured base. */
export const asset = (path: string) => `${BASE}/${path.replace(/^\//, "")}`;

export const BRAND = {
  /** Full-colour logo for light backgrounds (headers): dark wordmark, white
   *  المساعد inside the blue, no container box. */
  logoColor: asset("brand/logo-color.svg"),
  /** White/monochrome logo for dark backgrounds (Home hero). */
  logoWhite: asset("brand/logo-white.svg"),
  /** Raster logo (PNG) for the PowerPoint export. */
  logoPng: asset("brand/logo.png"),
  /** Optional full-bleed Home background image. */
  landing: asset("brand/landing.webp"),
};
