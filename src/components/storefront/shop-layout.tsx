import Link from "next/link";
import { Suspense } from "react";
import type { listProducts, listCategories } from "@/server/products";
import { ProductCard } from "@/components/storefront/product-card";
import { Filters } from "@/components/storefront/filters";
import { getT, getCurrency } from "@/i18n/server";
import { getWishlistProductIds } from "@/server/wishlist";
import { fmt } from "@/i18n";
import { CURRENCIES } from "@/lib/money";
import { db } from "@/lib/db";
import { ArrowRight, SlidersHorizontal, Sparkles } from "lucide-react";

export async function ShopLayout({ title, description, result, categories, basePath, query }: {
  title: string; description?: string | null; result: Awaited<ReturnType<typeof listProducts>>; categories: Awaited<ReturnType<typeof listCategories>>; basePath: string; query: Record<string, string | undefined>;
}) {
  const [t, currency, saved, colorRows] = await Promise.all([
    getT(),
    getCurrency(),
    getWishlistProductIds(),
    db.product.findMany({ where: { status: "ACTIVE" }, select: { colors: true }, take: 500 }),
  ]);
  const colors = [...new Set(colorRows.flatMap((r) => r.colors))].slice(0, 20);
  const wl = { save: t.product.saveWishlist, saved: t.product.savedWishlist };
  const pageHref = (p: number) => {
    const s = new URLSearchParams(Object.entries(query).filter(([, v]) => v) as [string, string][]);
    s.set("page", String(p));
    return `${basePath}?${s}`;
  };
  const featuredCategories = categories.filter((c) => c.isActive).slice(0, 8);

  return (
    <div className="bg-[#fbf8f5] pb-16 sm:pb-20">
      <section className="border-b border-sand/70 bg-[#f7eee7]">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12 lg:py-14">
          <div className="inline-flex items-center gap-2 rounded-full border border-cocoa/10 bg-white/70 px-3 py-1.5 text-[9px] font-bold uppercase tracking-[.16em] text-cocoa sm:px-4 sm:py-2 sm:text-[10px]">
            <Sparkles className="size-3 text-flame" /> MAMAHAIR COLLECTION
          </div>

          <div className="mt-4 flex flex-col justify-between gap-5 lg:mt-5 lg:flex-row lg:items-end">
            <div>
              <h1 className="max-w-3xl text-[2.6rem] leading-[.98] text-cocoa sm:text-5xl lg:text-6xl">{title}</h1>
              <p className="mt-3 max-w-2xl text-[13px] leading-6 text-ink-soft sm:mt-4 sm:text-base sm:leading-7">
                {description || "Premium wigs, bundles, extensions and hair essentials selected for a polished, natural finish."}
              </p>
            </div>
            <div className="hidden rounded-2xl border border-sand bg-white/80 px-5 py-4 text-sm text-ink-soft shadow-sm lg:block">
              <span className="font-semibold text-cocoa">{result.total}</span> curated product{result.total === 1 ? "" : "s"}
            </div>
          </div>

          {featuredCategories.length > 0 && (
            <div className="no-scrollbar -mx-4 mt-6 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:mt-8 sm:px-0">
              <Link href="/shop" className="shrink-0 rounded-full bg-cocoa px-4 py-2 text-[11px] font-semibold text-cream sm:px-5 sm:py-2.5 sm:text-sm">All hair</Link>
              {featuredCategories.map((category) => (
                <Link key={category.id} href={`/shop/${category.slug}`} className="shrink-0 rounded-full border border-sand bg-white/80 px-4 py-2 text-[11px] font-medium text-cocoa transition hover:border-cocoa hover:bg-white sm:px-5 sm:py-2.5 sm:text-sm">
                  {category.name}
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 sm:py-8 lg:py-10">
        <div className="mb-5 lg:hidden">
          <div className="flex items-center justify-between gap-3 rounded-2xl border border-sand bg-white p-3 shadow-[0_8px_28px_rgba(74,27,12,.05)]">
            <Suspense>
              <Filters categories={categories} colors={colors} t={t.shop} currencySymbol={CURRENCIES[currency]?.symbol ?? currency} />
            </Suspense>
            <div className="min-w-0 text-right">
              <p className="text-[11px] font-semibold text-cocoa">{fmt(t.shop.results, { n: result.total })}</p>
              <Link href="/quiz" className="mt-0.5 inline-flex items-center gap-1 text-[10px] font-medium text-flame">
                Hair finder <ArrowRight className="size-3" />
              </Link>
            </div>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-[265px_1fr] lg:gap-10 xl:grid-cols-[285px_1fr]">
          <aside className="hidden h-fit lg:sticky lg:top-28 lg:block">
            <div className="rounded-[28px] border border-sand bg-white p-5 shadow-[0_14px_45px_rgba(74,27,12,0.04)]">
              <div className="mb-5 flex items-center gap-2 border-b border-sand pb-4">
                <SlidersHorizontal className="size-4 text-flame" />
                <p className="text-sm font-semibold text-cocoa">Refine your search</p>
              </div>
              <Suspense>
                <Filters categories={categories} colors={colors} t={t.shop} currencySymbol={CURRENCIES[currency]?.symbol ?? currency} />
              </Suspense>
            </div>
          </aside>

          <main className="min-w-0">
            <div className="mb-6 hidden items-center justify-between gap-3 border-b border-sand pb-4 lg:flex">
              <p className="text-sm text-ink-soft">{fmt(t.shop.results, { n: result.total })}</p>
              <Link href="/quiz" className="inline-flex items-center gap-2 text-sm font-semibold text-cocoa hover:text-flame">
                Need help choosing? <ArrowRight className="size-4" />
              </Link>
            </div>

            {result.items.length === 0 ? (
              <div className="rounded-[28px] border border-dashed border-sand bg-white p-10 text-center sm:p-14">
                <p className="display text-2xl text-cocoa">No match yet</p>
                <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-ink-soft">{t.shop.noResults}</p>
                <Link href="/shop" className="mt-6 inline-flex rounded-full bg-cocoa px-6 py-3 text-sm font-semibold text-cream">Clear filters</Link>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-x-2.5 gap-y-7 sm:gap-x-4 sm:gap-y-9 md:grid-cols-3 md:gap-x-5 xl:gap-x-6">
                {result.items.map((p) => <ProductCard key={p.id} p={p} saved={saved.includes(p.id)} labels={wl} />)}
              </div>
            )}

            {result.pages > 1 && (
              <nav className="mt-12 flex flex-wrap justify-center gap-2 sm:mt-14" aria-label="Pagination">
                {Array.from({ length: result.pages }, (_, i) => i + 1).map((p) => (
                  <Link key={p} href={pageHref(p)} className={`grid size-10 place-items-center rounded-full text-sm font-semibold transition sm:size-11 ${p === result.page ? "bg-cocoa text-cream shadow-sm" : "border border-sand bg-white text-cocoa hover:border-cocoa hover:bg-petal"}`}>{p}</Link>
                ))}
              </nav>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
