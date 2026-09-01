"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { uploadVideo } from "@/lib/upload";
import { HOME_DEFAULTS, type HeroBlock } from "@/lib/home-blocks";

export type HeroVideoSlot = "videoMainUrl" | "videoTopRightUrl" | "videoBottomRightUrl";
export type HeroVideoUploadState = { error?: string; message?: string; url?: string };

const SLOT_LABELS: Record<HeroVideoSlot, string> = {
  videoMainUrl: "Vidéo principale",
  videoTopRightUrl: "Vidéo haut droite",
  videoBottomRightUrl: "Vidéo bas droite",
};

function cleanSlot(value: FormDataEntryValue | null): HeroVideoSlot | null {
  const slot = String(value ?? "") as HeroVideoSlot;
  return slot in SLOT_LABELS ? slot : null;
}

export async function uploadHeroVideo(_prev: HeroVideoUploadState, formData: FormData): Promise<HeroVideoUploadState> {
  await requireAdmin();
  const slot = cleanSlot(formData.get("slot"));
  const file = formData.get("file");
  if (!slot) return { error: "Emplacement vidéo invalide." };
  if (!(file instanceof File)) return { error: "Choisissez une vidéo MP4 ou WebM." };

  const uploaded = await uploadVideo("branding", "home-video", file, 60 * 1024 * 1024);
  if (uploaded.error || !uploaded.url) return { error: uploaded.error ?? "Échec de l’upload." };

  const heroRows = await db.homeBlock.findMany({ where: { key: "hero" } });
  if (heroRows.length === 0) {
    const data: HeroBlock = { ...HOME_DEFAULTS.hero, [slot]: uploaded.url };
    await db.homeBlock.create({ data: { key: "hero", locale: "en", data: data as unknown as object, isActive: true } });
  } else {
    await Promise.all(heroRows.map(async (row) => {
      const current = { ...HOME_DEFAULTS.hero, ...(row.data as object) } as HeroBlock;
      const next = { ...current, [slot]: uploaded.url };
      await db.homeBlock.update({ where: { id: row.id }, data: { data: next as unknown as object } });
    }));
  }

  revalidatePath("/");
  revalidatePath("/admin/content");
  return { message: `${SLOT_LABELS[slot]} mise à jour.`, url: uploaded.url };
}
