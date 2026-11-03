"use client";
import { useActionState } from "react";
import { signIn, type LoginState } from "../actions";

export function LoginForm() {
  const [state, action, pending] = useActionState<LoginState, FormData>(signIn, {});
  return (
    <form action={action} className="space-y-4">
      <label className="block">
        <span className="mb-1 block text-sm text-muted">Email</span>
        <input name="email" type="email" required autoComplete="email" className="input" />
      </label>
      <label className="block">
        <span className="mb-1 block text-sm text-muted">Parol</span>
        <input
          name="password"
          type="password"
          required
          autoComplete="current-password"
          className="input"
        />
      </label>
      {state.error && (
        <p role="alert" className="text-sm text-red-600 dark:text-red-400">
          {state.error}
        </p>
      )}
      <button type="submit" disabled={pending} className="btn btn-primary w-full">
        {pending ? "Kirilmoqda…" : "Kirish"}
      </button>
    </form>
  );
}
