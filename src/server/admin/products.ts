"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { uploadImage, deleteUpload } from "@/lib/upload";
import { productSchema, variantSchema } from "@/schemas/product";
import { toCents } from "@/lib/money";
import { slugify } from "@/lib/utils";
import { variantLabel } from "@/lib/catalog";
import type { ImageKind, ProductStatus } from "@prisma/client";

export type ActionState = { error?: string; ok?: boolean };

export async function adminListProducts(q?: string, status?: string) {
  await requireAdmin();
  return db.product.findMany({
    where: { ...(q ? { OR: [{ name: { contains: q, mode: "insensitive" } }, { sku: { contains: q, mode: "insensitive" } }, { variants: { some: { sku: { contains: q, mode: "insensitive" } } } }] } : {}), ...(status ? { status: status as ProductStatus } : {}) },
    orderBy: { updatedAt: "desc" },
    include: { category: true, images: { take: 1, orderBy: { sortOrder: "asc" } }, variants: { where: { isActive: true }, include: { inventory: true } }, _count: { select: { wishlistItems: true } } },
    take: 300,
  });
}

export async function adminGetProduct(id: string) {
  await requireAdmin();
  return db.product.findUnique({
    where: { id },
    include: { images: { orderBy: { sortOrder: "asc" } }, variants: { include: { inventory: true }, orderBy: [{ isActive: "desc" }, { priceCents: "asc" }] }, bundleItems: { include: { variant: { include: { product: { select: { name: true } } } } } } },
  });
}

function parseProductForm(formData: FormData) {
  const get = (k: string) => String(formData.get(k) ?? "").trim();
  const money = (k: string) => (get(k) === "" ? null : toCents(get(k)));
  const int = (k: string) => (get(k) === "" ? null : parseInt(get(k), 10));
  const list = (k: string) => formData.getAll(k).map(String).filter(Boolean);
  const attrs: Record<string, string> = {};
  get("attributes").split("\n").forEach((line) => { const [k, ...v] = line.split(":"); if (k?.trim() && v.length) attrs[k.trim()] = v.join(":").trim(); });
  return productSchema.safeParse({
    name: get("name"), slug: get("slug") || slugify(get("name")), sku: get("sku"), productType: get("productType") || "HAIR_CARE", status: get("status") || "ACTIVE", categoryId: get("categoryId"),
    brand: get("brand"), shortDesc: get("shortDesc"), description: get("description"), ingredients: get("ingredients"), howToUse: get("howToUse"),
    basePriceCents: toCents(get("basePrice")), compareAtCents: money("compareAt"), costCents: money("cost"), currency: (get("currency") || "USD").toUpperCase(), weightGrams: int("weightGrams"),
    hairTypes: list("hairTypes"), concerns: list("concerns"),
    hairMaterial: get("hairMaterial"), hairOrigin: get("hairOrigin"), capSize: get("capSize"), wigType: get("wigType"), closureType: get("closureType"), parting: get("parting"), hairGrade: get("hairGrade"),
    textures: list("textures"), lengths: list("lengths").map((n) => parseInt(n, 10)).filter((n) => !isNaN(n)), densities: list("densities"), laceTypes: list("laceTypes"), colors: get("colors").split(",").map((s) => s.trim()).filter(Boolean),
    bundlesCount: int("bundlesCount"),
    canBleach: get("canBleach"), canDye: get("canDye"), heatSafe: get("heatSafe"), prePlucked: get("prePlucked"), babyHair: get("babyHair"), glueless: get("glueless"), adjustableStrap: get("adjustableStrap"),
    attributes: Object.keys(attrs).length ? attrs : null,
    isFeatured: formData.get("isFeatured") === "on", isBestSeller: formData.get("isBestSeller") === "on", isNew: formData.get("isNew") === "on", isBundle: formData.get("isBundle") === "on",
    bundlePriceCents: money("bundlePrice"),
    seoTitle: get("seoTitle"), seoDescription: get("seoDescription"),
  });
}

const issues = (e: { issues: { path: PropertyKey[]; message: string }[] }) => e.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join(" · ");

export async function createProduct(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const parsed = parseProductForm(formData);
  if (!parsed.success) return { error: issues(parsed.error) };
  const { categoryId, sku, attributes, ...data } = parsed.data;
  if (await db.product.findUnique({ where: { slug: data.slug } })) return { error: "This slug is already used." };
  const product = await db.product.create({
    data: {
      ...data, sku: sku || null, categoryId: categoryId || null, attributes: attributes ?? undefined, publishedAt: data.status === "ACTIVE" ? new Date() : null,
      variants: { create: { sku: sku || `${data.slug.toUpperCase().slice(0, 14)}-DEF`, name: "Default", priceCents: data.basePriceCents, isDefault: true, inventory: { create: { quantity: 0 } } } },
    },
  });
  revalidatePath("/admin/products");
  redirect(`/admin/products/${product.id}`);
}

