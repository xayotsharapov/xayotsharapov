// ─── Edit these to make the site yours ───────────────────────────────
export const site = {
  name: "Xayot Sharapov",
  description:
    "Kopirayting, Meta reklama va sotuvchi matnlar haqida shaxsiy blog.",
  intro: "Balkim bu yerda ma'qolalar bo'lar...",
  locale: "uz_UZ",
  lang: "uz",
};

/** Absolute site URL: NEXT_PUBLIC_SITE_URL → Vercel production URL → localhost. */
export function siteUrl(): string {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "");
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL)
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3000";
}
