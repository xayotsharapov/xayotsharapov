import { Header } from "@/components/site/header";
import { Footer } from "@/components/site/footer";
import { NotFoundContent } from "@/components/site/not-found-content";

export default function NotFound() {
  return (
    <>
      <Header />
      <main className="mx-auto max-w-5xl px-4 sm:px-6">
        <NotFoundContent />
      </main>
      <Footer />
    </>
  );
}
