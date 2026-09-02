"use client";

import { useActionState } from "react";
import { ShieldCheck, UserPlus } from "lucide-react";
import { grantAdminAccess, revokeAdminAccess, type AdminAccessState } from "@/server/admin-access";

type AdminRow = {
  email: string;
  firstName: string | null;
  lastName: string | null;
  createdAt: string;
};

export function AdminAccessManager({ admins, currentAdminEmail }: { admins: AdminRow[]; currentAdminEmail: string }) {
  const [state, action, pending] = useActionState<AdminAccessState, FormData>(grantAdminAccess, {});

  return (
    <section className="overflow-hidden rounded-3xl border border-sand bg-white">
      <div className="border-b border-sand bg-cocoa px-5 py-5 text-cream md:px-6">
        <div className="flex items-start gap-3">
          <div className="grid size-10 shrink-0 place-items-center rounded-2xl bg-white/10"><ShieldCheck className="size-5" /></div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-peach">Accès sensible</p>
            <h2 className="mt-1 text-xl font-semibold">Administrateurs</h2>
            <p className="mt-1 max-w-2xl text-sm text-cream/70">Un administrateur possède un accès complet au tableau de bord, aux réglages, aux commandes, aux clients et à la gestion de l’équipe.</p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 p-5 lg:grid-cols-[0.9fr_1.1fr] md:p-6">
        <div className="rounded-2xl bg-cream p-4 sm:p-5">
          <div className="flex items-center gap-2"><UserPlus className="size-4 text-flame" /><h3 className="font-semibold text-cocoa">Donner l’accès Admin</h3></div>
          <p className="mt-2 text-sm leading-6 text-ink-soft">Entrez l’email d’un utilisateur qui possède déjà un compte MAMAHAIR.</p>
          {state.error && <div className="mt-4 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</div>}
          {state.message && <div className="mt-4 rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{state.message}</div>}
          <form action={action} className="mt-4 space-y-3">
            <input name="email" type="email" required placeholder="utilisateur@email.com" className="w-full rounded-xl border border-sand bg-white px-3 py-3 text-sm outline-none focus:border-cocoa" />
            <button disabled={pending} className="w-full rounded-xl bg-cocoa px-4 py-3 text-sm font-semibold text-white disabled:opacity-50">{pending ? "Attribution…" : "Donner l’accès administrateur"}</button>
          </form>
        </div>

        <div>
          <div className="mb-3 flex items-center justify-between gap-3"><h3 className="font-semibold text-cocoa">Admins actuels</h3><span className="rounded-full bg-petal px-3 py-1 text-xs font-semibold text-cocoa">{admins.length}</span></div>
          <div className="space-y-2">
            {admins.map((admin) => {
              const name = [admin.firstName, admin.lastName].filter(Boolean).join(" ") || "Sans nom";
              const isCurrent = admin.email.toLowerCase() === currentAdminEmail.toLowerCase();
              return (
                <div key={admin.email} className="flex flex-col gap-3 rounded-2xl border border-sand/80 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2"><p className="font-semibold text-cocoa">{name}</p>{isCurrent && <span className="rounded-full bg-cocoa px-2 py-1 text-[9px] font-bold uppercase tracking-[0.08em] text-cream">Vous</span>}</div>
                    <p className="truncate text-sm text-ink-soft">{admin.email}</p>
                  </div>
                  {isCurrent ? (
                    <span className="text-xs font-medium text-ink-soft">Votre accès ne peut pas être retiré ici</span>
                  ) : (
                    <form action={revokeAdminAccess}>
                      <input type="hidden" name="email" value={admin.email} />
                      <button className="rounded-xl bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-100">Retirer Admin</button>
                    </form>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
