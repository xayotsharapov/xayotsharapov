import Link from "next/link";

export function Pagination({
  page,
  pages,
  href,
}: {
  page: number;
  pages: number;
  href: (n: number) => string;
}) {
  if (pages <= 1) return null;
  const nums = Array.from({ length: pages }, (_, i) => i + 1).filter(
    (n) => n === 1 || n === pages || Math.abs(n - page) <= 1,
  );
  const base = "inline-flex h-10 min-w-10 items-center justify-center rounded-md px-3 text-sm";

  return (
    <nav aria-label="Sahifalar" className="mt-16 flex flex-wrap items-center justify-center gap-1">
      {page > 1 && (
        <Link href={href(page - 1)} rel="prev" className={`${base} text-muted hover:bg-surface hover:text-fg`}>
          ← Oldingi
        </Link>
      )}
      {nums.map((n, i) => (
        <span key={n} className="flex items-center">
          {i > 0 && n - nums[i - 1] > 1 && <span className="px-1 text-faint">…</span>}
          <Link
            href={href(n)}
            aria-current={n === page ? "page" : undefined}
            className={`${base} ${n === page ? "bg-fg text-bg" : "text-muted hover:bg-surface hover:text-fg"}`}
          >
            {n}
          </Link>
        </span>
      ))}
      {page < pages && (
        <Link href={href(page + 1)} rel="next" className={`${base} text-muted hover:bg-surface hover:text-fg`}>
          Keyingi →
        </Link>
      )}
    </nav>
  );
}
