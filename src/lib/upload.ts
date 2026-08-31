import { createSupabaseAdmin } from "./supabase/server";

export const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif"];
const MAGIC: Record<string, number[]> = { "image/jpeg": [0xff, 0xd8, 0xff], "image/png": [0x89, 0x50, 0x4e, 0x47], "image/webp": [0x52, 0x49, 0x46, 0x46] };

/** Valide type déclaré + signature binaire + taille, puis envoie dans le bucket. */
export type UploadResult = { error: string; url?: undefined; path?: undefined } | { url: string; path: string; error?: undefined };

export async function uploadImage(bucket: "products" | "reviews" | "branding", folder: string, file: File, maxBytes = 5 * 1024 * 1024): Promise<UploadResult> {
  if (!file || file.size === 0) return { error: "Choose an image." };
  if (file.size > maxBytes) return { error: `Image must be under ${Math.round(maxBytes / 1024 / 1024)} MB.` };
  if (!IMAGE_TYPES.includes(file.type)) return { error: "Only JPG, PNG, WebP or AVIF images are accepted." };
  const head = new Uint8Array(await file.slice(0, 12).arrayBuffer());
  const sig = MAGIC[file.type];
  if (sig && !sig.every((b, i) => head[i] === b)) return { error: "File content does not match its type." };
  if (file.type === "image/avif" && String.fromCharCode(...head.slice(4, 8)) !== "ftyp") return { error: "File content does not match its type." };

  const ext = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/avif": "avif" }[file.type] ?? "bin";
  const path = `${folder}/${Date.now()}-${crypto.randomUUID().slice(0, 8)}.${ext}`;
  const supabase = createSupabaseAdmin();
  const { error } = await supabase.storage.from(bucket).upload(path, file, { contentType: file.type, upsert: false, cacheControl: "31536000" });
  if (error) return { error: error.message };
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return { url: data.publicUrl, path };
}

export async function deleteUpload(bucket: string, path: string | null | undefined) {
  if (!path) return;
  await createSupabaseAdmin().storage.from(bucket).remove([path]);
}
