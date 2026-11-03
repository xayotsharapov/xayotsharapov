import parse, { type DOMNode, Element } from "html-react-parser";
import Image from "next/image";
import { sanitizePostHtml } from "@/lib/sanitize";

/** Sanitized post HTML; <img> tags become next/image so they're resized and lazy-loaded. */
export function PostContent({ html }: { html: string }) {
  const clean = sanitizePostHtml(html);
  return (
    <div className="article prose mx-auto">
      {parse(clean, {
        replace(node: DOMNode) {
          if (node instanceof Element && node.name === "img") {
            const { src, alt = "", width, height } = node.attribs;
            const w = Number(width);
            const h = Number(height);
            if (!src) return <></>;
            if (w > 0 && h > 0) {
              return (
                <Image
                  src={src}
                  alt={alt}
                  width={w}
                  height={h}
                  sizes="(min-width: 768px) 720px, 100vw"
                  className="h-auto w-full"
                />
              );
            }
            // eslint-disable-next-line @next/next/no-img-element -- legacy images without known size
            return <img src={src} alt={alt} loading="lazy" decoding="async" />;
          }
        },
      })}
    </div>
  );
}
