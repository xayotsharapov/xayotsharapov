const MONTHS = [
  "yanvar", "fevral", "mart", "aprel", "may", "iyun",
  "iyul", "avgust", "sentabr", "oktabr", "noyabr", "dekabr",
];

/** "3-noyabr, 2026" in Tashkent time. */
export function formatDate(iso: string | null | undefined): string {
  if (!iso) return "";
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Tashkent",
    year: "numeric",
    month: "numeric",
    day: "numeric",
  }).formatToParts(new Date(iso));
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value);
  return `${get("day")}-${MONTHS[get("month") - 1]}, ${get("year")}`;
}

export function formatViews(n: number): string {
  return new Intl.NumberFormat("ru-RU").format(n);
}
