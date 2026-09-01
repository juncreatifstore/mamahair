import { db } from "@/lib/db";

export const STAFF_ROLES = {
  MANAGER: {
    label: "Responsable boutique",
    permissions: ["orders.manage", "products.manage", "customers.manage", "reviews.manage", "discounts.manage", "shipping.manage", "abandoned.manage", "emails.manage", "content.manage"],
  },
  CUSTOMER_SERVICE: {
    label: "Service client",
    permissions: ["orders.manage", "customers.manage", "reviews.manage", "abandoned.manage", "emails.manage"],
  },
  INVENTORY_LOGISTICS: {
    label: "Stock / Logistique",
    permissions: ["orders.manage", "products.manage", "shipping.manage"],
  },
  MARKETING: {
    label: "Marketing",
    permissions: ["products.manage", "reviews.manage", "discounts.manage", "emails.manage", "content.manage"],
  },
  ACCOUNTING: {
    label: "Comptabilité",
    permissions: ["orders.manage", "customers.manage"],
  },
} as const;

export const STAFF_PERMISSION_LABELS = {
  "orders.manage": "Commandes",
  "products.manage": "Produits et stock",
  "customers.manage": "Clients",
  "reviews.manage": "Avis",
  "discounts.manage": "Promotions",
  "shipping.manage": "Livraison et taxes",
  "abandoned.manage": "Paniers abandonnés",
  "emails.manage": "Emails",
  "content.manage": "Contenu",
  "settings.manage": "Paramètres",
  "team.manage": "Équipe",
} as const;

export type StaffRoleKey = keyof typeof STAFF_ROLES;
export type StaffPermission = keyof typeof STAFF_PERMISSION_LABELS;

export type StaffAccess = {
  email: string;
  staffRole: StaffRoleKey;
  permissions: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export async function getStaffAccess(email: string): Promise<StaffAccess | null> {
  const rows = await db.$queryRaw<StaffAccess[]>`
    SELECT email, "staffRole", permissions, "isActive", "createdAt", "updatedAt"
    FROM "StaffAccess"
    WHERE email = ${email}
    LIMIT 1
  `;
  return rows[0] ?? null;
}

export function effectivePermissions(access: StaffAccess | null): string[] {
  if (!access || !access.isActive) return [];
  const defaults = STAFF_ROLES[access.staffRole]?.permissions ?? [];
  return Array.from(new Set([...defaults, ...(access.permissions ?? [])]));
}

export function hasStaffPermission(access: StaffAccess | null, permission: StaffPermission) {
  return effectivePermissions(access).includes(permission);
}
