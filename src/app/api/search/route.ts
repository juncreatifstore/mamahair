import { NextResponse } from "next/server";
import { searchSuggestions } from "@/server/products";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const q = new URL(req.url).searchParams.get("q") ?? "";
  const data = await searchSuggestions(q.slice(0, 60));
  return NextResponse.json(data, { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" } });
}
