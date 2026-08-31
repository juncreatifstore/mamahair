import type { Metadata } from "next";
import { cookies } from "next/headers";
import { Playfair_Display, Poppins } from "next/font/google";
import "./globals.css";

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  weight: ["400", "500", "600"],
  display: "swap",
});

const poppins = Poppins({
  subsets: ["latin"],
  variable: "--font-poppins",
  weight: ["400", "500", "600"],
  display: "swap",
});

const FALLBACK_SITE_URL = "https://mamahair.vercel.app";
const SUPPORTED_LOCALES = new Set(["en", "es", "fr", "ht"]);

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

const SITE_URL = getSiteUrl();

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "MAMAHAIR — Premium wigs, bundles & hair care",
    template: "%s — MAMAHAIR",
  },
  description:
    "Premium human hair wigs, bundles, closures, frontals and hair care for textured hair.",
  applicationName: "MAMAHAIR",
  alternates: { canonical: "/" },
  icons: {
    icon: "/icon.svg",
    shortcut: "/icon.svg",
  },
  openGraph: {
    type: "website",
    url: "/",
    siteName: "MAMAHAIR",
    title: "MAMAHAIR — Premium wigs, bundles & hair care",
    description:
      "Premium human hair wigs, bundles, closures, frontals and hair care for textured hair.",
  },
  twitter: {
    card: "summary_large_image",
    title: "MAMAHAIR — Premium wigs, bundles & hair care",
    description:
      "Premium human hair wigs, bundles, closures, frontals and hair care for textured hair.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const requestedLocale = cookieStore.get("locale")?.value?.toLowerCase();
  const locale = requestedLocale && SUPPORTED_LOCALES.has(requestedLocale) ? requestedLocale : "en";

  const organizationLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "MAMAHAIR",
    url: SITE_URL,
  };

  return (
    <html lang={locale} className={`${playfair.variable} ${poppins.variable}`}>
      <body className="min-h-screen">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationLd) }}
        />
        {children}
      </body>
    </html>
  );
}
