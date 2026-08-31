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

export async function ShopLayout({ title, description, result, categories, basePath, query }: {
  title: string; description?: string | null; result: Awaited<ReturnType<typeof listProducts>>; categories: Awaited<ReturnType<typeof listCategories>>; basePath: string; query: Record<string, string | undefined>;
}) {
  const [t, currency, saved, colorRows] = await Promise.all([getT(), getCurrency(), getWishlistProductIds(), db.product.findMany({ where: { status: "ACTIVE" }, select: { colors: true }, take: 500 })]);
  const colors = [...new Set(colorRows.flatMap((r) => r.colors))].slice(0, 20);
  const wl = { save: t.product.saveWishlist, saved: t.product.savedWishlist };
  const pageHref = (p: number) => { const s = new URLSearchParams(Object.entries(query).filter(([, v]) => v) as [string, string][]); s.set("page", String(p)); return `${basePath}?${s}`; };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <h1 className="text-4xl text-cocoa sm:text-5xl">{title}</h1>
      {description && <p className="mt-3 max-w-lg text-ink-soft">{description}</p>}
      <div className="mt-8 grid gap-8 lg:grid-cols-[260px_1fr]">
        <aside><Suspense><Filters categories={categories} colors={colors} t={t.shop} currencySymbol={CURRENCIES[currency]?.symbol ?? currency} /></Suspense></aside>
        <div>
          <p className="mb-4 text-sm text-ink-soft">{fmt(t.shop.results, { n: result.total })}</p>
          {result.items.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-sand p-12 text-center text-ink-soft">{t.shop.noResults}</div>
          ) : (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-6">{result.items.map((p) => <ProductCard key={p.id} p={p} saved={saved.includes(p.id)} labels={wl} />)}</div>
          )}
          {result.pages > 1 && (
            <nav className="mt-10 flex justify-center gap-2">
              {Array.from({ length: result.pages }, (_, i) => i + 1).map((p) => <Link key={p} href={pageHref(p)} className={`grid size-10 place-items-center rounded-pill text-sm ${p === result.page ? "bg-cocoa text-cream" : "border border-sand bg-white"}`}>{p}</Link>)}
            </nav>
          )}
        </div>
      </div>
    </div>
  );
}
