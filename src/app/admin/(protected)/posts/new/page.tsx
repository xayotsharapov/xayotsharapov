import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth";
import { PostEditor } from "@/components/admin/post-editor";
import type { Category } from "@/lib/types";

export default async function NewPostPage() {
  await requireAdmin();
  const supabase = await createClient();
  const { data } = await supabase.from("categories").select("id, name, slug").order("name");
  return <PostEditor post={null} categories={(data ?? []) as Category[]} />;
}
