"use client";

import { createStaffResponsibility, reviewStaffSubmission, submitStaffWork, toggleStaffResponsibility } from "@/server/staff-tasks";
import { TASK_CADENCE_LABELS, type TaskCadence } from "@/lib/staff-tasks";

type StaffRow = { email: string; firstName: string | null; lastName: string | null; staffRole: string };
type TaskRow = { id: string; email: string; title: string; description: string | null; cadence: TaskCadence; isActive: boolean; createdAt: string };
type SubmissionRow = { id: string; responsibilityId: string; email: string; periodKey: string; report: string; evidenceUrl: string | null; status: "PENDING" | "APPROVED" | "REJECTED"; adminComment: string | null; submittedAt: string; reviewedAt: string | null };

function statusLabel(status?: SubmissionRow["status"]) {
  if (status === "APPROVED") return "Approuvé";
  if (status === "REJECTED") return "À refaire";
  if (status === "PENDING") return "En attente de validation";
  return "À soumettre";
}

function statusClass(status?: SubmissionRow["status"]) {
  if (status === "APPROVED") return "bg-emerald-50 text-emerald-700";
  if (status === "REJECTED") return "bg-red-50 text-red-700";
  if (status === "PENDING") return "bg-amber-50 text-amber-700";
  return "bg-slate-100 text-slate-700";
}

