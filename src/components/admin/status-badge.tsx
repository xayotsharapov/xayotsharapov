import type { PostStatus } from "@/lib/types";

export function StatusBadge({ status, scheduled }: { status: PostStatus; scheduled?: boolean }) {
  const label = status === "draft" ? "Qoralama" : scheduled ? "Rejalashtirilgan" : "Nashr qilingan";
  const tone =
    status === "draft"
      ? "bg-surface text-muted"
      : scheduled
        ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
        : "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300";
  return <span className={`rounded px-2 py-0.5 text-xs font-medium ${tone}`}>{label}</span>;
}
