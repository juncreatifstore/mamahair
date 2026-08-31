import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight } from "lucide-react";
import { formatCents } from "@/lib/money";
import type { ProductCardData } from "@/server/products";
import { WishlistButton } from "./wishlist-button";

export function ProductCard({ p, saved, labels }: { p: ProductCardData; saved?: boolean; labels?: { save: string; saved: string } }) {
  const [img, img2] = p.images;
  const onSale = p.compareAtCents != null && p.compareAtCents > p.basePriceCents;

  return (
    <article className="group relative">
      <div className="relative overflow-hidden rounded-[1.4rem] bg-white shadow-[0_12px_35px_rgba(74,27,12,0.06)] ring-1 ring-sand/70 transition duration-300 hover:-translate-y-1 hover:shadow-[0_20px_48px_rgba(74,27,12,0.11)]">
        <Link href={`/products/${p.slug}`} className="block">
          <div className="relative aspect-[4/5] overflow-hidden bg-petal">
            {img ? (
              <>
                <Image src={img.url} alt={img.alt ?? p.name} fill sizes="(max-width: 768px) 50vw, 25vw" className={`object-cover transition duration-500 group-hover:scale-[1.035] ${img2 ? "group-hover:opacity-0" : ""}`} />
                {img2 && <Image src={img2.url} alt="" fill sizes="(max-width: 768px) 50vw, 25vw" className="object-cover opacity-0 transition duration-500 group-hover:scale-[1.035] group-hover:opacity-100" />}
              </>
            ) : (
              <div className="grid h-full place-items-center bg-gradient-to-br from-petal to-peach/50"><span className="display text-6xl text-cocoa/20">{p.name.charAt(0)}</span></div>
            )}

            <div className="absolute left-3 top-3 flex flex-col items-start gap-1.5">
              {p.isNew && <span className="rounded-full bg-white/95 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.1em] text-cocoa shadow-sm backdrop-blur">New</span>}
              {p.isBestSeller && <span className="rounded-full bg-cocoa px-3 py-1 text-[10px] font-bold uppercase tracking-[0.1em] text-cream shadow-sm">Best seller</span>}
              {onSale && <span className="rounded-full bg-flame px-3 py-1 text-[10px] font-bold uppercase tracking-[0.08em] text-white shadow-sm">Save {Math.round((1 - p.basePriceCents / p.compareAtCents!) * 100)}%</span>}
            </div>

            <div className="absolute inset-x-3 bottom-3 hidden translate-y-3 items-center justify-between rounded-full bg-white/92 px-4 py-2.5 text-xs font-semibold text-cocoa opacity-0 shadow-lg backdrop-blur transition duration-300 group-hover:translate-y-0 group-hover:opacity-100 sm:flex">
              <span>View product</span><ArrowUpRight className="size-4" />
            </div>
          </div>
        </Link>

        {labels && <div className="absolute right-3 top-3 z-10"><WishlistButton productId={p.id} saved={saved} labels={labels} compact /></div>}

        <div className="p-4 sm:p-5">
          <Link href={`/products/${p.slug}`} className="block font-body text-sm font-semibold leading-snug text-ink transition hover:text-flame sm:text-[15px]">{p.name}</Link>
          {p.textures.length > 0 && <p className="mt-1.5 min-h-4 text-[11px] uppercase tracking-[0.08em] text-ink-soft">{p.textures.slice(0, 2).join(" · ")}{p.lengths.length > 0 ? ` · ${Math.min(...p.lengths)}\"–${Math.max(...p.lengths)}\"` : ""}</p>}

          <div className="mt-3 flex items-end gap-2 border-t border-sand/70 pt-3">
            <span className="text-base font-bold text-cocoa">{formatCents(p.basePriceCents, p.currency)}</span>
            {onSale && <span className="pb-0.5 text-xs text-ink-soft line-through">{formatCents(p.compareAtCents!, p.currency)}</span>}
            {p.ratingCount > 0 && <span className="ml-auto pb-0.5 text-[11px] font-medium text-ink-soft">★ {p.ratingAvg?.toFixed(1)} <span className="opacity-70">({p.ratingCount})</span></span>}
          </div>
        </div>
      </div>
    </article>
  );
}
