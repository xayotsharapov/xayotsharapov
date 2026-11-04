import Link from "next/link";
import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth";
import { signOut } from "../actions";

export const metadata: Metadata = {
  title: "Admin",
  robots: { index: false, follow: false },
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireAdmin();
  return (
    <div lang="en" className="min-h-dvh">
      <header className="border-b border-line">
        <nav className="mx-auto flex max-w-5xl flex-wrap items-center gap-x-5 gap-y-2 px-4 py-3 text-sm">
          <Link href="/admin" className="font-semibold">
            Admin
          </Link>
          <Link href="/admin" className="text-muted hover:text-fg">
            Posts
          </Link>
          <Link href="/admin/categories" className="text-muted hover:text-fg">
            Categories
          </Link>
          <Link href="/" className="text-muted hover:text-fg" target="_blank">
            View site ↗
          </Link>
          <span className="ml-auto hidden text-faint sm:inline">{user.email}</span>
          <form action={signOut}>
            <button type="submit" className="text-muted hover:text-fg">
              Log out
            </button>
          </form>
        </nav>
      </header>
      <div className="mx-auto max-w-5xl px-4 py-8">{children}</div>
    </div>
  );
}
