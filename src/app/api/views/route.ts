import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { createServiceClient } from "@/lib/supabase/service";
import { isAdminEmail } from "@/lib/admin-email";
import { isBot } from "@/lib/bots";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const DAY = 60 * 60 * 24;

const skip = () => new NextResponse(null, { status: 204 });

export async function POST(req: NextRequest) {
  // Same-origin requests only.
  const origin = req.headers.get("origin");
  if (origin && new URL(origin).host !== req.headers.get("host")) {
    return new NextResponse(null, { status: 403 });
  }
  if (isBot(req.headers.get("user-agent"))) return skip();

  let postId: unknown;
  try {
    ({ postId } = await req.json());
  } catch {
    return new NextResponse(null, { status: 400 });
  }
  if (typeof postId !== "string" || !UUID_RE.test(postId)) {
    return new NextResponse(null, { status: 400 });
  }

  // One view per visitor per post per 24h.
  const cookieName = `pv_${postId.replace(/-/g, "")}`;
  if (req.cookies.has(cookieName)) return skip();

  // Don't count the admin's own views.
  if (req.cookies.getAll().some((c) => c.name.startsWith("sb-"))) {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { getAll: () => req.cookies.getAll(), setAll: () => {} } },
    );
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (isAdminEmail(user?.email)) return skip();
  }

  const { error } = await createServiceClient().rpc("increment_post_view", { p_post_id: postId });
  if (error) {
    console.error("increment_post_view", error);
    return new NextResponse(null, { status: 500 });
  }

  const res = skip();
  res.cookies.set(cookieName, "1", {
    maxAge: DAY,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/api/views", // only sent to this endpoint, not with every page request
  });
  return res;
}
