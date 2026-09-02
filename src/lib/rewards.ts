import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { getSection } from "@/lib/settings";

export type RewardTier = "COCOA" | "FLAME" | "CROWN";
export type RewardSummary = {
  points: number;
  lifetimePoints: number;
  tier: RewardTier;
  transactions: { id: string; type: string; points: number; description: string; createdAt: Date }[];
};

export async function getRewardRules() {
  const r = await getSection("rewards");
  return {
    ...r,
    paidOrderPoints: Math.max(0, r.paidOrderPoints),
    perItemPoints: Math.max(0, r.perItemPoints),
    minRedeemPoints: Math.max(100, r.minRedeemPoints),
    pointsPerPercent: Math.max(1, r.pointsPerPercent),
    maxRedeemPercent: Math.min(50, Math.max(1, r.maxRedeemPercent)),
    flameThreshold: Math.max(1, r.flameThreshold),
    crownThreshold: Math.max(r.flameThreshold + 1, r.crownThreshold),
  };
}

export async function pointsForPaidOrder(itemCount: number) {
  const r = await getRewardRules();
  return r.paidOrderPoints + Math.max(0, itemCount) * r.perItemPoints;
}

export async function tierForLifetimePoints(points: number): Promise<RewardTier> {
  const r = await getRewardRules();
  if (points >= r.crownThreshold) return "CROWN";
  if (points >= r.flameThreshold) return "FLAME";
  return "COCOA";
}

export async function calculateRewardRedemption(requestedPoints: number, availablePoints: number, eligibleSubtotalCents: number) {
  const r = await getRewardRules();
  if (!r.enabled || requestedPoints < r.minRedeemPoints || eligibleSubtotalCents <= 0) return { points: 0, percent: 0, discountCents: 0 };
  const capPoints = r.maxRedeemPercent * r.pointsPerPercent;
  const usable = Math.min(Math.max(0, requestedPoints), Math.max(0, availablePoints), capPoints);
  const rounded = Math.floor(usable / r.pointsPerPercent) * r.pointsPerPercent;
  if (rounded < r.minRedeemPoints) return { points: 0, percent: 0, discountCents: 0 };
  const percent = Math.min(r.maxRedeemPercent, Math.floor(rounded / r.pointsPerPercent));
  return { points: rounded, percent, discountCents: Math.floor((eligibleSubtotalCents * percent) / 100) };
}

/** Award points once per paid order. */
export async function awardPaidOrderRewards(orderId: string, userId: string, itemCount: number) {
  const r = await getRewardRules();
  if (!r.enabled) return;
  const points = r.paidOrderPoints + Math.max(0, itemCount) * r.perItemPoints;
  if (points <= 0) return;
  const reference = `paid-order:${orderId}`;

  await db.$executeRaw`
    WITH account AS (
      INSERT INTO "RewardAccount" ("userId", "points", "lifetimePoints", "tier")
      VALUES (${userId}, 0, 0, 'COCOA')
      ON CONFLICT ("userId") DO UPDATE SET "userId" = EXCLUDED."userId"
      RETURNING "id"
    ), inserted AS (
      INSERT INTO "RewardTransaction" ("accountId", "orderId", "type", "points", "description", "reference")
      SELECT "id", ${orderId}, 'EARN', ${points}, ${`Paid order reward · ${itemCount} item${itemCount === 1 ? "" : "s"}`}, ${reference}
      FROM account
      ON CONFLICT ("reference") DO NOTHING
      RETURNING "accountId"
    )
    UPDATE "RewardAccount"
    SET
      "points" = "points" + ${points},
      "lifetimePoints" = "lifetimePoints" + ${points},
      "tier" = CASE
        WHEN "lifetimePoints" + ${points} >= ${r.crownThreshold} THEN 'CROWN'
        WHEN "lifetimePoints" + ${points} >= ${r.flameThreshold} THEN 'FLAME'
        ELSE 'COCOA'
      END
    WHERE "id" IN (SELECT "accountId" FROM inserted)
  `;
}

/** Deduct points atomically while an order is pending payment. */
export async function reserveRewardRedemption(tx: Prisma.TransactionClient, orderId: string, userId: string, points: number) {
  if (points <= 0) return true;
  const rows = await tx.$queryRaw<Array<{ id: string }>>`
    UPDATE "RewardAccount"
    SET "points" = "points" - ${points}
    WHERE "userId" = ${userId} AND "points" >= ${points}
    RETURNING "id"
  `;
  const account = rows[0];
  if (!account) return false;
  await tx.$executeRaw`
    INSERT INTO "RewardTransaction" ("accountId", "orderId", "type", "points", "description", "reference")
    VALUES (${account.id}, ${orderId}, 'REDEEM', ${-points}, ${`Redeemed ${points} points at checkout`}, ${`redeem-order:${orderId}`})
    ON CONFLICT ("reference") DO NOTHING
  `;
  return true;
}

/** Return points for cancelled/expired checkout exactly once. */
export async function restoreRewardRedemption(orderId: string) {
  await db.$executeRaw`
    WITH original AS (
      SELECT rt."accountId", ABS(rt."points")::int AS points
      FROM "RewardTransaction" rt
      WHERE rt."orderId" = ${orderId} AND rt."reference" = ${`redeem-order:${orderId}`} AND rt."points" < 0
      LIMIT 1
    ), restored AS (
      INSERT INTO "RewardTransaction" ("accountId", "orderId", "type", "points", "description", "reference")
      SELECT "accountId", ${orderId}, 'REFUND', points, 'Points returned after cancelled checkout', ${`restore-order:${orderId}`}
      FROM original
      ON CONFLICT ("reference") DO NOTHING
      RETURNING "accountId", "points"
    )
    UPDATE "RewardAccount" a
    SET "points" = a."points" + r."points"
    FROM restored r
    WHERE a."id" = r."accountId"
  `;
}

export async function getRewardSummary(userId: string): Promise<RewardSummary> {
  const accounts = await db.$queryRaw<Array<{ id: string; points: number; lifetimePoints: number; tier: RewardTier }>>`
    SELECT "id", "points", "lifetimePoints", "tier" FROM "RewardAccount" WHERE "userId" = ${userId} LIMIT 1
  `;
  const account = accounts[0];
  if (!account) return { points: 0, lifetimePoints: 0, tier: "COCOA", transactions: [] };
  const transactions = await db.$queryRaw<Array<{ id: string; type: string; points: number; description: string; createdAt: Date }>>`
    SELECT "id", "type", "points", "description", "createdAt" FROM "RewardTransaction"
    WHERE "accountId" = ${account.id} ORDER BY "createdAt" DESC LIMIT 50
  `;
  return { points: account.points, lifetimePoints: account.lifetimePoints, tier: account.tier, transactions };
}
