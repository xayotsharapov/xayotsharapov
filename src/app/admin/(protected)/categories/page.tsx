import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth";
import { CategoryRow, NewCategoryForm } from "./category-forms";

export default async function CategoriesPage() {
  await requireAdmin();
  const supabase = await createClient();
  const { data } = await supabase
    .from("categories")
    .select("id, name, slug, posts(count)")
    .order("name");

  const categories = (data ?? []).map((c) => ({
    id: c.id as string,
    name: c.name as string,
    slug: c.slug as string,
    count: (c.posts as unknown as { count: number }[])?.[0]?.count ?? 0,
  }));

  return (
    <div className="max-w-2xl">
      <h1 className="mb-6 text-2xl font-semibold">Categories</h1>
      <NewCategoryForm />
      <ul className="mt-8 divide-y divide-line border-y border-line">
        {categories.map((c) => (
          <CategoryRow key={c.id} category={c} />
        ))}
      </ul>
      {categories.length === 0 && <p className="mt-4 text-muted">No categories yet.</p>}
    </div>
  );
}