export async function updateProduct(id: string, _prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const parsed = parseProductForm(formData);
  if (!parsed.success) return { error: issues(parsed.error) };
  const { categoryId, sku, attributes, ...data } = parsed.data;
  const clash = await db.product.findFirst({ where: { slug: data.slug, id: { not: id } } });
  if (clash) return { error: "This slug is already used by another product." };
  const before = await db.product.findUnique({ where: { id }, select: { status: true, publishedAt: true } });
  await db.product.update({ where: { id }, data: { ...data, sku: sku || null, categoryId: categoryId || null, attributes: attributes ?? undefined, publishedAt: data.status === "ACTIVE" && !before?.publishedAt ? new Date() : undefined } });
  revalidatePath("/admin/products"); revalidatePath(`/products/${data.slug}`); revalidatePath("/shop"); revalidatePath("/");
  return { ok: true };
}

export async function setProductStatus(id: string, status: ProductStatus) {
  await requireAdmin();
  await db.product.update({ where: { id }, data: { status, publishedAt: status === "ACTIVE" ? new Date() : undefined } });
  revalidatePath("/admin/products"); revalidatePath("/shop");
}

export async function duplicateProduct(id: string) {
  await requireAdmin();
  const p = await db.product.findUnique({ where: { id }, include: { variants: { include: { inventory: true } }, images: true } });
  if (!p) return;
  const suffix = Date.now().toString(36).slice(-4);
  const { variants, images, slug, sku, ...restAll } = p;
  const rest = Object.fromEntries(Object.entries(restAll).filter(([k]) => !["id", "createdAt", "updatedAt", "salesCount", "ratingAvg", "ratingCount", "publishedAt"].includes(k))) as Omit<typeof restAll, "id" | "createdAt" | "updatedAt" | "salesCount" | "ratingAvg" | "ratingCount" | "publishedAt">;
  const copy = await db.product.create({
    data: {
      ...rest, name: `${p.name} (copy)`, slug: `${slug}-copy-${suffix}`, sku: sku ? `${sku}-COPY-${suffix}` : null, status: "DRAFT", attributes: rest.attributes ?? undefined,
      images: { create: images.map((i) => ({ url: i.url, path: null, alt: i.alt, kind: i.kind, sortOrder: i.sortOrder })) },
      variants: { create: variants.map((v) => ({ sku: `${v.sku}-COPY-${suffix}`, name: v.name, options: v.options ?? undefined, priceCents: v.priceCents, compareAtCents: v.compareAtCents, costCents: v.costCents, weightGrams: v.weightGrams, isDefault: v.isDefault, isActive: v.isActive, inventory: { create: { quantity: 0 } } })) },
    },
  });
  redirect(`/admin/products/${copy.id}`);
}

// ---- Variantes ----
export async function saveVariant(productId: string, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const options: Record<string, string> = {};
  for (const k of ["texture", "length", "density", "lace", "color", "capSize", "size"]) { const v = String(formData.get(`opt_${k}`) ?? "").trim(); if (v) options[k] = v; }
  const name = String(formData.get("name") ?? "").trim() || variantLabel(options, "Default");
  const parsed = variantSchema.safeParse({
    sku: String(formData.get("sku") ?? "").trim(), name, options: Object.keys(options).length ? options : null,
    priceCents: toCents(String(formData.get("price") ?? "0")), compareAtCents: formData.get("compareAt") ? toCents(String(formData.get("compareAt"))) : null, costCents: formData.get("cost") ? toCents(String(formData.get("cost"))) : null,
    weightGrams: formData.get("weightGrams") ? parseInt(String(formData.get("weightGrams")), 10) : null,
    quantity: parseInt(String(formData.get("quantity") ?? "0"), 10) || 0, imageId: String(formData.get("imageId") ?? ""),
    isDefault: formData.get("isDefault") === "on", isActive: formData.has("activePresent") ? formData.get("active") === "on" : true,
  });
  if (!parsed.success) return { error: issues(parsed.error) };
  const { quantity, imageId, ...v } = parsed.data;
  const skuClash = await db.productVariant.findFirst({ where: { sku: v.sku, ...(id ? { id: { not: id } } : {}) } });
  if (skuClash) return { error: `SKU ${v.sku} already exists.` };
  await db.$transaction(async (tx) => {
    if (v.isDefault) await tx.productVariant.updateMany({ where: { productId }, data: { isDefault: false } });
    const data = { ...v, options: v.options ?? undefined, imageId: imageId || null };
    if (id) {
      await tx.productVariant.update({ where: { id, productId }, data });
      const inv = await tx.inventory.findUnique({ where: { variantId: id } });
      const safeQty = Math.max(quantity, inv?.reserved ?? 0);
      await tx.inventory.upsert({ where: { variantId: id }, create: { variantId: id, quantity: safeQty }, update: { quantity: safeQty } });
    } else {
      await tx.productVariant.create({ data: { ...data, productId, inventory: { create: { quantity } } } });
    }
  });
  revalidatePath(`/admin/products/${productId}`);
  return { ok: true };
}

