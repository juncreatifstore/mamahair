import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { Check, ChevronRight, ShieldCheck, Sparkles, Truck } from "lucide-react";
import { getProductBySlug, getRelatedProducts } from "@/server/products";
import { getWishlistProductIds } from "@/server/wishlist";
import { getCurrentUser } from "@/lib/auth";
import { getT } from "@/i18n/server";
import { AddToCart } from "@/components/storefront/add-to-cart";
import { ProductGallery } from "@/components/storefront/product-gallery";
import { VariantImageProvider } from "@/components/storefront/variant-image-context";
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
  const customerPhotos = p.reviews.flatMap((review) => review.photoUrls.map((url) => ({ url, reviewId: review.id, verified: review.isVerifiedPurchase, name: review.user.firstName ?? "Customer" }))).slice(0, 12);

  const variantPrices = p.variants.map((v) => v.priceCents);
  const jsonLd = [
    {
      "@context": "https://schema.org", "@type": "Product", name: p.name, description: p.shortDesc ?? undefined, sku: p.sku ?? p.variants[0]?.sku, image: p.images.map((i) => i.url), brand: p.brand ? { "@type": "Brand", name: p.brand } : undefined,
      ...(variantPrices.length ? { offers: { "@type": "AggregateOffer", priceCurrency: p.currency, lowPrice: (Math.min(...variantPrices) / 100).toFixed(2), highPrice: (Math.max(...variantPrices) / 100).toFixed(2), offerCount: p.variants.length, availability: inStock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock", url: `${SITE}/products/${p.slug}` } } : {}),
      ...(p.ratingCount > 0 ? { aggregateRating: { "@type": "AggregateRating", ratingValue: p.ratingAvg?.toFixed(1), reviewCount: p.ratingCount } } : {}),
    },
    { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [{ "@type": "ListItem", position: 1, name: "Shop", item: `${SITE}/shop` }, ...(p.category ? [{ "@type": "ListItem", position: 2, name: p.category.name, item: `${SITE}/shop/${p.category.slug}` }] : []), { "@type": "ListItem", position: p.category ? 3 : 2, name: p.name, item: `${SITE}/products/${p.slug}` }] },
  ];

  return (
    <div className="pb-20">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replaceAll("<", "\\u003c") }} />

      <div className="border-b border-sand/70 bg-white/55">
        <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6">
          <nav className="flex items-center gap-1.5 overflow-hidden text-[11px] font-medium text-ink-soft sm:text-xs">
            <Link href="/shop" className="shrink-0 transition hover:text-cocoa">{t.nav.shop}</Link>
            <ChevronRight className="size-3 shrink-0 opacity-50" />
            {p.category && <><Link href={`/shop/${p.category.slug}`} className="shrink-0 transition hover:text-cocoa">{p.category.name}</Link><ChevronRight className="size-3 shrink-0 opacity-50" /></>}
            <span className="truncate text-cocoa">{p.name}</span>
          </nav>
        </div>
      </div>

      <VariantImageProvider>
        <section className="mx-auto grid max-w-7xl gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[1.08fr_.92fr] lg:gap-14 lg:py-12">
          <div className="min-w-0">
            <ProductGallery images={p.images} name={p.name} />
          </div>

          <div className="lg:sticky lg:top-28 lg:self-start">
            <div className="rounded-[2rem] border border-sand/80 bg-white p-5 shadow-[0_20px_60px_rgba(74,27,12,0.06)] sm:p-7">
              <div className="flex flex-wrap items-center gap-2">
                {p.isNew && <Badge tone="honey">New</Badge>}
                {p.isBestSeller && <Badge tone="cocoa">Best seller</Badge>}
                {p.category && <Badge>{p.category.name}</Badge>}
                <span className={`ml-auto inline-flex items-center gap-1.5 text-xs font-semibold ${inStock ? "text-green-700" : "text-red-700"}`}>
                  <span className={`size-1.5 rounded-full ${inStock ? "bg-green-600" : "bg-red-600"}`} />{inStock ? "In stock" : tp.outOfStock}
                </span>
              </div>

              <h1 className="mt-5 text-[2.4rem] leading-[1.02] text-cocoa sm:text-5xl">{p.name}</h1>
              {p.shortDesc && <p className="mt-4 max-w-xl text-[15px] leading-7 text-ink-soft">{p.shortDesc}</p>}

              {p.ratingCount > 0 && (
                <a href="#reviews" className="mt-4 inline-flex items-center gap-2 rounded-full bg-cream px-3.5 py-2 text-sm transition hover:bg-petal">
                  <span className="tracking-[0.08em] text-flame">{"★".repeat(Math.round(p.ratingAvg ?? 0))}</span>
                  <span className="font-semibold text-cocoa">{p.ratingAvg?.toFixed(1)}</span>
                  <span className="text-ink-soft">({p.ratingCount} {tp.reviews.toLowerCase()})</span>
                </a>
              )}

              <div className="mt-6 border-y border-sand/80 py-6">
                <AddToCart variants={p.variants} currency={p.currency} labels={{ add: tp.addToCart, added: tp.added, out: tp.outOfStock, choose: tp.chooseOptions, onlyLeft: tp.onlyLeft }} />
                <div className="mt-3"><WishlistButton productId={p.id} saved={saved.includes(p.id)} labels={{ save: tp.saveWishlist, saved: tp.savedWishlist }} /></div>
              </div>

              <div className="mt-5 grid gap-2.5 sm:grid-cols-3">
                <TrustPill icon={Sparkles} title="Premium quality" text="Carefully selected" />
                <TrustPill icon={ShieldCheck} title="Secure checkout" text="Protected payment" />
                <TrustPill icon={Truck} title="Shipping ready" text="Tracked delivery" />
              </div>

              {features.length > 0 && (
                <div className="mt-6 flex flex-wrap gap-2">
                  {features.map((f) => <span key={f} className="inline-flex items-center gap-1.5 rounded-full bg-petal px-3 py-2 text-xs font-medium text-cocoa"><Check className="size-3.5 text-flame" />{f}</span>)}
                </div>
              )}

              {(p.hairTypes.length > 0 || p.concerns.length > 0) && (
                <div className="mt-6 rounded-2xl bg-cream p-4">
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-flame">{tp.hairTypes}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {p.hairTypes.map((h) => <span key={h} className="rounded-full border border-sand bg-white px-3 py-1.5 text-xs font-semibold text-cocoa">{HAIR_TYPE_LABELS[h]}</span>)}
                    {p.concerns.map((c) => <span key={c} className="rounded-full border border-sand bg-white px-3 py-1.5 text-xs text-ink-soft">{CONCERN_LABELS[c] ?? c}</span>)}
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>
      </VariantImageProvider>

      <section className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="grid gap-6 lg:grid-cols-[1.2fr_.8fr]">
          <div className="space-y-6">
            {p.description && (
              <div className="rounded-[1.75rem] border border-sand/70 bg-white p-6 sm:p-8">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-flame">The details</p>
                <h2 className="mt-2 text-3xl text-cocoa">About this hair</h2>
                <div className="mt-5 whitespace-pre-line text-[15px] leading-8 text-ink-soft">{p.description}</div>
              </div>
            )}

            <div className="overflow-hidden rounded-[1.75rem] border border-sand/70 bg-white">
              {specs.some(([, v]) => v) && (
                <details className="group border-b border-sand/70 p-5 sm:p-6" open>
                  <summary className="flex cursor-pointer list-none items-center justify-between font-semibold text-cocoa"><span>{tp.details}</span><span className="text-xl font-light text-ink-soft transition group-open:rotate-45">+</span></summary>
                  <dl className="mt-5 grid gap-3 sm:grid-cols-2">{specs.filter(([, v]) => v).map(([k, v]) => <div key={k} className="rounded-xl bg-cream px-4 py-3"><dt className="text-[10px] font-bold uppercase tracking-[0.12em] text-ink-soft">{k}</dt><dd className="mt-1 text-sm font-medium text-cocoa">{v}</dd></div>)}</dl>
                </details>
              )}
              {p.howToUse && <details className="group border-b border-sand/70 p-5 sm:p-6"><summary className="flex cursor-pointer list-none items-center justify-between font-semibold text-cocoa"><span>{tp.howToUse}</span><span className="text-xl font-light text-ink-soft transition group-open:rotate-45">+</span></summary><p className="mt-4 whitespace-pre-line text-sm leading-7 text-ink-soft">{p.howToUse}</p></details>}
              {p.ingredients && <details className="group p-5 sm:p-6"><summary className="flex cursor-pointer list-none items-center justify-between font-semibold text-cocoa"><span>{tp.ingredients}</span><span className="text-xl font-light text-ink-soft transition group-open:rotate-45">+</span></summary><p className="mt-4 text-sm leading-7 text-ink-soft">{p.ingredients}</p></details>}
            </div>
          </div>

          <div className="space-y-6">
            {p.isBundle && p.bundleItems.length > 0 && (
              <div className="rounded-[1.75rem] bg-cocoa p-6 text-cream sm:p-7">
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-peach">Curated set</p>
                <h2 className="mt-2 text-3xl">{tp.includes}</h2>
                <ul className="mt-5 space-y-3">{p.bundleItems.map((bi) => <li key={bi.id} className="flex items-center gap-3 rounded-2xl border border-cream/10 bg-cream/[0.05] p-3"><div className="relative size-12 shrink-0 overflow-hidden rounded-xl bg-white/10">{bi.variant.product.images[0] && <Image src={bi.variant.product.images[0].url} alt="" fill sizes="48px" className="object-cover" />}</div><Link href={`/products/${bi.variant.product.slug}`} className="min-w-0 flex-1 text-sm font-medium hover:text-peach">{bi.variant.product.name}<span className="block truncate text-xs font-normal text-cream/60">{bi.variant.name}</span></Link><span className="text-sm text-cream/70">× {bi.quantity}</span></li>)}</ul>
                {p.bundlePriceCents && <p className="mt-5 text-sm text-cream/70">Set price <strong className="text-cream">{formatCents(p.bundlePriceCents, p.currency)}</strong> vs {formatCents(p.bundleItems.reduce((s, bi) => s + bi.variant.priceCents * bi.quantity, 0), p.currency)} separately</p>}
              </div>
            )}

            <div className="rounded-[1.75rem] bg-petal p-6 sm:p-7">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-flame">MAMAHAIR care</p>
              <h3 className="mt-2 text-2xl text-cocoa">Made to look beautiful, made to last.</h3>
              <p className="mt-3 text-sm leading-7 text-ink-soft">Choose the variant that fits your look. Product options, stock and pricing are confirmed before checkout.</p>
            </div>
          </div>
        </div>
      </section>

      <section id="reviews" className="mx-auto mt-16 scroll-mt-32 max-w-7xl px-4 sm:px-6 md:mt-20">
        <div className="mb-8 grid gap-4 sm:grid-cols-[1fr_auto] sm:items-end">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-flame">Customer reviews</p>
            <h2 className="mt-2 text-4xl text-cocoa">Real feedback from MAMAHAIR customers</h2>
          </div>
          {p.ratingCount > 0 && (
            <div className="rounded-[1.4rem] border border-sand bg-white px-5 py-4 shadow-[0_10px_25px_rgba(74,27,12,.035)]">
              <div className="flex items-end gap-2"><span className="text-4xl font-bold leading-none text-cocoa">{p.ratingAvg?.toFixed(1)}</span><span className="pb-1 text-sm text-ink-soft">/ 5</span></div>
              <div className="mt-2 text-sm tracking-[.08em] text-flame">{"★".repeat(Math.round(p.ratingAvg ?? 0))}<span className="text-sand">{"★".repeat(5 - Math.round(p.ratingAvg ?? 0))}</span></div>
              <p className="mt-1 text-xs text-ink-soft">Based on {p.ratingCount} approved review{p.ratingCount === 1 ? "" : "s"}</p>
            </div>
          )}
        </div>

        {customerPhotos.length > 0 && (
          <div className="mb-8 rounded-[1.75rem] border border-sand/70 bg-[#fbf8f5] p-4 sm:p-5">
            <div className="flex items-center justify-between gap-3">
              <div><p className="text-[10px] font-bold uppercase tracking-[.16em] text-flame">Customer photos</p><p className="mt-1 text-sm text-ink-soft">Photos attached to approved product reviews.</p></div>
              <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-cocoa">{customerPhotos.length}</span>
            </div>
            <div className="no-scrollbar -mx-1 mt-4 flex gap-2 overflow-x-auto px-1 pb-1 sm:grid sm:grid-cols-6 lg:grid-cols-8">
              {customerPhotos.map((photo, index) => (
                <a key={`${photo.reviewId}-${photo.url}-${index}`} href={`#review-${photo.reviewId}`} className="group relative aspect-square w-28 shrink-0 overflow-hidden rounded-2xl bg-petal ring-1 ring-sand/70 sm:w-auto">
                  <Image src={photo.url} alt={`Customer review photo from ${photo.name}`} fill sizes="(max-width: 640px) 112px, 16vw" className="object-cover transition duration-300 group-hover:scale-105" />
                  {photo.verified && <span className="absolute bottom-2 left-2 rounded-full bg-white/92 px-2 py-1 text-[8px] font-bold uppercase tracking-[.06em] text-green-700 shadow-sm">Verified</span>}
                </a>
              ))}
            </div>
          </div>
        )}

        <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
          <div>
            {p.reviews.length === 0 ? <div className="rounded-[1.75rem] border border-dashed border-sand bg-white p-10 text-center"><p className="display text-2xl text-cocoa">No reviews yet</p><p className="mt-2 text-sm text-ink-soft">Be the first to share your experience.</p></div> : (
              <div className="grid gap-4 sm:grid-cols-2">
                {p.reviews.map((r) => (
                  <article id={`review-${r.id}`} key={r.id} className="scroll-mt-32 rounded-[1.5rem] border border-sand/70 bg-white p-5 shadow-[0_10px_25px_rgba(74,27,12,0.035)] sm:p-6">
                    <div className="flex flex-wrap items-center justify-between gap-3"><span className="text-sm tracking-[0.1em] text-flame">{"★".repeat(r.rating)}<span className="text-sand">{"★".repeat(5 - r.rating)}</span></span>{r.isVerifiedPurchase && <Badge tone="green">{tp.verified}</Badge>}</div>
                    {r.title && <p className="mt-4 text-base font-semibold text-cocoa">{r.title}</p>}
                    {r.body && <p className="mt-2 text-sm leading-7 text-ink-soft">{r.body}</p>}
                    {r.photoUrls.length > 0 && <div className="mt-4 grid grid-cols-3 gap-2">{r.photoUrls.slice(0, 6).map((u) => <div key={u} className="relative aspect-square overflow-hidden rounded-xl bg-petal ring-1 ring-sand/70"><Image src={u} alt="Customer review photo" fill sizes="160px" className="object-cover" /></div>)}</div>}
                    <div className="mt-5 flex items-center justify-between gap-3 border-t border-sand pt-3"><p className="text-xs font-semibold uppercase tracking-[0.08em] text-ink-soft">{r.user.firstName ?? "Customer"}</p><time className="text-[10px] text-ink-soft" dateTime={r.createdAt.toISOString()}>{r.createdAt.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</time></div>
                  </article>
                ))}
              </div>
            )}
          </div>
          <div className="h-fit rounded-[1.75rem] border border-sand/70 bg-white p-5 sm:p-6 lg:sticky lg:top-32"><ReviewForm productId={p.id} title={tp.writeReview} loggedIn={!!user} /></div>
        </div>
      </section>

      {related.length > 0 && (
        <section className="mx-auto mt-16 max-w-7xl px-4 sm:px-6 md:mt-20">
          <div className="mb-7"><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-flame">Complete your look</p><h2 className="mt-2 text-4xl text-cocoa">{tp.youMightLike}</h2></div>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-6">{related.map((r) => <ProductCard key={r.id} p={r} saved={saved.includes(r.id)} labels={{ save: tp.saveWishlist, saved: tp.savedWishlist }} />)}</div>
        </section>
      )}
    </div>
  );
}

function TrustPill({ icon: Icon, title, text }: { icon: typeof Sparkles; title: string; text: string }) {
  return <div className="rounded-2xl bg-cream p-3"><Icon className="size-4 text-flame" strokeWidth={1.7} /><p className="mt-2 text-xs font-semibold text-cocoa">{title}</p><p className="mt-0.5 text-[10px] leading-4 text-ink-soft">{text}</p></div>;
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
      openGraph: { type: "website", url: canonical, title, description, images: image ? [{ url: image, alt: p.name }] : undefined },
      twitter: { card: image ? "summary_large_image" : "summary", title, description, images: image ? [image] : undefined },
    };
  } catch (error) {
    console.error("Product metadata failed", { slug, error });
    return { title: "Product", alternates: { canonical: `/products/${slug}` } };
  }
}
