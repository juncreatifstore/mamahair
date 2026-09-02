"use server";

import { requireStaffPermission } from "@/lib/auth";

const PRODUCT_AI_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    shortDesc: { type: "string" },
    description: { type: "string" },
    howToUse: { type: "string" },
    ingredients: { type: "string" },
    slug: { type: "string" },
    sku: { type: "string" },
    seoTitle: { type: "string" },
    seoDescription: { type: "string" },
  },
  required: ["shortDesc", "description", "howToUse", "ingredients", "slug", "sku", "seoTitle", "seoDescription"],
} as const;

function outputText(payload: unknown) {
  const p = payload as { output_text?: string; output?: { content?: { type?: string; text?: string }[] }[] };
  if (p.output_text) return p.output_text;
  return (p.output ?? []).flatMap((item) => item.content ?? []).filter((part) => part.type === "output_text" || typeof part.text === "string").map((part) => part.text ?? "").join("").trim();
}

export async function generateProductAI(input: {
  mode?: string;
  language?: string;
  context?: Record<string, unknown>;
}) {
  await requireStaffPermission("products.manage");

  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) return { ok: false, error: "AI is not configured yet. Add OPENAI_API_KEY to the server environment." };

  const language = ["en", "fr", "es", "ht"].includes(input.language ?? "") ? input.language : "en";
  const mode = input.mode || "all";
  const context = input.context ?? {};

  const instruction = `You are MAMAHAIR's ecommerce product copy assistant. Create premium, useful, conversion-oriented catalog copy for wigs, bundles, extensions, lace products, accessories and hair care.\n\nRules:\n- Use only facts present in PRODUCT DATA. Never invent hair origin, grade, material, lace, density, ingredients, certifications, shipping speed, medical claims, performance claims or guarantees.\n- For ingredients: only organize or improve ingredients already supplied in PRODUCT DATA. If none are supplied, return an empty ingredients string.\n- Keep the tone premium, modern, clear and feminine without hype.\n- Generate natural SEO copy; do not keyword-stuff.\n- Slug: lowercase ASCII, words separated by hyphens, no leading/trailing hyphen.\n- SKU: uppercase ASCII letters/numbers/hyphens, concise and stable.\n- SEO title <= 70 characters. SEO description <= 160 characters.\n- shortDesc <= 200 characters.\n- howToUse must be safe and practical for the actual product type.\n- Output language: ${language}. Slug and SKU remain ASCII.\n- Requested generation mode: ${mode}. For fields outside the requested mode, preserve the current supplied value when available, otherwise return an empty string.`;

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.OPENAI_TEXT_MODEL?.trim() || "gpt-5.6-luna",
      input: [
        { role: "developer", content: [{ type: "input_text", text: instruction }] },
        { role: "user", content: [{ type: "input_text", text: `PRODUCT DATA:\n${JSON.stringify(context, null, 2)}` }] },
      ],
      text: {
        format: {
          type: "json_schema",
          name: "mamahair_product_copy",
          strict: true,
          schema: PRODUCT_AI_SCHEMA,
        },
      },
    }),
    cache: "no-store",
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = payload as { error?: { message?: string } };
    console.error("generateProductAI OpenAI error", response.status, error.error?.message);
    return { ok: false, error: error.error?.message || `AI request failed (${response.status}).` };
  }

  try {
    const text = outputText(payload);
    const data = JSON.parse(text) as Record<string, string>;
    return { ok: true, data };
  } catch (error) {
    console.error("generateProductAI parse failed", error);
    return { ok: false, error: "AI returned an unreadable response. Please try again." };
  }
}
