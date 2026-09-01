import { db } from "./db";

/** Blocs éditables de l'accueil (Admin → Content → Home blocks). Valeurs par défaut si absents. */
export type HeroBlock = {
  title: string;
  subtitle: string;
  ctaLabel: string;
  ctaHref: string;
  cta2Label: string;
  cta2Href: string;
  imageUrl: string;
  imageAlt: string;
  videoMainUrl: string;
  videoTopRightUrl: string;
  videoBottomRightUrl: string;
};
export type BannerBlock = { title: string; text: string; ctaLabel: string; ctaHref: string; imageUrl: string; tone: "cocoa" | "petal" | "peach" };
export type Testimonial = { name: string; city: string; text: string; rating: number };
export type Instagram = { handle: string; images: { url: string; href: string }[] };

export const HOME_DEFAULTS = {
  hero: {
    title: "",
    subtitle: "",
    ctaLabel: "",
    ctaHref: "/shop",
    cta2Label: "",
    cta2Href: "/shop?isNew=1",
    imageUrl: "",
    imageAlt: "",
    videoMainUrl: "https://videos.pexels.com/video-files/10149029/10149029-uhd_3840_2160_24fps.mp4",
    videoTopRightUrl: "https://videos.pexels.com/video-files/4107785/4107785-sd_540_676_30fps.mp4",
    videoBottomRightUrl: "https://videos.pexels.com/video-files/8154497/8154497-uhd_4096_2160_25fps.mp4",
  } as HeroBlock,
  banner_1: { title: "Bundle deals", text: "3 bundles + closure sets, priced to save.", ctaLabel: "Shop bundles", ctaHref: "/shop/bundles", imageUrl: "", tone: "cocoa" } as BannerBlock,
  banner_2: { title: "Glueless wigs", text: "Beginner-friendly, pre-plucked, ready to wear.", ctaLabel: "Shop wigs", ctaHref: "/shop/wigs", imageUrl: "", tone: "petal" } as BannerBlock,
  testimonials: { items: [
    { name: "Keisha", city: "Atlanta", text: "The 24\" body wave is unbelievably soft. Zero shedding after three washes.", rating: 5 },
    { name: "Marie-Josée", city: "Montréal", text: "Lace melted perfectly, and shipping to Canada was faster than expected.", rating: 5 },
    { name: "Daniela", city: "CDMX", text: "Mi primera peluca glueless y quedó perfecta desde el primer día.", rating: 5 },
  ] as Testimonial[] },
  instagram: { handle: "", images: [] } as Instagram,
};

export async function getHomeBlocks(locale: string) {
  const rows = await db.homeBlock.findMany({ where: { isActive: true, locale: { in: [locale, "en"] } } });
  const pick = <T,>(key: string, fallback: T): T => {
    const exact = rows.find((r) => r.key === key && r.locale === locale) ?? rows.find((r) => r.key === key && r.locale === "en");
    return exact ? { ...fallback, ...(exact.data as object) } : fallback;
  };
  return { hero: pick("hero", HOME_DEFAULTS.hero), banner_1: pick("banner_1", HOME_DEFAULTS.banner_1), banner_2: pick("banner_2", HOME_DEFAULTS.banner_2), testimonials: pick("testimonials", HOME_DEFAULTS.testimonials), instagram: pick("instagram", HOME_DEFAULTS.instagram) };
}
