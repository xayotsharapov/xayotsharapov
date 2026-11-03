import { getAllPublished } from "@/lib/posts";
import { sanitizePostHtml } from "@/lib/sanitize";
import { site, siteUrl } from "@/lib/site";

export const revalidate = 600;

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const cdata = (s: string) => `<![CDATA[${s.replace(/]]>/g, "]]]]><![CDATA[>")}]]>`;

export async function GET() {
  const base = siteUrl();
  const posts = (await getAllPublished().catch(() => [])).slice(0, 50);

  const items = posts
    .map((p) => {
      const url = `${base}/blog/${p.slug}`;
      return `    <item>
      <title>${esc(p.title)}</title>
      <link>${url}</link>
      <guid isPermaLink="true">${url}</guid>
      <pubDate>${new Date(p.published_at!).toUTCString()}</pubDate>
      ${p.category ? `<category>${esc(p.category.name)}</category>` : ""}
      <description>${esc(p.excerpt)}</description>
      <content:encoded>${cdata(sanitizePostHtml(p.content_html))}</content:encoded>
    </item>`;
    })
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:content="http://purl.org/rss/1.0/modules/content/">
  <channel>
    <title>${esc(site.name)}</title>
    <link>${base}</link>
    <description>${esc(site.description)}</description>
    <language>uz</language>
    <atom:link href="${base}/rss.xml" rel="self" type="application/rss+xml" />
    ${posts[0] ? `<lastBuildDate>${new Date(posts[0].updated_at).toUTCString()}</lastBuildDate>` : ""}
${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: { "Content-Type": "application/rss+xml; charset=utf-8" },
  });
}
