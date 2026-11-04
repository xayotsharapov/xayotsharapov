import Image from "next/image";
import { PostContent } from "./post-content";
import { PostMeta } from "./post-meta";
import type { Category } from "@/lib/types";

export type ArticleData = {
  title: string;
  excerpt: string;
  cover_url: string | null;
  cover_alt: string;
  content_html: string;
  published_at: string | null;
  reading_minutes: number;
  view_count?: number;
  category: Category | null;
};

export function PostArticle({ post, linkCategory = true }: { post: ArticleData; linkCategory?: boolean }) {
  return (
    <article>
      <header className="mx-auto max-w-[68ch]">
        <PostMeta
          category={post.category}
          publishedAt={post.published_at}
          readingMinutes={post.reading_minutes}
          views={post.view_count}
          linkCategory={linkCategory}
        />
        <h1 className="mt-4 font-serif text-[2.125rem] leading-[1.15] font-semibold tracking-tight text-balance sm:text-5xl">
          {post.title}
        </h1>
        {post.excerpt && (
          <p className="mt-5 font-serif text-xl leading-relaxed text-muted text-pretty">{post.excerpt}</p>
        )}
      </header>

      {post.cover_url && (
        <figure className="mx-auto mt-10 max-w-4xl">
          <div className="relative aspect-[16/9] overflow-hidden rounded-lg bg-surface">
            <Image
              src={post.cover_url}
              alt={post.cover_alt || post.title}
              fill
              priority
              sizes="(min-width: 896px) 896px, 100vw"
              className="object-cover"
            />
          </div>
        </figure>
      )}

      <div className="mt-10">
        <PostContent html={post.content_html} />
      </div>
    </article>
  );
}
