import { db } from "@/lib/db";
import { requireOwner } from "@/lib/auth";
import { TeamManager } from "@/components/admin/team-manager";
import { AdminAccessManager } from "@/components/admin/admin-access-manager";
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
  const currentAdmin = await requireOwner();
  const [staff, admins] = await Promise.all([
    db.$queryRaw<TeamRow[]>`
      SELECT sa.email, u."firstName", u."lastName", sa."staffRole", sa."isActive", sa."createdAt"
      FROM "StaffAccess" sa
      JOIN "User" u ON u.email = sa.email
      ORDER BY sa."createdAt" DESC
    `,
    db.user.findMany({
      where: { role: "ADMIN" },
      select: { email: true, firstName: true, lastName: true, createdAt: true },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  return (
    <main className="mx-auto max-w-6xl">
      <div className="mb-8">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-flame">Administration</p>
        <h1 className="mt-2 text-3xl font-semibold text-cocoa md:text-4xl">Équipe & permissions</h1>
        <p className="mt-2 max-w-3xl text-ink-soft">Gérez les administrateurs, créez les comptes du personnel, attribuez leurs fonctions et suspendez leur accès lorsque nécessaire.</p>
      </div>

      <div className="space-y-8">
        <AdminAccessManager
          currentAdminEmail={currentAdmin.email}
          admins={admins.map((admin) => ({ ...admin, createdAt: admin.createdAt.toISOString() }))}
        />
        <TeamManager staff={staff.map((member) => ({ ...member, createdAt: member.createdAt.toISOString() }))} />
      </div>
    </main>
  );
}
