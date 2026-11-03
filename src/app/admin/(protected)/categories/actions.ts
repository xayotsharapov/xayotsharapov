"use server";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { slugify, SLUG_RE } from "@/lib/slugify";
import { revalidatePublic } from "@/lib/revalidate";
import { revalidatePath } from "next/cache";

export type CategoryResult = { ok: boolean; error?: string };

function clean(nameRaw: string, slugRaw: string) {
  const name = nameRaw.trim().slice(0, 60);
  const slug = (slugRaw.trim() || slugify(name)).toLowerCase();
  if (!name) return { error: "Nom kiriting." } as const;
  if (!SLUG_RE.test(slug)) return { error: "Slug noto‘g‘ri." } as const;
  return { name, slug } as const;
}

function done(): CategoryResult {
  revalidatePublic();
  revalidatePath("/admin/categories");
  return { ok: true };
}

function fail(error: { code?: string } | null): CategoryResult {
  if (error?.code === "23505") return { ok: false, error: "Bu slug band." };
  console.error("category", error);
  return { ok: false, error: "Xatolik yuz berdi." };
}

export async function createCategory(name: string, slug: string): Promise<CategoryResult> {
  await requireAdmin();
  const v = clean(name, slug);
  if ("error" in v) return { ok: false, error: v.error };
  const supabase = await createClient();
  const { error } = await supabase.from("categories").insert(v);
  return error ? fail(error) : done();
}

export async function updateCategory(id: string, name: string, slug: string): Promise<CategoryResult> {
  await requireAdmin();
  const v = clean(name, slug);
  if ("error" in v) return { ok: false, error: v.error };
  const supabase = await createClient();
  const { error } = await supabase.from("categories").update(v).eq("id", id);
  return error ? fail(error) : done();
}

export async function deleteCategory(id: string): Promise<CategoryResult> {
  await requireAdmin();
  const supabase = await createClient();
  // Posts keep existing; their category_id becomes NULL (ON DELETE SET NULL).
  const { error } = await supabase.from("categories").delete().eq("id", id);
  return error ? fail(error) : done();
}
