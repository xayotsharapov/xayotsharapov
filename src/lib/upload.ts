"use client";
import imageCompression from "browser-image-compression";
import { createClient } from "@/lib/supabase/client";

const EXT: Record<string, string> = {
  "image/webp": "webp",
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/gif": "gif",
  "image/avif": "avif",
};

export type UploadedImage = { url: string; width: number; height: number };

/**
 * Resize (max 2000px), compress to WebP, upload to Supabase Storage "images".
 * GIFs are uploaded as-is so animation survives.
 */
export async function uploadImage(file: File, maxSide = 2000): Promise<UploadedImage> {
  if (!file.type.startsWith("image/")) throw new Error("Faqat rasm yuklash mumkin.");

  let blob: Blob = file;
  if (file.type !== "image/gif") {
    blob = await imageCompression(file, {
      maxWidthOrHeight: maxSide,
      maxSizeMB: 0.9,
      initialQuality: 0.82,
      fileType: "image/webp",
      useWebWorker: false, // the worker mode loads a script from a CDN; in-page is fast enough for one image
    });
  }
  if (blob.size > 5 * 1024 * 1024) throw new Error("Rasm juda katta (5 MB dan oshmasin).");

  const bitmap = await createImageBitmap(blob);
  const { width, height } = bitmap;
  bitmap.close();

  const type = EXT[blob.type] ? blob.type : "image/webp";
  const now = new Date();
  const path = `posts/${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, "0")}/${crypto.randomUUID()}.${EXT[type]}`;

  const supabase = createClient();
  const { error } = await supabase.storage.from("images").upload(path, blob, {
    contentType: type,
    cacheControl: "31536000",
    upsert: false,
  });
  if (error) throw new Error(`Yuklab bo‘lmadi: ${error.message}`);

  const { data } = supabase.storage.from("images").getPublicUrl(path);
  return { url: data.publicUrl, width, height };
}