export function StaffTasksManager({ isAdmin, currentUserEmail, currentPeriods, staff, tasks, submissions }: {
  isAdmin: boolean;
  currentUserEmail: string;
  currentPeriods: Record<string, string>;
  staff: StaffRow[];
  tasks: TaskRow[];
  submissions: SubmissionRow[];
}) {
  const currentSubmission = (task: TaskRow) => submissions.find((s) => s.responsibilityId === task.id && s.periodKey === currentPeriods[task.cadence]);

  if (isAdmin) {
    const pending = submissions.filter((s) => s.status === "PENDING");
    return (
      <div className="space-y-8">
        <section className="rounded-3xl border border-sand bg-white p-5 md:p-6">
          <div className="mb-5"><h2 className="text-xl font-semibold text-cocoa">Attribuer une responsabilité</h2><p className="mt-1 text-sm text-ink-soft">Choisis l’employé et la fréquence à laquelle son travail doit être soumis.</p></div>
          <form action={createStaffResponsibility} className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
            <label className="text-sm font-medium xl:col-span-2">Employé<select name="email" required className="mt-1 w-full rounded-xl border border-sand bg-white px-3 py-2">{staff.map((m) => { const name = [m.firstName, m.lastName].filter(Boolean).join(" ") || m.email; return <option key={m.email} value={m.email}>{name} — {m.email}</option>; })}</select></label>
            <label className="text-sm font-medium xl:col-span-2">Responsabilité<input name="title" required placeholder="Ex. Répondre aux demandes clients" className="mt-1 w-full rounded-xl border border-sand px-3 py-2" /></label>
            <label className="text-sm font-medium">Modalité<select name="cadence" className="mt-1 w-full rounded-xl border border-sand bg-white px-3 py-2"><option value="DAILY">Chaque jour</option><option value="WEEKLY">Chaque semaine</option><option value="MONTHLY">Chaque mois</option></select></label>
            <div className="xl:col-span-1 xl:self-end"><button className="w-full rounded-xl bg-cocoa px-4 py-2.5 font-semibold text-white">Attribuer</button></div>
            <label className="text-sm font-medium md:col-span-2 xl:col-span-6">Instructions<textarea name="description" rows={3} placeholder="Décris précisément ce qui doit être accompli et ce que l’employé doit soumettre comme preuve." className="mt-1 w-full rounded-xl border border-sand px-3 py-2" /></label>
          </form>
        </section>

        <section className="rounded-3xl border border-sand bg-white p-5 md:p-6">
          <div className="mb-5 flex items-center justify-between gap-4"><div><h2 className="text-xl font-semibold text-cocoa">Travaux à valider</h2><p className="text-sm text-ink-soft">{pending.length} soumission{pending.length === 1 ? "" : "s"} en attente</p></div></div>
          {pending.length === 0 ? <div className="rounded-2xl bg-[#faf8f5] p-6 text-center text-sm text-ink-soft">Aucun travail en attente de validation.</div> : <div className="space-y-4">{pending.map((submission) => {
            const task = tasks.find((t) => t.id === submission.responsibilityId);
            if (!task) return null;
            return <article key={submission.id} className="rounded-2xl border border-sand p-4 md:p-5">
              <div className="flex flex-col justify-between gap-3 md:flex-row"><div><div className="text-xs font-semibold uppercase tracking-wide text-flame">{submission.email}</div><h3 className="mt-1 font-semibold text-cocoa">{task.title}</h3><div className="mt-1 text-sm text-ink-soft">{TASK_CADENCE_LABELS[task.cadence]} · période {submission.periodKey}</div></div><span className="h-fit rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">À valider</span></div>
              <div className="mt-4 rounded-xl bg-[#faf8f5] p-4 text-sm whitespace-pre-wrap">{submission.report}</div>
              {submission.evidenceUrl && <a href={submission.evidenceUrl} target="_blank" rel="noreferrer" className="mt-3 inline-block text-sm font-semibold text-flame underline">Voir la preuve / le lien fourni</a>}
              <form action={reviewStaffSubmission} className="mt-4 grid gap-3 md:grid-cols-[1fr_auto_auto]"><input type="hidden" name="id" value={submission.id} /><input name="adminComment" placeholder="Commentaire de validation ou correction demandée" className="rounded-xl border border-sand px-3 py-2 text-sm" /><button name="decision" value="REJECTED" className="rounded-xl bg-red-50 px-4 py-2 text-sm font-semibold text-red-700">Refuser / À refaire</button><button name="decision" value="APPROVED" className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white">Approuver</button></form>
            </article>;
          })}</div>}
        </section>

        <section className="overflow-hidden rounded-3xl border border-sand bg-white">
          <div className="border-b border-sand px-5 py-4 md:px-6"><h2 className="text-xl font-semibold text-cocoa">Responsabilités attribuées</h2><p className="text-sm text-ink-soft">Suivi quotidien, hebdomadaire et mensuel de toute l’équipe.</p></div>
          <div className="divide-y divide-sand">{tasks.length === 0 ? <div className="p-8 text-center text-ink-soft">Aucune responsabilité attribuée.</div> : tasks.map((task) => {
            const latest = submissions.find((s) => s.responsibilityId === task.id);
            return <div key={task.id} className="grid gap-4 p-5 md:grid-cols-[1.4fr_1fr_auto] md:items-center md:px-6"><div><div className="font-semibold text-cocoa">{task.title}</div><div className="text-sm text-ink-soft">{task.email} · {TASK_CADENCE_LABELS[task.cadence]}</div>{task.description && <div className="mt-1 text-xs text-ink-soft">{task.description}</div>}</div><div><span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusClass(latest?.status)}`}>{latest ? `${statusLabel(latest.status)} · ${latest.periodKey}` : "Jamais soumis"}</span></div><form action={toggleStaffResponsibility}><input type="hidden" name="id" value={task.id} /><input type="hidden" name="active" value={task.isActive ? "false" : "true"} /><button className={task.isActive ? "rounded-xl bg-red-50 px-4 py-2 text-sm font-semibold text-red-700" : "rounded-xl bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700"}>{task.isActive ? "Désactiver" : "Réactiver"}</button></form></div>;
          })}</div>
        </section>
      </div>
    );
  }

  const grouped = (["DAILY", "WEEKLY", "MONTHLY"] as TaskCadence[]).map((cadence) => ({ cadence, items: tasks.filter((t) => t.cadence === cadence) }));
  return <div className="space-y-8">
    <section className="grid gap-4 sm:grid-cols-3">
      {grouped.map(({ cadence, items }) => { const approved = items.filter((t) => currentSubmission(t)?.status === "APPROVED").length; return <div key={cadence} className="rounded-3xl border border-sand bg-white p-5"><div className="text-sm font-semibold text-flame">{TASK_CADENCE_LABELS[cadence]}</div><div className="mt-2 text-3xl font-semibold text-cocoa">{approved}/{items.length}</div><div className="mt-1 text-sm text-ink-soft">validée{approved === 1 ? "" : "s"} pour la période actuelle</div></div>; })}
    </section>
    {grouped.map(({ cadence, items }) => <section key={cadence} className="rounded-3xl border border-sand bg-white p-5 md:p-6"><div className="mb-5"><h2 className="text-xl font-semibold text-cocoa">Responsabilités {TASK_CADENCE_LABELS[cadence].toLowerCase()}s</h2><p className="text-sm text-ink-soft">Période actuelle : {currentPeriods[cadence]}</p></div>{items.length === 0 ? <div className="rounded-2xl bg-[#faf8f5] p-5 text-sm text-ink-soft">Aucune responsabilité pour cette modalité.</div> : <div className="space-y-4">{items.map((task) => { const submission = currentSubmission(task); return <article key={task.id} className="rounded-2xl border border-sand p-4 md:p-5"><div className="flex flex-col justify-between gap-3 md:flex-row"><div><h3 className="font-semibold text-cocoa">{task.title}</h3>{task.description && <p className="mt-1 text-sm text-ink-soft">{task.description}</p>}</div><span className={`h-fit rounded-full px-3 py-1 text-xs font-semibold ${statusClass(submission?.status)}`}>{statusLabel(submission?.status)}</span></div>{submission?.adminComment && <div className={submission.status === "REJECTED" ? "mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700" : "mt-4 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-700"}><strong>Commentaire admin :</strong> {submission.adminComment}</div>}{submission?.status !== "APPROVED" && <form action={submitStaffWork} className="mt-4 space-y-3"><input type="hidden" name="responsibilityId" value={task.id} /><textarea name="report" required rows={4} defaultValue={submission?.report ?? ""} placeholder="Décris clairement le travail réalisé, les résultats et les éléments importants." className="w-full rounded-xl border border-sand px-3 py-2 text-sm" /><input name="evidenceUrl" type="url" defaultValue={submission?.evidenceUrl ?? ""} placeholder="Lien de preuve facultatif : document, capture, rapport, etc." className="w-full rounded-xl border border-sand px-3 py-2 text-sm" /><button className="rounded-xl bg-cocoa px-4 py-2.5 text-sm font-semibold text-white">{submission ? "Soumettre à nouveau" : "Soumettre mon travail"}</button></form>}{submission?.status === "APPROVED" && <div className="mt-4 rounded-xl bg-emerald-50 p-4 text-sm text-emerald-700">Cette responsabilité est validée par l’administrateur pour la période {submission.periodKey}.</div>}</article>; })}</div>}</section>)}
    <div className="text-xs text-ink-soft">Compte connecté : {currentUserEmail}</div>
  </div>;
}
