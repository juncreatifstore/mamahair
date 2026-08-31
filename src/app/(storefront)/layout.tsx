import { Header } from "@/components/storefront/header";
import { Footer } from "@/components/storefront/footer";
import { WishlistSync } from "@/components/storefront/wishlist-button";
import { getCurrentUser } from "@/lib/auth";

export default async function StorefrontLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  return (
    <>
      <Header />
      <main>{children}</main>
      <Footer />
      <WishlistSync loggedIn={!!user} />
    </>
  );
}
