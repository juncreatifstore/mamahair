import Link from "next/link";
import { ArrowRight, Headphones, RotateCcw, ShieldCheck, Sparkles, Truck } from "lucide-react";
import { getBestSellers, getNewArrivals, listCategories } from "@/server/products";
import { getWishlistProductIds } from "@/server/wishlist";
import { getHomeBlocks } from "@/lib/home-blocks";
import { getBrand } from "@/lib/settings";
import { getT, getLocale, getCurrency } from "@/i18n/server";
import { ProductCard } from "@/components/storefront/product-card";
import { NewsletterForm } from "@/components/storefront/newsletter-form";
import { Button } from "@/components/ui/button";
import { HAIR_TYPE_LABELS } from "@/lib/utils";
import { TEXTURES, LENGTHS } from "@/lib/catalog";

const MODEL_IMAGES = [
  "https://images.unsplash.com/photo-1645736279976-59f8fd22720c?auto=format&fit=crop&q=88&w=1400",
  "https://images.unsplash.com/photo-1589156191108-c762ff4b96ab?auto=format&fit=crop&q=88&w=1400",
  "https://images.unsplash.com/photo-1527203561188-dae1bc1a417f?auto=format&fit=crop&q=88&w=1400",
  "https://images.unsplash.com/photo-1593351799227-75df2026356b?auto=format&fit=crop&q=88&w=1400",
];

const TEXTURE_IMAGES = [MODEL_IMAGES[1], MODEL_IMAGES[0], MODEL_IMAGES[2], MODEL_IMAGES[3], MODEL_IMAGES[0], MODEL_IMAGES[1], MODEL_IMAGES[2]];

