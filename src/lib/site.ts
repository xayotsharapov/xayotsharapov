// ─── Edit these to make the site yours ───────────────────────────────
export const site = {
  name: "Ism Familiya", // TODO: your name
  role: "Kopirayter va Meta reklama mutaxassisi",
  description:
    "Kopirayting, Meta reklama va sotuvchi matnlar haqida shaxsiy blog.",
  intro:
    "Salom! Men matn yozaman va Meta’da reklama yurgizaman. Bu yerda ish jarayonida o‘rgangan narsalarim haqida yozaman: qanday sarlavha bosiladi, qaysi reklama sotadi va nimalar pulni behuda sovuradi.",
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
