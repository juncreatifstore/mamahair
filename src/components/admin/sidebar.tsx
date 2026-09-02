"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Package, Boxes, ShoppingCart, Users, Tag, Truck, FileText, Settings, ExternalLink, Star, ShoppingBasket, Mail, UserCog, ClipboardCheck } from "lucide-react";
import { cn } from "@/lib/utils";

const links = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/tasks", label: "Responsabilités", icon: ClipboardCheck },
  { href: "/admin/orders", label: "Orders", icon: ShoppingCart, badge: "toShip", permission: "orders.manage" },
  { href: "/admin/products", label: "Products", icon: Package, permission: "products.manage", exact: true },
  { href: "/admin/products/inventory", label: "Inventory", icon: Boxes, permission: "products.manage" },
  { href: "/admin/customers", label: "Customers", icon: Users, permission: "customers.manage" },
  { href: "/admin/reviews", label: "Reviews", icon: Star, badge: "reviews", permission: "reviews.manage" },
  { href: "/admin/discounts", label: "Discounts", icon: Tag, permission: "discounts.manage" },
  { href: "/admin/shipping", label: "Shipping & tax", icon: Truck, permission: "shipping.manage" },
  { href: "/admin/abandoned-carts", label: "Abandoned carts", icon: ShoppingBasket, permission: "abandoned.manage" },
  { href: "/admin/emails", label: "Emails", icon: Mail, permission: "emails.manage" },
  { href: "/admin/content", label: "Content", icon: FileText, permission: "content.manage" },
  { href: "/admin/team", label: "Team", icon: UserCog, permission: "team.manage", adminOnly: true },
  { href: "/admin/settings", label: "Settings", icon: Settings, permission: "settings.manage", adminOnly: true },
] as const;

export function Sidebar({ storeName, badges, permissions, isAdmin }: { storeName: string; badges: { toShip: number; reviews: number }; permissions: string[]; isAdmin: boolean }) {
  const pathname = usePathname();
  const allowed = (permission?: string, adminOnly?: boolean) => {
    if (isAdmin) return true;
    if (adminOnly) return false;
    if (!permission) return true;
    return permissions.includes(permission);
  };

  return (
    <aside className="no-print flex w-full flex-row gap-1 overflow-x-auto border-b border-sand bg-white p-2 md:sticky md:top-0 md:h-screen md:w-60 md:flex-col md:border-b-0 md:border-r md:p-4">
      <Link href="/admin" className="display hidden px-3 pb-6 pt-2 text-2xl text-cocoa md:block">{storeName}</Link>
      {links.filter((l) => allowed("permission" in l ? l.permission : undefined, "adminOnly" in l ? l.adminOnly : undefined)).map(({ href, label, icon: Icon, ...l }) => {
        const active = "exact" in l && l.exact ? pathname === href : pathname.startsWith(href);
        const n = "badge" in l ? badges[l.badge] : 0;
        return (
          <Link key={href} href={href} className={cn("flex items-center gap-3 whitespace-nowrap rounded-xl px-3 py-2 text-sm font-medium", active ? "bg-cocoa text-cream" : "hover:bg-petal")}>
            <Icon className="size-4" />{label}{n > 0 && <span className="ml-auto rounded-pill bg-flame px-2 text-xs font-semibold text-white">{n}</span>}
          </Link>
        );
      })}
      <Link href="/" className="mt-auto hidden items-center gap-3 px-3 py-2 text-sm text-ink-soft hover:text-ink md:flex"><ExternalLink className="size-4" /> View store</Link>
    </aside>
  );
}
