import Link from "next/link";
import { formatDate, formatViews } from "@/lib/format";
import type { Category } from "@/lib/types";

export function PostMeta({
  category,
  publishedAt,
  readingMinutes,
  views,
  linkCategory = true,
  className = "",
}: {
  category: Category | null;
  publishedAt: string | null;
  readingMinutes: number;
  views?: number;
  linkCategory?: boolean;
  className?: string;
}) {
  const items: React.ReactNode[] = [];
  if (category)
    items.push(
      linkCategory ? (
        <Link
          key="c"
          href={`/blog?category=${category.slug}`}
          className="relative z-10 font-medium text-accent hover:underline"
        >
          {category.name}
        </Link>
      ) : (
        <span key="c" className="font-medium text-accent">
          {category.name}
        </span>
      ),
    );
  if (publishedAt)
    items.push(
      <time key="d" dateTime={publishedAt}>
        {formatDate(publishedAt)}
      </time>,
    );
  items.push(<span key="r">{readingMinutes} daqiqa</span>);
  if (views !== undefined) items.push(<span key="v">{formatViews(views)} marta o‘qilgan</span>);

  return (
    <div className={`flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted ${className}`}>
      {items.map((it, i) => (
        <span key={i} className="flex items-center gap-x-2">
          {i > 0 && <span aria-hidden className="text-faint">·</span>}
          {it}
        </span>
      ))}
    </div>
  );
}
