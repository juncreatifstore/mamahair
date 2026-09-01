import Link from "next/link";
import { ArrowRight, Camera, Headphones, Heart, MessageCircle, RotateCcw, ShieldCheck, Sparkles, Star, Truck } from "lucide-react";
import { getBestSellers, getNewArrivals, listCategories } from "@/server/products";
import { getWishlistProductIds } from "@/server/wishlist";
import { getHomeBlocks } from "@/lib/home-blocks";
import { getBrand } from "@/lib/settings";
import { getT, getLocale, getCurrency } from "@/i18n/server";
import { ProductCard } from "@/components/storefront/product-card";
import { NewsletterForm } from "@/components/storefront/newsletter-form";
import { HeroVideo } from "@/components/storefront/hero-video";
import { Button } from "@/components/ui/button";
import { HAIR_TYPE_LABELS } from "@/lib/utils";
import { TEXTURES, LENGTHS } from "@/lib/catalog";

const MODEL_IMAGES = [
  "https://images.unsplash.com/photo-1645736279976-59f8fd22720c?auto=format&fit=crop&q=88&w=1600",
  "https://images.unsplash.com/photo-1589156191108-c762ff4b96ab?auto=format&fit=crop&q=88&w=1600",
  "https://images.unsplash.com/photo-1527203561188-dae1bc1a417f?auto=format&fit=crop&q=88&w=1600",
  "https://images.unsplash.com/photo-1593351799227-75df2026356b?auto=format&fit=crop&q=88&w=1600",
];

const HERO_VIDEO_FALLBACKS = [
  "https://videos.pexels.com/video-files/10149029/10149029-uhd_3840_2160_24fps.mp4",
  "https://videos.pexels.com/video-files/4107785/4107785-sd_540_676_30fps.mp4",
  "https://videos.pexels.com/video-files/8154497/8154497-uhd_4096_2160_25fps.mp4",
];

const TEXTURE_IMAGES = [MODEL_IMAGES[1], MODEL_IMAGES[0], MODEL_IMAGES[2], MODEL_IMAGES[3], MODEL_IMAGES[0], MODEL_IMAGES[1], MODEL_IMAGES[2]];

