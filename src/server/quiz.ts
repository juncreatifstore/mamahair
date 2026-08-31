"use server";

import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { quizSchema } from "@/schemas/quiz";
import type { Prisma, ProductType } from "@prisma/client";



const LENGTH_RANGES: Record<string, number[]> = { short: [8, 10, 12, 14], medium: [16, 18, 20, 22], long: [24, 26, 28, 30], extra: [32, 34, 36, 40] };
const BUDGET_MAX: Record<string, number> = { low: 15000, mid: 35000, high: 999999 };

/** Recommandations : filtre strict puis assouplissement progressif pour toujours proposer quelque chose. */
export async function getQuizRecommendations(raw: unknown, currency = "USD") {
  const a = quizSchema.safeParse(raw);
  const answers = a.success ? a.data : {};
  const user = await getCurrentUser();
  if (user) await db.hairProfile.upsert({ where: { userId: user.id }, update: { quiz: answers }, create: { userId: user.id, quiz: answers } });

  const base: Prisma.ProductWhereInput = { status: "ACTIVE", currency };
  const attempts: Prisma.ProductWhereInput[] = [
    { ...base, ...(answers.goal ? { productType: answers.goal as ProductType } : {}), ...(answers.texture ? { textures: { has: answers.texture } } : {}), ...(answers.length ? { lengths: { hasSome: LENGTH_RANGES[answers.length] } } : {}), ...(answers.budget ? { basePriceCents: { lte: BUDGET_MAX[answers.budget] } } : {}), ...(answers.maintenance === "low" ? { OR: [{ glueless: true }, { productType: "HAIR_CARE" }] } : {}) },
    { ...base, ...(answers.goal ? { productType: answers.goal as ProductType } : {}), ...(answers.texture ? { textures: { has: answers.texture } } : {}), ...(answers.budget ? { basePriceCents: { lte: BUDGET_MAX[answers.budget] } } : {}) },
    { ...base, ...(answers.goal ? { productType: answers.goal as ProductType } : {}) },
    base,
  ];
  for (const where of attempts) {
    const items = await db.product.findMany({ where, take: 6, orderBy: [{ isBestSeller: "desc" }, { salesCount: "desc" }], select: { id: true, slug: true, name: true, shortDesc: true, basePriceCents: true, compareAtCents: true, currency: true, productType: true, hairTypes: true, textures: true, lengths: true, isNew: true, isBestSeller: true, ratingAvg: true, ratingCount: true, images: { take: 2, orderBy: { sortOrder: "asc" }, select: { url: true, alt: true } }, category: { select: { slug: true, name: true } } } });
    if (items.length >= 3) return items;
  }
  return [];
}
