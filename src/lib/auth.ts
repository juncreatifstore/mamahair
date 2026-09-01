import { cache } from "react";
import { redirect } from "next/navigation";
import { db } from "./db";
import { createSupabaseServer } from "./supabase/server";
import { getStaffAccess, hasStaffPermission, type StaffPermission } from "./staff-access";

/**
 * Récupère l'utilisateur courant. Synchronise la table User avec Supabase Auth
 * à la première connexion (id = uid Supabase).
 *
 * Les pages publiques ne doivent jamais tomber en 500 si Supabase Auth n'est
 * pas disponible ou renvoie une erreur au runtime : on journalise et on traite
 * alors la requête comme une session invitée.
 */
export const getCurrentUser = cache(async () => {
  try {
    const supabase = await createSupabaseServer();
    const { data, error } = await supabase.auth.getUser();
    if (error) {
      console.warn("Supabase auth unavailable for current request", error.message);
      return null;
    }

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
    console.error("getCurrentUser failed; continuing as guest", error);
    return null;
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
  if (user.role === "ADMIN") return user;
  if (user.role !== "STAFF") redirect("/");

  const access = await getStaffAccess(user.email);
  if (!access?.isActive) redirect("/");
  return user;
}

export async function requireOwner() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/admin/team");
  if (user.role !== "ADMIN") redirect("/admin");
  return user;
}

export async function requireStaffPermission(permission: StaffPermission) {
  const user = await requireAdmin();
  if (user.role === "ADMIN") return user;
  const access = await getStaffAccess(user.email);
  if (!hasStaffPermission(access, permission)) redirect("/admin");
  return user;
}
