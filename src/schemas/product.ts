import { z } from "zod";

const opt = z.string().max(5000).optional().or(z.literal(""));
const bool3 = z.enum(["", "true", "false"]).transform((v) => (v === "" ? null : v === "true"));

export const productSchema = z.object({
  name: z.string().min(2).max(160),
  slug: z.string().min(2).max(160).regex(/^[a-z0-9-]+$/, "Lowercase letters, numbers and dashes only"),
  sku: z.string().max(60).optional().or(z.literal("")),
  productType: z.enum(["WIG", "BUNDLE", "EXTENSION", "CLOSURE", "FRONTAL", "HAIR_CARE", "ACCESSORY", "KIT"]),
  status: z.enum(["DRAFT", "ACTIVE", "ARCHIVED"]),
  categoryId: z.string().optional().or(z.literal("")),
  brand: opt, shortDesc: z.string().max(200).optional().or(z.literal("")), description: opt, ingredients: opt, howToUse: opt,
  basePriceCents: z.number().int().min(0),
  compareAtCents: z.number().int().min(0).nullable(),
  costCents: z.number().int().min(0).nullable(),
  currency: z.string().length(3),
  weightGrams: z.number().int().min(0).nullable(),
  hairTypes: z.array(z.enum(["T3A", "T3B", "T3C", "T4A", "T4B", "T4C"])),
  concerns: z.array(z.string().max(40)),
  hairMaterial: opt, hairOrigin: opt, capSize: opt, wigType: opt, closureType: opt, parting: opt, hairGrade: opt,
  textures: z.array(z.string().max(40)), lengths: z.array(z.number().int()), densities: z.array(z.string().max(10)), laceTypes: z.array(z.string().max(30)), colors: z.array(z.string().max(40)),
  bundlesCount: z.number().int().min(0).nullable(),
  canBleach: bool3, canDye: bool3, heatSafe: bool3, prePlucked: bool3, babyHair: bool3, glueless: bool3, adjustableStrap: bool3,
  attributes: z.record(z.string().max(60), z.string().max(200)).nullable(),
  isFeatured: z.boolean(), isBestSeller: z.boolean(), isNew: z.boolean(), isBundle: z.boolean(),
  bundlePriceCents: z.number().int().min(0).nullable(),
  seoTitle: z.string().max(70).optional().or(z.literal("")), seoDescription: z.string().max(160).optional().or(z.literal("")),
});
export type ProductInput = z.infer<typeof productSchema>;

export const variantSchema = z.object({
  sku: z.string().min(1).max(60),
  name: z.string().min(1).max(160),
  options: z.record(z.string().max(30), z.string().max(60)).nullable(),
  priceCents: z.number().int().min(0),
  compareAtCents: z.number().int().min(0).nullable(),
  costCents: z.number().int().min(0).nullable(),
  weightGrams: z.number().int().min(0).nullable(),
  quantity: z.number().int().min(0),
  imageId: z.string().optional().or(z.literal("")),
  isDefault: z.boolean(),
  isActive: z.boolean(),
});
export type VariantInput = z.infer<typeof variantSchema>;
