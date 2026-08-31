"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { saveSection, type SettingSection, DEFAULT_SETTINGS } from "@/lib/settings";
import { uploadImage } from "@/lib/upload";
import { discountSchema } from "@/schemas/discount";
import { toCents, isSupportedCurrency } from "@/lib/money";
import { recomputeProductRating } from "@/server/reviews";

type S = { error?: string; ok?: boolean };

// ---- Settings (sections) ----
export async function saveSettingsSection(section: SettingSection, formData: FormData): Promise<S> {
  await requireAdmin();
  const defaults = DEFAULT_SETTINGS[section] as Record<string, unknown>;
  const value: Record<string, unknown> = {};
  for (const [k, def] of Object.entries(defaults)) {
    const raw = formData.get(k);
    if (typeof def === "boolean") value[k] = raw === "on";
    else if (typeof def === "number") value[k] = raw === null || raw === "" ? def : Number(raw);
    else if (Array.isArray(def)) value[k] = String(raw ?? "").split(",").map((s) => s.trim().toUpperCase()).filter(Boolean).map((s) => (k === "enabledLocales" ? s.toLowerCase() : s));
    else if (raw !== null) value[k] = String(raw);
  }
  if (section === "commerce") {
    const cur = value.enabledCurrencies as string[];
    if (cur.some((c) => !isSupportedCurrency(c))) return { error: "Unsupported currency code." };
    if (!cur.includes(String(value.defaultCurrency).toUpperCase())) return { error: "Default currency must be in the enabled currencies." };
    value.defaultCurrency = String(value.defaultCurrency).toUpperCase();
    value.reservationMinutes = Math.min(1440, Math.max(30, Number(value.reservationMinutes) || 30));
  }
  await saveSection(section, value as never);
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function uploadBrandingAsset(field: "logoUrl" | "logoLightUrl" | "logoDarkUrl" | "faviconUrl" | "ogImageUrl", formData: FormData): Promise<S> {
  await requireAdmin();
  const file = formData.get("file");
  if (!(file instanceof File)) return { error: "Choose a file." };
  const up = await uploadImage("branding", field, file, 2 * 1024 * 1024);
  if (up.error || !up.url) return { error: up.error ?? "Upload failed." };
  if (field === "ogImageUrl") await saveSection("seo", { ogImageUrl: up.url });
  else await saveSection("branding", { [field]: up.url });
  revalidatePath("/", "layout");
  return { ok: true };
}

// ---- Livraison ----
export async function adminListZones() {
  await requireAdmin();
  return db.shippingZone.findMany({ include: { rates: { orderBy: { priceCents: "asc" } }, taxRates: true }, orderBy: [{ sortOrder: "asc" }, { name: "asc" }] });
}

export async function saveZone(formData: FormData): Promise<S> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const countries = String(formData.get("countries") ?? "").split(",").map((c) => c.trim().toUpperCase()).filter((c) => /^[A-Z]{2}$/.test(c));
  if (!name || !countries.length) return { error: "Name and at least one ISO country code are required." };
  if (id) await db.shippingZone.update({ where: { id }, data: { name, countries } });
  else await db.shippingZone.create({ data: { name, countries } });
  revalidatePath("/admin/shipping");
  return { ok: true };
}

export async function saveRate(formData: FormData): Promise<S> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const currency = String(formData.get("currency") ?? "USD").toUpperCase();
  if (!isSupportedCurrency(currency)) return { error: "Unsupported currency." };
  const num = (k: string) => (formData.get(k) ? parseInt(String(formData.get(k)), 10) : null);
  const data = {
    zoneId: String(formData.get("zoneId")), name: String(formData.get("name") ?? "").trim(), priceCents: toCents(String(formData.get("price") ?? "0")), currency,
    freeAboveCents: formData.get("freeAbove") ? toCents(String(formData.get("freeAbove"))) : null, minWeightGrams: num("minWeightGrams"), maxWeightGrams: num("maxWeightGrams"),
    minDays: num("minDays"), maxDays: num("maxDays"), isActive: formData.get("isActive") !== "off",
  };
  if (!data.name) return { error: "Rate name is required." };
  if (id) await db.shippingRate.update({ where: { id }, data });
  else await db.shippingRate.create({ data });
  revalidatePath("/admin/shipping");
  return { ok: true };
}

export async function deleteRate(id: string) {
  await requireAdmin();
  await db.shippingRate.update({ where: { id }, data: { isActive: false } });
  revalidatePath("/admin/shipping");
}