const TESTIMONIALS = [
  { name: "Ashley M.", text: "The lace melts beautifully and the hair stays soft. It looks even better in person." },
  { name: "Nadia K.", text: "I finally found a texture that blends naturally. The density is perfect and the shipping was fast." },
  { name: "Samantha J.", text: "Premium packaging, beautiful hair and excellent support. I already ordered my second unit." },
];

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
  const heroVideos = [
    hero.videoMainUrl || HERO_VIDEO_FALLBACKS[0],
    hero.videoTopRightUrl || HERO_VIDEO_FALLBACKS[1],
    hero.videoBottomRightUrl || HERO_VIDEO_FALLBACKS[2],
  ];
  const homeCategories = categories.filter((c) => c.showOnHome).slice(0, 4);
  const isFr = locale === "fr";

  const trust = [
    { icon: Truck, title: isFr ? "Livraison rapide" : "Fast shipping", text: isFr ? "Partout dans le monde" : "Worldwide delivery" },
    { icon: RotateCcw, title: isFr ? "Retours faciles" : "Easy returns", text: isFr ? "Politique claire" : "Simple return policy" },
    { icon: ShieldCheck, title: isFr ? "Paiement sécurisé" : "Secure payment", text: "Visa · Mastercard" },
    { icon: Headphones, title: isFr ? "Conseils personnalisés" : "Hair support", text: isFr ? "Avant et après achat" : "Before & after purchase" },
  ];

  const editorialCards = [
    { title: isFr ? "Perruques Lace" : "Lace Wigs", text: isFr ? "Finition invisible et naturelle" : "Natural hairline, effortless finish", href: "/shop?search=lace", image: MODEL_IMAGES[0] },
    { title: isFr ? "Bundles & Mèches" : "Bundles & Extensions", text: isFr ? "Volume, longueur et polyvalence" : "Length, volume and versatility", href: "/shop?search=bundle", image: MODEL_IMAGES[2] },
  ];

  return (
    <>
      <section className="overflow-hidden bg-[#f7eee7]">
        <div className="md:hidden">
          <div className="relative min-h-[520px] overflow-hidden bg-cocoa">
            <HeroVideo src={heroVideos[0]} poster={hero.imageUrl || MODEL_IMAGES[0]} objectPosition="center 18%" />
            <div className="absolute inset-0 bg-gradient-to-t from-cocoa via-cocoa/30 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 z-10 px-5 pb-7 text-cream">
              <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/12 px-3 py-1.5 text-[9px] font-bold uppercase tracking-[.16em] backdrop-blur-md">
                <Sparkles className="size-3 text-peach" /> {isFr ? "Cheveux humains premium" : "Premium human hair"}
              </div>
              <h1 className="max-w-[10ch] text-[2.85rem] leading-[.94] text-white">{hero.title}</h1>
              <p className="mt-4 max-w-[33rem] text-[13px] leading-5 text-white/82">{hero.subtitle}</p>
              <div className="mt-5 grid grid-cols-2 gap-2.5">
                <Button href={hero.ctaHref} size="lg" className="justify-center">{hero.ctaLabel}</Button>
                <Link href={hero.cta2Href} className="flex items-center justify-center rounded-full border border-white/45 bg-white/10 px-4 text-xs font-bold uppercase tracking-[.06em] text-white backdrop-blur">{hero.cta2Label}</Link>
              </div>
            </div>
          </div>
          <div className="no-scrollbar flex gap-2 overflow-x-auto border-b border-sand/70 bg-white px-4 py-3">
            {[isFr ? "Perruques" : "Wigs", "Bundles", "Lace Frontals", isFr ? "Nouveautés" : "New In", isFr ? "Best-sellers" : "Best Sellers"].map((label, i) => (
              <Link key={label} href={i === 3 ? "/shop?isNew=1" : i === 4 ? "/shop?bestSeller=1" : "/shop"} className="shrink-0 rounded-full border border-sand px-3.5 py-2 text-[10px] font-bold uppercase tracking-[.06em] text-cocoa">{label}</Link>
            ))}
          </div>
        </div>

        <div className="mx-auto hidden min-h-[650px] max-w-[1600px] grid-cols-[.88fr_1.12fr] md:grid xl:grid-cols-[.8fr_1.2fr]">
          <div className="relative z-10 flex items-center px-10 py-16 lg:px-16 xl:px-24">
            <div className="max-w-xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-cocoa/10 bg-white/65 px-4 py-2 text-[10px] font-bold uppercase tracking-[.18em] text-cocoa shadow-sm">
                <Sparkles className="size-3.5 text-flame" /> {isFr ? "100% cheveux humains · qualité premium" : "100% human hair · premium quality"}
              </div>
              <h1 className="mt-6 text-[4.25rem] leading-[.93] text-cocoa lg:text-[5rem] xl:text-[5.7rem]">{hero.title}</h1>
              <p className="mt-6 max-w-lg text-base leading-7 text-ink-soft lg:text-[17px]">{hero.subtitle}</p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Button href={hero.ctaHref} size="lg" className="min-w-48 justify-center shadow-[0_16px_35px_rgba(216,90,48,.22)]">{hero.ctaLabel}</Button>
                <Button href={hero.cta2Href} size="lg" variant="ghost" className="min-w-44 justify-center border-cocoa/25 bg-white/50 text-cocoa">{hero.cta2Label}</Button>
              </div>
              <div className="mt-10 grid max-w-md grid-cols-3 gap-4 border-t border-cocoa/10 pt-6 text-center">
                <div><div className="text-lg font-bold text-cocoa">100%</div><div className="mt-1 text-[10px] uppercase tracking-[.1em] text-ink-soft">Human Hair</div></div>
                <div className="border-x border-cocoa/10"><div className="text-lg font-bold text-cocoa">4.9★</div><div className="mt-1 text-[10px] uppercase tracking-[.1em] text-ink-soft">Loved</div></div>
                <div><div className="text-lg font-bold text-cocoa">Secure</div><div className="mt-1 text-[10px] uppercase tracking-[.1em] text-ink-soft">Checkout</div></div>
              </div>
            </div>
          </div>

          <div className="relative min-h-[650px] overflow-hidden bg-[#d4aa8a]">
            <div className="absolute inset-0 grid grid-cols-[1.05fr_.95fr] gap-1.5 p-1.5">
              <div className="relative overflow-hidden rounded-l-[2rem] bg-cocoa">
                <HeroVideo src={heroVideos[0]} poster={hero.imageUrl || MODEL_IMAGES[0]} objectPosition="center 18%" />
                <div className="absolute inset-0 bg-gradient-to-t from-cocoa/35 via-transparent to-transparent" />
                <span className="absolute bottom-6 left-6 rounded-full bg-white/90 px-4 py-2 text-[10px] font-bold uppercase tracking-[.12em] text-cocoa">HD Lace Collection</span>
              </div>
              <div className="grid grid-rows-2 gap-1.5">
                <div className="relative overflow-hidden rounded-tr-[2rem] bg-cocoa">
                  <HeroVideo src={heroVideos[1]} poster={MODEL_IMAGES[1]} objectPosition="center 20%" />
                </div>
                <div className="relative overflow-hidden rounded-br-[2rem] bg-cocoa">
                  <HeroVideo src={heroVideos[2]} poster={MODEL_IMAGES[2]} objectPosition="center" />
                  <div className="absolute inset-0 bg-gradient-to-t from-cocoa/55 via-transparent to-transparent" />
                  <span className="absolute bottom-5 left-5 text-xs font-bold uppercase tracking-[.12em] text-white">Bundles · Texture · Length</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-sand/70 bg-white">
        <div className="mx-auto grid max-w-7xl grid-cols-2 px-3 sm:px-6 lg:grid-cols-4">
          {trust.map(({ icon: Icon, title, text }, i) => (
            <div key={title} className={`flex items-center gap-2.5 px-2 py-4 sm:gap-3 sm:px-4 sm:py-5 ${i % 2 === 0 ? "border-r border-sand/70" : ""} ${i < 2 ? "border-b border-sand/70 lg:border-b-0" : ""} lg:border-r lg:last:border-r-0`}>
              <span className="grid size-8 shrink-0 place-items-center rounded-full bg-petal text-cocoa sm:size-10"><Icon className="size-4 sm:size-[18px]" strokeWidth={1.6} /></span>
              <div className="min-w-0"><p className="text-[9px] font-bold uppercase tracking-[.06em] text-cocoa sm:text-[11px]">{title}</p><p className="mt-0.5 text-[9px] text-ink-soft sm:text-[11px]">{text}</p></div>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:py-16">
        <SectionHeading eyebrow={isFr ? "Acheter par catégorie" : "Shop by category"} title={t.home.categories} link="/shop" linkLabel={t.home.viewAll} />
        <div className="grid grid-cols-2 gap-2.5 sm:gap-4 lg:grid-cols-4">
          {homeCategories.map((c, i) => (
            <Link key={c.id} href={`/shop/${c.slug}`} className="group relative h-[230px] overflow-hidden rounded-[1.25rem] bg-cocoa sm:h-[360px] lg:h-[430px]">
              <div className="absolute inset-0 bg-cover bg-center transition duration-700 group-hover:scale-[1.04]" style={{ backgroundImage: `url(${MODEL_IMAGES[i % MODEL_IMAGES.length]})` }} />
              <div className="absolute inset-0 bg-gradient-to-t from-cocoa/85 via-cocoa/8 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-4 text-cream sm:p-6">
                <h3 className="text-xl leading-tight sm:text-3xl">{c.name}</h3>
                <span className="mt-2 inline-flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-[.1em] sm:mt-3 sm:text-[10px]">{isFr ? "Découvrir" : "Shop now"}<ArrowRight className="size-3" /></span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="bg-[#fbf7f3] py-10 sm:py-14 lg:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <SectionHeading eyebrow={isFr ? "Les favoris de nos clientes" : "Customer favorites"} title={t.home.bestSellers} link="/shop?bestSeller=1" linkLabel={t.home.viewAll} />
          {best.length > 0 ? <Grid>{best.slice(0, 8).map((p) => <ProductCard key={p.id} p={p} saved={saved.includes(p.id)} labels={wl} />)}</Grid> : <div className="rounded-3xl border border-dashed border-sand p-8 text-center text-sm text-ink-soft">Add products in Admin to populate this section.</div>}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:py-16">
        <div className="grid gap-3 md:grid-cols-2 md:gap-5">
          {editorialCards.map((card) => (
            <Link key={card.title} href={card.href} className="group relative min-h-[340px] overflow-hidden rounded-[1.5rem] bg-cocoa sm:min-h-[440px]">
              <div className="absolute inset-0 bg-cover bg-center transition duration-700 group-hover:scale-105" style={{ backgroundImage: `url(${card.image})` }} />
              <div className="absolute inset-0 bg-gradient-to-t from-cocoa/80 via-cocoa/10 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-5 text-white sm:p-8">
                <span className="text-[9px] font-bold uppercase tracking-[.16em] text-peach">MAMAHAIR EDIT</span>
                <h2 className="mt-2 text-3xl sm:text-4xl">{card.title}</h2>
                <p className="mt-2 max-w-sm text-sm text-white/78">{card.text}</p>
                <span className="mt-4 inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.1em]">{isFr ? "Acheter la collection" : "Shop the collection"}<ArrowRight className="size-3.5" /></span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="border-y border-sand/60 bg-white">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 sm:py-12 lg:grid-cols-[1fr_1fr] lg:gap-14">
          <div>
            <p className="text-[9px] font-bold uppercase tracking-[.18em] text-flame sm:text-[10px]">{isFr ? "Choisissez votre longueur" : "Choose your length"}</p>
            <h2 className="mt-2 text-3xl text-cocoa sm:text-4xl">{t.home.byLength}</h2>
            <p className="mt-2 max-w-lg text-sm text-ink-soft">{isFr ? "Du naturel au spectaculaire, trouvez la longueur idéale pour votre style." : "From everyday natural to statement length, find the look that matches you."}</p>
            <div className="no-scrollbar -mx-4 mt-5 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0">
              {LENGTHS.map((l) => <Link key={l} href={`/shop?length=${l}`} className="shrink-0 rounded-full border border-sand bg-cream px-4 py-2.5 text-center text-xs font-semibold text-cocoa transition hover:border-cocoa hover:bg-cocoa hover:text-cream sm:min-w-[62px]">{l}&quot;</Link>)}
            </div>
          </div>
          <div className="lg:border-l lg:border-sand lg:pl-12">
            <p className="text-[9px] font-bold uppercase tracking-[.18em] text-flame sm:text-[10px]">{isFr ? "Trouvez votre match" : "Find your match"}</p>
            <h2 className="mt-2 text-3xl text-cocoa sm:text-4xl">{t.home.byHairType}</h2>
            <div className="mt-5 grid grid-cols-3 gap-3 sm:grid-cols-6 lg:grid-cols-3 xl:grid-cols-6">
              {Object.entries(HAIR_TYPE_LABELS).map(([k, label], i) => (
                <Link key={k} href={`/shop?hairType=${k}`} className="group text-center">
                  <span className="mx-auto block size-16 rounded-full border-2 border-white bg-cover bg-center shadow-sm ring-1 ring-sand transition group-hover:scale-105 group-hover:ring-cocoa" style={{ backgroundImage: `url(${MODEL_IMAGES[i % MODEL_IMAGES.length]})` }} />
                  <span className="mt-2 block text-[11px] font-semibold text-cocoa">{label}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-cocoa text-cream">
        <div className="mx-auto grid max-w-[1500px] lg:grid-cols-[1.04fr_.96fr]">
          <div className="relative min-h-[390px] bg-cover bg-[center_18%] sm:min-h-[520px]" style={{ backgroundImage: `url(${MODEL_IMAGES[3]})` }}>
            <div className="absolute inset-0 bg-gradient-to-r from-transparent to-cocoa/15" />
          </div>
          <div className="flex items-center px-5 py-10 sm:px-12 sm:py-14 lg:px-16 xl:px-20">
            <div className="max-w-lg">
              <p className="text-[9px] font-bold uppercase tracking-[.18em] text-peach sm:text-[10px]">The MAMAHAIR standard</p>
              <h2 className="mt-3 text-4xl leading-[1.02] text-white sm:text-5xl">{isFr ? "Une finition qui ressemble à vos vrais cheveux." : "Hair that looks like it was made for you."}</h2>
              <p className="mt-5 text-sm leading-6 text-cream/72">{isFr ? "Nous sélectionnons des textures, densités et finitions pensées pour un résultat naturel, élégant et facile à porter." : "We focus on texture, density and finishing details that make every look feel natural, polished and wearable."}</p>
              <div className="mt-7 grid gap-3 sm:grid-cols-2">
                {[isFr ? "Lace naturelle" : "Natural lace finish", isFr ? "Textures premium" : "Premium textures", isFr ? "Longueurs variées" : "Multiple lengths", isFr ? "Conseils avant achat" : "Pre-purchase guidance"].map((x) => <div key={x} className="flex items-center gap-2.5 text-sm"><ShieldCheck className="size-4 text-peach" />{x}</div>)}
              </div>
              <Link href="/quiz" className="mt-8 inline-flex items-center gap-2 rounded-full bg-flame px-6 py-3 text-[10px] font-bold uppercase tracking-[.08em] text-white">{isFr ? "Trouver mes cheveux" : "Find my perfect hair"}<ArrowRight className="size-3.5" /></Link>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:py-16">
        <SectionHeading eyebrow={isFr ? "Acheter par texture" : "Shop by texture"} title={t.home.byTexture} />
        <div className="no-scrollbar -mx-4 flex gap-2.5 overflow-x-auto px-4 pb-2 sm:mx-0 sm:gap-4 sm:px-0">
          {TEXTURES.slice(0, 7).map((tx, i) => (
            <Link key={tx} href={`/shop?texture=${encodeURIComponent(tx)}`} className="group relative h-[210px] min-w-[145px] overflow-hidden rounded-[1.15rem] bg-cocoa sm:h-[300px] sm:min-w-[205px]">
              <div className="absolute inset-0 bg-cover bg-center transition duration-500 group-hover:scale-105" style={{ backgroundImage: `url(${TEXTURE_IMAGES[i % TEXTURE_IMAGES.length]})` }} />
              <div className="absolute inset-0 bg-gradient-to-t from-cocoa/80 via-transparent to-transparent" />
              <span className="absolute inset-x-0 bottom-0 p-4 text-center text-[10px] font-bold uppercase tracking-[.12em] text-white sm:text-xs">{tx}</span>
            </Link>
          ))}
        </div>
      </section>

      {fresh.length > 0 && (
        <section className="bg-[#fbf7f3] py-10 sm:py-14 lg:py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <SectionHeading eyebrow={isFr ? "Nouveautés" : "Just landed"} title={t.home.newArrivals} link="/shop?isNew=1" linkLabel={t.home.viewAll} />
            <Grid>{fresh.slice(0, 8).map((p) => <ProductCard key={p.id} p={p} saved={saved.includes(p.id)} labels={wl} />)}</Grid>
          </div>
        </section>
      )}

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:py-16">
        <div className="mb-7 text-center">
          <p className="text-[9px] font-bold uppercase tracking-[.18em] text-flame sm:text-[10px]">{isFr ? "Elles aiment MAMAHAIR" : "Loved by our community"}</p>
          <h2 className="mt-2 text-3xl text-cocoa sm:text-4xl">{isFr ? "De vrais looks. De vrais avis." : "Real hair. Real confidence."}</h2>
        </div>
        <div className="grid gap-3 md:grid-cols-3 md:gap-5">
          {TESTIMONIALS.map((review) => (
            <article key={review.name} className="rounded-[1.35rem] border border-sand bg-white p-5 shadow-[0_12px_30px_rgba(74,27,12,.04)] sm:p-6">
              <div className="flex gap-1 text-flame">{Array.from({ length: 5 }).map((_, i) => <Star key={i} className="size-3.5 fill-current" />)}</div>
              <p className="mt-4 text-sm leading-6 text-ink">“{review.text}”</p>
              <div className="mt-5 flex items-center justify-between border-t border-sand/70 pt-4"><span className="text-xs font-bold text-cocoa">{review.name}</span><span className="text-[9px] font-bold uppercase tracking-[.1em] text-ink-soft">Verified buyer</span></div>
            </article>
          ))}
        </div>
      </section>

      <section className="bg-[#f6e5da] py-10 sm:py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div><p className="text-[9px] font-bold uppercase tracking-[.18em] text-flame sm:text-[10px]">MAMAHAIR community</p><h2 className="mt-2 text-3xl text-cocoa sm:text-4xl">{isFr ? "Inspirez-vous de nos looks" : "Wear it your way"}</h2></div>
            <div className="flex gap-4 text-xs font-semibold text-cocoa"><span className="inline-flex items-center gap-1.5"><Camera className="size-4" /> Instagram</span><span className="inline-flex items-center gap-1.5"><Heart className="size-4" /> TikTok</span></div>
          </div>
          <div className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
            {MODEL_IMAGES.map((image, i) => <div key={image} className="group relative aspect-square overflow-hidden rounded-xl bg-cover bg-center sm:rounded-[1.2rem]" style={{ backgroundImage: `url(${image})` }}><div className="absolute inset-0 grid place-items-center bg-cocoa/0 transition group-hover:bg-cocoa/35"><MessageCircle className="size-6 text-white opacity-0 transition group-hover:opacity-100" /></div><span className="absolute bottom-3 left-3 rounded-full bg-white/90 px-2.5 py-1 text-[8px] font-bold uppercase tracking-[.08em] text-cocoa">Look 0{i + 1}</span></div>)}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-16">
        <div className="rounded-[1.6rem] bg-cocoa px-5 py-9 text-center text-cream sm:rounded-[2rem] sm:px-10 sm:py-14 md:py-16">
          <p className="text-[9px] font-bold uppercase tracking-[.18em] text-peach sm:text-[10px]">MAMAHAIR private list</p>
          <h2 className="mt-2 text-3xl text-white sm:mt-3 sm:text-4xl">{t.home.newsletter}</h2>
          <p className="mx-auto mt-3 max-w-lg text-xs leading-5 text-cream/70 sm:text-sm sm:leading-6">{t.home.newsletterText}</p>
          <div className="mx-auto mt-6 max-w-md"><NewsletterForm cta={t.home.newsletterCta} done={t.home.newsletterDone} dark /></div>
        </div>
      </section>
    </>
  );
}

function SectionHeading({ eyebrow, title, link, linkLabel }: { eyebrow: string; title: string; link?: string; linkLabel?: string }) {
  return (
    <div className="mb-6 flex items-end justify-between gap-4 sm:mb-8">
      <div><p className="text-[9px] font-bold uppercase tracking-[.18em] text-flame sm:text-[10px]">{eyebrow}</p><h2 className="mt-1.5 text-3xl text-cocoa sm:mt-2 sm:text-4xl">{title}</h2></div>
      {link && <Link href={link} className="inline-flex shrink-0 items-center gap-1.5 text-[10px] font-bold uppercase tracking-[.07em] text-cocoa transition hover:text-flame sm:text-xs">{linkLabel}<ArrowRight className="size-3.5" /></Link>}
    </div>
  );
}

function Grid({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-2 gap-x-2.5 gap-y-6 sm:gap-5 md:grid-cols-3 lg:grid-cols-4 lg:gap-6">{children}</div>;
}
