"use server";

import { z } from "zod";
import { db } from "@/lib/db";
import { rateLimit } from "@/lib/rate-limit";
import { getLocale } from "@/i18n/server";

export async function subscribeNewsletter(_prev: { error?: string; ok?: boolean }, formData: FormData): Promise<{ error?: string; ok?: boolean }> {
  const rl = await rateLimit("newsletter", 5, 60 * 60_000);
  if (!rl.ok) return { error: "Too many attempts." };
  const email = z.string().email().safeParse(String(formData.get("email") ?? "").trim().toLowerCase());
  if (!email.success) return { error: "Enter a valid email." };
  await db.newsletterSubscriber.upsert({ where: { email: email.data }, update: {}, create: { email: email.data, locale: await getLocale(), source: String(formData.get("source") ?? "footer") } });
  return { ok: true };
}