export async function saveTaxRate(formData: FormData): Promise<S> {
  await requireAdmin();
  const rateBps = Math.round(parseFloat(String(formData.get("rate") ?? "0")) * 100);
  const name = String(formData.get("name") ?? "").trim();
  if (!name || isNaN(rateBps)) return { error: "Name and rate are required." };
  await db.taxRate.create({ data: { zoneId: String(formData.get("zoneId")), name, region: String(formData.get("region") ?? "") || null, rateBps } });
  revalidatePath("/admin/shipping");
  return { ok: true };
}

export async function deleteTaxRate(id: string) {
  await requireAdmin();
  await db.taxRate.delete({ where: { id } });
  revalidatePath("/admin/shipping");
}

// ---- Promotions ----
export async function adminListDiscounts() {
  await requireAdmin();
  return db.discount.findMany({ orderBy: { code: "asc" }, include: { products: { select: { name: true } }, categories: { select: { name: true } } } });
}

export async function saveDiscount(formData: FormData): Promise<S> {
  await requireAdmin();
  const type = String(formData.get("type"));
  const raw = String(formData.get("value") ?? "0");
  const parsed = discountSchema.safeParse({
    code: formData.get("code"), type, value: type === "FIXED" ? toCents(raw) : parseInt(raw || "0", 10), currency: String(formData.get("currency") ?? "").toUpperCase(),
    minOrderCents: formData.get("minOrder") ? toCents(String(formData.get("minOrder"))) : null, maxUses: formData.get("maxUses") ? parseInt(String(formData.get("maxUses")), 10) : null,
    usesPerCustomer: formData.get("usesPerCustomer") ? parseInt(String(formData.get("usesPerCustomer")), 10) : null,
    startsAt: formData.get("startsAt"), endsAt: formData.get("endsAt"), productIds: formData.getAll("productIds").map(String), categoryIds: formData.getAll("categoryIds").map(String),
  });
  if (!parsed.success) return { error: parsed.error.issues.map((i) => i.message).join(" · ") };
  const { startsAt, endsAt, productIds, categoryIds, currency, ...d } = parsed.data;
  const data = { ...d, currency: currency || null, startsAt: startsAt ? new Date(startsAt) : null, endsAt: endsAt ? new Date(endsAt) : null, products: { set: productIds.map((id) => ({ id })) }, categories: { set: categoryIds.map((id) => ({ id })) } };
  await db.discount.upsert({ where: { code: d.code }, update: data, create: { ...data, products: { connect: productIds.map((id) => ({ id })) }, categories: { connect: categoryIds.map((id) => ({ id })) } } });
  revalidatePath("/admin/discounts");
  return { ok: true };
}

export async function toggleDiscount(id: string, isActive: boolean) {
  await requireAdmin();
  await db.discount.update({ where: { id }, data: { isActive } });
  revalidatePath("/admin/discounts");
}

// ---- Contenu : pages + blocs accueil ----
export async function adminListPages() { await requireAdmin(); return db.page.findMany({ orderBy: [{ slug: "asc" }, { locale: "asc" }] }); }

export async function savePage(formData: FormData): Promise<S> {
  await requireAdmin();
  const slug = String(formData.get("slug") ?? "").trim().toLowerCase();
  const locale = String(formData.get("locale") ?? "en");
  const title = String(formData.get("title") ?? "").trim();
  if (!/^[a-z0-9-]+$/.test(slug) || !title) return { error: "Slug (letters, numbers, dashes) and title are required." };
  const data = { title, content: String(formData.get("content") ?? ""), seoTitle: String(formData.get("seoTitle") ?? "") || null, seoDescription: String(formData.get("seoDescription") ?? "") || null, isActive: formData.get("isActive") !== "off" };
  await db.page.upsert({ where: { slug_locale: { slug, locale } }, update: data, create: { ...data, slug, locale } });
  revalidatePath("/admin/content"); revalidatePath(`/pages/${slug}`);
  return { ok: true };
}

export async function adminListHomeBlocks() { await requireAdmin(); return db.homeBlock.findMany({ orderBy: [{ key: "asc" }, { locale: "asc" }] }); }

