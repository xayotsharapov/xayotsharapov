import "server-only";
import sanitizeHtml from "sanitize-html";

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
  allowedSchemesByTag: { img: ["https"] },
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
