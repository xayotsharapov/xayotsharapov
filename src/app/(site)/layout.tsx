import { Header } from "@/components/site/header";
import { Footer } from "@/components/site/footer";

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:rounded focus:bg-fg focus:px-3 focus:py-2 focus:text-bg"
      >
        Asosiy qismga o‘tish
      </a>
      <Header />
      <main id="main" className="mx-auto max-w-5xl px-4 sm:px-6">
        {children}
      </main>
      <Footer />
    </>
  );
}
