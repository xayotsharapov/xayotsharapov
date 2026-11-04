"use client";
import { createBrowserClient } from "@supabase/ssr";

/** Browser client (admin only: used for image uploads with the admin's session). */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
