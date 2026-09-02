"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireOwner } from "@/lib/auth";

export type AdminAccessState = { error?: string; message?: string };

export async function grantAdminAccess(_prev: AdminAccessState, formData: FormData): Promise<AdminAccessState> {
  await requireOwner();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();

  if (!email || !email.includes("@")) return { error: "Adresse email invalide." };

  const user = await db.user.findUnique({ where: { email } });
  if (!user) return { error: "Cet utilisateur n’existe pas encore dans MAMAHAIR. Il doit d’abord créer un compte ou être ajouté à l’équipe." };
  if (user.role === "ADMIN") return { message: "Cet utilisateur possède déjà un accès administrateur." };

  await db.user.update({
    where: { email },
    data: { role: "ADMIN", isBlocked: false },
  });

  revalidatePath("/admin/team");
  revalidatePath("/admin");
  return { message: `${email} est maintenant administrateur.` };
}

export async function revokeAdminAccess(formData: FormData) {
  const currentAdmin = await requireOwner();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!email) return;

  if (email === currentAdmin.email.toLowerCase()) {
    throw new Error("Vous ne pouvez pas retirer votre propre accès administrateur.");
  }

  const target = await db.user.findUnique({ where: { email } });
  if (!target || target.role !== "ADMIN") return;

  const adminCount = await db.user.count({ where: { role: "ADMIN" } });
  if (adminCount <= 1) throw new Error("Impossible de retirer le dernier administrateur.");

  const staffAccess = await db.$queryRaw<Array<{ isActive: boolean }>>`
    SELECT "isActive" FROM "StaffAccess" WHERE email = ${email} LIMIT 1
  `;

  await db.user.update({
    where: { email },
    data: { role: staffAccess[0]?.isActive ? "STAFF" : "CLIENT" },
  });

  revalidatePath("/admin/team");
  revalidatePath("/admin");
}
