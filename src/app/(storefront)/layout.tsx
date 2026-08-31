import type { CSSProperties } from "react";
import type { Metadata } from "next";
import { Header } from "@/components/storefront/header";
import { Footer } from "@/components/storefront/footer";
import { WishlistSync } from "@/components/storefront/wishlist-button";
import { getCurrentUser } from "@/lib/auth";
import { getBrand } from "@/lib/settings";

const FALLBACK_SITE_URL = "https://mamahair.vercel.app";
const FALLBACK_TITLE = "MAMAHAIR — Premium wigs, bundles & hair care";
const FALLBACK_DESCRIPTION =
  "Premium human hair wigs, bundles, closures, frontals and hair care for textured hair.";

function getSiteUrl() {
  const raw = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (!raw) return FALLBACK_SITE_URL;
  try {
    const url = new URL(raw);
    if (url.protocol !== "http:" && url.protocol !== "https:") return FALLBACK_SITE_URL;
    return url.origin;
  } catch {
    return FALLBACK_SITE_URL;
  }
}

export async function generateMetadata(): Promise<Metadata> {
  const siteUrl = getSiteUrl();

  try {
    const brand = await getBrand();
    const title = brand.seo.defaultTitle || FALLBACK_TITLE;
    const description = brand.seo.defaultDescription || FALLBACK_DESCRIPTION;
    const storeName = brand.storeName || "MAMAHAIR";
    const ogImage = brand.seo.ogImageUrl?.trim();

    return {
      metadataBase: new URL(siteUrl),
      title: {
        default: title,
        template: `%s — ${storeName}`,
      },
      description,
      applicationName: storeName,
      alternates: { canonical: "/" },
      openGraph: {
        type: "website",
        url: "/",
        siteName: storeName,
        title,
        description,
        images: ogImage ? [ogImage] : undefined,
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
        site: brand.seo.twitterHandle || undefined,
        images: ogImage ? [ogImage] : undefined,
      },
    };
  } catch (error) {
    console.error("storefront metadata fallback", error);
    return {
      metadataBase: new URL(siteUrl),
      title: {
        default: FALLBACK_TITLE,
        template: "%s — MAMAHAIR",
      },
      description: FALLBACK_DESCRIPTION,
      applicationName: "MAMAHAIR",
      alternates: { canonical: "/" },
      openGraph: {
        type: "website",
        url: "/",
        siteName: "MAMAHAIR",
        title: FALLBACK_TITLE,
        description: FALLBACK_DESCRIPTION,
      },
      twitter: {
        card: "summary_large_image",
        title: FALLBACK_TITLE,
        description: FALLBACK_DESCRIPTION,
      },
    };
  }
}

export default async function StorefrontLayout({ children }: { children: React.ReactNode }) {
  const [user, brand] = await Promise.all([getCurrentUser(), getBrand()]);

  const brandStyle = {
    "--color-cocoa": brand.branding.primaryColor || "#4A1B0C",
    "--color-flame": brand.branding.accentColor || "#D85A30",
  } as CSSProperties;

  return (
    <div style={brandStyle}>
      <Header />
      <main>{children}</main>
      <Footer />
      <WishlistSync loggedIn={!!user} />
    </div>
  );
}
