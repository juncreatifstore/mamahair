import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Sparkles, ShieldCheck, Truck, MessageCircle } from "lucide-react";
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

export default async function HomePage() {
  const [t, locale, currency, b] = await Promise.all([getT(), getLocale(), getCurrency(), getBrand()]);
  const [best, fresh, categories, blocks, saved] = await Promise.all([getBestSellers(8, currency), getNewArrivals(8, currency), listCategories(), getHomeBlocks(locale), getWishlistProductIds()]);
  const wl = { save: t.product.saveWishlist, saved: t.product.savedWishlist };
  const hero = { ...blocks.hero, title: blocks.hero.title || t.home.heroTitle, subtitle: blocks.hero.subtitle || t.home.heroText, ctaLabel: blocks.hero.ctaLabel || t.home.heroCta, cta2Label: blocks.hero.cta2Label || t.home.heroCta2 };
  const heroImg = hero.imageUrl || best[0]?.images[0]?.url || "";
  const homeCategories = categories.filter((c) => c.showOnHome).slice(0, 7);
  const why = [
    { icon: Sparkles, title: t.home.whyQuality, text: t.home.whyQualityText },
    { icon: ShieldCheck, title: t.home.whySecure, text: t.home.whySecureText },
    { icon: Truck, title: t.home.whyShipping, text: t.home.whyShippingText },
    { icon: MessageCircle, title: t.home.whySupport, text: t.home.whySupportText },
  ];

  return (
    <>
      <section className="relative overflow-hidden bg-cream">
        <div className="absolute inset-x-0 top-0 h-[72%] bg-[radial-gradient(circle_at_15%_20%,rgba(245,196,179,0.42),transparent_34%),radial-gradient(circle_at_82%_15%,rgba(250,236,231,0.9),transparent_30%)]" />
        <div className="relative mx-auto grid max-w-7xl items-center gap-10 px-4 py-10 sm:px-6 md:grid-cols-[0.9fr_1.1fr] md:py-14 lg:gap-16 lg:py-20">
          <div className="order-2 max-w-xl md:order-1">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-cocoa/10 bg-white/70 px-4 py-2 text-[10px] font-bold uppercase tracking-[0.2em] text-cocoa shadow-sm backdrop-blur">
              <span className="size-1.5 rounded-full bg-flame" /> Premium hair, made for you
            </div>
            <h1 className="max-w-[11ch] text-[3.3rem] leading-[0.98] text-cocoa sm:text-6xl lg:text-[5.4rem]">{hero.title}</h1>
            <p className="mt-6 max-w-lg text-[15px] leading-7 text-ink-soft sm:text-base sm:leading-8">{hero.subtitle}</p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Button href={hero.ctaHref} size="lg" className="min-w-40 shadow-[0_10px_30px_rgba(216,90,48,0.18)]">{hero.ctaLabel}</Button>
              <Button href={hero.cta2Href} size="lg" variant="ghost" className="border-cocoa/20 bg-white/60 text-cocoa backdrop-blur">{hero.cta2Label}</Button>
            </div>
            <div className="mt-9 grid max-w-md grid-cols-3 gap-5 border-t border-cocoa/10 pt-5 text-xs text-ink-soft">
              <div><strong className="block text-sm text-cocoa">Premium</strong> quality</div>
              <div><strong className="block text-sm text-cocoa">Secure</strong> checkout</div>
              <div><strong className="block text-sm text-cocoa">Worldwide</strong> ready</div>
            </div>
          </div>

          <div className="relative order-1 md:order-2">
            <div className="absolute -left-5 top-12 hidden h-44 w-28 rounded-full bg-peach/45 blur-3xl md:block" />
            <div className="relative ml-auto aspect-[4/5] max-h-[700px] overflow-hidden rounded-[2.25rem] bg-peach shadow-[0_28px_80px_rgba(74,27,12,0.14)] ring-1 ring-white/80">
              {heroImg ? <Image src={heroImg} alt={hero.imageAlt} fill priority sizes="(max-width: 768px) 100vw, 55vw" className="object-cover" /> : <div className="grid h-full place-items-center bg-gradient-to-br from-petal to-peach"><span className="display text-8xl text-cocoa/20">{b.storeName.charAt(0)}</span></div>}
              <div className="absolute inset-0 bg-gradient-to-t from-cocoa/20 via-transparent to-transparent" />
              <div className="absolute bottom-5 left-5 right-5 flex items-center justify-between rounded-2xl border border-white/30 bg-white/80 px-5 py-4 shadow-lg backdrop-blur-md">
                <div><span className="block text-[10px] font-bold uppercase tracking-[0.16em] text-ink-soft">MAMAHAIR edit</span><strong className="display mt-1 block text-xl text-cocoa">Confidence in every strand</strong></div>
                <span className="grid size-10 place-items-center rounded-full bg-cocoa text-cream"><ArrowRight className="size-4" /></span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-sand/70 bg-white/55">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-x-10 gap-y-3 px-4 py-4 text-[10px] font-bold uppercase tracking-[0.16em] text-cocoa/70 sm:px-6 md:justify-between">
          <span>Luxury texture</span><span>Natural finish</span><span>Secure payment</span><span>Curated quality</span><span>Customer care</span>
        </div>
      </section>

      <Section eyebrow="Shop by collection" title={t.home.categories}>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-7">
          {homeCategories.map((c, i) => (
            <Link key={c.id} href={`/shop/${c.slug}`} className={`group relative overflow-hidden rounded-[1.5rem] bg-petal ${i === 0 ? "sm:col-span-2 lg:col-span-1" : ""}`}>
              <div className="relative aspect-[4/5] overflow-hidden">
                {c.imageUrl ? <Image src={c.imageUrl} alt={c.name} fill sizes="220px" className="object-cover transition duration-500 group-hover:scale-105" /> : <div className="grid h-full place-items-center bg-gradient-to-br from-petal to-peach/60"><span className="display text-5xl text-cocoa/25">{c.name.charAt(0)}</span></div>}
                <div className="absolute inset-0 bg-gradient-to-t from-cocoa/65 via-cocoa/5 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-4 text-cream">
                  <p className="display text-xl leading-tight">{c.name}</p>
                  <span className="mt-1 inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-[0.12em] text-cream/80">Shop now <ArrowRight className="size-3" /></span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </Section>

      {best.length > 0 && (
        <Section eyebrow="Most loved" title={t.home.bestSellers} link={{ href: "/shop?bestSeller=1", label: t.home.viewAll }}>
          <Grid>{best.map((p) => <ProductCard key={p.id} p={p} saved={saved.includes(p.id)} labels={wl} />)}</Grid>
        </Section>
      )}

      <section className="mx-auto grid max-w-7xl gap-5 px-4 py-4 sm:px-6 md:grid-cols-2">
        {[blocks.banner_1, blocks.banner_2].map((bn, i) => (
          <Link key={i} href={bn.ctaHref} className={`group relative min-h-[360px] overflow-hidden rounded-[2rem] p-8 shadow-sm md:p-10 ${bn.tone === "cocoa" ? "bg-cocoa text-cream" : bn.tone === "peach" ? "bg-peach text-cocoa" : "bg-petal text-cocoa"}`}>
            {bn.imageUrl && <Image src={bn.imageUrl} alt="" fill sizes="50vw" className="object-cover transition duration-700 group-hover:scale-105" />}
            <div className={`absolute inset-0 ${bn.tone === "cocoa" ? "bg-gradient-to-r from-cocoa/90 via-cocoa/65 to-cocoa/10" : "bg-gradient-to-r from-cream/90 via-cream/50 to-transparent"}`} />
            <div className="relative flex h-full max-w-sm flex-col justify-end">
              <span className="mb-3 text-[10px] font-bold uppercase tracking-[0.18em] opacity-75">Curated by MAMAHAIR</span>
              <h3 className="text-4xl leading-tight">{bn.title}</h3>
              <p className={`mt-3 text-sm leading-6 ${bn.tone === "cocoa" ? "text-cream/78" : "text-ink-soft"}`}>{bn.text}</p>
              <span className="mt-6 inline-flex w-fit items-center gap-2 rounded-full bg-flame px-5 py-2.5 text-xs font-bold uppercase tracking-[0.08em] text-white shadow-md">{bn.ctaLabel}<ArrowRight className="size-3.5" /></span>
            </div>
          </Link>
        ))}
      </section>

      {fresh.length > 0 && (
        <Section eyebrow="Just landed" title={t.home.newArrivals} link={{ href: "/shop?isNew=1", label: t.home.viewAll }}>
          <Grid>{fresh.map((p) => <ProductCard key={p.id} p={p} saved={saved.includes(p.id)} labels={wl} />)}</Grid>
        </Section>
      )}

      <section className="bg-white/55 py-4">
        <Section eyebrow="Find your match" title={t.home.byTexture} compact>
          <div className="no-scrollbar flex gap-2.5 overflow-x-auto pb-2">
            {TEXTURES.map((tx) => <Link key={tx} href={`/shop?texture=${encodeURIComponent(tx)}`} className="shrink-0 rounded-full border border-sand bg-white px-5 py-3 text-xs font-semibold transition hover:-translate-y-0.5 hover:border-cocoa hover:bg-cocoa hover:text-cream">{tx}</Link>)}
          </div>
        </Section>

        <Section eyebrow="Choose your length" title={t.home.byLength} compact>
          <div className="grid grid-cols-4 gap-2.5 sm:grid-cols-8">
            {LENGTHS.map((l) => <Link key={l} href={`/shop?length=${l}`} className="group grid aspect-square place-items-center rounded-[1.25rem] border border-sand/80 bg-cream transition hover:-translate-y-1 hover:border-peach hover:bg-petal"><span className="display text-2xl text-cocoa transition group-hover:text-flame">{`${l}\"`}</span></Link>)}
          </div>
        </Section>

        <Section eyebrow="Made for your texture" title={t.home.byHairType} compact>
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
            {Object.entries(HAIR_TYPE_LABELS).map(([k, label]) => <Link key={k} href={`/shop?hairType=${k}`} className="group grid aspect-square place-items-center rounded-[1.4rem] border border-sand bg-white shadow-sm transition hover:-translate-y-1 hover:border-cocoa"><span className="display text-4xl text-cocoa transition group-hover:scale-105 group-hover:text-flame">{label}</span></Link>)}
          </div>
        </Section>
      </section>

      <section className="relative overflow-hidden bg-cocoa text-cream">
        <div className="absolute -right-24 -top-24 size-80 rounded-full bg-flame/15 blur-3xl" />
        <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 md:py-20">
          <div className="max-w-xl"><span className="text-[10px] font-bold uppercase tracking-[0.2em] text-peach">The MAMAHAIR promise</span><h2 className="mt-3 text-4xl sm:text-5xl">{t.home.why}</h2></div>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {why.map(({ icon: Icon, title, text }, i) => <div key={title} className="rounded-[1.5rem] border border-cream/10 bg-cream/[0.045] p-5 backdrop-blur"><span className="mb-5 grid size-10 place-items-center rounded-full bg-peach/15 text-peach"><Icon className="size-5" strokeWidth={1.6} /></span><span className="text-[10px] font-bold uppercase tracking-[0.16em] text-cream/45">0{i + 1}</span><p className="mt-2 font-semibold">{title}</p><p className="mt-2 text-sm leading-6 text-cream/68">{text}</p></div>)}
          </div>
        </div>
      </section>

      <Section eyebrow="Real hair. Real confidence." title={t.home.testimonials}>
        <div className="grid gap-4 md:grid-cols-3">
          {blocks.testimonials.items.map((tm, i) => (
            <figure key={i} className="rounded-[1.75rem] border border-sand/70 bg-white p-6 shadow-[0_10px_30px_rgba(74,27,12,0.04)]">
              <p className="text-sm tracking-[0.18em] text-flame">{"★".repeat(tm.rating)}</p>
              <blockquote className="display mt-5 text-xl leading-relaxed text-cocoa">“{tm.text}”</blockquote>
              <figcaption className="mt-6 border-t border-sand pt-4 text-xs font-semibold uppercase tracking-[0.1em] text-ink-soft">{tm.name}{tm.city ? ` · ${tm.city}` : ""}</figcaption>
            </figure>
          ))}
        </div>
      </Section>

      {(blocks.instagram.images.length > 0 || b.social.instagram) && (
        <Section eyebrow="Follow the look" title={t.home.instagram} link={b.social.instagram ? { href: b.social.instagram, label: blocks.instagram.handle || "Instagram" } : undefined}>
          {blocks.instagram.images.length > 0 ? (
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">{blocks.instagram.images.slice(0, 6).map((im, i) => <a key={i} href={im.href || b.social.instagram} target="_blank" rel="noreferrer" className="group relative aspect-square overflow-hidden rounded-[1.25rem] bg-petal"><Image src={im.url} alt="" fill sizes="200px" className="object-cover transition duration-500 group-hover:scale-105" /><div className="absolute inset-0 bg-cocoa/0 transition group-hover:bg-cocoa/10" /></a>)}</div>
          ) : <p className="text-sm text-ink-soft">Add Instagram images in Admin → Content → Home blocks.</p>}
        </Section>
      )}

      <section className="mx-auto max-w-7xl px-4 pb-16 pt-4 sm:px-6 md:pb-24">
        <div className="relative overflow-hidden rounded-[2.25rem] bg-peach px-6 py-14 text-center shadow-[0_22px_60px_rgba(74,27,12,0.08)] md:py-20">
          <div className="absolute left-1/2 top-0 h-48 w-96 -translate-x-1/2 rounded-full bg-white/30 blur-3xl" />
          <div className="relative mx-auto max-w-2xl">
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-cocoa/60">MAMAHAIR private list</span>
            <h2 className="mt-3 text-4xl text-cocoa sm:text-5xl">{t.home.newsletter}</h2>
            <p className="mx-auto mt-4 max-w-md text-sm leading-6 text-ink-soft">{t.home.newsletterText}</p>
            <div className="mx-auto mt-7 max-w-md"><NewsletterForm cta={t.home.newsletterCta} done={t.home.newsletterDone} /></div>
          </div>
        </div>
      </section>
    </>
  );
}

function Section({ title, eyebrow, link, children, compact = false }: { title: string; eyebrow?: string; link?: { href: string; label: string }; children: React.ReactNode; compact?: boolean }) {
  return (
    <section className={`mx-auto max-w-7xl px-4 sm:px-6 ${compact ? "py-9" : "py-14 md:py-18"}`}>
      <div className="mb-7 flex items-end justify-between gap-4">
        <div>{eyebrow && <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-flame">{eyebrow}</p>}<h2 className="text-3xl text-cocoa sm:text-4xl">{title}</h2></div>
        {link && <Link href={link.href} className="group inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.08em] text-cocoa transition hover:text-flame">{link.label}<ArrowRight className="size-3.5 transition group-hover:translate-x-1" /></Link>}
      </div>
      {children}
    </section>
  );
}

function Grid({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-4 md:gap-6">{children}</div>;
}
