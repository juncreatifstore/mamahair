import type { MetadataRoute } from "next";

const FALLBACK_SITE_URL = "https://mamahair.vercel.app";

function getBaseUrl() {
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

export default function robots(): MetadataRoute.Robots {
  const base = getBaseUrl();
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/account", "/checkout", "/cart", "/api", "/search", "/login", "/register", "/forgot-password", "/reset-password"],
    },
    sitemap: `${base}/sitemap.xml`,
    host: base,
  };
}
