import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { currentPeriodKey, type TaskCadence } from "@/lib/staff-tasks";
import { StaffTasksManager } from "@/components/admin/staff-tasks-manager";

type TaskRow = {
  id: string;
  email: string;
  title: string;
  description: string | null;
  cadence: TaskCadence;
  isActive: boolean;
  createdAt: Date;
};

type SubmissionRow = {
  id: string;
  responsibilityId: string;
  email: string;
  periodKey: string;
  report: string;
  evidenceUrl: string | null;
  status: "PENDING" | "APPROVED" | "REJECTED";
  adminComment: string | null;
  submittedAt: Date;
  reviewedAt: Date | null;
};

type StaffRow = { email: string; firstName: string | null; lastName: string | null; staffRole: string };

export default async function StaffTasksPage() {
  const user = await requireAdmin();
  const isAdmin = user.role === "ADMIN";

  const staff = isAdmin
    ? await db.$queryRaw<StaffRow[]>`
        SELECT sa.email, u."firstName", u."lastName", sa."staffRole"
        FROM "StaffAccess" sa JOIN "User" u ON u.email = sa.email
        WHERE sa."isActive" = true
        ORDER BY u."firstName" NULLS LAST, u."lastName" NULLS LAST, sa.email
      `
    : [];

  const tasks = isAdmin
    ? await db.$queryRaw<TaskRow[]>`
        SELECT id::text, email, title, description, cadence, "isActive", "createdAt"
        FROM "StaffResponsibility"
        ORDER BY "isActive" DESC, "createdAt" DESC
      `
    : await db.$queryRaw<TaskRow[]>`
        SELECT id::text, email, title, description, cadence, "isActive", "createdAt"
        FROM "StaffResponsibility"
        WHERE email = ${user.email} AND "isActive" = true
        ORDER BY cadence, "createdAt" DESC
      `;

  const submissions = isAdmin
    ? await db.$queryRaw<SubmissionRow[]>`
        SELECT id::text, "responsibilityId"::text, email, "periodKey", report, "evidenceUrl", status, "adminComment", "submittedAt", "reviewedAt"
        FROM "StaffTaskSubmission"
        ORDER BY CASE status WHEN 'PENDING' THEN 0 WHEN 'REJECTED' THEN 1 ELSE 2 END, "submittedAt" DESC
        LIMIT 300
      `
    : await db.$queryRaw<SubmissionRow[]>`
        SELECT id::text, "responsibilityId"::text, email, "periodKey", report, "evidenceUrl", status, "adminComment", "submittedAt", "reviewedAt"
        FROM "StaffTaskSubmission"
        WHERE email = ${user.email}
        ORDER BY "submittedAt" DESC
        LIMIT 120
      `;

  const currentPeriods = Object.fromEntries(
    ["DAILY", "WEEKLY", "MONTHLY"].map((cadence) => [cadence, currentPeriodKey(cadence as TaskCadence)]),
  );

  return (
    <main className="mx-auto max-w-7xl">
      <div className="mb-8">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-flame">{isAdmin ? "Pilotage de l’équipe" : "Mon travail"}</p>
        <h1 className="mt-2 text-3xl font-semibold text-cocoa md:text-4xl">{isAdmin ? "Responsabilités & validations" : "Mes responsabilités"}</h1>
        <p className="mt-2 max-w-3xl text-ink-soft">
          {isAdmin
            ? "Attribue les responsabilités par jour, semaine ou mois, puis valide les travaux réellement accomplis par chaque employé."
            : "Soumets ton travail pour chaque responsabilité selon sa fréquence. Une tâche n’est considérée accomplie qu’après validation de l’administrateur."}
        </p>
      </div>
      <StaffTasksManager
        isAdmin={isAdmin}
        currentUserEmail={user.email}
        currentPeriods={currentPeriods}
        staff={staff}
        tasks={tasks.map((t) => ({ ...t, createdAt: t.createdAt.toISOString() }))}
        submissions={submissions.map((s) => ({ ...s, submittedAt: s.submittedAt.toISOString(), reviewedAt: s.reviewedAt?.toISOString() ?? null }))}
      />
    </main>
  );
}
