/**
 * Seed MAMAHAIR.COM : paramètres, zones (USA, Mexico, Canada, DO, Haiti, International),
 * catégories, produits réalistes avec variantes combinatoires, blocs accueil, pages, codes promo, admin.
 * Lancer : npm run db:seed   (idempotent)
 */
import { PrismaClient, ProductType } from "@prisma/client";
import { createClient } from "@supabase/supabase-js";

const db = new PrismaClient();
const label = (o: Record<string, string>) => [o.texture, o.length && `${o.length}"`, o.density, o.lace, o.color].filter(Boolean).join(" · ");
const skuOf = (prefix: string, o: Record<string, string>) => `${prefix}-${Object.values(o).map((v) => v.replace(/[^A-Za-z0-9]/g, "").toUpperCase().slice(0, 6)).join("-")}`;

async function createAdmin() {
  const email = process.env.SEED_ADMIN_EMAIL, password = process.env.SEED_ADMIN_PASSWORD, url = process.env.NEXT_PUBLIC_SUPABASE_URL, key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!email || !password || !url || !key) { console.log("⚠︎ SEED_ADMIN_* or Supabase vars missing: admin not created."); return; }
  const supabase = createClient(url, key, { auth: { persistSession: false } });
  const { data, error } = await supabase.auth.admin.createUser({ email, password, email_confirm: true });
  let id = data.user?.id;
  if (error && !id) { const { data: list } = await supabase.auth.admin.listUsers(); id = list.users.find((u) => u.email === email)?.id; }
  if (!id) return;
  await db.user.upsert({ where: { email }, update: { role: "ADMIN" }, create: { id, email, role: "ADMIN", firstName: "Admin" } });
  console.log(`✓ Admin: ${email}`);
}

