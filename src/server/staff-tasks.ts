"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireAdmin, requireOwner } from "@/lib/auth";
import { currentPeriodKey, type TaskCadence } from "@/lib/staff-tasks";

const CADENCES = new Set<TaskCadence>(["DAILY", "WEEKLY", "MONTHLY"]);

function cleanCadence(value: FormDataEntryValue | null): TaskCadence | null {
  const cadence = String(value ?? "") as TaskCadence;
  return CADENCES.has(cadence) ? cadence : null;
}

export async function createStaffResponsibility(formData: FormData) {
  const admin = await requireOwner();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const title = String(formData.get("title") ?? "").trim().slice(0, 140);
  const description = String(formData.get("description") ?? "").trim().slice(0, 3000);
  const cadence = cleanCadence(formData.get("cadence"));
  if (!email || !title || !cadence) return;

  const staff = await db.$queryRaw<Array<{ email: string }>>`
    SELECT email FROM "StaffAccess" WHERE email = ${email} AND "isActive" = true LIMIT 1
  `;
  if (!staff[0]) return;

  await db.$executeRaw`
    INSERT INTO "StaffResponsibility" (email, title, description, cadence, "createdBy")
    VALUES (${email}, ${title}, ${description || null}, ${cadence}, ${admin.email})
  `;
  revalidatePath("/admin/tasks");
}

export async function toggleStaffResponsibility(formData: FormData) {
  await requireOwner();
  const id = String(formData.get("id") ?? "");
  const active = String(formData.get("active") ?? "") === "true";
  if (!id) return;
  await db.$executeRaw`
    UPDATE "StaffResponsibility" SET "isActive" = ${active}, "updatedAt" = now() WHERE id = ${id}::uuid
  `;
  revalidatePath("/admin/tasks");
}

export async function submitStaffWork(formData: FormData) {
  const user = await requireAdmin();
  if (user.role === "ADMIN") return;

  const responsibilityId = String(formData.get("responsibilityId") ?? "");
  const report = String(formData.get("report") ?? "").trim().slice(0, 6000);
  const evidenceUrl = String(formData.get("evidenceUrl") ?? "").trim().slice(0, 1200);
  if (!responsibilityId || !report) return;

  const rows = await db.$queryRaw<Array<{ cadence: TaskCadence }>>`
    SELECT cadence FROM "StaffResponsibility"
    WHERE id = ${responsibilityId}::uuid AND email = ${user.email} AND "isActive" = true
    LIMIT 1
  `;
  const task = rows[0];
  if (!task) return;

  const periodKey = currentPeriodKey(task.cadence);
  await db.$executeRaw`
    INSERT INTO "StaffTaskSubmission" ("responsibilityId", email, "periodKey", report, "evidenceUrl", status, "submittedAt", "updatedAt")
    VALUES (${responsibilityId}::uuid, ${user.email}, ${periodKey}, ${report}, ${evidenceUrl || null}, 'PENDING', now(), now())
    ON CONFLICT ("responsibilityId", "periodKey") DO UPDATE SET
      report = EXCLUDED.report,
      "evidenceUrl" = EXCLUDED."evidenceUrl",
      status = 'PENDING',
      "adminComment" = NULL,
      "submittedAt" = now(),
      "reviewedAt" = NULL,
      "reviewedBy" = NULL,
      "updatedAt" = now()
  `;
  revalidatePath("/admin/tasks");
}

export async function reviewStaffSubmission(formData: FormData) {
  const admin = await requireOwner();
  const id = String(formData.get("id") ?? "");
  const decision = String(formData.get("decision") ?? "");
  const adminComment = String(formData.get("adminComment") ?? "").trim().slice(0, 3000);
  if (!id || !["APPROVED", "REJECTED"].includes(decision)) return;

  await db.$executeRaw`
    UPDATE "StaffTaskSubmission"
    SET status = ${decision}, "adminComment" = ${adminComment || null}, "reviewedAt" = now(), "reviewedBy" = ${admin.email}, "updatedAt" = now()
    WHERE id = ${id}::uuid
  `;
  revalidatePath("/admin/tasks");
}
