import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";

const OUTPUT_KEYS = ["slug", "sku", "shortDesc", "description", "howToUse", "ingredients", "seoTitle", "seoDescription"] as const;
const MODES = ["all", "identity", "details", "usage", "seo", ...OUTPUT_KEYS] as const;

type ProductAIResult = Partial<Record<(typeof OUTPUT_KEYS)[number], string>> & { notes?: string[] };

export async function POST(request: Request) {
  await requireAdmin();

  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) {
    return NextResponse.json({ error: "OPENAI_API_KEY is not configured on the server." }, { status: 503 });
  }

  const body = await request.json().catch(() => null) as { mode?: string; language?: string; context?: Record<string, unknown> } | null;
  if (!body?.context || typeof body.context !== "object") {
    return NextResponse.json({ error: "Missing product context." }, { status: 400 });
  }

  const mode = MODES.includes((body.mode ?? "") as (typeof MODES)[number]) ? body.mode! : "all";
  const language = body.language || "English";
  const context = sanitizeContext(body.context);

  const instructions = `You are MAMAHAIR's ecommerce product copy assistant. Produce accurate, premium, conversion-focused catalog copy in ${language}.

Rules:
- Use ONLY facts supplied in PRODUCT CONTEXT. Never invent hair origin, material, grade, density, lace type, certifications, medical claims, guarantees, shipping promises, or performance claims.
- Ingredients are factual product data. If exact ingredients are not supplied, return an empty ingredients string. Never fabricate an ingredient list.
- How-to/install instructions may be practical and generic, but must not claim product-specific properties that are absent from context.
- slug: lowercase ASCII, hyphen-separated, concise, no domain, no leading/trailing hyphen.
- sku: uppercase ASCII, letters/numbers/hyphens only, concise and human-readable, prefix MH when possible.
- shortDesc: <= 180 characters.
- seoTitle: <= 65 characters.
- seoDescription: <= 155 characters.
- Keep wording premium and specific, not exaggerated.
- Return ONLY valid JSON. No markdown and no prose outside JSON.

Return this exact object shape:
{"slug":"","sku":"","shortDesc":"","description":"","howToUse":"","ingredients":"","seoTitle":"","seoDescription":"","notes":[]}

MODE: ${mode}
If MODE is one exact field name, generate ONLY that field and return empty strings for the others. If MODE is a group, generate only fields in that group. For fields outside the requested mode, return an empty string.`;

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.OPENAI_TEXT_MODEL?.trim() || "gpt-5.6-luna",
      input: [
        { role: "system", content: [{ type: "input_text", text: instructions }] },
        { role: "user", content: [{ type: "input_text", text: `PRODUCT CONTEXT\n${JSON.stringify(context, null, 2)}` }] },
      ],
      max_output_tokens: 1800,
    }),
  });

  const data = await response.json().catch(() => ({})) as Record<string, unknown>;
  if (!response.ok) {
    const apiMessage = typeof data.error === "object" && data.error && "message" in data.error ? String((data.error as { message?: unknown }).message ?? "") : "";
    return NextResponse.json({ error: apiMessage || "AI generation failed." }, { status: response.status });
  }

  const raw = extractOutputText(data);
  if (!raw) return NextResponse.json({ error: "The AI returned an empty response." }, { status: 502 });

  try {
    const parsed = JSON.parse(stripCodeFence(raw)) as ProductAIResult;
    const result: ProductAIResult = {};
    for (const key of OUTPUT_KEYS) result[key] = typeof parsed[key] === "string" ? parsed[key]!.trim() : "";
    result.notes = Array.isArray(parsed.notes) ? parsed.notes.map(String).slice(0, 8) : [];
    return NextResponse.json({ result });
  } catch {
    return NextResponse.json({ error: "The AI response could not be parsed. Please try again." }, { status: 502 });
  }
}

function sanitizeContext(input: Record<string, unknown>) {
  const allowed = [
    "name", "productType", "brand", "category", "slug", "sku", "shortDesc", "description", "howToUse", "ingredients",
    "hairMaterial", "hairOrigin", "hairGrade", "wigType", "capSize", "closureType", "parting", "textures", "lengths", "densities",
    "laceTypes", "colors", "canBleach", "canDye", "heatSafe", "prePlucked", "babyHair", "glueless", "adjustableStrap", "weightGrams",
    "basePrice", "currency", "seoTitle", "seoDescription", "extraInstructions",
  ];
  return Object.fromEntries(allowed.filter((key) => key in input).map((key) => [key, input[key]]));
}

function extractOutputText(data: Record<string, unknown>) {
  if (typeof data.output_text === "string") return data.output_text;
  const output = Array.isArray(data.output) ? data.output : [];
  for (const item of output) {
    if (!item || typeof item !== "object") continue;
    const content = Array.isArray((item as { content?: unknown }).content) ? (item as { content: unknown[] }).content : [];
    for (const part of content) {
      if (part && typeof part === "object" && (part as { type?: unknown }).type === "output_text" && typeof (part as { text?: unknown }).text === "string") {
        return (part as { text: string }).text;
      }
    }
  }
  return "";
}

function stripCodeFence(value: string) {
  return value.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
}
