"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireOwner } from "@/lib/auth";
import { createSupabaseAdmin } from "@/lib/supabase/server";
import { STAFF_ROLES, type StaffRoleKey } from "@/lib/staff-access";

export type StaffActionState = { error?: string; message?: string };

function cleanRole(value: FormDataEntryValue | null): StaffRoleKey | null {
  const role = String(value ?? "") as StaffRoleKey;
  return role in STAFF_ROLES ? role : null;
}

export async function inviteStaff(_prev: StaffActionState, formData: FormData): Promise<StaffActionState> {
  await requireOwner();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const firstName = String(formData.get("firstName") ?? "").trim().slice(0, 60);
  const lastName = String(formData.get("lastName") ?? "").trim().slice(0, 60);
  const staffRole = cleanRole(formData.get("staffRole"));

  if (!email || !email.includes("@")) return { error: "Adresse email invalide." };
  if (!staffRole) return { error: "Choisissez un rôle valide." };

  try {
    const supabase = createSupabaseAdmin();
    const site = process.env.NEXT_PUBLIC_SITE_URL?.trim() || "https://mamahair.vercel.app";
    const { error: inviteError } = await supabase.auth.admin.inviteUserByEmail(email, {
      redirectTo: `${site}/auth/callback?next=/admin`,
      data: { first_name: firstName, last_name: lastName, staff_role: staffRole },
    });

    // Un utilisateur peut déjà exister dans Supabase (ex. compte client converti en employé).
    // Dans ce cas, on configure tout de même son accès interne.
    if (inviteError && !/already|registered|exists/i.test(inviteError.message)) {
      return { error: inviteError.message };
    }

    await db.user.upsert({
      where: { email },
      update: { role: "STAFF", firstName: firstName || undefined, lastName: lastName || undefined, isBlocked: false },
      create: { email, firstName: firstName || null, lastName: lastName || null, role: "STAFF" },
    });

    await db.$executeRaw`
      INSERT INTO "StaffAccess" (email, "staffRole", permissions, "isActive", "updatedAt")
      VALUES (${email}, ${staffRole}, ARRAY[]::text[], true, now())
      ON CONFLICT (email) DO UPDATE SET
        "staffRole" = EXCLUDED."staffRole",
        "isActive" = true,
        "updatedAt" = now()
    `;

    revalidatePath("/admin/team");
    return { message: inviteError ? "Compte existant configuré comme employé." : "Invitation envoyée et compte employé créé." };
  } catch (error) {
    console.error("inviteStaff failed", error);
    return { error: error instanceof Error ? error.message : "Impossible de créer ce compte employé." };
  }
}

export async function updateStaffRole(formData: FormData) {
  await requireOwner();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const staffRole = cleanRole(formData.get("staffRole"));
  if (!email || !staffRole) return;

  await db.$executeRaw`
    UPDATE "StaffAccess"
    SET "staffRole" = ${staffRole}, "updatedAt" = now()
    WHERE email = ${email}
  `;
  revalidatePath("/admin/team");
}

export async function toggleStaffAccess(formData: FormData) {
  await requireOwner();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const active = String(formData.get("active") ?? "") === "true";
  if (!email) return;

  await db.$executeRaw`
    UPDATE "StaffAccess"
    SET "isActive" = ${active}, "updatedAt" = now()
    WHERE email = ${email}
  `;
  revalidatePath("/admin/team");
}
