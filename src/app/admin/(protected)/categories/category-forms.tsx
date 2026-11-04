"use client";
import { useState, useTransition } from "react";
import { slugify } from "@/lib/slugify";
import { createCategory, deleteCategory, updateCategory } from "./actions";

export function NewCategoryForm() {
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [error, setError] = useState<string>();
  const [pending, start] = useTransition();

  return (
    <form
      className="flex flex-col gap-2 sm:flex-row"
      onSubmit={(e) => {
        e.preventDefault();
        start(async () => {
          const res = await createCategory(name, slug);
          if (!res.ok) return setError(res.error);
          setName("");
          setSlug("");
          setSlugTouched(false);
          setError(undefined);
        });
      }}
    >
      <input
        className="input"
        placeholder="New category name"
        value={name}
        required
        onChange={(e) => {
          setName(e.target.value);
          if (!slugTouched) setSlug(slugify(e.target.value));
        }}
      />
      <input
        className="input font-mono text-sm"
        placeholder="slug"
        value={slug}
        onChange={(e) => {
          setSlugTouched(true);
          setSlug(e.target.value);
        }}
      />
      <button className="btn btn-primary shrink-0" disabled={pending}>
        Add
      </button>
      {error && <p className="text-sm text-red-600 sm:self-center">{error}</p>}
    </form>
  );
}

export function CategoryRow({
  category,
}: {
  category: { id: string; name: string; slug: string; count: number };
}) {
  const [name, setName] = useState(category.name);
  const [slug, setSlug] = useState(category.slug);
  const [error, setError] = useState<string>();
  const [pending, start] = useTransition();
  const changed = name !== category.name || slug !== category.slug;

  return (
    <li className="flex flex-col gap-2 py-4 sm:flex-row sm:items-center">
      <input className="input" value={name} onChange={(e) => setName(e.target.value)} aria-label="Name" />
      <input
        className="input font-mono text-sm"
        value={slug}
        onChange={(e) => setSlug(e.target.value)}
        aria-label="Slug"
      />
      <span className="shrink-0 text-sm text-muted">
        {category.count} {category.count === 1 ? "post" : "posts"}
      </span>
      <div className="flex shrink-0 gap-2">
        <button
          className="btn"
          disabled={!changed || pending}
          onClick={() =>
            start(async () => {
              const res = await updateCategory(category.id, name, slug);
              setError(res.ok ? undefined : res.error);
            })
          }
        >
          Save
        </button>
        <button
          className="btn btn-danger"
          disabled={pending}
          onClick={() => {
            const msg =
              category.count > 0
                ? `Delete “${category.name}”? Its ${category.count} post(s) will be kept, just without a category.`
                : `Delete “${category.name}”?`;
            if (!confirm(msg)) return;
            start(async () => {
              const res = await deleteCategory(category.id);
              if (!res.ok) setError(res.error);
            });
          }}
        >
          Delete
        </button>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </li>
  );
}
