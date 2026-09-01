import { db } from "@/lib/db";
import { requireOwner } from "@/lib/auth";
import { TeamManager } from "@/components/admin/team-manager";
import type { StaffRoleKey } from "@/lib/staff-access";

type TeamRow = {
  email: string;
  firstName: string | null;
  lastName: string | null;
  staffRole: StaffRoleKey;
  isActive: boolean;
  createdAt: Date;
};

export default async function TeamPage() {
  await requireOwner();
  const staff = await db.$queryRaw<TeamRow[]>`
    SELECT sa.email, u."firstName", u."lastName", sa."staffRole", sa."isActive", sa."createdAt"
    FROM "StaffAccess" sa
    JOIN "User" u ON u.email = sa.email
    ORDER BY sa."createdAt" DESC
  `;

  return (
    <main className="mx-auto max-w-6xl">
      <div className="mb-8">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-flame">Administration</p>
        <h1 className="mt-2 text-3xl font-semibold text-cocoa md:text-4xl">Équipe & permissions</h1>
        <p className="mt-2 max-w-3xl text-ink-soft">Crée les comptes du personnel, attribue leur fonction et coupe immédiatement leur accès lorsqu’un employé ne travaille plus avec la boutique.</p>
      </div>
      <TeamManager staff={staff.map((member) => ({ ...member, createdAt: member.createdAt.toISOString() }))} />
    </main>
  );
}
