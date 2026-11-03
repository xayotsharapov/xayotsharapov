import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth";
import { PostArticle } from "@/components/site/post-article";
import type { PostWithCategory } from "@/lib/types";

export default async function PreviewPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from("posts")
    .select("*, category:categories(id, name, slug)")
    .eq("id", id)
    .maybeSingle();
  if (!data) notFound();
  const post = data as PostWithCategory;

  return (
    <div>
      <div className="mb-10 flex flex-wrap items-center justify-between gap-2 rounded-md bg-amber-100 px-4 py-2 text-sm text-amber-900 dark:bg-amber-950 dark:text-amber-200">
        <span>
          Ko‘rib chiqish rejimi — {post.status === "draft" ? "qoralama, saytda ko‘rinmaydi" : "nashr qilingan"}.
        </span>
        <Link href={`/admin/posts/${post.id}`} className="underline">
          Tahrirlashga qaytish
        </Link>
      </div>
      <PostArticle
        post={{ ...post, title: post.title || "Nomsiz", published_at: post.published_at ?? post.updated_at }}
        linkCategory={false}
      />
    </div>
  );
}
