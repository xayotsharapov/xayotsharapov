"use server";
import { redirect } from "next/navigation";
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
  if (!slug) slug = `draft-${Date.now().toString(36)}`;
  if (!SLUG_RE.test(slug)) {
    return { ok: false, error: "The slug can only contain lowercase letters, numbers and hyphens." };
  }

  if (input.status === "published") {
    if (!title) return { ok: false, error: "Add a title before publishing." };
    if (!input.contentHtml.replace(/<[^>]*>/g, "").trim() && !input.contentHtml.includes("<img"))
      return { ok: false, error: "Add some content before publishing." };
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
    if (result.error.code === "23505") return { ok: false, error: "That slug is already used by another post. Choose a different one." };
    console.error("savePost", result.error);
    return { ok: false, error: "Could not save. Please try again." };
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

/** "+ New post": create an empty draft and open it in the editor. */
export async function createDraft() {
  await requireAdmin();
  const supabase = await createClient();
  // Tidy up drafts that were opened but never written in.
  await supabase
    .from("posts")
    .delete()
    .eq("status", "draft")
    .eq("title", "")
    .eq("content_html", "")
    .is("cover_url", null)
    .lt("created_at", new Date(Date.now() - 60 * 60 * 1000).toISOString());

  const { data, error } = await supabase
    .from("posts")
    .insert({ slug: `draft-${crypto.randomUUID().slice(0, 8)}`, status: "draft" })
    .select("id")
    .single();
  if (error) throw new Error("Could not create a draft.");
  redirect(`/admin/posts/${data.id}`);
}

export async function deletePost(id: string): Promise<{ ok: boolean; error?: string }> {
  await requireAdmin();
  const supabase = await createClient();
  const { error } = await supabase.from("posts").delete().eq("id", id);
  if (error) {
    console.error("deletePost", error);
    return { ok: false, error: "Could not delete the post." };
  }
  revalidatePublic();
  return { ok: true };
}
