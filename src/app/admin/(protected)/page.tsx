import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth";
import { formatDate, formatViews } from "@/lib/format";
import { StatusBadge } from "@/components/admin/status-badge";
import { DeletePostButton } from "@/components/admin/delete-post-button";
import type { Category, PostStatus } from "@/lib/types";

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
        <h1 className="text-2xl font-semibold">Maqolalar</h1>
        <Link href="/admin/posts/new" className="btn btn-primary">
          + Yangi maqola
        </Link>
      </div>

      <form className="mb-6 flex flex-wrap gap-2" role="search">
        <input
          name="q"
          defaultValue={q}
          placeholder="Sarlavha bo‘yicha qidirish…"
          className="input max-w-xs flex-1"
          aria-label="Qidirish"
        />
        <select name="status" defaultValue={status} className="input w-auto" aria-label="Holat">
          <option value="">Hammasi</option>
          <option value="published">Nashr qilingan</option>
          <option value="draft">Qoralamalar</option>
        </select>
        <button className="btn">Qidirish</button>
      </form>

      {error && <p className="text-red-600">Yuklab bo‘lmadi: {error.message}</p>}
      {!error && posts.length === 0 && <p className="text-muted">Hali maqola yo‘q.</p>}

      <ul className="divide-y divide-line border-y border-line">
        {posts.map((p) => {
          const scheduled =
            p.status === "published" && !!p.published_at && new Date(p.published_at).getTime() > now;
          return (
            <li key={p.id} className="flex flex-col gap-2 py-4 sm:flex-row sm:items-center sm:gap-4">
              <div className="min-w-0 flex-1">
                <Link href={`/admin/posts/${p.id}`} className="font-medium hover:text-accent">
                  {p.title || <span className="text-faint">Nomsiz qoralama</span>}
                </Link>
                <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted">
                  <StatusBadge status={p.status} scheduled={scheduled} />
                  <span>{p.category?.name ?? "Kategoriyasiz"}</span>
                  <span>{formatDate(p.published_at ?? p.updated_at)}</span>
                  <span>{formatViews(p.view_count)} ko‘rish</span>
                </div>
              </div>
              <div className="flex gap-2">
                {p.status === "published" && !scheduled && (
                  <Link href={`/blog/${p.slug}`} target="_blank" className="btn">
                    Ochish
                  </Link>
                )}
                <Link href={`/admin/posts/${p.id}`} className="btn">
                  Tahrirlash
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
