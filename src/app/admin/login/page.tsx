import type { Metadata } from "next";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Log in", robots: { index: false, follow: false } };

export default function LoginPage() {
  return (
    <main lang="en" className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center px-6">
      <h1 className="mb-8 font-serif text-3xl">Admin</h1>
      <LoginForm />
    </main>
  );
}
