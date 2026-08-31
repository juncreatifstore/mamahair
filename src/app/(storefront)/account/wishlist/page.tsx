import Link from "next/link";
import Image from "next/image";
import { getWishlist, removeFromWishlist } from "@/server/wishlist";
import { getT } from "@/i18n/server";
import { formatCents } from "@/lib/money";

export default async function WishlistPage() {
  const [items, t] = await Promise.all([getWishlist(), getT()]);
  return (
    <div>
      <h2 className="text-2xl text-cocoa">{t.account.wishlist}</h2>
      {items.length === 0 ? <p className="mt-4 text-ink-soft">{t.account.emptyWishlist}</p> : (
        <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((w) => (
            <li key={w.id} className="rounded-3xl bg-white p-4">
              <Link href={`/products/${w.product.slug}`} className="block"><div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-petal">{w.product.images[0] && <Image src={w.product.images[0].url} alt={w.product.images[0].alt ?? ""} fill sizes="300px" className="object-cover" />}</div><p className="mt-3 font-medium">{w.product.name}</p><p className="text-sm text-cocoa">{formatCents(w.variant?.priceCents ?? w.product.basePriceCents, w.product.currency)}</p></Link>
              <form action={removeFromWishlist.bind(null, w.product.id)} className="mt-2"><button className="text-xs underline text-ink-soft">{t.cart.remove}</button></form>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
