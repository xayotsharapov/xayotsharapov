import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getAllPublished, getPostBySlug, getRelatedPosts } from "@/lib/posts";
import { htmlToText } from "@/lib/reading-time";
import { site, siteUrl } from "@/lib/site";
import { PostArticle } from "@/components/site/post-article";
import { PostCard } from "@/components/site/post-card";
import { ViewTracker } from "@/components/site/view-tracker";

export const revalidate = 600; // seconds; matches REVALIDATE_SECONDS in lib/posts.ts
export const dynamicParams = true;

type Params = Promise<{ slug: string }>;

export async function generateStaticParams() {
  try {
    const posts = await getAllPublished();
    return posts.map((p) => ({ slug: p.slug }));
  } catch {
    return []; // build without DB access: pages render on first request instead
  }
}

function description(post: { meta_description: string | null; excerpt: string; content_html: string }) {
  return (
    post.meta_description ||
    post.excerpt ||
    htmlToText(post.content_html).slice(0, 160).replace(/\s\S*$/, "") + "…"
  );
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) return {};
  const title = post.meta_title || post.title;
  const desc = description(post);
  return {
    title,
    description: desc,
    alternates: { canonical: `/blog/${post.slug}` },
    openGraph: {
      type: "article",
      title,
      description: desc,
      url: `/blog/${post.slug}`,
      publishedTime: post.published_at ?? undefined,
      modifiedTime: post.updated_at,
      section: post.category?.name,
      authors: [site.name],
      // No cover → the generated opengraph-image.tsx in this folder is used.
      ...(post.cover_url
        ? { images: [{ url: post.cover_url, width: 1200, height: 675, alt: post.cover_alt || post.title }] }
        : {}),
    },
    twitter: { card: "summary_large_image", title, description: desc },
  };
}

export default async function PostPage({ params }: { params: Params }) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) notFound();
  const related = await getRelatedPosts(post.category_id, post.id).catch(() => []);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: description(post),
    image: post.cover_url ? [post.cover_url] : undefined,
    datePublished: post.published_at,
    dateModified: post.updated_at,
    author: { "@type": "Person", name: site.name, url: `${siteUrl()}/about` },
    mainEntityOfPage: `${siteUrl()}/blog/${post.slug}`,
    inLanguage: "uz",
  };

  return (
    <div className="pt-10 sm:pt-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />
      <ViewTracker postId={post.id} />
      <PostArticle post={post} />

      <aside className="mx-auto mt-16 max-w-[68ch] border-t border-line pt-8">
        <p className="font-serif text-lg leading-relaxed text-muted">
          <Link href="/about" className="font-semibold text-fg hover:text-accent">
            {site.name}
          </Link>{" "}
          — {site.role}. Bu yerda amaliyotdan olingan tajribalar haqida yozadi.
        </p>
      </aside>

      {related.length > 0 && (
        <section aria-labelledby="related" className="mt-20">
          <h2 id="related" className="border-b border-line pb-3 text-sm font-medium tracking-wide text-faint uppercase">
            Shu mavzuda yana
          </h2>
          <div className="mt-8 grid gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((p) => (
              <PostCard key={p.id} post={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
