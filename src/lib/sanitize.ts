import "server-only";
import sanitizeHtml from "sanitize-html";

// Images must be https (or http only when Supabase itself runs on http, i.e. local dev).
const IMG_SCHEMES = process.env.NEXT_PUBLIC_SUPABASE_URL?.startsWith("http://")
  ? ["https", "http"]
  : ["https"];

const OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: [
    "p", "br", "hr", "h2", "h3", "h4", "strong", "b", "em", "i", "s", "u", "code", "pre",
    "blockquote", "ul", "ol", "li", "a", "img",
  ],
  allowedAttributes: {
    a: ["href", "target", "rel"],
    img: ["src", "alt", "width", "height", "title"],
    ol: ["start"],
  },
  allowedSchemes: ["http", "https", "mailto", "tel"],
  allowedSchemesByTag: { img: IMG_SCHEMES },
  allowProtocolRelative: false,
  transformTags: {
    a: (tagName, attribs) => {
      const external = /^https?:\/\//i.test(attribs.href ?? "");
      return {
        tagName,
        attribs: {
          href: attribs.href ?? "#",
          ...(external ? { target: "_blank", rel: "noopener noreferrer" } : {}),
        },
      };
    },
  },
};

/** Strip anything that isn't plain article markup. Used on save and again on render. */
export function sanitizePostHtml(html: string): string {
  return sanitizeHtml(html, OPTIONS);
}
