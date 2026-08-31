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
  const headerLogo = b.branding.logoDarkUrl || b.branding.logoUrl;
  const nav = [
    { href: "/shop", label: t.nav.shop },
    ...categories.filter((c) => c.showOnHome).slice(0, 5).map((c) => ({ href: `/shop/${c.slug}`, label: c.name })),
    { href: "/shop?isNew=1", label: t.nav.newArrivals },
    { href: "/quiz", label: t.nav.quiz },
    { href: "/blog", label: "Blog" },
  ];

  return (
    <header className="sticky top-0 z-40">
      {b.announcementEnabled && b.announcement && (
        <div className="bg-cocoa-deep px-4 py-2.5 text-center text-[11px] font-semibold uppercase tracking-[0.18em] text-cream sm:text-xs">{b.announcement}</div>
      )}
      <div className="border-b border-sand/80 bg-cream/90 shadow-[0_8px_30px_rgba(74,27,12,0.04)] backdrop-blur-xl">
        <div className="mx-auto flex min-h-[76px] max-w-7xl items-center gap-3 px-4 sm:px-6">
          <MobileMenu nav={nav} label={t.nav.menu} />

          <Link href="/" className="flex shrink-0 items-center" aria-label={b.storeName}>
            {headerLogo ? (
              <Image src={headerLogo} alt={b.storeName} width={180} height={56} className="h-10 w-auto object-contain sm:h-11" priority />
            ) : (
              <span className="display text-[1.65rem] tracking-[0.08em] text-cocoa sm:text-3xl">{b.storeName}</span>
            )}
          </Link>

          <nav className="ml-8 hidden items-center gap-6 text-[13px] font-semibold uppercase tracking-[0.08em] text-ink/80 xl:flex">
            {nav.map((n) => (
              <Link key={n.href} href={n.href} className="relative py-7 transition-colors hover:text-flame after:absolute after:bottom-5 after:left-0 after:h-px after:w-0 after:bg-flame after:transition-all hover:after:w-full">{n.label}</Link>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-0.5 sm:gap-1.5">
            <SearchBox placeholder={t.shop.searchPlaceholder} />
            <LocaleCurrencySwitcher locale={locale} currency={currency} locales={b.localization.enabledLocales} currencies={b.commerce.enabledCurrencies} labels={{ language: t.nav.language, currency: t.nav.currency }} />
            <Link href="/account/wishlist" aria-label={t.nav.wishlist} className="hidden size-10 place-items-center rounded-full transition hover:bg-petal sm:grid"><Heart className="size-[19px]" strokeWidth={1.7} /></Link>
            <Link href={user ? "/account" : "/login"} aria-label={t.nav.account} className="grid size-10 place-items-center rounded-full transition hover:bg-petal"><User className="size-[19px]" strokeWidth={1.7} /></Link>
            <Link href="/cart" aria-label={t.nav.cart} className="relative grid size-10 place-items-center rounded-full transition hover:bg-petal">
              <ShoppingBag className="size-5" strokeWidth={1.7} />
              {count > 0 && <span className="absolute right-0 top-0 grid size-[19px] place-items-center rounded-full bg-flame text-[10px] font-bold text-white shadow-sm">{count}</span>}
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
