import type { Metadata } from "next";
import Link from "next/link";
import { getCategories, getPosts, isSort, PAGE_SIZE, SORTS, type Sort } from "@/lib/posts";
import { PostCard } from "@/components/site/post-card";
import { Pagination } from "@/components/site/pagination";

type SP = Promise<{ category?: string; sort?: string; page?: string }>;

function parse(sp: Awaited<SP>) {
  const sort: Sort = isSort(sp.sort) ? sp.sort : "newest";
  const page = Math.max(1, Math.floor(Number(sp.page)) || 1);
  return { category: sp.category, sort, page };
}

/** Build a /blog URL, dropping default values so URLs stay clean and shareable. */
function blogHref(p: { category?: string; sort?: Sort; page?: number }) {
  const q = new URLSearchParams();
  if (p.category) q.set("category", p.category);
  if (p.sort && p.sort !== "newest") q.set("sort", p.sort);
  if (p.page && p.page > 1) q.set("page", String(p.page));
  const s = q.toString();
  return s ? `/blog?${s}` : "/blog";
}

export async function generateMetadata({ searchParams }: { searchParams: SP }): Promise<Metadata> {
  const { category, page } = parse(await searchParams);
  const cat = category ? (await getCategories().catch(() => [])).find((c) => c.slug === category) : undefined;
  const title = cat ? `${cat.name} — maqolalar` : "Blog";
  return {
    title: page > 1 ? `${title} (${page}-sahifa)` : title,
    description: cat
      ? `${cat.name} mavzusidagi barcha maqolalar.`
      : "Kopirayting va Meta reklama haqidagi barcha maqolalar.",
    // Sort variants point to the default order; categories and pages are their own pages.
    alternates: { canonical: blogHref({ category: cat?.slug, page }) },
    robots: category && !cat ? { index: false } : undefined,
  };
}

export default async function BlogPage({ searchParams }: { searchParams: SP }) {
  const { category, sort, page } = parse(await searchParams);
  const categories = await getCategories().catch(() => []);
  const active = categories.find((c) => c.slug === category);
  const unknownCategory = !!category && !active;

  const { posts, total } = unknownCategory
    ? { posts: [], total: 0 }
    : await getPosts({ categoryId: active?.id, sort, page }).catch(() => ({ posts: [], total: 0 }));
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const chip = (on: boolean) =>
    `rounded-full border px-3.5 py-1.5 text-sm transition-colors ${
      on ? "border-fg bg-fg text-bg" : "border-line text-muted hover:border-fg/40 hover:text-fg"
    }`;

  return (
    <div className="pt-10 sm:pt-16">
      <h1 className="font-serif text-4xl font-semibold tracking-tight sm:text-5xl">
        {active ? active.name : "Blog"}
      </h1>

      <div className="mt-8 flex flex-col gap-4 border-b border-line pb-6 sm:flex-row sm:items-center sm:justify-between">
        <nav aria-label="Kategoriyalar" className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0">
          <Link href={blogHref({ sort })} className={`${chip(!active)} shrink-0`} aria-current={!active ? "page" : undefined}>
            Hammasi
          </Link>
          {categories.map((c) => (
            <Link
              key={c.id}
              href={blogHref({ category: c.slug, sort })}
              className={`${chip(active?.id === c.id)} shrink-0`}
              aria-current={active?.id === c.id ? "page" : undefined}
            >
              {c.name}
            </Link>
          ))}
        </nav>
        <nav aria-label="Saralash" className="flex shrink-0 gap-4 text-sm">
          {(Object.keys(SORTS) as Sort[]).map((s) => (
            <Link
              key={s}
              href={blogHref({ category: active?.slug, sort: s })}
              className={s === sort ? "font-medium text-fg" : "text-muted hover:text-fg"}
              aria-current={s === sort ? "true" : undefined}
            >
              {SORTS[s]}
            </Link>
          ))}
        </nav>
      </div>

      {posts.length === 0 ? (
        <p className="py-16 text-muted">
          {unknownCategory ? "Bunday kategoriya yo‘q." : page > 1 ? "Bu sahifada maqola yo‘q." : "Hozircha maqola yo‘q."}
        </p>
      ) : (
        <div className="mt-10 grid gap-x-8 gap-y-14 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((p, i) => (
            <PostCard key={p.id} post={p} priority={i < 2} />
          ))}
        </div>
      )}

      <Pagination
        page={page}
        pages={pages}
        href={(n) => blogHref({ category: active?.slug, sort, page: n })}
      />
    </div>
  );
}
