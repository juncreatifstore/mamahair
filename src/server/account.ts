"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { createSupabaseAdmin, createSupabaseServer } from "@/lib/supabase/server";
import { logger } from "@/lib/logger";
import { addressSchema } from "@/schemas/address";
import { z } from "zod";

export async function saveAddress(formData: FormData) {
  const user = await requireUser("/account/addresses");
  const parsed = addressSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "Check the address fields." };
  const isDefault = formData.get("isDefault") === "on";
  const d = parsed.data;
  await db.$transaction([
    ...(isDefault ? [db.address.updateMany({ where: { userId: user.id }, data: { isDefault: false } })] : []),
    db.address.create({ data: { ...d, line2: d.line2 || null, region: d.region || null, postalCode: d.postalCode || null, phone: d.phone || null, country: d.country.toUpperCase(), userId: user.id, isDefault } }),
  ]);
  revalidatePath("/account/addresses");
  return { ok: true };
}

export async function deleteAddress(id: string) {
  const user = await requireUser("/account/addresses");
  await db.address.deleteMany({ where: { id, userId: user.id } });
  revalidatePath("/account/addresses");
}

const profileSchema = z.object({ firstName: z.string().max(60), lastName: z.string().max(60), phone: z.string().max(30), locale: z.string().max(5).optional(), currency: z.string().max(3).optional() });

export async function updateProfile(formData: FormData) {
  const user = await requireUser();
  const parsed = profileSchema.safeParse({ firstName: formData.get("firstName") ?? "", lastName: formData.get("lastName") ?? "", phone: formData.get("phone") ?? "", locale: formData.get("locale") ?? undefined, currency: formData.get("currency") ?? undefined });
  if (!parsed.success) return { error: "Check the fields." };
  await db.user.update({ where: { id: user.id }, data: parsed.data });
  revalidatePath("/account");
  return { ok: true };
}

/**
 * Suppression du compte par le client. Profil, adresses, panier, favoris, avis et
 * points sont supprimés (cascade) ; les commandes restent pour la comptabilité,
 * détachées du compte (Order.userId -> NULL).
 */
export async function deleteAccount(formData: FormData) {
  const user = await requireUser("/account/settings");
  if (user.role !== "CLIENT") redirect("/account/settings?delete=staff");
  if (String(formData.get("confirm") ?? "").trim().toUpperCase() !== "DELETE") redirect("/account/settings?delete=confirm");

  const supabase = await createSupabaseServer();
  const { data } = await supabase.auth.getUser();
  const authId = data.user?.id;
  if (!authId) redirect("/login?next=/account/settings");

  const { error } = await createSupabaseAdmin().auth.admin.deleteUser(authId);
  if (error) {
    logger.error("account.delete.auth_failed", error);
    redirect("/account/settings?delete=error");
  }
  await db.user.delete({ where: { id: user.id } });
  await supabase.auth.signOut().catch(() => undefined);
  redirect("/?account=deleted");
}