async function main() {
  // ---- Settings ----
  const settings: Record<string, object> = {
    "settings:general": { companyName: "MAMAHAIR.COM", storeName: "MAMAHAIR", tagline: "Premium wigs, bundles & hair care for textured hair", announcement: "Free US shipping over $99 · New arrivals every week · Secure checkout", announcementEnabled: true },
    "settings:contact": { email: "hello@mamahair.com", phone: "", whatsapp: "", addressLine: "", city: "", region: "", postalCode: "", country: "US" },
    "settings:commerce": { defaultCurrency: "USD", enabledCurrencies: ["USD"], enabledCountries: ["US"], lowStockThreshold: 5, reservationMinutes: 30, freeShippingBannerCents: 9900, allowGuestCheckout: true },
    "settings:email": { fromName: "MAMAHAIR", fromEmail: "orders@mamahair.com", replyTo: "hello@mamahair.com", footerText: "Premium hair, shipped with love." },
    "settings:policies": {
      shipping: "## Shipping\n\nOrders ship from the USA within 2 business days. Standard delivery takes 3–7 business days; express 1–3. Free standard shipping on US orders over $99.\n\nInternational orders (Mexico, Canada, Dominican Republic, Haiti) are shipped with tracking; duties and taxes may apply on delivery.",
      returns: "## Returns\n\nUnworn, unwashed hair in its original packaging can be returned within 14 days of delivery. Custom-colored or installed items are final sale. Email hello@mamahair.com with your order number to start a return.",
      privacy: "## Privacy policy\n\nWe collect only the information needed to process your order and improve your experience. Payments are handled by Stripe; we never store card numbers. You can request deletion of your account at any time.",
      terms: "## Terms & conditions\n\nBy placing an order you agree to these terms. Prices are shown in the selected currency and include applicable taxes at checkout. MAMAHAIR reserves the right to cancel orders in case of stock or pricing errors.",
    },
  };
  for (const [key, value] of Object.entries(settings)) await db.setting.upsert({ where: { key }, update: {}, create: { key, value } });

  // ---- Zones de livraison ----
  const zones: { id: string; name: string; countries: string[]; rates: { id: string; name: string; priceCents: number; currency: string; freeAboveCents?: number; minDays: number; maxDays: number }[] }[] = [
    { id: "zone-us", name: "United States", countries: ["US"], rates: [{ id: "rate-us-std", name: "Standard (3–7 days)", priceCents: 899, currency: "USD", freeAboveCents: 9900, minDays: 3, maxDays: 7 }, { id: "rate-us-exp", name: "Express (1–3 days)", priceCents: 2499, currency: "USD", minDays: 1, maxDays: 3 }] },
    { id: "zone-mx", name: "Mexico", countries: ["MX"], rates: [{ id: "rate-mx-std", name: "Tracked (7–12 days)", priceCents: 2500, currency: "USD", minDays: 7, maxDays: 12 }, { id: "rate-mx-mxn", name: "Envío con rastreo (7–12 días)", priceCents: 45000, currency: "MXN", minDays: 7, maxDays: 12 }] },
    { id: "zone-ca", name: "Canada", countries: ["CA"], rates: [{ id: "rate-ca-std", name: "Tracked (5–10 days)", priceCents: 1999, currency: "USD", freeAboveCents: 19900, minDays: 5, maxDays: 10 }, { id: "rate-ca-cad", name: "Tracked (5–10 days)", priceCents: 2699, currency: "CAD", minDays: 5, maxDays: 10 }] },
    { id: "zone-do", name: "Dominican Republic", countries: ["DO"], rates: [{ id: "rate-do-std", name: "Tracked (7–14 days)", priceCents: 2999, currency: "USD", minDays: 7, maxDays: 14 }] },
    { id: "zone-ht", name: "Haiti", countries: ["HT"], rates: [{ id: "rate-ht-std", name: "Tracked (10–20 days)", priceCents: 3499, currency: "USD", minDays: 10, maxDays: 20 }] },
    { id: "zone-intl", name: "International", countries: ["GB", "FR", "DE", "ES", "IT", "NL", "BE", "PT", "JM", "TT", "SN", "CI", "NG", "GH", "ZA", "BR", "CO"], rates: [{ id: "rate-intl-std", name: "International tracked (10–20 days)", priceCents: 4499, currency: "USD", minDays: 10, maxDays: 20 }] },
  ];
  for (const [i, z] of zones.entries()) {
    await db.shippingZone.upsert({ where: { id: z.id }, update: {}, create: { id: z.id, name: z.name, countries: z.countries, sortOrder: i } });
    for (const r of z.rates) await db.shippingRate.upsert({ where: { id: r.id }, update: {}, create: { ...r, zoneId: z.id } });
  }

  // ---- Catégories ----
  const cats = [
    { slug: "wigs", name: "Wigs", description: "Lace front, closure, glueless and headband wigs in 100% human hair." },
    { slug: "bundles", name: "Bundles", description: "Virgin and Remy bundles, single or in deals." },
    { slug: "extensions", name: "Extensions", description: "Clip-ins, tape-ins and ponytails for instant length." },
    { slug: "closures", name: "Closures", description: "4x4, 5x5 and 6x6 HD and transparent lace closures." },
    { slug: "frontals", name: "Frontals", description: "13x4, 13x6 and 360 frontals, pre-plucked with baby hair." },
    { slug: "hair-care", name: "Hair Care", description: "Shampoos, conditioners and oils for your natural hair and your units." },
    { slug: "accessories", name: "Accessories", description: "Wig caps, glue, bands, edge control and tools." },
  ];
  for (const [i, c] of cats.entries()) await db.category.upsert({ where: { slug: c.slug }, update: {}, create: { ...c, sortOrder: i } });
  const catId = async (slug: string) => (await db.category.findUniqueOrThrow({ where: { slug } })).id;

  // ---- Produits ----
  type Seed = { slug: string; name: string; category: string; productType: ProductType; shortDesc: string; description: string; basePriceCents: number; compareAtCents?: number; weightGrams: number; hairMaterial?: string; hairOrigin?: string; hairGrade?: string; wigType?: string; capSize?: string; textures?: string[]; lengths?: number[]; densities?: string[]; laceTypes?: string[]; colors?: string[]; bundlesCount?: number; flags?: Partial<Record<"canBleach" | "canDye" | "heatSafe" | "prePlucked" | "babyHair" | "glueless" | "adjustableStrap", boolean>>; isFeatured?: boolean; isBestSeller?: boolean; isNew?: boolean; howToUse?: string; ingredients?: string; hairTypes?: ("T3A" | "T3B" | "T3C" | "T4A" | "T4B" | "T4C")[]; concerns?: string[]; variants: { options?: Record<string, string>; name?: string; priceCents: number; qty: number }[] };
  const price = (base: number, o: Record<string, string>) => base + (parseInt(o.length ?? "0", 10) - 16) * 900 + (o.density === "180%" ? 3000 : o.density === "200%" ? 6000 : 0) + (o.lace === "13x6" ? 2500 : 0);

  const products: Seed[] = [
    { slug: "body-wave-lace-front-wig", name: "Body Wave Lace Front Wig", category: "wigs", productType: "WIG", shortDesc: "13x4 HD lace, pre-plucked, 100% virgin hair.", description: "Our best-selling body wave unit: soft, bouncy waves on a 13x4 HD lace front that melts into any skin tone. Pre-plucked hairline with baby hair, adjustable strap and combs. Can be bleached, dyed and styled with heat.", basePriceCents: 18900, compareAtCents: 22900, weightGrams: 350, hairMaterial: "Virgin Hair", hairOrigin: "Brazilian", hairGrade: "12A", wigType: "Lace Front", capSize: "M", textures: ["Body Wave"], lengths: [16, 18, 20, 22, 24, 26], densities: ["150%", "180%", "200%"], laceTypes: ["13x4", "13x6"], colors: ["Natural Black"], flags: { canBleach: true, canDye: true, heatSafe: true, prePlucked: true, babyHair: true, adjustableStrap: true }, isFeatured: true, isBestSeller: true, howToUse: "Bleach knots if desired, cut the lace, apply on a flat base with or without glue. Wash every 7–10 wears with sulfate-free shampoo.",
      variants: [16, 18, 20, 22, 24, 26].flatMap((l) => ["150%", "180%"].map((d) => ({ options: { texture: "Body Wave", length: String(l), density: d, lace: "13x4", color: "Natural Black" }, priceCents: price(18900, { length: String(l), density: d }), qty: 6 }))) },
    { slug: "deep-wave-glueless-closure-wig", name: "Deep Wave Glueless Closure Wig", category: "wigs", productType: "WIG", shortDesc: "5x5 HD closure, beginner-friendly, no glue needed.", description: "Deep, defined waves on a 5x5 HD lace closure. Elastic band and adjustable strap for a secure glueless install in minutes. Perfect first wig.", basePriceCents: 15900, weightGrams: 320, hairMaterial: "Virgin Hair", hairOrigin: "Peruvian", hairGrade: "10A", wigType: "Glueless", capSize: "M", textures: ["Deep Wave"], lengths: [14, 16, 18, 20, 22, 24], densities: ["180%"], laceTypes: ["5x5"], colors: ["Natural Black", "1B"], flags: { canBleach: true, canDye: true, heatSafe: true, prePlucked: true, babyHair: true, glueless: true, adjustableStrap: true }, isFeatured: true, isNew: true,
      variants: [14, 16, 18, 20, 22, 24].map((l) => ({ options: { texture: "Deep Wave", length: String(l), density: "180%", lace: "5x5", color: "Natural Black" }, priceCents: price(15900, { length: String(l), density: "150%" }), qty: 5 })) },
    { slug: "kinky-curly-headband-wig", name: "Kinky Curly Headband Wig", category: "wigs", productType: "WIG", shortDesc: "No lace, no glue: throw it on and go.", description: "4C-inspired kinky curly texture on a breathable cap with a built-in headband. Ideal for gym days and protective styling.", basePriceCents: 9900, weightGrams: 260, hairMaterial: "Human Hair", hairOrigin: "Indian", hairGrade: "10A", wigType: "Headband Wig", textures: ["Kinky Curly"], lengths: [14, 16, 18, 20], densities: ["150%"], colors: ["Natural Black"], flags: { heatSafe: true, glueless: true, adjustableStrap: true }, hairTypes: ["T4A", "T4B", "T4C"],
      variants: [14, 16, 18, 20].map((l) => ({ options: { texture: "Kinky Curly", length: String(l), color: "Natural Black" }, priceCents: 9900 + (l - 14) * 1500, qty: 8 })) },
    { slug: "613-blonde-straight-lace-front-wig", name: "613 Blonde Straight Lace Front Wig", category: "wigs", productType: "WIG", shortDesc: "Pre-bleached #613 blonde, ready to tone.", description: "Silky straight 613 blonde on 13x4 transparent lace. Tone it, color it, or wear it icy as is.", basePriceCents: 21900, weightGrams: 360, hairMaterial: "Virgin Hair", hairOrigin: "Brazilian", hairGrade: "12A", wigType: "Lace Front", textures: ["Straight"], lengths: [18, 20, 22, 24, 26, 28, 30], densities: ["180%"], laceTypes: ["13x4"], colors: ["#613 Blonde"], flags: { canDye: true, heatSafe: true, prePlucked: true, babyHair: true, adjustableStrap: true }, isNew: true,
      variants: [18, 20, 22, 24, 26, 28, 30].map((l) => ({ options: { texture: "Straight", length: String(l), density: "180%", lace: "13x4", color: "#613 Blonde" }, priceCents: price(21900, { length: String(l) }), qty: 4 })) },
    { slug: "virgin-bundles-body-wave", name: "Virgin Body Wave Bundle", category: "bundles", productType: "BUNDLE", shortDesc: "Single bundle, 100 g, double-drawn.", description: "One bundle of 12A virgin body wave, double weft, minimal shedding. Sold per bundle so you can mix lengths.", basePriceCents: 6900, weightGrams: 110, hairMaterial: "Virgin Hair", hairOrigin: "Brazilian", hairGrade: "12A", textures: ["Body Wave", "Straight", "Deep Wave", "Water Wave"], lengths: [12, 14, 16, 18, 20, 22, 24, 26, 28, 30], colors: ["Natural Black"], bundlesCount: 1, flags: { canBleach: true, canDye: true, heatSafe: true }, isBestSeller: true,
      variants: ["Body Wave", "Straight", "Deep Wave", "Water Wave"].flatMap((tx) => [14, 16, 18, 20, 22, 24, 26].map((l) => ({ options: { texture: tx, length: String(l), color: "Natural Black" }, priceCents: 6900 + (l - 14) * 800, qty: 12 }))) },
    { slug: "3-bundles-closure-deal", name: "3 Bundles + 4x4 Closure Deal", category: "bundles", productType: "KIT", shortDesc: "Everything for a full sew-in, priced to save.", description: "Three matching virgin bundles plus a 4x4 HD closure. Choose your texture and lengths in the same family.", basePriceCents: 24900, compareAtCents: 28900, weightGrams: 400, hairMaterial: "Virgin Hair", hairOrigin: "Brazilian", hairGrade: "12A", textures: ["Body Wave", "Straight", "Deep Wave"], lengths: [16, 18, 20, 22, 24], laceTypes: ["4x4"], colors: ["Natural Black"], bundlesCount: 3, flags: { canBleach: true, canDye: true, heatSafe: true }, isFeatured: true, isBestSeller: true,
      variants: ["Body Wave", "Straight", "Deep Wave"].flatMap((tx) => [16, 18, 20, 22, 24].map((l) => ({ options: { texture: tx, length: String(l), lace: "4x4", color: "Natural Black" }, priceCents: 24900 + (l - 16) * 2500, qty: 5 }))) },
    { slug: "hd-lace-closure-5x5", name: "5x5 HD Lace Closure", category: "closures", productType: "CLOSURE", shortDesc: "Ultra-thin HD lace, free part, pre-plucked.", description: "Invisible HD lace closure with bleached knots option, free part and natural hairline.", basePriceCents: 7900, weightGrams: 60, hairMaterial: "Virgin Hair", hairOrigin: "Brazilian", hairGrade: "12A", textures: ["Body Wave", "Straight", "Deep Wave"], lengths: [12, 14, 16, 18, 20], laceTypes: ["5x5", "HD Lace"], colors: ["Natural Black"], flags: { canBleach: true, prePlucked: true, babyHair: true },
      variants: ["Body Wave", "Straight", "Deep Wave"].flatMap((tx) => [14, 16, 18].map((l) => ({ options: { texture: tx, length: String(l), lace: "5x5", color: "Natural Black" }, priceCents: 7900 + (l - 14) * 1000, qty: 7 }))) },
    { slug: "13x4-transparent-frontal", name: "13x4 Transparent Lace Frontal", category: "frontals", productType: "FRONTAL", shortDesc: "Ear-to-ear coverage, pre-plucked with baby hair.", description: "13x4 transparent Swiss lace frontal for versatile parting. Pre-plucked hairline, natural density.", basePriceCents: 9900, weightGrams: 70, hairMaterial: "Virgin Hair", hairOrigin: "Peruvian", hairGrade: "10A", textures: ["Body Wave", "Straight", "Deep Wave", "Water Wave"], lengths: [14, 16, 18, 20], laceTypes: ["13x4", "Transparent Lace"], colors: ["Natural Black"], flags: { canBleach: true, prePlucked: true, babyHair: true },
      variants: ["Body Wave", "Straight", "Deep Wave"].flatMap((tx) => [14, 16, 18, 20].map((l) => ({ options: { texture: tx, length: String(l), lace: "13x4", color: "Natural Black" }, priceCents: 9900 + (l - 14) * 1200, qty: 6 }))) },
    { slug: "clip-in-extensions-kinky-straight", name: "Kinky Straight Clip-in Extensions", category: "extensions", productType: "EXTENSION", shortDesc: "7 pieces, 120 g, blends with blown-out 4C hair.", description: "Seven-piece clip-in set in kinky straight texture, made to blend with blow-dried natural hair.", basePriceCents: 8900, weightGrams: 140, hairMaterial: "Human Hair", hairOrigin: "Indian", textures: ["Kinky Straight"], lengths: [14, 16, 18, 20, 22], colors: ["Natural Black", "#2", "#4"], flags: { heatSafe: true, canDye: true }, hairTypes: ["T4A", "T4B", "T4C"], isNew: true,
      variants: [14, 16, 18, 20, 22].flatMap((l) => ["Natural Black", "#2"].map((c) => ({ options: { texture: "Kinky Straight", length: String(l), color: c }, priceCents: 8900 + (l - 14) * 1000, qty: 9 }))) },
    { slug: "drawstring-ponytail-curly", name: "Curly Drawstring Ponytail", category: "extensions", productType: "EXTENSION", shortDesc: "Instant curly pony, wraps and clips in seconds.", description: "Human hair curly drawstring ponytail with combs and a wrap-around strand for a seamless finish.", basePriceCents: 5900, weightGrams: 120, hairMaterial: "Human Hair", textures: ["Curly"], lengths: [14, 18, 22], colors: ["Natural Black", "1B"], flags: { heatSafe: true },
      variants: [14, 18, 22].map((l) => ({ options: { texture: "Curly", length: String(l), color: "Natural Black" }, priceCents: 5900 + (l - 14) * 1000, qty: 10 })) },
    { slug: "wig-care-kit", name: "Wig Care Kit", category: "hair-care", productType: "KIT", shortDesc: "Sulfate-free shampoo, conditioner and lace-safe spray.", description: "Everything to keep your unit soft and your lace clean: 250 ml gentle shampoo, 250 ml conditioner, 100 ml refresh spray.", basePriceCents: 4200, compareAtCents: 4800, weightGrams: 650, ingredients: "Aqua, decyl glucoside, Aloe barbadensis leaf juice, Argania spinosa (argan) oil, panthenol, hydrolyzed keratin.", howToUse: "Wash your wig every 7–10 wears. Shampoo, condition, rinse cool, air-dry on a stand.", concerns: ["wigcare", "hydration"], isFeatured: true,
      variants: [{ name: "Full kit", priceCents: 4200, qty: 40 }] },
    { slug: "edge-and-scalp-oil", name: "Scalp & Edge Growth Oil", category: "hair-care", productType: "HAIR_CARE", shortDesc: "Rosemary, castor and peppermint for your natural hair under the wig.", description: "Lightweight oil blend to keep the scalp healthy under protective styles and support growth at the edges.", basePriceCents: 1600, weightGrams: 90, ingredients: "Ricinus communis (castor) oil, Rosmarinus officinalis leaf oil, Mentha piperita oil, Vitis vinifera seed oil.", howToUse: "Apply a few drops to scalp and edges 3× a week; massage 2 minutes.", hairTypes: ["T3A", "T3B", "T3C", "T4A", "T4B", "T4C"], concerns: ["growth", "scalp"], isBestSeller: true,
      variants: [{ name: "60 ml", priceCents: 1600, qty: 120 }, { name: "120 ml", priceCents: 2800, qty: 50 }] },
    { slug: "hd-lace-melt-spray", name: "HD Lace Melting Spray", category: "accessories", productType: "ACCESSORY", shortDesc: "Strong hold, alcohol-free, invisible finish.", description: "Melts HD and transparent lace without glue residue. Water-resistant, 24-hour hold.", basePriceCents: 1400, weightGrams: 130, howToUse: "Spray 2–3 layers on a clean hairline, dry with cool air between layers, apply the lace.",
      variants: [{ name: "100 ml", priceCents: 1400, qty: 80 }] },
    { slug: "silk-bonnet", name: "Adjustable Silk Bonnet", category: "accessories", productType: "ACCESSORY", shortDesc: "Mulberry silk, protects your unit and your edges overnight.", description: "Double-layer 22-momme silk bonnet with adjustable tie.", basePriceCents: 1900, weightGrams: 60, colors: ["Black", "Champagne", "Burgundy"],
      variants: ["Black", "Champagne", "Burgundy"].map((c) => ({ options: { color: c }, priceCents: 1900, qty: 30 })) },
  ];

  for (const p of products) {
    const { variants, category, flags, ...data } = p;
    const product = await db.product.upsert({
      where: { slug: p.slug }, update: {},
      create: { ...data, ...flags, categoryId: await catId(category), currency: "USD", status: "ACTIVE", publishedAt: new Date(), textures: data.textures ?? [], lengths: data.lengths ?? [], densities: data.densities ?? [], laceTypes: data.laceTypes ?? [], colors: data.colors ?? [], hairTypes: data.hairTypes ?? [], concerns: data.concerns ?? [] },
    });
    const prefix = p.slug.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 10);
    for (const [i, v] of variants.entries()) {
      const sku = v.options ? skuOf(prefix, v.options) : `${prefix}-${(v.name ?? "DEF").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 8)}`;
      const variant = await db.productVariant.upsert({ where: { sku }, update: {}, create: { productId: product.id, sku, name: v.name ?? label(v.options ?? {}), options: v.options ?? undefined, priceCents: v.priceCents, isDefault: i === 0, weightGrams: p.weightGrams } });
      await db.inventory.upsert({ where: { variantId: variant.id }, update: {}, create: { variantId: variant.id, quantity: v.qty } });
    }
  }

  // Set réel : Wig + Care Kit (utilise BundleItem)
  const wig = await db.productVariant.findFirst({ where: { product: { slug: "body-wave-lace-front-wig" }, isDefault: true } });
  const kit = await db.productVariant.findFirst({ where: { product: { slug: "wig-care-kit" } } });
  if (wig && kit) {
    const set = await db.product.upsert({ where: { slug: "body-wave-wig-care-set" }, update: {}, create: { slug: "body-wave-wig-care-set", name: "Body Wave Wig + Care Kit", productType: "KIT", categoryId: await catId("wigs"), shortDesc: "Our best-selling wig with everything to maintain it.", description: "The 16\" 150% body wave lace front wig paired with the full wig care kit. Save vs buying separately.", basePriceCents: 21900, compareAtCents: 23100, currency: "USD", weightGrams: 1000, isBundle: true, bundlePriceCents: 21900, status: "ACTIVE", publishedAt: new Date(), isFeatured: true, textures: ["Body Wave"], lengths: [16], laceTypes: ["13x4"], colors: ["Natural Black"], hairMaterial: "Virgin Hair" } });
    const sv = await db.productVariant.upsert({ where: { sku: "SET-BW16-CARE" }, update: {}, create: { productId: set.id, sku: "SET-BW16-CARE", name: "Set", priceCents: 21900, isDefault: true } });
    await db.inventory.upsert({ where: { variantId: sv.id }, update: {}, create: { variantId: sv.id, quantity: 5 } });
    await db.bundleItem.upsert({ where: { bundleId_variantId: { bundleId: set.id, variantId: wig.id } }, update: {}, create: { bundleId: set.id, variantId: wig.id, quantity: 1 } });
    await db.bundleItem.upsert({ where: { bundleId_variantId: { bundleId: set.id, variantId: kit.id } }, update: {}, create: { bundleId: set.id, variantId: kit.id, quantity: 1 } });
  }

  // ---- Pages (en + fr + es pour "about") ----
  const pages = [
    { slug: "about", locale: "en", title: "About MAMAHAIR", content: "## Hair that feels like yours\n\nMAMAHAIR was born from one frustration: premium human hair shouldn't be a gamble. Every wig, bundle, closure and frontal we sell is inspected by hand before it ships from our US studio.\n\nWe serve the diaspora first — USA, Mexico, Haiti, Dominican Republic, Canada — with care products made for afro, curly and textured hair." },
    { slug: "about", locale: "fr", title: "À propos de MAMAHAIR", content: "## Des cheveux qui vous ressemblent\n\nMAMAHAIR est née d'une frustration : des cheveux humains premium ne devraient pas être un pari. Chaque perruque, bundle, closure et frontal est contrôlé à la main avant expédition depuis notre studio aux USA." },
    { slug: "about", locale: "es", title: "Sobre MAMAHAIR", content: "## Cabello que se siente tuyo\n\nMAMAHAIR nació de una frustración: el cabello humano premium no debería ser una apuesta. Cada peluca, bundle, closure y frontal se inspecciona a mano antes de enviarse desde nuestro estudio en EE. UU." },
    { slug: "faq", locale: "en", title: "FAQ", content: "## Which lace should I choose?\n\nHD lace is the thinnest and most invisible; transparent lace is sturdier and great for beginners. 13x4 gives a full hairline, 5x5 or 4x4 a natural part with less lace to work with.\n\n## Can I bleach or dye the hair?\n\nYes for virgin hair (all our wigs and bundles). We recommend a professional for anything lighter than #27.\n\n## How long does shipping take?\n\nUS: 3–7 business days standard. Mexico, Canada, DR and Haiti: 7–20 days with tracking." },
  ];
  for (const pg of pages) await db.page.upsert({ where: { slug_locale: { slug: pg.slug, locale: pg.locale } }, update: {}, create: pg });

  // ---- Blocs accueil ----
  await db.homeBlock.upsert({ where: { key_locale: { key: "hero", locale: "en" } }, update: {}, create: { key: "hero", locale: "en", data: { title: "Hair that feels like yours", subtitle: "Premium human hair wigs, bundles, closures and frontals — plus the care products that keep them flawless.", ctaLabel: "Shop now", ctaHref: "/shop", cta2Label: "Discover new arrivals", cta2Href: "/shop?isNew=1", imageUrl: "", imageAlt: "" } } });

  // ---- Codes promo ----
  await db.discount.upsert({ where: { code: "WELCOME10" }, update: {}, create: { code: "WELCOME10", type: "PERCENT", value: 10, usesPerCustomer: 1 } });
  await db.discount.upsert({ where: { code: "MAMA20" }, update: {}, create: { code: "MAMA20", type: "FIXED", value: 2000, currency: "USD", minOrderCents: 15000 } });
  await db.discount.upsert({ where: { code: "FREESHIP" }, update: {}, create: { code: "FREESHIP", type: "FREE_SHIPPING", value: 0 } });

  await createAdmin();
  console.log("✓ MAMAHAIR seed complete");
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => db.$disconnect());