export async function saveHomeBlock(formData: FormData): Promise<S> {
  await requireAdmin();
  const key = String(formData.get("key") ?? "").trim();
  const locale = String(formData.get("locale") ?? "en");
  let data: unknown;
  try { data = JSON.parse(String(formData.get("data") ?? "{}")); } catch { return { error: "Block data must be valid JSON." }; }
  if (!key) return { error: "Key is required." };
  await db.homeBlock.upsert({ where: { key_locale: { key, locale } }, update: { data: data as object, isActive: formData.get("isActive") !== "off" }, create: { key, locale, data: data as object } });
  revalidatePath("/"); revalidatePath("/admin/content");
  return { ok: true };
}

export async function uploadHomeImage(formData: FormData): Promise<S & { url?: string }> {
  await requireAdmin();
  const file = formData.get("file");
  if (!(file instanceof File)) return { error: "Choose an image." };
  const up = await uploadImage("branding", "home", file, 6 * 1024 * 1024);
  if (up.error || !up.url) return { error: up.error ?? "Upload failed." };
  return { ok: true, url: up.url };
}

// ---- Avis ----
export async function adminListReviews(pending = true) {
  await requireAdmin();
  return db.review.findMany({ where: pending ? { isApproved: false } : {}, include: { product: { select: { name: true, slug: true } }, user: { select: { email: true, firstName: true } } }, orderBy: { createdAt: "desc" }, take: 200 });
}

export async function moderateReview(id: string, approve: boolean) {
  await requireAdmin();
  const r = await db.review.findUnique({ where: { id } });
  if (!r) return;
  if (approve) await db.review.update({ where: { id }, data: { isApproved: true } });
  else await db.review.delete({ where: { id } });
  await recomputeProductRating(r.productId);
  revalidatePath("/admin/reviews");
}

// ---- Clients ----
export async function adminListCustomers(q?: string) {
  await requireAdmin();
  return db.user.findMany({
    where: { role: "CLIENT", ...(q ? { OR: [{ email: { contains: q, mode: "insensitive" } }, { firstName: { contains: q, mode: "insensitive" } }, { lastName: { contains: q, mode: "insensitive" } }, { phone: { contains: q } }] } : {}) },
    orderBy: { createdAt: "desc" },
    include: { addresses: { where: { isDefault: true }, take: 1 }, orders: { where: { status: { notIn: ["PENDING_PAYMENT", "CANCELLED"] } }, select: { totalCents: true, currency: true, createdAt: true }, orderBy: { createdAt: "desc" } } },
    take: 300,
  });
}

export async function adminGetCustomer(id: string) {
  await requireAdmin();
  return db.user.findUnique({
    where: { id },
    include: {
      addresses: true,
      hairProfile: true,
      orders: { orderBy: { createdAt: "desc" }, include: { items: true, payment: true, shipment: true } },
      reviews: { include: { product: { select: { name: true, slug: true } } }, orderBy: { createdAt: "desc" } },
      wishlist: { include: { product: { select: { id: true, name: true, slug: true, basePriceCents: true, currency: true, images: { take: 1, orderBy: { sortOrder: "asc" } } } } }, orderBy: { createdAt: "desc" } },
      cart: {
        include: {
          discount: { select: { code: true } },
          items: { include: { variant: { include: { inventory: true, image: true, product: { select: { id: true, name: true, slug: true, images: { take: 1, orderBy: { sortOrder: "asc" } } } } } } } },
        },
      },
    },
  });
}

export async function saveCustomerNotes(id: string, formData: FormData) {
  await requireAdmin();
  await db.user.update({ where: { id }, data: { notes: String(formData.get("notes") ?? ""), isBlocked: formData.get("isBlocked") === "on" } });
  revalidatePath(`/admin/customers/${id}`);
  revalidatePath("/admin/customers");
}

// ---- Paniers abandonnés & wishlist ----
export async function adminAbandonedCarts() {
  await requireAdmin();
  return db.cart.findMany({ where: { convertedAt: null, items: { some: {} }, lastActivityAt: { lt: new Date(Date.now() - 3600_000) } }, include: { user: { select: { email: true } }, items: { include: { variant: { include: { product: { select: { name: true } } } } } } }, orderBy: { lastActivityAt: "desc" }, take: 100 });
}

export async function adminTopWishlisted() {
  await requireAdmin();
  const rows = await db.wishlistItem.groupBy({ by: ["productId"], _count: true, orderBy: { _count: { productId: "desc" } }, take: 10 });
  const products = await db.product.findMany({ where: { id: { in: rows.map((r) => r.productId) } }, select: { id: true, name: true, slug: true } });
  return rows.map((r) => ({ count: r._count, product: products.find((p) => p.id === r.productId) }));
}
