import Link from "next/link";
import { site } from "@/lib/site";

export function Footer() {
  return (
    <footer className="mx-auto mt-24 max-w-5xl border-t border-line px-4 py-10 text-sm text-faint sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <p>
          © {new Date().getFullYear()} {site.name}
        </p>
        <nav className="flex gap-5">
          <Link href="/blog" className="hover:text-fg">Blog</Link>
          <a href="/rss.xml" className="hover:text-fg">RSS</a>
        </nav>
      </div>
    </footer>
  );
}
