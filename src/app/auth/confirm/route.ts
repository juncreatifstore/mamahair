import { NextResponse } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createSupabaseServer } from "@/lib/supabase/server";

/**
 * Lien email Supabase (token_hash). Contrairement au flux PKCE de /auth/callback,
 * il fonctionne même si l'email est ouvert sur un autre appareil ou navigateur.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const rawNext = searchParams.get("next") ?? "/account";
  const next = rawNext.startsWith("/") && !rawNext.startsWith("//") ? rawNext : "/account";

  if (tokenHash && type) {
    const supabase = await createSupabaseServer();
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
    if (!error) return NextResponse.redirect(`${origin}${next}`);
  }
  
  const retry = type === "recovery" ? "/forgot-password" : "/login";
  return NextResponse.redirect(`${origin}${retry}?error=link`);
}
