import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";

const LOCALES = {
  en: "English",
  fr: "French",
  es: "Spanish",
  ht: "Haitian Creole",
} as const;

type Locale = keyof typeof LOCALES;

type TranslationResult = {
  name: string;
  shortDesc: string;
  description: string;
  ingredients: string;
  howToUse: string;
};

export async function GET(request: Request) {
  await requireAdmin();
  const url = new URL(request.url);
  const productId = url.searchParams.get("productId")?.trim();
  if (!productId) return NextResponse.json({ error: "Missing productId." }, { status: 400 });

  const product = await db.product.findUnique({
    where: { id: productId },
    select: {
      id: true,
      translations: {
        select: { locale: true, name: true, shortDesc: true, description: true, ingredients: true, howToUse: true },
        orderBy: { locale: "asc" },
      },
    },
  });
  if (!product) return NextResponse.json({ error: "Product not found." }, { status: 404 });

  return NextResponse.json({ translations: product.translations });
}

export async function POST(request: Request) {
  await requireAdmin();

  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) return NextResponse.json({ error: "OPENAI_API_KEY is not configured on the server." }, { status: 503 });

  const body = await request.json().catch(() => null) as { productId?: string; locale?: string } | null;
  const productId = body?.productId?.trim();
  const locale = body?.locale?.trim().toLowerCase() as Locale | undefined;
  if (!productId || !locale || !(locale in LOCALES)) return NextResponse.json({ error: "Invalid product or locale." }, { status: 400 });

  const product = await db.product.findUnique({
    where: { id: productId },
    select: {
      id: true,
      slug: true,
      name: true,
      shortDesc: true,
      description: true,
      ingredients: true,
      howToUse: true,
      brand: true,
      productType: true,
      hairMaterial: true,
      hairOrigin: true,
      hairGrade: true,
      wigType: true,
      closureType: true,
      textures: true,
      lengths: true,
      densities: true,
      laceTypes: true,
      colors: true,
    },
  });
  if (!product) return NextResponse.json({ error: "Product not found." }, { status: 404 });

  const source = {
    name: product.name,
    shortDesc: product.shortDesc ?? "",
    description: product.description ?? "",
    ingredients: product.ingredients ?? "",
    howToUse: product.howToUse ?? "",
  };

  const instructions = `You translate MAMAHAIR ecommerce product content into ${LOCALES[locale]}.

Rules:
- Preserve meaning, product facts, measurements, brand names, hair terminology and formatting.
- Do not invent ingredients, claims, certifications, origin, material, guarantees, delivery promises or product capabilities.
- If a source field is empty, return that field as an empty string.
- Ingredients must be translated only when an exact source ingredient list exists; never add ingredients.
- Keep the tone premium, natural and ecommerce-friendly.
- Return ONLY valid JSON with exactly this shape:
{"name":"","shortDesc":"","description":"","ingredients":"","howToUse":""}`;

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: process.env.OPENAI_TEXT_MODEL?.trim() || "gpt-5.6-luna",
      input: [
        { role: "system", content: [{ type: "input_text", text: instructions }] },
        { role: "user", content: [{ type: "input_text", text: `PRODUCT FACTS\n${JSON.stringify({
          productType: product.productType,
          brand: product.brand,
          hairMaterial: product.hairMaterial,
          hairOrigin: product.hairOrigin,
          hairGrade: product.hairGrade,
          wigType: product.wigType,
          closureType: product.closureType,
          textures: product.textures,
          lengths: product.lengths,
          densities: product.densities,
          laceTypes: product.laceTypes,
          colors: product.colors,
        }, null, 2)}\n\nSOURCE CONTENT\n${JSON.stringify(source, null, 2)}` }] },
      ],
      max_output_tokens: 2200,
    }),
  });

  const data = await response.json().catch(() => ({})) as Record<string, unknown>;
  if (!response.ok) {
    const apiMessage = typeof data.error === "object" && data.error && "message" in data.error ? String((data.error as { message?: unknown }).message ?? "") : "";
    return NextResponse.json({ error: apiMessage || "AI translation failed." }, { status: response.status });
  }

  const raw = extractOutputText(data);
  if (!raw) return NextResponse.json({ error: "The AI returned an empty translation." }, { status: 502 });

  try {
    const parsed = JSON.parse(stripCodeFence(raw)) as Partial<TranslationResult>;
    const translated: TranslationResult = {
      name: clean(parsed.name) || product.name,
      shortDesc: source.shortDesc ? clean(parsed.shortDesc) : "",
      description: source.description ? clean(parsed.description) : "",
      ingredients: source.ingredients ? clean(parsed.ingredients) : "",
      howToUse: source.howToUse ? clean(parsed.howToUse) : "",
    };

    const saved = await db.productTranslation.upsert({
      where: { productId_locale: { productId, locale } },
      create: { productId, locale, ...nullableTranslation(translated) },
      update: nullableTranslation(translated),
      select: { locale: true, name: true, shortDesc: true, description: true, ingredients: true, howToUse: true },
    });

    revalidatePath(`/admin/products/${productId}`);
    revalidatePath(`/products/${product.slug}`);
    revalidatePath("/shop");
    return NextResponse.json({ translation: saved });
  } catch {
    return NextResponse.json({ error: "The AI translation could not be parsed. Please try again." }, { status: 502 });
  }
}

function nullableTranslation(value: TranslationResult) {
  return {
    name: value.name,
    shortDesc: value.shortDesc || null,
    description: value.description || null,
    ingredients: value.ingredients || null,
    howToUse: value.howToUse || null,
  };
}

function clean(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function extractOutputText(data: Record<string, unknown>) {
  if (typeof data.output_text === "string") return data.output_text;
  const output = Array.isArray(data.output) ? data.output : [];
  for (const item of output) {
    if (!item || typeof item !== "object") continue;
    const content = Array.isArray((item as { content?: unknown }).content) ? (item as { content: unknown[] }).content : [];
    for (const part of content) {
      if (part && typeof part === "object" && (part as { type?: unknown }).type === "output_text" && typeof (part as { text?: unknown }).text === "string") return (part as { text: string }).text;
    }
  }
  return "";
}

function stripCodeFence(value: string) {
  return value.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
}
