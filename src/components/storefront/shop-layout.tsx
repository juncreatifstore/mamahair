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
import { ArrowRight, SlidersHorizontal } from "lucide-react";

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
  const featuredCategories = categories.filter((c) => c.isActive).slice(0, 6);

  return (
    <div className="pb-20">
      <section className="border-b border-sand bg-white">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-flame">MAMAHAIR COLLECTION</p>
          <div className="mt-3 flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
            <div>
              <h1 className="max-w-3xl text-4xl text-cocoa sm:text-5xl lg:text-6xl">{title}</h1>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-ink-soft sm:text-base">
                {description || "Premium wigs, bundles, extensions and hair essentials selected for a polished, natural finish."}
              </p>
            </div>
            <div className="rounded-2xl border border-sand bg-cream px-5 py-4 text-sm text-ink-soft">
              <span className="font-semibold text-cocoa">{result.total}</span> curated product{result.total === 1 ? "" : "s"}
            </div>
          </div>

          {featuredCategories.length > 0 && (
            <div className="no-scrollbar mt-8 flex gap-2 overflow-x-auto pb-1">
              <Link href="/shop" className="shrink-0 rounded-full bg-cocoa px-5 py-2.5 text-sm font-semibold text-cream">All hair</Link>
              {featuredCategories.map((category) => (
                <Link key={category.id} href={`/shop/${category.slug}`} className="shrink-0 rounded-full border border-sand bg-white px-5 py-2.5 text-sm font-medium text-cocoa transition hover:border-cocoa hover:bg-petal">
                  {category.name}
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
        <div className="grid gap-8 lg:grid-cols-[280px_1fr] lg:gap-10">
          <aside className="h-fit lg:sticky lg:top-28">
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

          <main>
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-sand pb-4">
              <p className="text-sm text-ink-soft">{fmt(t.shop.results, { n: result.total })}</p>
              <Link href="/quiz" className="inline-flex items-center gap-2 text-sm font-semibold text-cocoa hover:text-flame">
                Need help choosing? <ArrowRight className="size-4" />
              </Link>
            </div>

            {result.items.length === 0 ? (
              <div className="rounded-[28px] border border-dashed border-sand bg-white p-14 text-center">
                <p className="display text-2xl text-cocoa">No match yet</p>
                <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-ink-soft">{t.shop.noResults}</p>
                <Link href="/shop" className="mt-6 inline-flex rounded-full bg-cocoa px-6 py-3 text-sm font-semibold text-cream">Clear filters</Link>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-3 md:gap-x-6 md:gap-y-10">
                {result.items.map((p) => <ProductCard key={p.id} p={p} saved={saved.includes(p.id)} labels={wl} />)}
              </div>
            )}

            {result.pages > 1 && (
              <nav className="mt-14 flex flex-wrap justify-center gap-2" aria-label="Pagination">
                {Array.from({ length: result.pages }, (_, i) => i + 1).map((p) => (
                  <Link key={p} href={pageHref(p)} className={`grid size-11 place-items-center rounded-full text-sm font-semibold transition ${p === result.page ? "bg-cocoa text-cream shadow-sm" : "border border-sand bg-white text-cocoa hover:border-cocoa hover:bg-petal"}`}>{p}</Link>
                ))}
              </nav>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
