"use server";

import { requireStaffPermission } from "@/lib/auth";
import { db } from "@/lib/db";
import { getSetting, setSetting } from "@/lib/settings";
import { uploadVideo } from "@/lib/upload";

type SavedVideo = { id: string; url: string; path: string; createdAt: string };

function videoKey(productId: string) {
  return `ai:product-videos:${productId}`;
}

export async function startProductVideoAI(input: { productId: string; prompt?: string }) {
  await requireStaffPermission("products.manage");
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) return { ok: false, error: "AI is not configured yet. Add OPENAI_API_KEY to the server environment." };

  const product = await db.product.findUnique({
    where: { id: input.productId },
    include: { images: { orderBy: { sortOrder: "asc" }, take: 1 }, category: { select: { name: true } } },
  });
  if (!product) return { ok: false, error: "Product not found." };

  const prompt = `Create a vertical premium ecommerce beauty video for MAMAHAIR featuring this product: ${product.name}. Product type: ${product.productType}. Category: ${product.category?.name ?? "hair product"}. Preserve the product's visible color, texture, construction and proportions. Elegant studio movement, premium lighting, clean background, subtle camera movement, no text, no fake claims, no altered logo. ${input.prompt?.trim() || ""}`;
  const form = new FormData();
  form.append("model", process.env.OPENAI_VIDEO_MODEL?.trim() || "sora-2");
  form.append("prompt", prompt);
  form.append("seconds", "8");
  form.append("size", "720x1280");

  const source = product.images[0];
  if (source?.url) {
    try {
      const imageResponse = await fetch(source.url, { cache: "no-store" });
      if (imageResponse.ok) {
        const blob = await imageResponse.blob();
        const mime = blob.type.startsWith("image/") ? blob.type : "image/png";
        form.append("input_reference", new File([blob], `product-reference.${mime.includes("jpeg") ? "jpg" : "png"}`, { type: mime }));
      }
    } catch (error) {
      console.warn("Could not attach product image reference to AI video", error);
    }
  }

  const response = await fetch("https://api.openai.com/v1/videos", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}` },
    body: form,
    cache: "no-store",
  });
  const payload = await response.json().catch(() => ({})) as { id?: string; status?: string; progress?: number; error?: { message?: string } };
  if (!response.ok || !payload.id) {
    console.error("startProductVideoAI OpenAI error", response.status, payload.error?.message);
    return { ok: false, error: payload.error?.message || `AI video request failed (${response.status}).` };
  }
  return { ok: true, videoId: payload.id, status: payload.status ?? "queued", progress: payload.progress ?? 0 };
}

export async function checkProductVideoAI(input: { productId: string; videoId: string }) {
  await requireStaffPermission("products.manage");
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) return { ok: false, error: "AI is not configured yet. Add OPENAI_API_KEY to the server environment." };
  if (!/^video_[A-Za-z0-9_-]+$/.test(input.videoId)) return { ok: false, error: "Invalid video job id." };

  const product = await db.product.findUnique({ where: { id: input.productId }, select: { id: true } });
  if (!product) return { ok: false, error: "Product not found." };

  const existing = await getSetting<SavedVideo[]>(videoKey(input.productId), []);
  const saved = existing.find((video) => video.id === input.videoId);
  if (saved) return { ok: true, status: "completed", progress: 100, videoUrl: saved.url };

  const statusResponse = await fetch(`https://api.openai.com/v1/videos/${encodeURIComponent(input.videoId)}`, {
    headers: { Authorization: `Bearer ${apiKey}` },
    cache: "no-store",
  });
  const status = await statusResponse.json().catch(() => ({})) as { status?: string; progress?: number; error?: { message?: string } };
  if (!statusResponse.ok) return { ok: false, error: status.error?.message || `Could not check AI video (${statusResponse.status}).` };
  if (status.status !== "completed") return { ok: true, status: status.status ?? "in_progress", progress: status.progress ?? 0 };

  const contentResponse = await fetch(`https://api.openai.com/v1/videos/${encodeURIComponent(input.videoId)}/content`, {
    headers: { Authorization: `Bearer ${apiKey}` },
    cache: "no-store",
  });
  if (!contentResponse.ok) return { ok: false, error: `Video completed but download failed (${contentResponse.status}).` };
  const blob = await contentResponse.blob();
  const file = new File([blob], `mamahair-ai-${input.videoId}.mp4`, { type: "video/mp4" });
  const uploaded = await uploadVideo("branding", `products/${input.productId}/ai-videos`, file, 120 * 1024 * 1024);
  if (uploaded.error || !uploaded.url) return { ok: false, error: uploaded.error || "Could not save generated video." };

  const next: SavedVideo[] = [...existing, { id: input.videoId, url: uploaded.url, path: uploaded.path, createdAt: new Date().toISOString() }].slice(-20);
  await setSetting(videoKey(input.productId), next);
  return { ok: true, status: "completed", progress: 100, videoUrl: uploaded.url };
}

export async function listProductAIVideos(productId: string) {
  await requireStaffPermission("products.manage");
  return getSetting<SavedVideo[]>(videoKey(productId), []);
}
