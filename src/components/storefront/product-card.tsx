import Link from "next/link";
import Image from "next/image";
import { formatCents } from "@/lib/money";
import type { ProductCardData } from "@/server/products";
import { WishlistButton } from "./wishlist-button";

export function ProductCard({ p, saved, labels }: { p: ProductCardData; saved?: boolean; labels?: { save: string; saved: string } }) {
  const [img, img2] = p.images;
  const onSale = p.compareAtCents != null && p.compareAtCents > p.basePriceCents;
  return (
    <div className="group relative">
      <Link href={`/products/${p.slug}`} className="block">
        <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-petal">
          {img ? (
            <>
              <Image src={img.url} alt={img.alt ?? p.name} fill sizes="(max-width: 768px) 50vw, 25vw" className={`object-cover ${img2 ? "transition-opacity group-hover:opacity-0" : ""}`} />
              {img2 && <Image src={img2.url} alt="" fill sizes="(max-width: 768px) 50vw, 25vw" className="object-cover opacity-0 transition-opacity group-hover:opacity-100" />}
            </>
          ) : (
            <div className="grid h-full place-items-center"><span className="display text-5xl text-cocoa/25">{p.name.charAt(0)}</span></div>
          )}
          <div className="absolute left-3 top-3 flex flex-col gap-1">
            {p.isNew && <span className="rounded-pill bg-cream/95 px-2.5 py-1 text-[11px] font-semibold text-cocoa">New</span>}
            {p.isBestSeller && <span className="rounded-pill bg-cocoa px-2.5 py-1 text-[11px] font-semibold text-cream">Best seller</span>}
            {onSale && <span className="rounded-pill bg-flame px-2.5 py-1 text-[11px] font-semibold text-white">−{Math.round((1 - p.basePriceCents / p.compareAtCents!) * 100)}%</span>}
          </div>
        </div>
      </Link>
      {labels && <div className="absolute right-3 top-3"><WishlistButton productId={p.id} saved={saved} labels={labels} compact /></div>}
      <div className="mt-3">
        <Link href={`/products/${p.slug}`} className="block font-body text-sm font-medium leading-snug hover:text-flame sm:text-base">{p.name}</Link>
        {p.textures.length > 0 && <p className="mt-0.5 text-xs text-ink-soft">{p.textures.slice(0, 2).join(" · ")}{p.lengths.length > 0 ? ` · ${Math.min(...p.lengths)}"–${Math.max(...p.lengths)}"` : ""}</p>}
        <div className="mt-1 flex items-center gap-2 text-sm">
          <span className="font-semibold text-cocoa">{formatCents(p.basePriceCents, p.currency)}</span>
          {onSale && <span className="text-ink-soft line-through">{formatCents(p.compareAtCents!, p.currency)}</span>}
          {p.ratingCount > 0 && <span className="ml-auto text-xs text-ink-soft">★ {p.ratingAvg?.toFixed(1)} ({p.ratingCount})</span>}
        </div>
      </div>
    </div>
  );
}
