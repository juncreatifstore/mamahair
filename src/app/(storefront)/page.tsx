import Link from "next/link";
import Image from "next/image";
import { Sparkles, ShieldCheck, Truck, MessageCircle } from "lucide-react";
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
  const why = [
    { icon: Sparkles, title: t.home.whyQuality, text: t.home.whyQualityText },
    { icon: ShieldCheck, title: t.home.whySecure, text: t.home.whySecureText },
    { icon: Truck, title: t.home.whyShipping, text: t.home.whyShippingText },
    { icon: MessageCircle, title: t.home.whySupport, text: t.home.whySupportText },
  ];

  return (
    <>
      <section className="bg-petal">
        <div className="mx-auto grid max-w-7xl items-center gap-8 px-4 py-12 sm:px-6 md:grid-cols-2 md:py-20">
          <div className="order-2 md:order-1">
            <h1 className="text-5xl text-cocoa sm:text-6xl lg:text-7xl">{hero.title}</h1>
            <p className="mt-6 max-w-md text-base leading-relaxed text-ink-soft">{hero.subtitle}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button href={hero.ctaHref} size="lg">{hero.ctaLabel}</Button>
              <Button href={hero.cta2Href} size="lg" variant="ghost" className="border-cocoa/30 text-cocoa">{hero.cta2Label}</Button>
            </div>
          </div>
          <div className="relative order-1 aspect-[4/5] overflow-hidden rounded-[2rem] bg-peach md:order-2">
            {heroImg ? <Image src={heroImg} alt={hero.imageAlt} fill priority sizes="(max-width: 768px) 100vw, 50vw" className="object-cover" /> : <div className="grid h-full place-items-center"><span className="display text-8xl text-cocoa/30">{b.storeName.charAt(0)}</span></div>}
          </div>
        </div>
      </section>

      <Section title={t.home.categories}>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
          {categories.filter((c) => c.showOnHome).map((c) => (
            <Link key={c.id} href={`/shop/${c.slug}`} className="group">
              <div className="relative aspect-square overflow-hidden rounded-2xl bg-petal">{c.imageUrl ? <Image src={c.imageUrl} alt={c.name} fill sizes="200px" className="object-cover transition-transform group-hover:scale-105" /> : <div className="grid h-full place-items-center"><span className="display text-4xl text-cocoa/40">{c.name.charAt(0)}</span></div>}</div>
              <p className="mt-2 text-center text-sm font-medium group-hover:text-flame">{c.name}</p>
            </Link>
          ))}
        </div>
      </Section>

      {best.length > 0 && (
        <Section title={t.home.bestSellers} link={{ href: "/shop?bestSeller=1", label: t.home.viewAll }}>
          <Grid>{best.map((p) => <ProductCard key={p.id} p={p} saved={saved.includes(p.id)} labels={wl} />)}</Grid>
        </Section>
      )}

      <section className="mx-auto grid max-w-7xl gap-4 px-4 sm:px-6 md:grid-cols-2">
        {[blocks.banner_1, blocks.banner_2].map((bn, i) => (
          <Link key={i} href={bn.ctaHref} className={`relative overflow-hidden rounded-3xl p-8 md:p-10 ${bn.tone === "cocoa" ? "bg-cocoa text-cream" : bn.tone === "peach" ? "bg-peach text-cocoa" : "bg-petal text-cocoa"}`}>
            {bn.imageUrl && <Image src={bn.imageUrl} alt="" fill sizes="50vw" className="object-cover opacity-40" />}
            <div className="relative">
              <h3 className="text-3xl">{bn.title}</h3>
              <p className={`mt-2 max-w-xs text-sm ${bn.tone === "cocoa" ? "text-cream/80" : "text-ink-soft"}`}>{bn.text}</p>
              <span className="mt-5 inline-block rounded-pill bg-flame px-5 py-2 text-sm font-medium text-white">{bn.ctaLabel}</span>
            </div>
          </Link>
        ))}
      </section>

      {fresh.length > 0 && (
        <Section title={t.home.newArrivals} link={{ href: "/shop?isNew=1", label: t.home.viewAll }}>
          <Grid>{fresh.map((p) => <ProductCard key={p.id} p={p} saved={saved.includes(p.id)} labels={wl} />)}</Grid>
        </Section>
      )}

      <Section title={t.home.byTexture}>
        <div className="no-scrollbar flex gap-3 overflow-x-auto pb-2">
          {TEXTURES.map((tx) => <Link key={tx} href={`/shop?texture=${encodeURIComponent(tx)}`} className="shrink-0 rounded-pill border border-sand bg-white px-5 py-3 text-sm font-medium hover:border-cocoa hover:bg-petal">{tx}</Link>)}
        </div>
      </Section>
      <Section title={t.home.byLength}>
        <div className="grid grid-cols-4 gap-2 sm:grid-cols-8">
          {LENGTHS.map((l) => <Link key={l} href={`/shop?length=${l}`} className="grid aspect-square place-items-center rounded-2xl bg-petal hover:bg-peach"><span className="display text-2xl text-cocoa">{`${l}"`}</span></Link>)}
        </div>
      </Section>
      <Section title={t.home.byHairType}>
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
          {Object.entries(HAIR_TYPE_LABELS).map(([k, label]) => <Link key={k} href={`/shop?hairType=${k}`} className="grid aspect-square place-items-center rounded-2xl border border-sand bg-white hover:border-cocoa"><span className="display text-4xl text-cocoa">{label}</span></Link>)}
        </div>
      </Section>

      <section className="bg-cocoa text-cream">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
          <h2 className="text-3xl">{t.home.why}</h2>
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {why.map(({ icon: Icon, title, text }) => <div key={title}><Icon className="size-6 text-peach" /><p className="mt-3 font-semibold">{title}</p><p className="mt-1 text-sm text-cream/75">{text}</p></div>)}
          </div>
        </div>
      </section>

      <Section title={t.home.testimonials}>
        <div className="grid gap-4 md:grid-cols-3">
          {blocks.testimonials.items.map((tm, i) => (
            <figure key={i} className="rounded-3xl bg-white p-6">
              <p className="text-peach">{"★".repeat(tm.rating)}</p>
              <blockquote className="mt-3 text-[15px] leading-relaxed">“{tm.text}”</blockquote>
              <figcaption className="mt-4 text-sm text-ink-soft">{tm.name}{tm.city ? `, ${tm.city}` : ""}</figcaption>
            </figure>
          ))}
        </div>
      </Section>

      {(blocks.instagram.images.length > 0 || b.social.instagram) && (
        <Section title={t.home.instagram} link={b.social.instagram ? { href: b.social.instagram, label: blocks.instagram.handle || "Instagram" } : undefined}>
          {blocks.instagram.images.length > 0 ? (
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">{blocks.instagram.images.slice(0, 6).map((im, i) => <a key={i} href={im.href || b.social.instagram} target="_blank" rel="noreferrer" className="relative aspect-square overflow-hidden rounded-xl bg-petal"><Image src={im.url} alt="" fill sizes="200px" className="object-cover" /></a>)}</div>
          ) : <p className="text-sm text-ink-soft">Add Instagram images in Admin → Content → Home blocks.</p>}
        </Section>
      )}

      <section className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="rounded-3xl bg-peach px-6 py-12 text-center md:py-16">
          <h2 className="text-3xl text-cocoa">{t.home.newsletter}</h2>
          <p className="mx-auto mt-2 max-w-md text-ink-soft">{t.home.newsletterText}</p>
          <div className="mx-auto mt-6 max-w-md"><NewsletterForm cta={t.home.newsletterCta} done={t.home.newsletterDone} /></div>
        </div>
      </section>
    </>
  );
}

function Section({ title, link, children }: { title: string; link?: { href: string; label: string }; children: React.ReactNode }) {
  return (
    <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
      <div className="mb-6 flex items-end justify-between gap-4"><h2 className="text-3xl text-cocoa">{title}</h2>{link && <Link href={link.href} className="text-sm font-medium text-flame underline-offset-4 hover:underline">{link.label}</Link>}</div>
      {children}
    </section>
  );
}
function Grid({ children }: { children: React.ReactNode }) { return <div className="grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-6">{children}</div>; }
