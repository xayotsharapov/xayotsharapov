"use client";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { deletePost } from "@/app/admin/(protected)/posts/actions";

export function DeletePostButton({
  id,
  title,
  className = "btn btn-danger",
  afterDelete = "refresh",
}: {
  id: string;
  title: string;
  className?: string;
  afterDelete?: "refresh" | "list";
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      className={className}
      disabled={pending}
      onClick={() => {
        if (!confirm(`Permanently delete “${title || "Untitled"}”? This cannot be undone.`))
          return;
        start(async () => {
          const res = await deletePost(id);
          if (!res.ok) return alert(res.error);
          if (afterDelete === "list") router.push("/admin");
          router.refresh();
        });
      }}
    >
      {pending ? "Deleting…" : "Delete"}
    </button>
  );
}
