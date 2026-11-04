import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth";
import { formatViews } from "@/lib/format";
import { StatusBadge } from "@/components/admin/status-badge";
import { DeletePostButton } from "@/components/admin/delete-post-button";
import type { Category, PostStatus } from "@/lib/types";
import { createDraft } from "./posts/actions";

type Row = {
  id: string;
  title: string;
  slug: string;
  status: PostStatus;
  published_at: string | null;
  updated_at: string;
  view_count: number;
  category: Pick<Category, "name"> | null;
};

const adminDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Tashkent",
  });

export default async function AdminPosts({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string }>;
}) {
  await requireAdmin();
  const { q = "", status = "" } = await searchParams;
  const supabase = await createClient();

  let query = supabase
    .from("posts")
    .select("id, title, slug, status, published_at, updated_at, view_count, category:categories(name)")
    .order("updated_at", { ascending: false })
    .limit(200);
  if (q.trim()) query = query.ilike("title", `%${q.trim().replace(/[%_\\]/g, (c) => `\\${c}`)}%`);
  if (status === "draft" || status === "published") query = query.eq("status", status);

  const { data, error } = await query.returns<Row[]>();
  const posts = data ?? [];
  const now = Date.now();

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Posts</h1>
        <form action={createDraft}>
          <button className="btn btn-primary">+ New post</button>
        </form>
      </div>

      <form className="mb-6 flex flex-wrap gap-2" role="search">
        <input
          name="q"
          defaultValue={q}
          placeholder="Search by title…"
          className="input max-w-xs flex-1"
          aria-label="Search"
        />
        <select name="status" defaultValue={status} className="input w-auto" aria-label="Status">
          <option value="">All</option>
          <option value="published">Published</option>
          <option value="draft">Drafts</option>
        </select>
        <button className="btn">Search</button>
      </form>

      {error && <p className="text-red-600">Could not load posts: {error.message}</p>}
      {!error && posts.length === 0 && <p className="text-muted">No posts yet.</p>}

      <ul className="divide-y divide-line border-y border-line">
        {posts.map((p) => {
          const scheduled =
            p.status === "published" && !!p.published_at && new Date(p.published_at).getTime() > now;
          return (
            <li key={p.id} className="flex flex-col gap-2 py-4 sm:flex-row sm:items-center sm:gap-4">
              <div className="min-w-0 flex-1">
                <Link href={`/admin/posts/${p.id}`} className="font-medium hover:text-accent">
                  {p.title || <span className="text-faint">Untitled draft</span>}
                </Link>
                <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted">
                  <StatusBadge status={p.status} scheduled={scheduled} />
                  <span>{p.category?.name ?? "No category"}</span>
                  <span>{adminDate(p.published_at ?? p.updated_at)}</span>
                  <span>{formatViews(p.view_count)} views</span>
                </div>
              </div>
              <div className="flex gap-2">
                {p.status === "published" && !scheduled && (
                  <Link href={`/blog/${p.slug}`} target="_blank" className="btn">
                    View
                  </Link>
                )}
                <Link href={`/admin/posts/${p.id}`} className="btn">
                  Edit
                </Link>
                <DeletePostButton id={p.id} title={p.title} />
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
