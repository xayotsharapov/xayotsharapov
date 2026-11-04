import Link from "next/link";
import { getLatestPosts } from "@/lib/posts";
import { site } from "@/lib/site";
import { PostRow } from "@/components/site/post-card";

export const revalidate = 600; // seconds; matches REVALIDATE_SECONDS in lib/posts.ts

export default async function HomePage() {
  const posts = await getLatestPosts(6).catch(() => []);

  return (
    <>
      <section className="max-w-[40rem] pt-10 pb-16 sm:pt-16 sm:pb-20">
        <p className="text-sm font-medium tracking-wide text-accent uppercase">{site.role}</p>
        <h1 className="mt-4 font-serif text-4xl leading-[1.1] font-semibold tracking-tight text-balance sm:text-5xl">
          {site.name}
        </h1>
        <p className="mt-6 font-serif text-xl leading-relaxed text-muted text-pretty">{site.intro}</p>
        <div className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-[0.9375rem]">
          <Link href="/blog" className="font-medium underline decoration-accent underline-offset-4 hover:text-accent">
            Barcha maqolalar →
          </Link>
          <Link href="/about" className="text-muted hover:text-fg">
            Men haqimda
          </Link>
        </div>
      </section>

      <section aria-labelledby="latest">
        <h2 id="latest" className="border-b border-line pb-3 text-sm font-medium tracking-wide text-faint uppercase">
          So‘nggi maqolalar
        </h2>
        {posts.length === 0 ? (
          <p className="py-8 text-muted">Tez orada birinchi maqola chiqadi.</p>
        ) : (
          <div className="divide-y divide-line">
            {posts.map((p) => (
              <PostRow key={p.id} post={p} />
            ))}
          </div>
        )}
        {posts.length > 0 && (
          <Link href="/blog" className="mt-4 inline-block text-[0.9375rem] text-muted hover:text-fg">
            Barchasini ko‘rish →
          </Link>
        )}
      </section>
    </>
  );
}
