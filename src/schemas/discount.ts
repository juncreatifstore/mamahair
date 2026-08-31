import { z } from "zod";

export const discountSchema = z
  .object({
    code: z.string().min(3).max(40).transform((s) => s.toUpperCase().trim()),
    type: z.enum(["PERCENT", "FIXED", "FREE_SHIPPING"]),
    value: z.number().int().min(0),
    currency: z.string().length(3).optional().or(z.literal("")),
    minOrderCents: z.number().int().min(0).nullable(),
    maxUses: z.number().int().min(1).nullable(),
    usesPerCustomer: z.number().int().min(1).nullable(),
    startsAt: z.string().optional().or(z.literal("")),
    endsAt: z.string().optional().or(z.literal("")),
    productIds: z.array(z.string()),
    categoryIds: z.array(z.string()),
  })
  .superRefine((d, ctx) => {
    if (d.type === "PERCENT" && d.value > 100) ctx.addIssue({ code: "custom", path: ["value"], message: "Percent cannot exceed 100" });
    if ((d.type === "FIXED" || d.minOrderCents != null) && !d.currency) ctx.addIssue({ code: "custom", path: ["currency"], message: "A fixed amount or minimum order needs a currency" });
  });
