import Link from "next/link";
import Image from "next/image";
import { ShoppingBag, User, Heart } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { getCart, cartTotals } from "@/server/cart";
import { getBrand } from "@/lib/settings";
import { getT, getLocale, getCurrency } from "@/i18n/server";
import { listCategories } from "@/server/products";
import { SearchBox } from "./search-box";
import { LocaleCurrencySwitcher } from "./locale-switcher";
import { MobileMenu } from "./mobile-menu";

export async function Header() {
  const [user, cart, b, t, locale, currency, categories] = await Promise.all([getCurrentUser(), getCart(), getBrand(), getT(), getLocale(), getCurrency(), listCategories()]);
  const { count } = await cartTotals(cart);
  const nav = [
    { href: "/shop", label: t.nav.shop },
    ...categories.filter((c) => c.showOnHome).slice(0, 6).map((c) => ({ href: `/shop/${c.slug}`, label: c.name })),
    { href: "/shop?isNew=1", label: t.nav.newArrivals },
    { href: "/quiz", label: t.nav.quiz },
  ];

  return (
    <header className="sticky top-0 z-40">
      {b.announcementEnabled && b.announcement && (
        <div className="bg-cocoa px-4 py-2 text-center text-xs font-medium tracking-wide text-cream">{b.announcement}</div>
      )}
      <div className="border-b border-sand bg-cream/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4 sm:px-6">
          <MobileMenu nav={nav} label={t.nav.menu} />
          <Link href="/" className="flex items-center" aria-label={b.storeName}>
            {b.branding.logoUrl ? <Image src={b.branding.logoUrl} alt={b.storeName} width={140} height={40} className="h-9 w-auto" priority /> : <span className="display text-2xl tracking-wide text-cocoa">{b.storeName}</span>}
          </Link>
          <nav className="ml-6 hidden items-center gap-6 text-sm font-medium lg:flex">
            {nav.map((n) => <Link key={n.href} href={n.href} className="hover:text-flame">{n.label}</Link>)}
          </nav>
          <div className="ml-auto flex items-center gap-1 sm:gap-2">
            <SearchBox placeholder={t.shop.searchPlaceholder} />
            <LocaleCurrencySwitcher locale={locale} currency={currency} locales={b.localization.enabledLocales} currencies={b.commerce.enabledCurrencies} labels={{ language: t.nav.language, currency: t.nav.currency }} />
            <Link href="/account/wishlist" aria-label={t.nav.wishlist} className="grid size-10 place-items-center rounded-pill hover:bg-petal"><Heart className="size-5" /></Link>
            <Link href={user ? "/account" : "/login"} aria-label={t.nav.account} className="grid size-10 place-items-center rounded-pill hover:bg-petal"><User className="size-5" /></Link>
            <Link href="/cart" aria-label={t.nav.cart} className="relative grid size-10 place-items-center rounded-pill hover:bg-petal">
              <ShoppingBag className="size-5" />
              {count > 0 && <span className="absolute -right-0.5 -top-0.5 grid size-5 place-items-center rounded-pill bg-flame text-[11px] font-semibold text-white">{count}</span>}
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
