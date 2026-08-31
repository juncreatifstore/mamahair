import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

function getSupabaseServerConfig() {
  const url = (
    process.env.NEXT_PUBLIC_SUPABASE_URL ??
    process.env.SUPABASE_URL
  )?.trim();

  const publicKey = (
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.SUPABASE_ANON_KEY ??
    process.env.SUPABASE_PUBLISHABLE_KEY
  )?.trim();

  if (!url || !publicKey) {
    throw new Error(
      "Supabase server configuration is missing. Expected a Supabase URL and public anon/publishable key."
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

/** Client admin (service role) : upload, gestion des comptes. Serveur uniquement. */
export function createSupabaseAdmin() {
  const url = (
    process.env.NEXT_PUBLIC_SUPABASE_URL ??
    process.env.SUPABASE_URL
  )?.trim();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  if (!url || !serviceRoleKey) {
    throw new Error(
      "Supabase admin configuration is missing. Expected Supabase URL and SUPABASE_SERVICE_ROLE_KEY."
    );
  }

  return createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
