import Image from "next/image";
import Link from "next/link";
import { PostMeta } from "./post-meta";
import type { PostSummary } from "@/lib/types";

/** Grid card for /blog and related posts. */
export function PostCard({ post, priority = false }: { post: PostSummary; priority?: boolean }) {
  return (
    <article className="group relative flex flex-col">
      {post.cover_url && (
        <div className="relative mb-4 aspect-[16/9] overflow-hidden rounded-md bg-surface">
          <Image
            src={post.cover_url}
            alt={post.cover_alt || ""}
            fill
            priority={priority}
            sizes="(min-width: 1024px) 320px, (min-width: 640px) 50vw, 100vw"
            className="object-cover transition-transform duration-500 group-hover:scale-[1.02]"
          />
        </div>
      )}
      <PostMeta
        category={post.category}
        publishedAt={post.published_at}
        readingMinutes={post.reading_minutes}
        views={post.view_count}
        className="text-[0.8125rem]"
      />
      <h2 className="mt-2 font-serif text-xl leading-snug font-semibold text-balance group-hover:text-accent">
        <Link href={`/blog/${post.slug}`} className="after:absolute after:inset-0">
          {post.title}
        </Link>
      </h2>
      {post.excerpt && <p className="mt-2 line-clamp-3 leading-relaxed text-muted">{post.excerpt}</p>}
    </article>
  );
}

/** Text-only row for the home page. */
export function PostRow({ post }: { post: PostSummary }) {
  return (
    <article className="group relative py-7">
      <PostMeta
        category={post.category}
        publishedAt={post.published_at}
        readingMinutes={post.reading_minutes}
        className="text-[0.8125rem]"
      />
      <h3 className="mt-2 font-serif text-2xl leading-snug font-semibold text-balance group-hover:text-accent">
        <Link href={`/blog/${post.slug}`} className="after:absolute after:inset-0">
          {post.title}
        </Link>
      </h3>
      {post.excerpt && <p className="mt-2 max-w-[65ch] leading-relaxed text-muted">{post.excerpt}</p>}
    </article>
  );
}
