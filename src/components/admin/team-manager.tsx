"use client";

import { useActionState } from "react";
import { inviteStaff, toggleStaffAccess, updateStaffRole, type StaffActionState } from "@/server/staff";
import { STAFF_ROLES } from "@/lib/staff-access";

type StaffRow = {
  email: string;
  firstName: string | null;
  lastName: string | null;
  staffRole: keyof typeof STAFF_ROLES;
  isActive: boolean;
  createdAt: string;
};

export function TeamManager({ staff }: { staff: StaffRow[] }) {
  const [state, action, pending] = useActionState<StaffActionState, FormData>(inviteStaff, {});

  return (
    <div className="space-y-8">
      <section className="rounded-3xl border border-sand bg-white p-5 md:p-6">
        <div className="mb-5">
          <h2 className="text-xl font-semibold text-cocoa">Ajouter un membre</h2>
          <p className="mt-1 text-sm text-ink-soft">Une invitation sécurisée est envoyée par email. L’employé choisit ensuite son mot de passe.</p>
        </div>
        {state.error && <div className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{state.error}</div>}
        {state.message && <div className="mb-4 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{state.message}</div>}
        <form action={action} className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <label className="text-sm font-medium">Prénom<input name="firstName" className="mt-1 w-full rounded-xl border border-sand px-3 py-2" /></label>
          <label className="text-sm font-medium">Nom<input name="lastName" className="mt-1 w-full rounded-xl border border-sand px-3 py-2" /></label>
          <label className="text-sm font-medium xl:col-span-2">Email<input name="email" type="email" required className="mt-1 w-full rounded-xl border border-sand px-3 py-2" /></label>
          <label className="text-sm font-medium">Fonction<select name="staffRole" className="mt-1 w-full rounded-xl border border-sand bg-white px-3 py-2">{Object.entries(STAFF_ROLES).map(([value, role]) => <option key={value} value={value}>{role.label}</option>)}</select></label>
          <button disabled={pending} className="rounded-xl bg-cocoa px-5 py-2.5 font-semibold text-white disabled:opacity-50 md:col-span-2 xl:col-span-5 xl:justify-self-start">{pending ? "Création…" : "Créer le compte employé"}</button>
        </form>
      </section>

      <section className="overflow-hidden rounded-3xl border border-sand bg-white">
        <div className="border-b border-sand px-5 py-4 md:px-6"><h2 className="text-xl font-semibold text-cocoa">Équipe</h2><p className="text-sm text-ink-soft">{staff.length} membre{staff.length === 1 ? "" : "s"}</p></div>
        {staff.length === 0 ? <div className="p-8 text-center text-ink-soft">Aucun membre du personnel pour le moment.</div> : (
          <div className="divide-y divide-sand">
            {staff.map((member) => {
              const name = [member.firstName, member.lastName].filter(Boolean).join(" ") || "Sans nom";
              return <div key={member.email} className="grid gap-4 p-5 md:grid-cols-[1.5fr_1fr_auto] md:items-center md:px-6">
                <div><div className="font-semibold text-cocoa">{name}</div><div className="text-sm text-ink-soft">{member.email}</div><div className="mt-1 text-xs text-ink-soft">{member.isActive ? "Accès actif" : "Accès suspendu"}</div></div>
                <form action={updateStaffRole} className="flex gap-2"><input type="hidden" name="email" value={member.email} /><select name="staffRole" defaultValue={member.staffRole} className="min-w-0 flex-1 rounded-xl border border-sand bg-white px-3 py-2 text-sm">{Object.entries(STAFF_ROLES).map(([value, role]) => <option key={value} value={value}>{role.label}</option>)}</select><button className="rounded-xl border border-cocoa px-3 py-2 text-sm font-semibold text-cocoa">Modifier</button></form>
                <form action={toggleStaffAccess}><input type="hidden" name="email" value={member.email} /><input type="hidden" name="active" value={member.isActive ? "false" : "true"} /><button className={member.isActive ? "rounded-xl bg-red-50 px-4 py-2 text-sm font-semibold text-red-700" : "rounded-xl bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700"}>{member.isActive ? "Suspendre" : "Réactiver"}</button></form>
              </div>;
            })}
          </div>
        )}
      </section>
    </div>
  );
}
