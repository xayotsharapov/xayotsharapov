import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth";
import { PostEditor } from "@/components/admin/post-editor";
import type { Category, Post } from "@/lib/types";

export default async function EditPostPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const supabase = await createClient();
  const [{ data: post }, { data: categories }] = await Promise.all([
    supabase.from("posts").select("*").eq("id", id).maybeSingle(),
    supabase.from("categories").select("id, name, slug").order("name"),
  ]);
  if (!post) notFound();
  // key forces a fresh editor when switching between posts
  return <PostEditor key={post.id} post={post as Post} categories={(categories ?? []) as Category[]} />;
}
