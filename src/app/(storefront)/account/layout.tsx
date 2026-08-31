import { requireUser } from "@/lib/auth";
import { getT } from "@/i18n/server";
import { signOut } from "@/server/auth";
import { AccountNav } from "@/components/storefront/account-nav";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const [user, t] = await Promise.all([requireUser(), getT()]);
  const a = t.account;
  const items = [{ href: "/account", label: a.dashboard }, { href: "/account/orders", label: a.orders }, { href: "/account/addresses", label: a.addresses }, { href: "/account/wishlist", label: a.wishlist }, { href: "/account/reviews", label: a.reviews }, { href: "/account/settings", label: a.settings }];
  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-4xl text-cocoa">{a.title}</h1>
        <div className="flex gap-2">{(user.role === "ADMIN" || user.role === "STAFF") && <Link href="/admin" className="rounded-pill bg-petal px-4 py-2 text-sm font-medium text-cocoa">Admin</Link>}<form action={signOut}><Button variant="ghost" size="sm">{t.nav.signOut}</Button></form></div>
      </div>
      <div className="mt-8 grid gap-8 md:grid-cols-[220px_1fr]"><AccountNav items={items} /><div>{children}</div></div>
    </div>
  );
}
