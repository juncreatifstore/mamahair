import Link from "next/link";
import Image from "next/image";
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
    { icon: RotateCcw, title: isFr ? "Retours faciles" : "Easy returns", text: isFr ? "Une expérience sans stress" : "Shop with confidence" },
    { icon: ShieldCheck, title: isFr ? "Paiement sécurisé" : "Secure payment", text: "Visa · Mastercard · Apple Pay" },
    { icon: Headphones, title: isFr ? "Support dédié" : "Dedicated support", text: isFr ? "Nous sommes là pour vous" : "We're here to help" },
  ];

  return (
    <>
      <section className="relative overflow-hidden bg-[#f8f1ea]">
        <div className="mx-auto grid min-h-[620px] max-w-[1500px] items-stretch lg:grid-cols-[0.82fr_1.18fr]">
          <div className="relative z-10 flex items-center px-5 py-14 sm:px-10 lg:px-14 xl:px-20">
            <div className="max-w-xl">
              <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-flame">{isFr ? "Cheveux 100% naturels" : "100% human hair · premium quality"}</p>
              <h1 className="mt-5 text-[3.15rem] leading-[0.98] text-cocoa sm:text-6xl xl:text-[5.25rem]">{hero.title}</h1>
              <p className="mt-6 max-w-lg text-[15px] leading-7 text-ink-soft sm:text-base">{hero.subtitle}</p>
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

          <div className="relative min-h-[500px] overflow-hidden lg:min-h-[620px]">
            <div className="absolute inset-0 bg-gradient-to-r from-[#f8f1ea] via-transparent to-transparent lg:z-10" />
            <div className="absolute inset-0 grid grid-cols-3 gap-1 bg-[#d8aa89]">
              {MODEL_IMAGES.slice(0, 3).map((url, i) => (
                <div key={url} className={`bg-cover bg-center ${i === 0 ? "translate-y-8" : i === 2 ? "translate-y-12" : ""}`} style={{ backgroundImage: `url(${url})` }} />
              ))}
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-cocoa/20 via-transparent to-transparent" />
          </div>
        </div>
      </section>

      <section className="relative z-20 mx-auto -mt-1 max-w-7xl px-4 sm:px-6 lg:-mt-8">
        <div className="grid overflow-hidden rounded-[1.4rem] border border-sand bg-white shadow-[0_18px_50px_rgba(74,27,12,.08)] sm:grid-cols-2 lg:grid-cols-4">
          {trust.map(({ icon: Icon, title, text }) => (
            <div key={title} className="flex items-center gap-3 border-b border-sand/70 px-5 py-5 last:border-0 sm:[&:nth-child(odd)]:border-r lg:border-b-0 lg:border-r lg:last:border-r-0">
              <span className="grid size-10 shrink-0 place-items-center rounded-full bg-petal text-cocoa"><Icon className="size-5" strokeWidth={1.6} /></span>
              <div><p className="text-xs font-bold uppercase tracking-[.08em] text-cocoa">{title}</p><p className="mt-1 text-xs text-ink-soft">{text}</p></div>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 md:py-18">
        <div className="mb-7 flex items-end justify-between gap-4">
          <div><p className="text-[10px] font-bold uppercase tracking-[.2em] text-flame">{isFr ? "Nos essentiels" : "Shop the edit"}</p><h2 className="mt-2 text-3xl text-cocoa sm:text-4xl">{t.home.categories}</h2></div>
          <Link href="/shop" className="hidden items-center gap-2 text-xs font-bold uppercase tracking-[.08em] text-cocoa hover:text-flame sm:inline-flex">{t.home.viewAll}<ArrowRight className="size-3.5" /></Link>
        </div>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {homeCategories.map((c, i) => (
            <Link key={c.id} href={`/shop/${c.slug}`} className="group relative min-h-[310px] overflow-hidden rounded-[1.35rem] bg-cocoa sm:min-h-[390px]">
              <div className="absolute inset-0 bg-cover bg-center transition duration-700 group-hover:scale-105" style={{ backgroundImage: `url(${MODEL_IMAGES[i % MODEL_IMAGES.length]})` }} />
              <div className="absolute inset-0 bg-gradient-to-t from-cocoa/80 via-cocoa/10 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-5 text-cream">
                <h3 className="text-2xl sm:text-3xl">{c.name}</h3>
                <span className="mt-3 inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.12em]">{isFr ? "Voir plus" : "Shop now"}<ArrowRight className="size-3" /></span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="border-y border-sand/60 bg-white/65">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[1.1fr_.9fr] lg:gap-12">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[.2em] text-flame">{isFr ? "Choisissez votre longueur" : "Choose your length"}</p>
            <h2 className="mt-2 text-3xl text-cocoa">{t.home.byLength}</h2>
            <div className="mt-5 flex flex-wrap gap-2">
              {LENGTHS.map((l) => <Link key={l} href={`/shop?length=${l}`} className="min-w-[58px] rounded-full border border-sand bg-cream px-4 py-2.5 text-center text-sm font-semibold text-cocoa transition hover:border-cocoa hover:bg-cocoa hover:text-cream">{l}&quot;</Link>)}
            </div>
          </div>

          <div className="lg:border-l lg:border-sand lg:pl-10">
            <p className="text-[10px] font-bold uppercase tracking-[.2em] text-flame">{isFr ? "Pour votre texture" : "Made for your texture"}</p>
            <h2 className="mt-2 text-3xl text-cocoa">{t.home.byHairType}</h2>
            <div className="mt-5 grid grid-cols-3 gap-3 sm:grid-cols-6 lg:grid-cols-3 xl:grid-cols-6">
              {Object.entries(HAIR_TYPE_LABELS).map(([k, label], i) => (
                <Link key={k} href={`/shop?hairType=${k}`} className="group text-center">
                  <span className="mx-auto block size-16 rounded-full border-2 border-white bg-cover bg-center shadow-sm ring-1 ring-sand transition group-hover:scale-105 group-hover:ring-cocoa" style={{ backgroundImage: `url(${MODEL_IMAGES[i % MODEL_IMAGES.length]})` }} />
                  <span className="mt-2 block text-xs font-semibold text-cocoa">{label}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 md:py-18">
        <div className="mb-7 flex items-end justify-between gap-4"><div><p className="text-[10px] font-bold uppercase tracking-[.2em] text-flame">{isFr ? "Les plus aimés" : "Most loved"}</p><h2 className="mt-2 text-3xl text-cocoa sm:text-4xl">{t.home.bestSellers}</h2></div><Link href="/shop?bestSeller=1" className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[.08em] text-cocoa hover:text-flame">{t.home.viewAll}<ArrowRight className="size-3.5" /></Link></div>
        {best.length > 0 ? <Grid>{best.slice(0, 8).map((p) => <ProductCard key={p.id} p={p} saved={saved.includes(p.id)} labels={wl} />)}</Grid> : <div className="rounded-3xl border border-dashed border-sand p-10 text-center text-sm text-ink-soft">Add products in Admin to populate this section.</div>}
      </section>

      <section className="bg-[#f4e2d5]">
        <div className="mx-auto grid max-w-[1500px] items-center lg:grid-cols-2">
          <div className="min-h-[450px] bg-cover bg-center lg:min-h-[560px]" style={{ backgroundImage: `url(${MODEL_IMAGES[0]})` }} />
          <div className="px-6 py-14 sm:px-12 lg:px-16 xl:px-20">
            <p className="text-[10px] font-bold uppercase tracking-[.22em] text-flame">The MAMAHAIR promise</p>
            <h2 className="mt-4 max-w-md text-4xl text-cocoa sm:text-5xl">{isFr ? "Des cheveux sublimes. Une confiance totale." : "Healthy hair. Happy you."}</h2>
            <div className="mt-7 space-y-3 text-sm text-cocoa/80">
              {[isFr ? "Cheveux humains premium" : "Premium 100% human hair", isFr ? "Finition naturelle et élégante" : "Natural, polished finish", isFr ? "Sélectionnés pour durer" : "Selected to last", isFr ? "Beauté sans compromis" : "Beauty without compromise"].map((x) => <p key={x} className="flex items-center gap-3"><span className="text-flame">✓</span>{x}</p>)}
            </div>
            <Link href="/pages/about" className="mt-8 inline-flex items-center gap-2 rounded-full bg-flame px-6 py-3 text-xs font-bold uppercase tracking-[.08em] text-white">{isFr ? "En savoir plus" : "Learn more"}<ArrowRight className="size-3.5" /></Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 md:py-18">
        <div className="mb-7"><p className="text-[10px] font-bold uppercase tracking-[.2em] text-flame">{isFr ? "Trouvez votre style" : "Find your texture"}</p><h2 className="mt-2 text-3xl text-cocoa sm:text-4xl">{t.home.byTexture}</h2></div>
        <div className="no-scrollbar flex gap-3 overflow-x-auto pb-3">
          {TEXTURES.slice(0, 7).map((tx, i) => (
            <Link key={tx} href={`/shop?texture=${encodeURIComponent(tx)}`} className="group relative min-h-[210px] min-w-[155px] overflow-hidden rounded-[1.25rem] bg-cocoa sm:min-h-[260px] sm:min-w-[190px]">
              <div className="absolute inset-0 bg-cover bg-center transition duration-500 group-hover:scale-105" style={{ backgroundImage: `url(${TEXTURE_IMAGES[i % TEXTURE_IMAGES.length]})` }} />
              <div className="absolute inset-0 bg-gradient-to-t from-cocoa/75 via-transparent to-transparent" />
              <span className="absolute inset-x-0 bottom-0 p-4 text-center text-xs font-bold uppercase tracking-[.12em] text-cream">{tx}</span>
            </Link>
          ))}
        </div>
      </section>

      {fresh.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 pb-14 sm:px-6 md:pb-18">
          <div className="mb-7 flex items-end justify-between gap-4"><div><p className="text-[10px] font-bold uppercase tracking-[.2em] text-flame">{isFr ? "Nouveautés" : "Just landed"}</p><h2 className="mt-2 text-3xl text-cocoa sm:text-4xl">{t.home.newArrivals}</h2></div><Link href="/shop?isNew=1" className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[.08em] text-cocoa hover:text-flame">{t.home.viewAll}<ArrowRight className="size-3.5" /></Link></div>
          <Grid>{fresh.slice(0, 8).map((p) => <ProductCard key={p.id} p={p} saved={saved.includes(p.id)} labels={wl} />)}</Grid>
        </section>
      )}

      <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6">
        <div className="rounded-[2rem] bg-cocoa px-6 py-12 text-center text-cream sm:px-10 md:py-16">
          <p className="text-[10px] font-bold uppercase tracking-[.2em] text-peach">MAMAHAIR private list</p>
          <h2 className="mt-3 text-3xl sm:text-4xl">{t.home.newsletter}</h2>
          <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-cream/70">{t.home.newsletterText}</p>
          <div className="mx-auto mt-6 max-w-md"><NewsletterForm cta={t.home.newsletterCta} done={t.home.newsletterDone} dark /></div>
        </div>
      </section>
    </>
  );
}

function Grid({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-4 md:gap-6">{children}</div>;
}
