export type PostStatus = "draft" | "published";

export type Category = {
  id: string;
  name: string;
  slug: string;
};

export type Post = {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content_html: string;
  content_json: unknown | null;
  cover_url: string | null;
  cover_alt: string;
  category_id: string | null;
  meta_title: string | null;
  meta_description: string | null;
  status: PostStatus;
  published_at: string | null;
  reading_minutes: number;
  view_count: number;
  created_at: string;
  updated_at: string;
};

/** Shape used for cards and lists (no content). */
export type PostSummary = Pick<
  Post,
  | "id"
  | "title"
  | "slug"
  | "excerpt"
  | "cover_url"
  | "cover_alt"
  | "published_at"
  | "reading_minutes"
  | "view_count"
> & { category: Category | null };

export type PostWithCategory = Post & { category: Category | null };
