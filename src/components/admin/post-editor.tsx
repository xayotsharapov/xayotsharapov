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

export function PostEditor({ post, categories }: { post: Post | null; categories: Category[] }) {
  const [f, setF] = useState<Fields>(() => ({
    title: post?.title ?? "",
    slug: post?.slug ?? "",
    excerpt: post?.excerpt ?? "",
    categoryId: post ? post.category_id ?? "" : categories[0]?.id ?? "",
    coverUrl: post?.cover_url ?? null,
    coverAlt: post?.cover_alt ?? "",
    html: post?.content_html ?? "",
    metaTitle: post?.meta_title ?? "",
    metaDescription: post?.meta_description ?? "",
    publishedAt: toLocalInput(post?.published_at ?? null),
  }));
  const set = <K extends keyof Fields>(k: K, v: Fields[K]) => setF((prev) => ({ ...prev, [k]: v }));

  const [json, setJson] = useState<JSONContent | null>((post?.content_json as JSONContent) ?? null);
  const [slugTouched, setSlugTouched] = useState(!!post);
  const [id, setId] = useState<string | null>(post?.id ?? null);
  const [savedStatus, setSavedStatus] = useState<PostStatus>(post?.status ?? "draft");
  const [state, setState] = useState<{ kind: "idle" | "saving" | "saved" | "error"; msg?: string }>({
    kind: "idle",
  });
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(post ? new Date(post.updated_at) : null);

  const current = useMemo(() => snap(f), [f]);
  const savedSnap = useRef(current);
  const dirty = current !== savedSnap.current;

  const idRef = useRef(id);
  const inFlight = useRef<Promise<unknown> | null>(null);
  const latest = useRef({ f, json });
  latest.current = { f, json };

  const save = useCallback(async (status: PostStatus): Promise<string | null> => {
    while (inFlight.current) await inFlight.current;
    const { f: fields, json: content } = latest.current;
    const input: PostInput = {
      id: idRef.current,
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
      res = { ok: false as const, error: "Tarmoq xatosi. Qaytadan urinib ko‘ring." };
    } finally {
      inFlight.current = null;
    }
    if (!res.ok) {
      setState({ kind: "error", msg: res.error });
      return null;
    }
    const isNew = !idRef.current;
    idRef.current = res.id;
    setId(res.id);
    if (isNew) window.history.replaceState(null, "", `/admin/posts/${res.id}`);

    const next = { ...fields, slug: res.slug, publishedAt: toLocalInput(res.publishedAt) };
    savedSnap.current = snap(next);
    setF((prev) => ({ ...prev, slug: res.slug, publishedAt: next.publishedAt }));
    setSlugTouched(true);
    setSavedStatus(res.status);
    setLastSavedAt(new Date(res.savedAt));
    setState({ kind: "saved" });
    return res.id;
  }, []);

  // Autosave: drafts only. Published posts change only when you press "Yangilash".
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

  async function preview() {
    const win = window.open("about:blank", "_blank"); // open now, before await, to avoid popup blockers
    let postId = idRef.current;
    if (savedStatus === "draft" && (dirty || !postId)) postId = await save("draft");
    if (!postId) return win?.close();
    if (win) win.location.href = `/admin/posts/${postId}/preview`;
  }

  const scheduled =
    savedStatus === "published" && !!f.publishedAt && new Date(f.publishedAt).getTime() > Date.now();
  const text = htmlToText(f.html);
  const words = text ? text.split(" ").length : 0;

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
      {/* Main column */}
      <div className="min-w-0 space-y-4">
        <Link href="/admin" className="text-sm text-muted hover:text-fg">
          ← Maqolalar
        </Link>
        <textarea
          value={f.title}
          onChange={(e) => {
            const title = e.target.value.replace(/\n/g, " ");
            setF((prev) => ({ ...prev, title, slug: slugTouched ? prev.slug : slugify(title) }));
          }}
          placeholder="Sarlavha"
          rows={1}
          className="field-sizing-content w-full resize-none bg-transparent font-serif text-3xl leading-tight font-semibold outline-none placeholder:text-faint sm:text-4xl"
          aria-label="Sarlavha"
        />
        <RichEditor
          initialContent={json ?? f.html}
          onChange={(html, j) => {
            set("html", html);
            setJson(j);
          }}
        />
        <p className="text-sm text-faint">
          {words} so‘z · ~{Math.max(1, Math.round(words / 200))} daqiqa o‘qish
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
              <button className="btn btn-primary" onClick={() => void save("published")} disabled={state.kind === "saving"}>
                Nashr qilish
              </button>
              <button className="btn" onClick={() => void save("draft")} disabled={state.kind === "saving" || (!dirty && !!id)}>
                Saqlash
              </button>
              <button className="btn" onClick={() => void preview()}>
                Ko‘rib chiqish
              </button>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              <button className="btn btn-primary" onClick={() => void save("published")} disabled={state.kind === "saving" || !dirty}>
                Yangilash
              </button>
              {!scheduled && (
                <Link className="btn" href={`/blog/${f.slug}`} target="_blank">
                  Ochish ↗
                </Link>
              )}
              <button
                className="btn"
                disabled={state.kind === "saving"}
                onClick={() => {
                  if (confirm("Maqola saytdan olinib, qoralamaga qaytarilsinmi?")) void save("draft");
                }}
              >
                Qoralamaga qaytarish
              </button>
            </div>
          )}

          <label className="block">
            <span className="mb-1 block text-sm text-muted">Nashr sanasi</span>
            <input
              type="datetime-local"
              className="input text-sm"
              value={f.publishedAt}
              onChange={(e) => set("publishedAt", e.target.value)}
            />
            <span className="mt-1 block text-xs text-faint">
              Bo‘sh bo‘lsa — nashr qilingan payt. Kelajakdagi sana — rejalashtirilgan.
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
            <span className="mb-1 block text-sm text-muted">Kategoriya</span>
            <select className="input" value={f.categoryId} onChange={(e) => set("categoryId", e.target.value)}>
              <option value="">— Kategoriyasiz —</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-1 block text-sm text-muted">Qisqacha mazmun (excerpt)</span>
            <textarea
              className="input text-sm"
              rows={3}
              maxLength={500}
              value={f.excerpt}
              onChange={(e) => set("excerpt", e.target.value)}
              placeholder="Kartochkalarda va qidiruv natijalarida ko‘rinadi"
            />
          </label>
        </section>

        <section>
          <span className="mb-2 block text-sm text-muted">Muqova rasmi</span>
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
                Meta sarlavha <Counter n={(f.metaTitle || f.title).length} max={60} />
              </span>
              <input
                className="input text-sm"
                maxLength={200}
                value={f.metaTitle}
                placeholder={f.title || "Bo‘sh bo‘lsa sarlavha ishlatiladi"}
                onChange={(e) => set("metaTitle", e.target.value)}
              />
            </label>
            <label className="block">
              <span className="mb-1 flex justify-between text-sm text-muted">
                Meta tavsif <Counter n={(f.metaDescription || f.excerpt).length} max={160} />
              </span>
              <textarea
                className="input text-sm"
                rows={3}
                maxLength={300}
                value={f.metaDescription}
                placeholder={f.excerpt || "Bo‘sh bo‘lsa qisqacha mazmun ishlatiladi"}
                onChange={(e) => set("metaDescription", e.target.value)}
              />
            </label>
          </div>
        </details>

        {id && (
          <div className="border-t border-line pt-4">
            <DeletePostButton id={id} title={f.title} afterDelete="list" />
          </div>
        )}
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
  if (state.kind === "saving") text = "Saqlanmoqda…";
  else if (state.kind === "error") text = "Saqlanmadi";
  else if (dirty) text = draft ? "O‘zgarishlar bor…" : "Saqlanmagan o‘zgarishlar";
  else if (lastSavedAt)
    text = `Saqlandi ${lastSavedAt.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })}`;
  return (
    <span className="text-xs text-faint" aria-live="polite">
      {text}
    </span>
  );
}
