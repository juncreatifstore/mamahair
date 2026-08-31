import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getProductBySlug, getRelatedProducts } from "@/server/products";
import { getWishlistProductIds } from "@/server/wishlist";
import { getCurrentUser } from "@/lib/auth";
import { getT } from "@/i18n/server";
import { AddToCart } from "@/components/storefront/add-to-cart";
import { ProductGallery } from "@/components/storefront/product-gallery";
import { ProductCard } from "@/components/storefront/product-card";
import { WishlistButton } from "@/components/storefront/wishlist-button";
import { ReviewForm } from "@/components/storefront/review-form";
import { Badge } from "@/components/ui/badge";
import { CONCERN_LABELS, HAIR_TYPE_LABELS } from "@/lib/utils";
import { formatCents } from "@/lib/money";

const FALLBACK_SITE = "https://mamahair.vercel.app";
function siteUrl() {
  const raw = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (!raw) return FALLBACK_SITE;
  try { return new URL(raw).origin; } catch { return FALLBACK_SITE; }
}
const SITE = siteUrl();

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const p = await getProductBySlug(slug);
  if (!p) notFound();
  const [t, user, saved, related] = await Promise.all([getT(), getCurrentUser(), getWishlistProductIds(), getRelatedProducts(p)]);
  const tp = t.product;
  const inStock = p.variants.some((v) => (v.inventory?.quantity ?? 0) - (v.inventory?.reserved ?? 0) > 0);

  const specs: [string, string | null | undefined][] = [
    [tp.material, p.hairMaterial], [tp.origin, p.hairOrigin], [tp.grade, p.hairGrade], [tp.wigType, p.wigType], [tp.capSize, p.capSize],
    [tp.texture, p.textures.join(", ")], [tp.length, p.lengths.length ? `${p.lengths.map((l) => `${l}\"`).join(", ")}` : null], [tp.density, p.densities.join(", ")], [tp.lace, p.laceTypes.join(", ")], [tp.color, p.colors.join(", ")],
    [tp.bundles, p.bundlesCount ? String(p.bundlesCount) : null], ["Closure", p.closureType], ["Parting", p.parting],
    ...Object.entries((p.attributes as Record<string, string> | null) ?? {}),
  ];
  const features = [[tp.canBleach, p.canBleach], [tp.canDye, p.canDye], [tp.heatSafe, p.heatSafe], [tp.prePlucked, p.prePlucked], [tp.babyHair, p.babyHair], [tp.glueless, p.glueless], [tp.adjustableStrap, p.adjustableStrap]].filter(([, v]) => v === true).map(([l]) => l as string);

  const jsonLd = [
    {
      "@context": "https://schema.org", "@type": "Product", name: p.name, description: p.shortDesc ?? undefined, sku: p.sku ?? p.variants[0]?.sku, image: p.images.map((i) => i.url), brand: p.brand ? { "@type": "Brand", name: p.brand } : undefined,
      offers: { "@type": "AggregateOffer", priceCurrency: p.currency, lowPrice: (Math.min(...p.variants.map((v) => v.priceCents)) / 100).toFixed(2), highPrice: (Math.max(...p.variants.map((v) => v.priceCents)) / 100).toFixed(2), offerCount: p.variants.length, availability: inStock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock", url: `${SITE}/products/${p.slug}` },
      ...(p.ratingCount > 0 ? { aggregateRating: { "@type": "AggregateRating", ratingValue: p.ratingAvg?.toFixed(1), reviewCount: p.ratingCount } } : {}),
    },
    { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [{ "@type": "ListItem", position: 1, name: "Shop", item: `${SITE}/shop` }, ...(p.category ? [{ "@type": "ListItem", position: 2, name: p.category.name, item: `${SITE}/shop/${p.category.slug}` }] : []), { "@type": "ListItem", position: p.category ? 3 : 2, name: p.name, item: `${SITE}/products/${p.slug}` }] },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <nav className="text-sm text-ink-soft"><Link href="/shop" className="hover:text-ink">{t.nav.shop}</Link>{p.category && <> / <Link href={`/shop/${p.category.slug}`} className="hover:text-ink">{p.category.name}</Link></>}</nav>

      <div className="mt-5 grid gap-10 md:grid-cols-2">
        <ProductGallery images={p.images} name={p.name} />
        <div>
          <div className="flex flex-wrap gap-2">{p.isNew && <Badge tone="honey">New</Badge>}{p.isBestSeller && <Badge tone="cocoa">Best seller</Badge>}{p.category && <Badge>{p.category.name}</Badge>}</div>
          <h1 className="mt-3 text-4xl text-cocoa">{p.name}</h1>
          {p.shortDesc && <p className="mt-3 text-lg text-ink-soft">{p.shortDesc}</p>}
          {p.ratingCount > 0 && <p className="mt-2 text-sm"><span className="text-flame">{"★".repeat(Math.round(p.ratingAvg ?? 0))}</span> <span className="text-ink-soft">{p.ratingAvg?.toFixed(1)} · {p.ratingCount} {tp.reviews.toLowerCase()}</span></p>}

          <div className="mt-6"><AddToCart variants={p.variants} currency={p.currency} labels={{ add: tp.addToCart, added: tp.added, out: tp.outOfStock, choose: tp.chooseOptions, onlyLeft: tp.onlyLeft }} /></div>
          <div className="mt-3"><WishlistButton productId={p.id} saved={saved.includes(p.id)} labels={{ save: tp.saveWishlist, saved: tp.savedWishlist }} /></div>

          {features.length > 0 && <div className="mt-6 flex flex-wrap gap-2">{features.map((f) => <Badge key={f} tone="green">✓ {f}</Badge>)}</div>}
          {(p.hairTypes.length > 0 || p.concerns.length > 0) && <div className="mt-5"><p className="mb-2 text-sm font-semibold">{tp.hairTypes}</p><div className="flex flex-wrap gap-2">{p.hairTypes.map((h) => <Badge key={h} tone="honey">{HAIR_TYPE_LABELS[h]}</Badge>)}{p.concerns.map((c) => <Badge key={c}>{CONCERN_LABELS[c] ?? c}</Badge>)}</div></div>}

          {p.isBundle && p.bundleItems.length > 0 && (
            <div className="mt-8 rounded-2xl bg-petal p-5">
              <p className="font-semibold">{tp.includes}</p>
              <ul className="mt-3 space-y-2 text-sm">{p.bundleItems.map((bi) => <li key={bi.id} className="flex items-center gap-3"><div className="relative size-10 overflow-hidden rounded-lg bg-white">{bi.variant.product.images[0] && <Image src={bi.variant.product.images[0].url} alt="" fill sizes="40px" className="object-cover" />}</div><Link href={`/products/${bi.variant.product.slug}`} className="hover:text-flame">{bi.variant.product.name} · {bi.variant.name}</Link><span className="ml-auto text-ink-soft">× {bi.quantity}</span></li>)}</ul>
              {p.bundlePriceCents && <p className="mt-3 text-sm text-ink-soft">Set price {formatCents(p.bundlePriceCents, p.currency)} vs {formatCents(p.bundleItems.reduce((s, bi) => s + bi.variant.priceCents * bi.quantity, 0), p.currency)} separately</p>}
            </div>
          )}

          {p.description && <div className="mt-8 whitespace-pre-line text-[15px] leading-relaxed">{p.description}</div>}

          <div className="mt-8 divide-y divide-sand border-y border-sand">
            {specs.some(([, v]) => v) && (
              <details className="py-4" open><summary className="cursor-pointer list-none font-semibold">{tp.details}</summary>
                <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-6 gap-y-1.5 text-sm">{specs.filter(([, v]) => v).map(([k, v]) => <div key={k} className="contents"><dt className="text-ink-soft">{k}</dt><dd>{v}</dd></div>)}</dl>
              </details>
            )}
            {p.howToUse && <details className="py-4"><summary className="cursor-pointer list-none font-semibold">{tp.howToUse}</summary><p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-ink-soft">{p.howToUse}</p></details>}
            {p.ingredients && <details className="py-4"><summary className="cursor-pointer list-none font-semibold">{tp.ingredients}</summary><p className="mt-2 text-sm leading-relaxed text-ink-soft">{p.ingredients}</p></details>}
          </div>
        </div>
      </div>

      <section className="mt-16 grid gap-8 md:grid-cols-[1fr_380px]">
        <div>
          <h2 className="text-3xl text-cocoa">{tp.reviews}{p.ratingCount > 0 && <span className="ml-3 text-lg text-ink-soft">{p.ratingAvg?.toFixed(1)} / 5</span>}</h2>
          {p.reviews.length === 0 ? <p className="mt-4 text-sm text-ink-soft">No reviews yet. Be the first.</p> : (
            <div className="mt-6 divide-y divide-sand">
              {p.reviews.map((r) => (
                <div key={r.id} className="py-5">
                  <p className="text-sm"><span className="text-flame">{"★".repeat(r.rating)}</span><span className="text-sand">{"★".repeat(5 - r.rating)}</span> <span className="ml-2 font-medium">{r.user.firstName ?? "Customer"}</span>{r.isVerifiedPurchase && <Badge tone="green" className="ml-2">{tp.verified}</Badge>}</p>
                  {r.title && <p className="mt-1 font-medium">{r.title}</p>}
                  {r.body && <p className="mt-1 text-sm text-ink-soft">{r.body}</p>}
                  {r.photoUrls.length > 0 && <div className="mt-2 flex gap-2">{r.photoUrls.map((u) => <div key={u} className="relative size-16 overflow-hidden rounded-lg bg-petal"><Image src={u} alt="" fill sizes="64px" className="object-cover" /></div>)}</div>}
                </div>
              ))}
            </div>
          )}
        </div>
        <ReviewForm productId={p.id} title={tp.writeReview} loggedIn={!!user} />
      </section>

      {related.length > 0 && (
        <section className="mt-16"><h2 className="text-3xl text-cocoa">{tp.youMightLike}</h2><div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">{related.map((r) => <ProductCard key={r.id} p={r} saved={saved.includes(r.id)} labels={{ save: tp.saveWishlist, saved: tp.savedWishlist }} />)}</div></section>
      )}
    </div>
  );
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  try {
    const p = await getProductBySlug(slug);
    if (!p) return { title: "Product", robots: { index: false, follow: false } };

    const title = p.seoTitle || p.name;
    const description = p.seoDescription || p.shortDesc || p.description?.slice(0, 160) || undefined;
    const image = p.images[0]?.url;
    const canonical = `/products/${p.slug}`;

    return {
      title,
      description,
      alternates: { canonical },
      openGraph: {
        type: "website",
        url: canonical,
        title,
        description,
        images: image ? [{ url: image, alt: p.name }] : undefined,
      },
      twitter: {
        card: image ? "summary_large_image" : "summary",
        title,
        description,
        images: image ? [image] : undefined,
      },
    };
  } catch (error) {
    console.error("Product metadata failed", { slug, error });
    return {
      title: "Product",
      alternates: { canonical: `/products/${slug}` },
    };
  }
}
