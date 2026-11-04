"use client";
/* eslint-disable @next/next/no-img-element -- admin-only preview of a freshly uploaded image */
import { useRef, useState } from "react";
import { uploadImage } from "@/lib/upload";

export function CoverField({
  url,
  alt,
  onChange,
  onAltChange,
}: {
  url: string | null;
  alt: string;
  onChange: (url: string | null) => void;
  onAltChange: (alt: string) => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  return (
    <div className="space-y-2">
      {url ? (
        <img src={url} alt={alt} className="aspect-[16/9] w-full rounded-md border border-line object-cover" />
      ) : (
        <button
          type="button"
          onClick={() => input.current?.click()}
          className="flex aspect-[16/9] w-full items-center justify-center rounded-md border border-dashed border-line text-sm text-muted hover:bg-surface"
        >
          {busy ? "Uploading…" : "Choose a cover image"}
        </button>
      )}
      <div className="flex gap-2">
        <button type="button" className="btn" disabled={busy} onClick={() => input.current?.click()}>
          {busy ? "Uploading…" : url ? "Replace" : "Upload"}
        </button>
        {url && (
          <button type="button" className="btn" onClick={() => onChange(null)}>
            Remove
          </button>
        )}
      </div>
      {url && (
        <input
          className="input text-sm"
          placeholder="Image description (alt text)"
          value={alt}
          onChange={(e) => onAltChange(e.target.value)}
        />
      )}
      <input
        ref={input}
        type="file"
        accept="image/*"
        hidden
        onChange={async (e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          if (!file) return;
          setBusy(true);
          try {
            const img = await uploadImage(file, 2400);
            onChange(img.url);
          } catch (err) {
            alert((err as Error).message);
          } finally {
            setBusy(false);
          }
        }}
      />
    </div>
  );
}
