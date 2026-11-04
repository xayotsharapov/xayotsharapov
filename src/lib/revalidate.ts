import "server-only";
import { revalidatePath, revalidateTag } from "next/cache";

export const POSTS_TAG = "posts";
export const CATEGORIES_TAG = "categories";

/** Refresh every public page (home, blog, posts, sitemap, RSS). */
export function revalidatePublic() {
  revalidateTag(POSTS_TAG);
  revalidateTag(CATEGORIES_TAG);
  revalidatePath("/", "layout");
}
