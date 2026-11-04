import Link from "next/link";
import { site } from "@/lib/site";
import { ThemeToggle } from "./theme-toggle";

// Add future sections (e.g. { href: "/products", label: "Mahsulotlar" }) here.
const NAV = [
  { href: "/blog", label: "Blog" },
];

export function Header() {
  return (
    <header className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-6 sm:px-6">
      <Link href="/" className="font-serif text-lg font-semibold tracking-tight">
        {site.name}
      </Link>
      <nav className="flex items-center gap-5 text-[0.9375rem] sm:gap-7">
        {NAV.map((n) => (
          <Link key={n.href} href={n.href} className="text-muted transition-colors hover:text-fg">
            {n.label}
          </Link>
        ))}
        <ThemeToggle />
      </nav>
    </header>
  );
}
