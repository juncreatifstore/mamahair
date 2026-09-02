"use server";

import { revalidatePath } from "next/cache";
import { requireStaffPermission } from "@/lib/auth";
import { db } from "@/lib/db";
import { getSection } from "@/lib/settings";
import { uploadImage } from "@/lib/upload";

function imageResult(payload: unknown) {
  const p = payload as { output?: { type?: string; result?: string }[] };
  return (p.output ?? []).find((item) => item.type === "image_generation_call" && item.result)?.result ?? null;
}

async function saveGeneratedImage(productId: string, base64: string, kind: "GALLERY" | "WORN" | "TEXTURE" | "LACE_DETAIL" | "VARIANT", alt: string) {
  const bytes = Buffer.from(base64, "base64");
  const file = new File([bytes], `mamahair-ai-${Date.now()}.png`, { type: "image/png" });
  const uploaded = await uploadImage("products", productId, file, 10 * 1024 * 1024);
  if (uploaded.error || !uploaded.url) return { error: uploaded.error || "Could not save generated image." };
  const count = await db.productImage.count({ where: { productId } });
  const image = await db.productImage.create({ data: { productId, url: uploaded.url, path: uploaded.path, alt, kind: count === 0 ? "MAIN" : kind, sortOrder: count } });
  return { image };
}

export async function generateProductMediaAI(input: {
  productId: string;
  operation: "generate" | "enhance" | "brand" | "marketing";
  sourceImageId?: string;
  prompt?: string;
}) {
  await requireStaffPermission("products.manage");
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) return { ok: false, error: "AI is not configured yet. Add OPENAI_API_KEY to the server environment." };

  const product = await db.product.findUnique({
    where: { id: input.productId },
    include: { images: { orderBy: { sortOrder: "asc" } }, category: { select: { name: true } } },
  });
  if (!product) return { ok: false, error: "Product not found." };

  const branding = await getSection("branding");
  const source = input.sourceImageId ? product.images.find((image) => image.id === input.sourceImageId) : product.images[0];
  if ((input.operation === "enhance" || input.operation === "brand") && !source) return { ok: false, error: "Add a source product photo first." };
  if (input.operation === "brand" && !branding.logoUrl && !branding.logoDarkUrl && !branding.logoLightUrl) return { ok: false, error: "Add the MAMAHAIR logo in Admin → Settings → Branding first." };

  const facts = {
    name: product.name,
    productType: product.productType,
    category: product.category?.name ?? null,
    material: product.hairMaterial,
    origin: product.hairOrigin,
    textures: product.textures,
    lengths: product.lengths,
    densities: product.densities,
    laceTypes: product.laceTypes,
    colors: product.colors,
  };

  const custom = input.prompt?.trim();
  let instruction = "";
  let kind: "GALLERY" | "WORN" | "TEXTURE" | "LACE_DETAIL" | "VARIANT" = "GALLERY";

  if (input.operation === "generate") {
    instruction = `Create a premium ecommerce studio product photo for MAMAHAIR using only these product facts: ${JSON.stringify(facts)}. Clean warm-neutral studio background, realistic premium hair texture, vertical 4:5 composition, no text, no fake badges, no invented physical features. ${custom || ""}`;
  } else if (input.operation === "marketing") {
    kind = "WORN";
    instruction = `Create a premium editorial ecommerce marketing image for MAMAHAIR based only on these product facts: ${JSON.stringify(facts)}. The product should remain the visual focus, realistic lighting, sophisticated beauty-campaign feel, vertical 4:5, no text or fake claims. ${custom || ""}`;
  } else if (input.operation === "enhance") {
    instruction = `Edit the supplied product photo for ecommerce. Preserve the exact product, hair color, texture, length, lace/construction and proportions. Improve lighting, sharpness, framing and background cleanliness only. Do not redesign the product or add text. Output a premium vertical 4:5 MAMAHAIR catalog image. ${custom || ""}`;
  } else {
    instruction = `Edit the first supplied image while preserving the exact product. Use the second supplied image as the exact MAMAHAIR logo reference. Add that logo as a small tasteful brand mark near the bottom-right with safe margins. Do not redraw, restyle, misspell or replace the supplied logo. Preserve product color, texture, length and construction. ${custom || ""}`;
  }

  const content: { type: "input_text" | "input_image"; text?: string; image_url?: string; detail?: "high" }[] = [{ type: "input_text", text: instruction }];
  if (source && input.operation !== "generate" && input.operation !== "marketing") content.push({ type: "input_image", image_url: source.url, detail: "high" });
  if (input.operation === "brand") {
    const logo = branding.logoUrl || branding.logoDarkUrl || branding.logoLightUrl;
    content.push({ type: "input_image", image_url: logo, detail: "high" });
  }

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: process.env.OPENAI_TEXT_MODEL?.trim() || "gpt-5.6-luna",
      input: [{ role: "user", content }],
      tools: [{ type: "image_generation", model: process.env.OPENAI_IMAGE_MODEL?.trim() || "gpt-image-2", quality: "high", size: "1024x1536", output_format: "png" }],
      tool_choice: { type: "image_generation" },
    }),
    cache: "no-store",
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = payload as { error?: { message?: string } };
    console.error("generateProductMediaAI OpenAI error", response.status, error.error?.message);
    return { ok: false, error: error.error?.message || `AI image request failed (${response.status}).` };
  }

  const base64 = imageResult(payload);
  if (!base64) return { ok: false, error: "AI did not return an image. Please try again." };

  const alt = `${product.name} — AI ${input.operation} image`;
  const saved = await saveGeneratedImage(product.id, base64, kind, alt);
  if (saved.error) return { ok: false, error: saved.error };

  revalidatePath(`/admin/products/${product.id}`);
  revalidatePath(`/products/${product.slug}`);
  revalidatePath("/shop");
  return { ok: true, imageUrl: saved.image?.url };
}
