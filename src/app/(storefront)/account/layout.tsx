import Link from "next/link";
import { Crown, Heart, MapPin, Package, Settings, Star, UserRound } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { getT } from "@/i18n/server";
import { signOut } from "@/server/auth";
import { AccountNav } from "@/components/storefront/account-nav";
import { Button } from "@/components/ui/button";

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const [user, t] = await Promise.all([requireUser(), getT()]);
  const a = t.account;
  const items = [
    { href: "/account", label: a.dashboard },
    { href: "/account/orders", label: a.orders },
    { href: "/account/rewards", label: "Mama Rewards" },
    { href: "/account/addresses", label: a.addresses },
    { href: "/account/wishlist", label: a.wishlist },
    { href: "/account/reviews", label: a.reviews },
    { href: "/account/settings", label: a.settings },
  ];

  const shortcuts = [
    { href: "/account/orders", label: a.orders, icon: Package },
    { href: "/account/rewards", label: "Rewards", icon: Crown },
    { href: "/account/wishlist", label: a.wishlist, icon: Heart },
    { href: "/account/addresses", label: a.addresses, icon: MapPin },
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 py-7 sm:px-6 sm:py-10">
      <section className="overflow-hidden rounded-[1.8rem] border border-sand/80 bg-[linear-gradient(135deg,#fff_0%,#fbf4ee_55%,#f6e7dc_100%)] p-5 shadow-[0_16px_50px_rgba(74,27,12,0.05)] sm:p-7">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-4">
            <div className="grid size-12 shrink-0 place-items-center rounded-full bg-cocoa text-cream shadow-sm sm:size-14"><UserRound className="size-5 sm:size-6" /></div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-[.16em] text-flame">MAMAHAIR account</p>
              <h1 className="mt-1 truncate text-3xl text-cocoa sm:text-4xl">{user.firstName ? `${user.firstName}'s account` : a.title}</h1>
              <p className="mt-1 truncate text-xs text-ink-soft sm:text-sm">{user.email}</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {(user.role === "ADMIN" || user.role === "STAFF") && <Link href="/admin" className="rounded-full border border-sand bg-white px-4 py-2 text-xs font-semibold text-cocoa transition hover:bg-petal">Admin</Link>}
            <form action={signOut}><Button variant="ghost" size="sm">{t.nav.signOut}</Button></form>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-2 sm:hidden">
          {shortcuts.map(({ href, label, icon: Icon }) => <Link key={href} href={href} className="flex items-center gap-2.5 rounded-2xl border border-white/70 bg-white/75 px-3 py-3 text-xs font-semibold text-cocoa shadow-sm backdrop-blur"><span className="grid size-8 place-items-center rounded-full bg-petal text-flame"><Icon className="size-3.5" /></span><span className="truncate">{label}</span></Link>)}
        </div>
      </section>

      <div className="mt-5 md:hidden"><AccountNav items={items} /></div>

      <div className="mt-6 grid gap-7 md:mt-8 md:grid-cols-[230px_minmax(0,1fr)] md:gap-8">
        <aside className="hidden md:block"><AccountNav items={items} /></aside>
        <main className="min-w-0">{children}</main>
      </div>
    </div>
  );
}
