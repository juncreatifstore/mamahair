import type { CSSProperties } from "react";
import { Header } from "@/components/storefront/header";
import { Footer } from "@/components/storefront/footer";
import { WishlistSync } from "@/components/storefront/wishlist-button";
import { getCurrentUser } from "@/lib/auth";
import { getBrand } from "@/lib/settings";

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