export async function generateVariants(productId: string, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const p = await db.product.findUnique({ where: { id: productId }, select: { basePriceCents: true, slug: true, weightGrams: true } });
  if (!p) return { error: "Product not found." };
  const axes: [string, string[]][] = [];
  for (const k of ["texture", "length", "density", "lace", "color", "capSize"]) {
    const vals = formData.getAll(`gen_${k}`).map(String).filter(Boolean);
    if (vals.length) axes.push([k, vals]);
  }
  if (!axes.length) return { error: "Select at least one option value." };
  let combos: Record<string, string>[] = [{}];
  for (const [k, vals] of axes) combos = combos.flatMap((c) => vals.map((v) => ({ ...c, [k]: v })));
  if (combos.length > 400) return { error: `${combos.length} combinations is too many. Reduce the options.` };
  const prefix = p.slug.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 10);
  let created = 0;
  for (const options of combos) {
    const sku = `${prefix}-${Object.values(options).map((v) => v.replace(/[^A-Za-z0-9]/g, "").toUpperCase().slice(0, 6)).join("-")}`;
    const exists = await db.productVariant.findUnique({ where: { sku } });
    if (exists) continue;
    await db.productVariant.create({ data: { productId, sku, name: variantLabel(options, "Variant"), options, priceCents: p.basePriceCents, weightGrams: p.weightGrams, inventory: { create: { quantity: 0 } } } });
    created++;
  }
  revalidatePath(`/admin/products/${productId}`);
  return { ok: true, error: created === 0 ? "All combinations already existed." : undefined };
}

export async function deleteVariant(productId: string, variantId: string): Promise<ActionState> {
  await requireAdmin();
  const count = await db.productVariant.count({ where: { productId, isActive: true } });
  if (count <= 1) return { error: "A product needs at least one active variant." };
  await db.productVariant.update({ where: { id: variantId, productId }, data: { isActive: false, isDefault: false } });
  revalidatePath(`/admin/products/${productId}`);
  return { ok: true };
}

// ---- Bundles ----
export async function addBundleItem(productId: string, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const sku = String(formData.get("sku") ?? "").trim();
  const quantity = Math.max(1, parseInt(String(formData.get("quantity") ?? "1"), 10) || 1);
  const variant = await db.productVariant.findUnique({ where: { sku } });
  if (!variant) return { error: `No variant with SKU ${sku}.` };
  if (variant.productId === productId) return { error: "A bundle cannot contain itself." };
  await db.bundleItem.upsert({ where: { bundleId_variantId: { bundleId: productId, variantId: variant.id } }, update: { quantity }, create: { bundleId: productId, variantId: variant.id, quantity } });
  await db.product.update({ where: { id: productId }, data: { isBundle: true } });
  revalidatePath(`/admin/products/${productId}`);
  return { ok: true };
}

export async function removeBundleItem(productId: string, itemId: string) {
  await requireAdmin();
  await db.bundleItem.deleteMany({ where: { id: itemId, bundleId: productId } });
  revalidatePath(`/admin/products/${productId}`);
}

// ---- Catégories ----
export async function adminListCategories() {
  await requireAdmin();
  return db.category.findMany({ orderBy: [{ sortOrder: "asc" }, { name: "asc" }], include: { _count: { select: { products: true } } } });
}

export async function saveCategory(formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { error: "Name is required." };
  const slug = String(formData.get("slug") ?? "").trim() || slugify(name);
  const sortOrderRaw = parseInt(String(formData.get("sortOrder") ?? "0"), 10);
  const data = {
    name,
    slug,
    description: String(formData.get("description") ?? "").trim() || null,
    isActive: formData.get("isActive") === "on",
    showOnHome: formData.get("showOnHome") === "on",
    sortOrder: Number.isFinite(sortOrderRaw) ? sortOrderRaw : 0,
  };

  const slugClash = await db.category.findFirst({ where: { slug, ...(id ? { id: { not: id } } : {}) }, select: { id: true } });
  if (slugClash) return { error: "This category slug is already used." };

  if (id) await db.category.update({ where: { id }, data });
  else await db.category.create({ data });

  revalidatePath("/admin/products");
  revalidatePath("/");
  revalidatePath("/shop");
  revalidatePath(`/shop/${slug}`);
  return { ok: true };
}

export async function uploadCategoryImage(categoryId: string, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const category = await db.category.findUnique({ where: { id: categoryId }, select: { slug: true } });
  if (!category) return { error: "Category not found." };
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) return { error: "Choose an image." };
  const up = await uploadImage("products", `categories/${category.slug}`, file);
  if (up.error || !up.url) return { error: up.error ?? "Upload failed." };
  await db.category.update({ where: { id: categoryId }, data: { imageUrl: up.url } });
  revalidatePath("/"); revalidatePath("/shop"); revalidatePath(`/shop/${category.slug}`); revalidatePath("/admin/products");
  return { ok: true };
}
