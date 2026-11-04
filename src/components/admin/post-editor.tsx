"use client";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { JSONContent } from "@tiptap/react";
import { RichEditor } from "./rich-editor";
import { CoverField } from "./cover-field";
import { StatusBadge } from "./status-badge";
import { DeletePostButton } from "./delete-post-button";
import { savePost, type PostInput } from "@/app/admin/(protected)/posts/actions";
import { slugify } from "@/lib/slugify";
import { htmlToText } from "@/lib/reading-time";
import type { Category, Post, PostStatus } from "@/lib/types";

const AUTOSAVE_MS = 2000;

/** ISO → value for <input type="datetime-local"> in the browser's timezone. */
function toLocalInput(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
function fromLocalInput(v: string): string | null {
  return v ? new Date(v).toISOString() : null;
}

type Fields = {
  title: string;
  slug: string;
  excerpt: string;
  categoryId: string;
  coverUrl: string | null;
  coverAlt: string;
  html: string;
  metaTitle: string;
  metaDescription: string;
  publishedAt: string; // datetime-local value
};

const snap = (f: Fields) => JSON.stringify(f);

export function PostEditor({ post, categories }: { post: Post; categories: Category[] }) {
  const [f, setF] = useState<Fields>(() => ({
    title: post.title,
    // Fresh drafts have a placeholder slug; it's replaced from the title.
    slug: post.title ? post.slug : "",
    excerpt: post.excerpt,
    categoryId: post.category_id ?? (post.title ? "" : categories[0]?.id ?? ""),
    coverUrl: post.cover_url,
    coverAlt: post.cover_alt,
    html: post.content_html,
    metaTitle: post.meta_title ?? "",
    metaDescription: post.meta_description ?? "",
    publishedAt: toLocalInput(post.published_at),
  }));
  const set = <K extends keyof Fields>(k: K, v: Fields[K]) => setF((prev) => ({ ...prev, [k]: v }));

  const [json, setJson] = useState<JSONContent | null>((post.content_json as JSONContent) ?? null);
  // Published slugs never follow the title automatically (that would break links).
  const [slugTouched, setSlugTouched] = useState(
    post.status === "published" || (!!post.title && post.slug !== slugify(post.title)),
  );
  const id = post.id;
  const [savedStatus, setSavedStatus] = useState<PostStatus>(post.status);
  const [state, setState] = useState<{ kind: "idle" | "saving" | "saved" | "error"; msg?: string }>({
    kind: "idle",
  });
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(new Date(post.updated_at));

  const [initialContent] = useState<JSONContent | string>(() => json ?? post.content_html);
  const onContentChange = useCallback((html: string, j: JSONContent) => {
    setF((prev) => ({ ...prev, html }));
    setJson(j);
  }, []);

  const current = useMemo(() => snap(f), [f]);
  const savedSnap = useRef(current);
  const dirty = current !== savedSnap.current;

  const inFlight = useRef<Promise<unknown> | null>(null);
  const latest = useRef({ f, json });
  latest.current = { f, json };

  const save = useCallback(async (status: PostStatus): Promise<string | null> => {
    while (inFlight.current) await inFlight.current;
    const { f: fields, json: content } = latest.current;
    const input: PostInput = {
      id,
      title: fields.title,
      slug: fields.slug,
      excerpt: fields.excerpt,
      categoryId: fields.categoryId || null,
      coverUrl: fields.coverUrl,
      coverAlt: fields.coverAlt,
      contentHtml: fields.html,
      contentJson: content,
      metaTitle: fields.metaTitle,
      metaDescription: fields.metaDescription,
      status,
      publishedAt: fromLocalInput(fields.publishedAt),
    };
    setState({ kind: "saving" });
    const p = savePost(input);
    inFlight.current = p;
    let res;
    try {
      res = await p;
    } catch {
      res = { ok: false as const, error: "Network error. Please try again." };
    } finally {
      inFlight.current = null;
    }
    if (!res.ok) {
      setState({ kind: "error", msg: res.error });
      return null;
    }
    const next = { ...fields, slug: res.slug, publishedAt: toLocalInput(res.publishedAt) };
    savedSnap.current = snap(next);
    setF((prev) => ({ ...prev, slug: res.slug, publishedAt: next.publishedAt }));
    setSlugTouched(true);
    setSavedStatus(res.status);
    setLastSavedAt(new Date(res.savedAt));
    setState({ kind: "saved" });
    return res.id;
  }, [id]);

  // Autosave: drafts only. Published posts change only when you press "Update".
  useEffect(() => {
    if (savedStatus !== "draft" || !dirty) return;
    if (!f.title.trim() && !htmlToText(f.html)) return; // don't create empty rows
    const t = setTimeout(() => void save("draft"), AUTOSAVE_MS);
    return () => clearTimeout(t);
  }, [current, savedStatus, dirty, f.title, f.html, save]);

  // Warn before leaving with unsaved changes.
  useEffect(() => {
    if (!dirty) return;
    const h = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", h);
    return () => window.removeEventListener("beforeunload", h);
  }, [dirty]);

  // Ctrl/Cmd+S
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        void save(savedStatus);
      }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [save, savedStatus]);

  const titleRef = useRef<HTMLTextAreaElement>(null);
  const [titleMissing, setTitleMissing] = useState(false);

  function publish() {
    if (!f.title.trim()) {
      setTitleMissing(true);
      setState({ kind: "error", msg: "Add a title before publishing." });
      titleRef.current?.focus();
      titleRef.current?.scrollIntoView({ block: "center", behavior: "smooth" });
      return;
    }
    void save("published");
  }

  async function preview() {
    const win = window.open("about:blank", "_blank"); // open now, before await, to avoid popup blockers
    if (savedStatus === "draft" && dirty && !(await save("draft"))) return win?.close();
    if (win) win.location.href = `/admin/posts/${id}/preview`;
  }

  const scheduled =
    savedStatus === "published" && !!f.publishedAt && new Date(f.publishedAt).getTime() > Date.now();
  const text = htmlToText(f.html);
  const words = text ? text.split(" ").length : 0;

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
      {/* Main column */}
      <div className="min-w-0 space-y-4">
        <Link href="/admin" className="mb-2 inline-block text-sm text-muted hover:text-fg">
          ← All posts
        </Link>
        <label className="block">
          <span className="mb-1 block text-sm font-medium">Title</span>
          <textarea
            ref={titleRef}
            value={f.title}
            onChange={(e) => {
              const title = e.target.value.replace(/\n/g, " ");
              if (title.trim()) setTitleMissing(false);
              setF((prev) => ({ ...prev, title, slug: slugTouched ? prev.slug : slugify(title) }));
            }}
            placeholder="Post title"
            rows={1}
            aria-invalid={titleMissing || undefined}
            className={`field-sizing-content w-full resize-none rounded-md border bg-bg px-4 py-3 font-serif text-2xl leading-tight font-semibold outline-none placeholder:font-normal placeholder:text-faint focus:border-accent sm:text-3xl ${
              titleMissing ? "border-red-500" : "border-line"
            }`}
          />
        </label>
        <div>
          <span className="mb-1 block text-sm font-medium">Content</span>
          <RichEditor initialContent={initialContent} onChange={onContentChange} />
        </div>
        <p className="text-sm text-faint">
          {words} words · ~{Math.max(1, Math.round(words / 200))} min read
        </p>
      </div>

      {/* Sidebar */}
      <aside className="space-y-6 lg:sticky lg:top-4 lg:max-h-[calc(100dvh-2rem)] lg:self-start lg:overflow-y-auto lg:pb-4">
        <section className="space-y-3 rounded-md border border-line p-4">
          <div className="flex items-center justify-between gap-2">
            <StatusBadge status={savedStatus} scheduled={scheduled} />
            <SaveIndicator state={state} dirty={dirty} lastSavedAt={lastSavedAt} draft={savedStatus === "draft"} />
          </div>
          {state.kind === "error" && (
            <p role="alert" className="text-sm text-red-600 dark:text-red-400">
              {state.msg}
            </p>
          )}

          {savedStatus === "draft" ? (
            <div className="flex flex-wrap gap-2">
              <button className="btn btn-primary" onClick={publish} disabled={state.kind === "saving"}>
                Publish
              </button>
              <button className="btn" onClick={() => void save("draft")} disabled={state.kind === "saving" || !dirty}>
                Save draft
              </button>
              <button className="btn" onClick={() => void preview()}>
                Preview
              </button>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              <button className="btn btn-primary" onClick={publish} disabled={state.kind === "saving" || !dirty}>
                Update
              </button>
              {!scheduled && (
                <Link className="btn" href={`/blog/${f.slug}`} target="_blank">
                  View ↗
                </Link>
              )}
              <button
                className="btn"
                disabled={state.kind === "saving"}
                onClick={() => {
                  if (confirm("Unpublish this post and move it back to drafts?")) void save("draft");
                }}
              >
                Unpublish
              </button>
            </div>
          )}

          <label className="block">
            <span className="mb-1 block text-sm text-muted">Publish date</span>
            <input
              type="datetime-local"
              className="input text-sm"
              value={f.publishedAt}
              onChange={(e) => set("publishedAt", e.target.value)}
            />
            <span className="mt-1 block text-xs text-faint">
              Empty = the moment you publish. A future date schedules the post.
            </span>
          </label>
        </section>

        <section className="space-y-3">
          <label className="block">
            <span className="mb-1 block text-sm text-muted">Slug (URL)</span>
            <div className="flex items-center gap-1 text-sm">
              <span className="text-faint">/blog/</span>
              <input
                className="input font-mono text-sm"
                value={f.slug}
                onChange={(e) => {
                  setSlugTouched(true);
                  set("slug", e.target.value.toLowerCase().replace(/\s+/g, "-"));
                }}
                onBlur={() => {
                  if (!f.slug.trim()) {
                    setSlugTouched(false);
                    set("slug", slugify(f.title));
                  } else set("slug", slugify(f.slug));
                }}
              />
            </div>
          </label>

          <label className="block">
            <span className="mb-1 block text-sm text-muted">Category</span>
            <select className="input" value={f.categoryId} onChange={(e) => set("categoryId", e.target.value)}>
              <option value="">— No category —</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-1 block text-sm text-muted">Excerpt</span>
            <textarea
              className="input text-sm"
              rows={3}
              maxLength={500}
              value={f.excerpt}
              onChange={(e) => set("excerpt", e.target.value)}
              placeholder="Short summary shown on post cards and in search results"
            />
          </label>
        </section>

        <section>
          <span className="mb-2 block text-sm text-muted">Cover image</span>
          <CoverField
            url={f.coverUrl}
            alt={f.coverAlt}
            onChange={(u) => set("coverUrl", u)}
            onAltChange={(a) => set("coverAlt", a)}
          />
        </section>

        <details className="rounded-md border border-line p-4" open={!!(f.metaTitle || f.metaDescription)}>
          <summary className="cursor-pointer text-sm font-medium">SEO</summary>
          <div className="mt-3 space-y-3">
            <label className="block">
              <span className="mb-1 flex justify-between text-sm text-muted">
                Meta title <Counter n={(f.metaTitle || f.title).length} max={60} />
              </span>
              <input
                className="input text-sm"
                maxLength={200}
                value={f.metaTitle}
                placeholder={f.title || "Defaults to the post title"}
                onChange={(e) => set("metaTitle", e.target.value)}
              />
            </label>
            <label className="block">
              <span className="mb-1 flex justify-between text-sm text-muted">
                Meta description <Counter n={(f.metaDescription || f.excerpt).length} max={160} />
              </span>
              <textarea
                className="input text-sm"
                rows={3}
                maxLength={300}
                value={f.metaDescription}
                placeholder={f.excerpt || "Defaults to the excerpt"}
                onChange={(e) => set("metaDescription", e.target.value)}
              />
            </label>
          </div>
        </details>

        <div className="border-t border-line pt-4">
          <DeletePostButton id={id} title={f.title} afterDelete="list" />
        </div>
      </aside>
    </div>
  );
}

function Counter({ n, max }: { n: number; max: number }) {
  return <span className={n > max ? "text-amber-600" : "text-faint"}>{n}/{max}</span>;
}

function SaveIndicator({
  state,
  dirty,
  lastSavedAt,
  draft,
}: {
  state: { kind: string };
  dirty: boolean;
  lastSavedAt: Date | null;
  draft: boolean;
}) {
  let text = "";
  if (state.kind === "saving") text = "Saving…";
  else if (state.kind === "error") text = "Not saved";
  else if (dirty) text = draft ? "Editing…" : "Unsaved changes";
  else if (lastSavedAt)
    text = `Saved ${lastSavedAt.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}`;
  return (
    <span className="text-xs text-faint" aria-live="polite">
      {text}
    </span>
  );
}
