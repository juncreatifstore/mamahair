import type { Metadata } from "next";
import "./globals.css";

const FALLBACK_SITE_URL = "https://mamahair.vercel.app";

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

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const organizationLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "MAMAHAIR",
    url: SITE_URL,
  };

  return (
    <html lang="en">
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
