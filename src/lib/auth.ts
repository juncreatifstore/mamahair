import { cache } from "react";
import { redirect } from "next/navigation";
import { db } from "./db";
import { createSupabaseServer } from "./supabase/server";

/**
 * Récupère l'utilisateur courant. Synchronise la table User avec Supabase Auth
 * à la première connexion (id = uid Supabase).
 *
 * Les pages publiques ne doivent jamais tomber en 500 si Supabase Auth n'est
 * pas encore configuré dans l'environnement Vercel : dans ce cas on traite la
 * requête comme une session invitée et on retourne null.
 */
export const getCurrentUser = cache(async () => {
  try {
    const supabase = await createSupabaseServer();
    const { data, error } = await supabase.auth.getUser();
    if (error) return null;

    const authUser = data.user;
    if (!authUser?.email) return null;

    const existing = await db.user.findUnique({ where: { email: authUser.email } });
    if (existing) return existing;

    return db.user.create({
      data: {
        id: authUser.id,
        email: authUser.email,
        firstName: (authUser.user_metadata?.first_name as string) ?? null,
        lastName: (authUser.user_metadata?.last_name as string) ?? null,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (
      message.includes("Supabase server configuration is missing") ||
      message.includes("project's URL and Key are required")
    ) {
      return null;
    }
    throw error;
  }
});

export async function requireUser(next = "/account") {
  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(next)}`);
  return user;
}

export async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/admin");
  if (user.role !== "ADMIN" && user.role !== "STAFF") redirect("/");
  return user;
}
