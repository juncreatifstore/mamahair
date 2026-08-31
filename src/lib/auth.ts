import { cache } from "react";
import { redirect } from "next/navigation";
import { db } from "./db";
import { createSupabaseServer } from "./supabase/server";

/**
 * Récupère l'utilisateur courant. Synchronise la table User avec Supabase Auth
 * à la première connexion (id = uid Supabase).
 */
export const getCurrentUser = cache(async () => {
  const supabase = await createSupabaseServer();
  const { data } = await supabase.auth.getUser();
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