export default async function HomePage() {
  const [t, locale, currency, b] = await Promise.all([getT(), getLocale(), getCurrency(), getBrand()]);
  const [best, fresh, categories, blocks, saved] = await Promise.all([
    getBestSellers(8, currency),
    getNewArrivals(8, currency),
    listCategories(),
    getHomeBlocks(locale),
    getWishlistProductIds(),
  ]);

  const wl = { save: t.product.saveWishlist, saved: t.product.savedWishlist };
  const hero = {
    ...blocks.hero,
    title: blocks.hero.title || t.home.heroTitle,
    subtitle: blocks.hero.subtitle || t.home.heroText,
    ctaLabel: blocks.hero.ctaLabel || t.home.heroCta,
    cta2Label: blocks.hero.cta2Label || t.home.heroCta2,
  };
  const homeCategories = categories.filter((c) => c.showOnHome).slice(0, 4);
  const isFr = locale === "fr";

  const trust = [
    { icon: Truck, title: isFr ? "Livraison rapide" : "Fast shipping", text: isFr ? "Partout dans le monde" : "Worldwide delivery" },
    { icon: RotateCcw, title: isFr ? "Retours faciles" : "Easy returns", text: isFr ? "Sans stress" : "Shop with confidence" },
    { icon: ShieldCheck, title: isFr ? "Paiement sécurisé" : "Secure payment", text: "Visa · Mastercard" },
    { icon: Headphones, title: isFr ? "Support dédié" : "Dedicated support", text: isFr ? "Nous sommes là" : "We're here to help" },
  ];

  return (
    <>
      <section className="overflow-hidden bg-[#f8f1ea]">
        {/* Mobile hero: intentionally separate from desktop */}
        <div className="md:hidden">
          <div className="relative h-[360px] overflow-hidden bg-[#d8aa89]">
            <div className="absolute inset-0 bg-cover bg-[center_18%]" style={{ backgroundImage: `url(${MODEL_IMAGES[0]})` }} />
            <div className="absolute inset-0 bg-gradient-to-t from-cocoa/35 via-transparent to-transparent" />
            <div className="absolute bottom-4 left-4 rounded-full bg-white/88 px-3 py-1.5 text-[9px] font-bold uppercase tracking-[.16em] text-cocoa shadow-sm backdrop-blur">
              {isFr ? "Cheveux humains premium" : "Premium human hair"}
            </div>
          </div>

          <div className="px-4 py-7">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-flame">{isFr ? "Cheveux 100% naturels" : "100% human hair"}</p>
            <h1 className="mt-3 max-w-[11ch] text-[2.7rem] leading-[.98] text-cocoa">{hero.title}</h1>
            <p className="mt-4 max-w-md text-sm leading-6 text-ink-soft">{hero.subtitle}</p>
            <div className="mt-6 grid gap-2.5">
              <Button href={hero.ctaHref} size="lg" className="w-full justify-center shadow-[0_10px_24px_rgba(216,90,48,.18)]">{hero.ctaLabel}</Button>
              <Button href={hero.cta2Href} size="lg" variant="ghost" className="w-full justify-center border-cocoa/25 bg-white/45 text-cocoa">{hero.cta2Label}</Button>
            </div>
            <div className="mt-5 flex flex-wrap gap-x-4 gap-y-2 text-[11px] font-medium text-cocoa/75">
              <span className="inline-flex items-center gap-1.5"><Sparkles className="size-3.5 text-flame" />{isFr ? "Naturels" : "Natural"}</span>
              <span className="inline-flex items-center gap-1.5"><ShieldCheck className="size-3.5 text-flame" />{isFr ? "Premium" : "Premium"}</span>
              <span className="inline-flex items-center gap-1.5"><ShieldCheck className="size-3.5 text-flame" />{isFr ? "Sécurisé" : "Secure"}</span>
            </div>
          </div>
        </div>

        {/* Desktop / tablet hero */}
        <div className="mx-auto hidden min-h-[620px] max-w-[1500px] items-stretch md:grid md:grid-cols-[0.9fr_1.1fr] lg:grid-cols-[0.82fr_1.18fr]">
          <div className="relative z-10 flex items-center px-10 py-14 lg:px-14 xl:px-20">
            <div className="max-w-xl">
              <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-flame">{isFr ? "Cheveux 100% naturels" : "100% human hair · premium quality"}</p>
              <h1 className="mt-5 text-6xl leading-[0.98] text-cocoa xl:text-[5.25rem]">{hero.title}</h1>
              <p className="mt-6 max-w-lg text-base leading-7 text-ink-soft">{hero.subtitle}</p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Button href={hero.ctaHref} size="lg" className="min-w-44 shadow-[0_12px_28px_rgba(216,90,48,.2)]">{hero.ctaLabel}</Button>
                <Button href={hero.cta2Href} size="lg" variant="ghost" className="border-cocoa/30 bg-white/35 text-cocoa">{hero.cta2Label}</Button>
              </div>
              <div className="mt-9 flex flex-wrap gap-x-6 gap-y-3 text-xs font-medium text-cocoa/80">
                <span className="inline-flex items-center gap-2"><Sparkles className="size-4 text-flame" />{isFr ? "Cheveux naturels" : "Natural hair"}</span>
                <span className="inline-flex items-center gap-2"><ShieldCheck className="size-4 text-flame" />{isFr ? "Qualité premium" : "Premium quality"}</span>
                <span className="inline-flex items-center gap-2"><ShieldCheck className="size-4 text-flame" />{isFr ? "Paiement sécurisé" : "Secure checkout"}</span>
              </div>
            </div>
          </div>

          <div className="relative min-h-[620px] overflow-hidden">
            <div className="absolute inset-0 z-10 bg-gradient-to-r from-[#f8f1ea] via-transparent to-transparent" />
            <div className="absolute inset-0 grid grid-cols-3 gap-1 bg-[#d8aa89]">
              {MODEL_IMAGES.slice(0, 3).map((url, i) => (
                <div key={url} className={`bg-cover bg-center ${i === 0 ? "translate-y-8" : i === 2 ? "translate-y-12" : ""}`} style={{ backgroundImage: `url(${url})` }} />
              ))}
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-cocoa/20 via-transparent to-transparent" />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-3 py-3 sm:px-6 sm:py-0 lg:-mt-8 lg:relative lg:z-20">
        <div className="grid grid-cols-2 overflow-hidden rounded-2xl border border-sand bg-white shadow-[0_12px_32px_rgba(74,27,12,.07)] lg:grid-cols-4 lg:rounded-[1.4rem]">
          {trust.map(({ icon: Icon, title, text }, i) => (
            <div key={title} className={`flex items-center gap-2.5 px-3 py-3.5 lg:gap-3 lg:px-5 lg:py-5 ${i < 2 ? "border-b border-sand/70" : ""} ${i % 2 === 0 ? "border-r border-sand/70" : ""} lg:border-b-0 lg:border-r lg:last:border-r-0`}>
              <span className="grid size-8 shrink-0 place-items-center rounded-full bg-petal text-cocoa lg:size-10"><Icon className="size-4 lg:size-5" strokeWidth={1.6} /></span>
              <div className="min-w-0"><p className="truncate text-[9px] font-bold uppercase tracking-[.06em] text-cocoa sm:text-[10px] lg:text-xs">{title}</p><p className="mt-0.5 truncate text-[9px] text-ink-soft sm:text-[10px] lg:mt-1 lg:text-xs">{text}</p></div>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-9 sm:px-6 sm:py-12 md:py-14">
        <div className="mb-5 flex items-end justify-between gap-4 sm:mb-7">
          <div><p className="text-[9px] font-bold uppercase tracking-[.18em] text-flame sm:text-[10px]">{isFr ? "Nos essentiels" : "Shop the edit"}</p><h2 className="mt-1.5 text-2xl text-cocoa sm:mt-2 sm:text-4xl">{t.home.categories}</h2></div>
          <Link href="/shop" className="hidden items-center gap-2 text-xs font-bold uppercase tracking-[.08em] text-cocoa hover:text-flame sm:inline-flex">{t.home.viewAll}<ArrowRight className="size-3.5" /></Link>
        </div>
        <div className="grid grid-cols-2 gap-2.5 sm:gap-3 lg:grid-cols-4">
          {homeCategories.map((c, i) => (
            <Link key={c.id} href={`/shop/${c.slug}`} className="group relative h-[210px] overflow-hidden rounded-2xl bg-cocoa sm:h-[390px] sm:rounded-[1.35rem]">
              <div className="absolute inset-0 bg-cover bg-center transition duration-700 group-hover:scale-105" style={{ backgroundImage: `url(${MODEL_IMAGES[i % MODEL_IMAGES.length]})` }} />
              <div className="absolute inset-0 bg-gradient-to-t from-cocoa/80 via-cocoa/10 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-3.5 text-cream sm:p-5">
                <h3 className="text-lg leading-tight sm:text-3xl">{c.name}</h3>
                <span className="mt-2 inline-flex items-center gap-1.5 text-[8px] font-bold uppercase tracking-[.1em] sm:mt-3 sm:text-[10px]">{isFr ? "Voir plus" : "Shop now"}<ArrowRight className="size-2.5 sm:size-3" /></span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="border-y border-sand/60 bg-white/65">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-8 sm:px-6 sm:py-10 lg:grid-cols-[1.1fr_.9fr] lg:gap-12">
          <div className="min-w-0">
            <p className="text-[9px] font-bold uppercase tracking-[.18em] text-flame sm:text-[10px]">{isFr ? "Choisissez votre longueur" : "Choose your length"}</p>
            <h2 className="mt-1.5 text-2xl text-cocoa sm:mt-2 sm:text-3xl">{t.home.byLength}</h2>
            <div className="no-scrollbar -mx-4 mt-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0">
              {LENGTHS.map((l) => <Link key={l} href={`/shop?length=${l}`} className="shrink-0 rounded-full border border-sand bg-cream px-3.5 py-2 text-center text-xs font-semibold text-cocoa transition hover:border-cocoa hover:bg-cocoa hover:text-cream sm:min-w-[58px] sm:px-4 sm:py-2.5 sm:text-sm">{l}&quot;</Link>)}
            </div>
          </div>

          <div className="lg:border-l lg:border-sand lg:pl-10">
            <p className="text-[9px] font-bold uppercase tracking-[.18em] text-flame sm:text-[10px]">{isFr ? "Pour votre texture" : "Made for your texture"}</p>
            <h2 className="mt-1.5 text-2xl text-cocoa sm:mt-2 sm:text-3xl">{t.home.byHairType}</h2>
            <div className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-6 lg:grid-cols-3 xl:grid-cols-6">
              {Object.entries(HAIR_TYPE_LABELS).map(([k, label], i) => (
                <Link key={k} href={`/shop?hairType=${k}`} className="group text-center">
                  <span className="mx-auto block size-14 rounded-full border-2 border-white bg-cover bg-center shadow-sm ring-1 ring-sand transition group-hover:scale-105 group-hover:ring-cocoa sm:size-16" style={{ backgroundImage: `url(${MODEL_IMAGES[i % MODEL_IMAGES.length]})` }} />
                  <span className="mt-1.5 block text-[11px] font-semibold text-cocoa sm:mt-2 sm:text-xs">{label}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-9 sm:px-6 sm:py-12 md:py-14">
        <div className="mb-5 flex items-end justify-between gap-3 sm:mb-7"><div><p className="text-[9px] font-bold uppercase tracking-[.18em] text-flame sm:text-[10px]">{isFr ? "Les plus aimés" : "Most loved"}</p><h2 className="mt-1.5 text-2xl text-cocoa sm:mt-2 sm:text-4xl">{t.home.bestSellers}</h2></div><Link href="/shop?bestSeller=1" className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[.06em] text-cocoa hover:text-flame sm:text-xs">{t.home.viewAll}<ArrowRight className="size-3" /></Link></div>
        {best.length > 0 ? <Grid>{best.slice(0, 8).map((p) => <ProductCard key={p.id} p={p} saved={saved.includes(p.id)} labels={wl} />)}</Grid> : <div className="rounded-3xl border border-dashed border-sand p-8 text-center text-sm text-ink-soft">Add products in Admin to populate this section.</div>}
      </section>

      <section className="bg-[#f4e2d5]">
        <div className="mx-auto grid max-w-[1500px] items-center lg:grid-cols-2">
          <div className="h-[280px] bg-cover bg-[center_18%] sm:h-[420px] lg:h-auto lg:min-h-[560px]" style={{ backgroundImage: `url(${MODEL_IMAGES[0]})` }} />
          <div className="px-5 py-8 sm:px-12 sm:py-12 lg:px-16 lg:py-14 xl:px-20">
            <p className="text-[9px] font-bold uppercase tracking-[.18em] text-flame sm:text-[10px]">The MAMAHAIR promise</p>
            <h2 className="mt-3 max-w-md text-3xl text-cocoa sm:mt-4 sm:text-5xl">{isFr ? "Des cheveux sublimes. Une confiance totale." : "Healthy hair. Happy you."}</h2>
            <div className="mt-5 space-y-2.5 text-xs text-cocoa/80 sm:mt-7 sm:space-y-3 sm:text-sm">
              {[isFr ? "Cheveux humains premium" : "Premium 100% human hair", isFr ? "Finition naturelle et élégante" : "Natural, polished finish", isFr ? "Sélectionnés pour durer" : "Selected to last", isFr ? "Beauté sans compromis" : "Beauty without compromise"].map((x) => <p key={x} className="flex items-center gap-2.5"><span className="text-flame">✓</span>{x}</p>)}
            </div>
            <Link href="/pages/about" className="mt-6 inline-flex items-center gap-2 rounded-full bg-flame px-5 py-2.5 text-[10px] font-bold uppercase tracking-[.06em] text-white sm:mt-8 sm:px-6 sm:py-3 sm:text-xs">{isFr ? "En savoir plus" : "Learn more"}<ArrowRight className="size-3.5" /></Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-9 sm:px-6 sm:py-12 md:py-14">
        <div className="mb-5 sm:mb-7"><p className="text-[9px] font-bold uppercase tracking-[.18em] text-flame sm:text-[10px]">{isFr ? "Trouvez votre style" : "Find your texture"}</p><h2 className="mt-1.5 text-2xl text-cocoa sm:mt-2 sm:text-4xl">{t.home.byTexture}</h2></div>
        <div className="no-scrollbar -mx-4 flex gap-2.5 overflow-x-auto px-4 pb-2 sm:mx-0 sm:gap-3 sm:px-0 sm:pb-3">
          {TEXTURES.slice(0, 7).map((tx, i) => (
            <Link key={tx} href={`/shop?texture=${encodeURIComponent(tx)}`} className="group relative h-[185px] min-w-[135px] overflow-hidden rounded-2xl bg-cocoa sm:h-[260px] sm:min-w-[190px] sm:rounded-[1.25rem]">
              <div className="absolute inset-0 bg-cover bg-center transition duration-500 group-hover:scale-105" style={{ backgroundImage: `url(${TEXTURE_IMAGES[i % TEXTURE_IMAGES.length]})` }} />
              <div className="absolute inset-0 bg-gradient-to-t from-cocoa/75 via-transparent to-transparent" />
              <span className="absolute inset-x-0 bottom-0 p-3 text-center text-[9px] font-bold uppercase tracking-[.1em] text-cream sm:p-4 sm:text-xs">{tx}</span>
            </Link>
          ))}
        </div>
      </section>

      {fresh.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 pb-9 sm:px-6 sm:pb-12 md:pb-14">
          <div className="mb-5 flex items-end justify-between gap-3 sm:mb-7"><div><p className="text-[9px] font-bold uppercase tracking-[.18em] text-flame sm:text-[10px]">{isFr ? "Nouveautés" : "Just landed"}</p><h2 className="mt-1.5 text-2xl text-cocoa sm:mt-2 sm:text-4xl">{t.home.newArrivals}</h2></div><Link href="/shop?isNew=1" className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[.06em] text-cocoa hover:text-flame sm:text-xs">{t.home.viewAll}<ArrowRight className="size-3" /></Link></div>
          <Grid>{fresh.slice(0, 8).map((p) => <ProductCard key={p.id} p={p} saved={saved.includes(p.id)} labels={wl} />)}</Grid>
        </section>
      )}

      <section className="mx-auto max-w-7xl px-4 pb-12 sm:px-6 sm:pb-20">
        <div className="rounded-3xl bg-cocoa px-5 py-8 text-center text-cream sm:rounded-[2rem] sm:px-10 sm:py-12 md:py-16">
          <p className="text-[9px] font-bold uppercase tracking-[.18em] text-peach sm:text-[10px]">MAMAHAIR private list</p>
          <h2 className="mt-2 text-2xl sm:mt-3 sm:text-4xl">{t.home.newsletter}</h2>
          <p className="mx-auto mt-2.5 max-w-lg text-xs leading-5 text-cream/70 sm:mt-3 sm:text-sm sm:leading-6">{t.home.newsletterText}</p>
          <div className="mx-auto mt-5 max-w-md sm:mt-6"><NewsletterForm cta={t.home.newsletterCta} done={t.home.newsletterDone} dark /></div>
        </div>
      </section>
    </>
  );
}

function Grid({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-2 gap-x-2.5 gap-y-6 sm:gap-5 md:grid-cols-4 md:gap-6">{children}</div>;
}
