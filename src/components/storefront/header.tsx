import Link from "next/link";
import Image from "next/image";
import { Heart, Search, ShoppingBag, Sparkles, User } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { getCart, cartTotals } from "@/server/cart";
import { getBrand } from "@/lib/settings";
import { getT, getLocale, getCurrency } from "@/i18n/server";
import { listCategories } from "@/server/products";
import { SearchBox } from "./search-box";
import { LocaleCurrencySwitcher } from "./locale-switcher";
import { MobileMenu } from "./mobile-menu";
import { DesktopMegaMenu } from "./desktop-mega-menu";

export async function Header() {
  const [user, cart, b, t, locale, currency, categories] = await Promise.all([
    getCurrentUser(),
    getCart(),
    getBrand(),
    getT(),
    getLocale(),
    getCurrency(),
    listCategories(),
  ]);
  const { count } = await cartTotals(cart);
  const headerLogo = b.branding.logoDarkUrl || b.branding.logoUrl;
  const featuredCategories = categories.filter((c) => c.showOnHome).slice(0, 5);
  const mobileNav = [
    { href: "/shop", label: t.nav.shop },
    ...featuredCategories.map((c) => ({ href: `/shop/${c.slug}`, label: c.name })),
    { href: "/shop?isNew=1", label: t.nav.newArrivals },
    { href: "/shop?bestSeller=1", label: "Best Sellers" },
    { href: "/track-order", label: "Track Order" },
    { href: "/quiz", label: t.nav.quiz },
    { href: "/blog", label: "Hair Guide" },
  ];
  const desktopNav = [
    { href: "/shop?isNew=1", label: t.nav.newArrivals },
    { href: "/shop?bestSeller=1", label: "Best Sellers" },
    { href: "/quiz", label: t.nav.quiz },
    { href: "/blog", label: "Hair Guide" },
    { href: "/track-order", label: "Track Order" },
  ];
  const localeLabels = { language: t.nav.language, currency: t.nav.currency };

  return (
    <header className="sticky top-0 z-40 bg-cream">
      {b.announcementEnabled && b.announcement && (
        <div className="bg-cocoa-deep px-3 py-2 text-center text-[10px] font-semibold uppercase tracking-[0.16em] text-cream sm:px-4 sm:text-[11px] lg:text-xs">
          {b.announcement}
        </div>
      )}

      <div className="border-b border-sand/80 bg-cream/95 shadow-[0_8px_28px_rgba(74,27,12,0.045)] backdrop-blur-xl">
        <div className="mx-auto flex h-[64px] max-w-[1440px] items-center gap-2 px-3 sm:h-[72px] sm:px-5 lg:h-[78px] lg:px-8">
          <div className="lg:hidden">
            <MobileMenu nav={mobileNav} label={t.nav.menu} locale={locale} currency={currency} locales={b.localization.enabledLocales} currencies={b.commerce.enabledCurrencies} labels={localeLabels} />
          </div>

          <Link href="/" className="flex shrink-0 items-center" aria-label={b.storeName}>
            {headerLogo ? <Image src={headerLogo} alt={b.storeName} width={200} height={64} className="h-9 w-auto max-w-[132px] object-contain sm:h-11 sm:max-w-[170px] lg:h-12 lg:max-w-[190px]" priority /> : <span className="display text-[1.35rem] tracking-[0.08em] text-cocoa sm:text-[1.7rem] lg:text-3xl">{b.storeName}</span>}
          </Link>

          <div className="mx-auto hidden w-full max-w-xl md:block lg:max-w-2xl"><SearchBox placeholder={t.shop.searchPlaceholder} /></div>

          <div className="ml-auto flex shrink-0 items-center gap-0.5 sm:gap-1">
            <div className="hidden xl:block"><LocaleCurrencySwitcher locale={locale} currency={currency} locales={b.localization.enabledLocales} currencies={b.commerce.enabledCurrencies} labels={localeLabels} /></div>
            <Link href="/search" aria-label="Search" className="grid size-10 place-items-center rounded-full transition hover:bg-petal md:hidden"><Search className="size-[19px]" strokeWidth={1.7} /></Link>
            <Link href="/account/wishlist" aria-label={t.nav.wishlist} className="hidden size-10 place-items-center rounded-full transition hover:bg-petal sm:grid"><Heart className="size-[19px]" strokeWidth={1.7} /></Link>
            <Link href={user ? "/account" : "/login"} aria-label={t.nav.account} className="hidden size-10 place-items-center rounded-full transition hover:bg-petal sm:grid"><User className="size-[19px]" strokeWidth={1.7} /></Link>
            <Link href="/cart" aria-label={t.nav.cart} className="relative grid size-10 place-items-center rounded-full transition hover:bg-petal"><ShoppingBag className="size-5" strokeWidth={1.7} />{count > 0 && <span className="absolute right-0 top-0 grid size-[19px] place-items-center rounded-full bg-flame text-[10px] font-bold text-white shadow-sm">{count}</span>}</Link>
          </div>
        </div>

        <div className="hidden border-t border-sand/70 bg-white/90 lg:block">
          <div className="mx-auto flex h-[47px] max-w-[1440px] items-center justify-center gap-7 px-8 xl:gap-9">
            <DesktopMegaMenu categories={categories} />
            <Link href="/shop?bestSeller=1" className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.1em] text-flame transition hover:text-cocoa"><Sparkles className="size-3.5" /> Trending</Link>
            {desktopNav.map((n) => <Link key={`${n.href}-${n.label}`} href={n.href} className="relative py-4 text-[11px] font-semibold uppercase tracking-[0.09em] text-ink/80 transition-colors hover:text-flame after:absolute after:bottom-2.5 after:left-1/2 after:h-px after:w-0 after:-translate-x-1/2 after:bg-flame after:transition-all hover:after:w-full">{n.label}</Link>)}
          </div>
        </div>

        <div className="border-t border-sand/70 bg-white/80 px-3 py-1.5 md:hidden"><LocaleCurrencySwitcher mobileBar locale={locale} currency={currency} locales={b.localization.enabledLocales} currencies={b.commerce.enabledCurrencies} labels={localeLabels} /></div>
      </div>
    </header>
  );
}
