import { db } from "@/lib/db";

export type RewardTier = "COCOA" | "FLAME" | "CROWN";

export type RewardSummary = {
  points: number;
  lifetimePoints: number;
  tier: RewardTier;
  transactions: { id: string; type: string; points: number; description: string; createdAt: Date }[];
};

export const REWARD_RULES = {
  paidOrder: 100,
  perItem: 25,
  tiers: [
    { key: "COCOA" as const, min: 0, label: "Cocoa" },
    { key: "FLAME" as const, min: 1000, label: "Flame" },
    { key: "CROWN" as const, min: 3000, label: "Crown" },
  ],
};

export function pointsForPaidOrder(itemCount: number) {
  return REWARD_RULES.paidOrder + Math.max(0, itemCount) * REWARD_RULES.perItem;
}

export function tierForLifetimePoints(points: number): RewardTier {
  if (points >= 3000) return "CROWN";
  if (points >= 1000) return "FLAME";
  return "COCOA";
}

/** Award points once per paid order. The unique reference makes retries idempotent. */
export async function awardPaidOrderRewards(orderId: string, userId: string, itemCount: number) {
  const points = pointsForPaidOrder(itemCount);
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
        WHEN "lifetimePoints" + ${points} >= 3000 THEN 'CROWN'
        WHEN "lifetimePoints" + ${points} >= 1000 THEN 'FLAME'
        ELSE 'COCOA'
      END
    WHERE "id" IN (SELECT "accountId" FROM inserted)
  `;
}

export async function getRewardSummary(userId: string): Promise<RewardSummary> {
  const accounts = await db.$queryRaw<Array<{ id: string; points: number; lifetimePoints: number; tier: RewardTier }>>`
    SELECT "id", "points", "lifetimePoints", "tier"
    FROM "RewardAccount"
    WHERE "userId" = ${userId}
    LIMIT 1
  `;

  const account = accounts[0];
  if (!account) return { points: 0, lifetimePoints: 0, tier: "COCOA", transactions: [] };

  const transactions = await db.$queryRaw<Array<{ id: string; type: string; points: number; description: string; createdAt: Date }>>`
    SELECT "id", "type", "points", "description", "createdAt"
    FROM "RewardTransaction"
    WHERE "accountId" = ${account.id}
    ORDER BY "createdAt" DESC
    LIMIT 50
  `;

  return { points: account.points, lifetimePoints: account.lifetimePoints, tier: account.tier, transactions };
}
