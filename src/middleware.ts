import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const FALLBACK_SUPABASE_URL = "https://vrsvvubawtxhtyvegzqc.supabase.co";

function firstNonEmpty(...values: Array<string | undefined>) {
  return values.map((value) => value?.trim()).find(Boolean);
}

function readDefaultKeyFromJson(value: string | undefined) {
  if (!value) return undefined;
  try {
    const parsed = JSON.parse(value) as Record<string, unknown>;
    const candidate = parsed.default;
    return typeof candidate === "string" && candidate.trim() ? candidate.trim() : undefined;
  } catch {
    return undefined;
  }
}

/**
 * Rafraîchit la session Supabase et protège /admin et /account.
 * Le contrôle du rôle ADMIN se fait côté serveur (requireAdmin) : ici on
 * vérifie seulement qu'un utilisateur est connecté.
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isProtected = pathname.startsWith("/admin") || pathname.startsWith("/account");

  const supabaseUrl = firstNonEmpty(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_URL,
    FALLBACK_SUPABASE_URL,
  );

  const supabaseKey = firstNonEmpty(
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    process.env.SUPABASE_PUBLISHABLE_KEY,
    process.env.SUPABASE_ANON_KEY,
    readDefaultKeyFromJson(process.env.SUPABASE_PUBLISHABLE_KEYS),
  );

  if (!supabaseUrl || !supabaseKey) {
    if (isProtected) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("next", pathname);
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  let response = NextResponse.next({ request });

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (list: { name: string; value: string; options: CookieOptions }[]) => {
        list.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        list.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  try {
    const { data } = await supabase.auth.getUser();
    if (isProtected && !data.user) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("next", pathname);
      return NextResponse.redirect(url);
    }
  } catch (error) {
    console.error("Supabase middleware auth failed", error);
    if (isProtected) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("next", pathname);
      return NextResponse.redirect(url);
    }
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api/webhooks|.*\\.(?:svg|png|jpg|jpeg|webp|ico)$).*)"],
};
