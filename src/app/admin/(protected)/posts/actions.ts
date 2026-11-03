"use server";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { sanitizePostHtml } from "@/lib/sanitize";
import { readingMinutes } from "@/lib/reading-time";
import { slugify, SLUG_RE } from "@/lib/slugify";
import { revalidatePublic } from "@/lib/revalidate";
import type { PostStatus } from "@/lib/types";

export type PostInput = {
  id: string | null;
  title: string;
  slug: string;
  excerpt: string;
  categoryId: string | null;
  coverUrl: string | null;
  coverAlt: string;
  contentHtml: string;
  contentJson: unknown;
  metaTitle: string;
  metaDescription: string;
  status: PostStatus;
  publishedAt: string | null; // ISO
};

export type SaveResult =
  | { ok: true; id: string; slug: string; status: PostStatus; publishedAt: string | null; savedAt: string }
  | { ok: false; error: string };

const nullIfEmpty = (s: string) => (s.trim() ? s.trim() : null);

export async function savePost(input: PostInput): Promise<SaveResult> {
  await requireAdmin();
  const supabase = await createClient();

  const title = input.title.trim();
  let slug = input.slug.trim() || slugify(title);
  if (!slug) slug = `qoralama-${Date.now().toString(36)}`;
  if (!SLUG_RE.test(slug)) {
    return { ok: false, error: "Slug faqat kichik lotin harflari, raqamlar va chiziqchadan iborat bo‘lsin." };
  }

  if (input.status === "published") {
    if (!title) return { ok: false, error: "Nashr qilish uchun sarlavha kerak." };
    if (!input.contentHtml.replace(/<[^>]*>/g, "").trim() && !input.contentHtml.includes("<img"))
      return { ok: false, error: "Nashr qilish uchun matn kerak." };
  }

  const contentHtml = sanitizePostHtml(input.contentHtml);
  const publishedAt =
    input.status === "published" ? input.publishedAt ?? new Date().toISOString() : input.publishedAt;

  const row = {
    title: title.slice(0, 200),
    slug,
    excerpt: input.excerpt.trim().slice(0, 500),
    category_id: input.categoryId || null,
    cover_url: input.coverUrl || null,
    cover_alt: input.coverAlt.trim(),
    content_html: contentHtml,
    content_json: input.contentJson ?? null,
    meta_title: nullIfEmpty(input.metaTitle)?.slice(0, 200) ?? null,
    meta_description: nullIfEmpty(input.metaDescription)?.slice(0, 300) ?? null,
    status: input.status,
    published_at: publishedAt,
    reading_minutes: readingMinutes(contentHtml),
  };

  let wasPublished = false;
  let result;
  if (input.id) {
    const { data: prev } = await supabase.from("posts").select("status").eq("id", input.id).single();
    wasPublished = prev?.status === "published";
    result = await supabase
      .from("posts")
      .update(row)
      .eq("id", input.id)
      .select("id, slug, status, published_at, updated_at")
      .single();
  } else {
    result = await supabase
      .from("posts")
      .insert(row)
      .select("id, slug, status, published_at, updated_at")
      .single();
  }

  if (result.error) {
    if (result.error.code === "23505") return { ok: false, error: "Bu slug band. Boshqasini tanlang." };
    console.error("savePost", result.error);
    return { ok: false, error: "Saqlab bo‘lmadi. Qaytadan urinib ko‘ring." };
  }

  if (wasPublished || input.status === "published") revalidatePublic();

  return {
    ok: true,
    id: result.data.id,
    slug: result.data.slug,
    status: result.data.status,
    publishedAt: result.data.published_at,
    savedAt: result.data.updated_at,
  };
}

export async function deletePost(id: string): Promise<{ ok: boolean; error?: string }> {
  await requireAdmin();
  const supabase = await createClient();
  const { error } = await supabase.from("posts").delete().eq("id", id);
  if (error) {
    console.error("deletePost", error);
    return { ok: false, error: "O‘chirib bo‘lmadi." };
  }
  revalidatePublic();
  return { ok: true };
}
