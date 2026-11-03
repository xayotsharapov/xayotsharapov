import { ImageResponse } from "next/og";
import { site } from "@/lib/site";

export const runtime = "edge";

// The bundled OG font lacks some Uzbek glyphs (oʻ, gʻ); plain apostrophes look the same.
const plain = (s: string) => s.replace(/[ʻʼ‘’`]/g, "'").slice(0, 140);

/** /og?title=…&category=… → 1200×630 text card. Used when a post has no cover. */
export function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const title = plain(searchParams.get("title") || site.name);
  const category = plain(searchParams.get("category") || site.role);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px 80px",
          background: "#fbfaf7",
          color: "#1c1b19",
        }}
      >
        <div style={{ fontSize: 30, color: "#b4441f", letterSpacing: 1 }}>{category}</div>
        <div style={{ fontSize: title.length > 60 ? 64 : 80, lineHeight: 1.1, fontWeight: 700, letterSpacing: -2 }}>
          {title}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 16, fontSize: 30, color: "#6b6860" }}>
          <div style={{ width: 48, height: 4, background: "#b4441f" }} />
          {plain(site.name)}
        </div>
      </div>
    ),
    { width: 1200, height: 630, headers: { "Cache-Control": "public, max-age=86400, immutable" } },
  );
}
