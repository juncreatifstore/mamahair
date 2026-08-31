import type { Metadata } from "next";
import { Playfair_Display, Poppins } from "next/font/google";
import { getBrand } from "@/lib/settings";
import { getLocale } from "@/i18n/server";
import "./globals.css";

const playfair = Playfair_Display({ subsets: ["latin"], variable: "--font-playfair", weight: ["400", "500", "600"], display: "swap" });
const poppins = Poppins({ subsets: ["latin"], variable: "--font-poppins", weight: ["400", "500", "600"], display: "swap" });

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export async function generateMetadata(): Promise<Metadata> {
  const b = await getBrand();
  return {
    metadataBase: new URL(SITE),
    title: { default: b.seo.defaultTitle, template: `%s — ${b.storeName}` },
    description: b.seo.defaultDescription,
    icons: b.branding.faviconUrl ? { icon: b.branding.faviconUrl } : undefined,
    openGraph: { type: "website", siteName: b.storeName, images: b.seo.ogImageUrl ? [b.seo.ogImageUrl] : undefined },
    twitter: { card: "summary_large_image", site: b.seo.twitterHandle || undefined },
    alternates: { canonical: "./" },
  };
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const [locale, b] = await Promise.all([getLocale(), getBrand()]);
  const orgLd = {
    "@context": "https://schema.org", "@type": "Organization", name: b.companyName, url: SITE, logo: b.branding.logoUrl || undefined,
    contactPoint: b.contact.email ? { "@type": "ContactPoint", email: b.contact.email, telephone: b.contact.phone || undefined, contactType: "customer service" } : undefined,
    sameAs: Object.values(b.social).filter(Boolean),
  };
  return (
    <html lang={locale} className={`${playfair.variable} ${poppins.variable}`}>
      <body className="min-h-screen">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(orgLd) }} />
        {children}
      </body>
    </html>
  );
}
