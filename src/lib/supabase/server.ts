import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

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

function getSupabaseServerConfig() {
  const url = firstNonEmpty(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_URL,
    FALLBACK_SUPABASE_URL,
  );

  const publicKey = firstNonEmpty(
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    process.env.SUPABASE_PUBLISHABLE_KEY,
    process.env.SUPABASE_ANON_KEY,
    readDefaultKeyFromJson(process.env.SUPABASE_PUBLISHABLE_KEYS),
  );

  if (!url || !publicKey) {
    throw new Error(
      "Supabase server configuration is missing. Expected SUPABASE_PUBLISHABLE_KEY (Vercel Marketplace) or a NEXT_PUBLIC Supabase publishable/anon key."
    );
  }

  return { url, publicKey };
}

/** Client Supabase côté serveur (session utilisateur via cookies). */
export async function createSupabaseServer() {
  const cookieStore = await cookies();
  const { url, publicKey } = getSupabaseServerConfig();

  return createServerClient(url, publicKey, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (list: { name: string; value: string; options: CookieOptions }[]) => {
        try {
          list.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          /* appelé depuis un Server Component : ignoré, le middleware rafraîchit la session */
        }
      },
    },
  });
}

/** Client admin : accepte les nouvelles clés Secret Supabase et l'ancienne service_role. */
export function createSupabaseAdmin() {
  const url = firstNonEmpty(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_URL,
    FALLBACK_SUPABASE_URL,
  );

  const adminKey = firstNonEmpty(
    process.env.SUPABASE_SECRET_KEY,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    readDefaultKeyFromJson(process.env.SUPABASE_SECRET_KEYS),
  );

  if (!url || !adminKey) {
    throw new Error(
      "Supabase admin configuration is missing. Expected SUPABASE_SECRET_KEY (Vercel Marketplace) or SUPABASE_SERVICE_ROLE_KEY."
    );
  }

  return createClient(url, adminKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
