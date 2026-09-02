import { NextResponse } from "next/server";
import { requireStaffPermission } from "@/lib/auth";
import { generateProductMediaAI } from "@/server/admin/product-media-ai";

const OPERATIONS = ["generate", "enhance", "brand", "marketing"] as const;
type Operation = (typeof OPERATIONS)[number];

export async function POST(request: Request) {
  await requireStaffPermission("products.manage");

  const body = await request.json().catch(() => null) as {
    productId?: string;
    operation?: string;
    sourceImageId?: string;
    prompt?: string;
  } | null;

  const productId = body?.productId?.trim();
  const operation = body?.operation as Operation | undefined;
  if (!productId) return NextResponse.json({ error: "Missing product id." }, { status: 400 });
  if (!operation || !OPERATIONS.includes(operation)) return NextResponse.json({ error: "Invalid AI media operation." }, { status: 400 });

  const result = await generateProductMediaAI({
    productId,
    operation,
    sourceImageId: body?.sourceImageId?.trim() || undefined,
    prompt: body?.prompt?.trim() || undefined,
  });

  return NextResponse.json(result, { status: result.ok ? 200 : 400 });
}
