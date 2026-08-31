"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";
import { uploadImage } from "@/lib/upload";

const reviewSchema = z.object({
  productId: z.string().uuid(),
  rating: z.coerce.number().int().min(1).max(5),
  title: z.string().max(120).optional().or(z.literal("")),
  body: z.string().min(10, "Tell us a little more (10+ characters).").max(2000),
});

export type ReviewState = { error?: string; message?: string };

export async function submitReview(_prev: ReviewState, formData: FormData): Promise<ReviewState> {
  const user = await getCurrentUser();
  if (!user) return { error: "Sign in to leave a review." };
  const rl = await rateLimit("review", 5, 60 * 60_000);
  if (!rl.ok) return { error: "Too many reviews submitted. Try again later." };
  const parsed = reviewSchema.safeParse({ productId: formData.get("productId"), rating: formData.get("rating"), title: formData.get("title"), body: formData.get("body") });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message || "Check the review fields." };
  const { productId, rating, title, body } = parsed.data;

  // Anti-spam évident : liens + majuscules abusives
  if (/(https?:\/\/|www\.)/i.test(body) || (body.length > 30 && body.replace(/[^A-Z]/g, "").length / body.length > 0.6)) return { error: "Please write a review without links." };
  if (await db.review.findUnique({ where: { productId_userId: { productId, userId: user.id } } })) return { error: "You already reviewed this product." };

  const verified = (await db.orderItem.count({ where: { variant: { productId }, order: { userId: user.id, status: { in: ["PAID", "PROCESSING", "READY_TO_SHIP", "SHIPPED", "DELIVERED"] } } } })) > 0;
  const uid: string = user.id;

  const photoUrls: string[] = [];
  for (const f of formData.getAll("photos").slice(0, 3)) {
    if (f instanceof File && f.size > 0) {
      const up = await uploadImage("reviews", `${productId}/${uid}`, f, 3 * 1024 * 1024);
      if (up.url) photoUrls.push(up.url);
    }
  }
  await db.review.create({ data: { productId, userId: user.id, rating, title: title || null, body, photoUrls, isVerifiedPurchase: verified, isApproved: false } });
  return { message: "Thanks! Your review will appear after moderation." };
}

/** Recalcule la moyenne (appelé à l'approbation admin). */
export async function recomputeProductRating(productId: string) {
  const agg = await db.review.aggregate({ where: { productId, isApproved: true }, _avg: { rating: true }, _count: true });
  await db.product.update({ where: { id: productId }, data: { ratingAvg: agg._avg.rating, ratingCount: agg._count } });
  const p = await db.product.findUnique({ where: { id: productId }, select: { slug: true } });
  if (p) revalidatePath(`/products/${p.slug}`);
}

export async function getMyReviews() {
  const user = await getCurrentUser();
  if (!user) return [];
  return db.review.findMany({ where: { userId: user.id }, include: { product: { select: { name: true, slug: true } } }, orderBy: { createdAt: "desc" } });
}
