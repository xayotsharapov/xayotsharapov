import "server-only";
import { unstable_cache } from "next/cache";
import { createPublicClient } from "@/lib/supabase/public";
import { CATEGORIES_TAG, POSTS_TAG } from "@/lib/revalidate";
import type { Category, PostSummary, PostWithCategory } from "@/lib/types";

/** Public data is cached and refreshed on publish/edit (tags) or every 10 minutes. */
export const REVALIDATE_SECONDS = 600;
export const PAGE_SIZE = 9;

export const SORTS = {
  newest: "Eng yangi",
  oldest: "Eng eski",
  popular: "Ko‘p o‘qilgan",
} as const;
export type Sort = keyof typeof SORTS;
export const isSort = (s: unknown): s is Sort => typeof s === "string" && s in SORTS;

const CARD =
  "id, title, slug, excerpt, cover_url, cover_alt, published_at, reading_minutes, view_count, category:categories(id, name, slug)";

const cacheOpts = (tags: string[]) => ({ tags, revalidate: REVALIDATE_SECONDS });
const nowIso = () => new Date().toISOString();

export const getCategories = unstable_cache(
  async (): Promise<Category[]> => {
    const { data, error } = await createPublicClient()
      .from("categories")
      .select("id, name, slug")
      .order("name");
    if (error) throw error;
    return data ?? [];
  },
  ["categories"],
  cacheOpts([CATEGORIES_TAG]),
);

export const getPosts = unstable_cache(
  async ({
    categoryId,
    sort,
    page,
  }: {
    categoryId?: string;
    sort: Sort;
    page: number;
  }): Promise<{ posts: PostSummary[]; total: number }> => {
    let q = createPublicClient()
      .from("posts")
      .select(CARD, { count: "exact" })
      .eq("status", "published")
      .lte("published_at", nowIso());
    if (categoryId) q = q.eq("category_id", categoryId);
    if (sort === "popular") q = q.order("view_count", { ascending: false });
    q = q.order("published_at", { ascending: sort === "oldest" });
    const from = (page - 1) * PAGE_SIZE;
    const { data, count, error } = await q.range(from, from + PAGE_SIZE - 1);
    if (error && error.code !== "PGRST103") throw error; // PGRST103 = page out of range
    return { posts: (data ?? []) as unknown as PostSummary[], total: count ?? 0 };
  },
  ["posts-list"],
  cacheOpts([POSTS_TAG, CATEGORIES_TAG]),
);

export const getLatestPosts = unstable_cache(
  async (limit: number): Promise<PostSummary[]> => {
    const { data, error } = await createPublicClient()
      .from("posts")
      .select(CARD)
      .eq("status", "published")
      .lte("published_at", nowIso())
      .order("published_at", { ascending: false })
      .limit(limit);
    if (error) throw error;
    return (data ?? []) as unknown as PostSummary[];
  },
  ["posts-latest"],
  cacheOpts([POSTS_TAG, CATEGORIES_TAG]),
);

export const getPostBySlug = unstable_cache(
  async (slug: string): Promise<PostWithCategory | null> => {
    const { data, error } = await createPublicClient()
      .from("posts")
      .select("*, category:categories(id, name, slug)")
      .eq("status", "published")
      .lte("published_at", nowIso())
      .eq("slug", slug)
      .maybeSingle();
    if (error) throw error;
    return data as PostWithCategory | null;
  },
  ["post-by-slug"],
  cacheOpts([POSTS_TAG, CATEGORIES_TAG]),
);

export const getRelatedPosts = unstable_cache(
  async (categoryId: string | null, excludeId: string, limit = 3): Promise<PostSummary[]> => {
    if (!categoryId) return [];
    const { data, error } = await createPublicClient()
      .from("posts")
      .select(CARD)
      .eq("status", "published")
      .lte("published_at", nowIso())
      .eq("category_id", categoryId)
      .neq("id", excludeId)
      .order("published_at", { ascending: false })
      .limit(limit);
    if (error) throw error;
    return (data ?? []) as unknown as PostSummary[];
  },
  ["posts-related"],
  cacheOpts([POSTS_TAG, CATEGORIES_TAG]),
);

/** For sitemap, RSS and generateStaticParams. */
export const getAllPublished = unstable_cache(
  async (): Promise<
    Pick<PostWithCategory, "title" | "slug" | "excerpt" | "content_html" | "published_at" | "updated_at" | "category">[]
  > => {
    const { data, error } = await createPublicClient()
      .from("posts")
      .select("title, slug, excerpt, content_html, published_at, updated_at, category:categories(id, name, slug)")
      .eq("status", "published")
      .lte("published_at", nowIso())
      .order("published_at", { ascending: false });
    if (error) throw error;
    return (data ?? []) as never;
  },
  ["posts-all"],
  cacheOpts([POSTS_TAG, CATEGORIES_TAG]),
);
