import Link from "next/link";

export function NotFoundContent() {
  return (
    <div className="py-24 text-center">
      <p className="text-sm text-faint">404</p>
      <h1 className="mt-2 font-serif text-3xl font-semibold">Sahifa topilmadi</h1>
      <p className="mt-4 text-muted">Bu sahifa o‘chirilgan yoki hech qachon bo‘lmagan.</p>
      <Link href="/blog" className="mt-8 inline-block underline decoration-accent underline-offset-4">
        Blogga qaytish
      </Link>
    </div>
  );
}
