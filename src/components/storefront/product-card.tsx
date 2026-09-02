import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight, Star } from "lucide-react";
import { formatCents } from "@/lib/money";
import type { ProductCardData } from "@/server/products";
import { WishlistButton } from "./wishlist-button";

export function ProductCard({ p, saved, labels }: { p: ProductCardData; saved?: boolean; labels?: { save: string; saved: string } }) {
  const [img, img2] = p.images;
  const onSale = p.compareAtCents != null && p.compareAtCents > p.basePriceCents;
  const discount = onSale ? Math.round((1 - p.basePriceCents / p.compareAtCents!) * 100) : 0;
  const minLength = p.lengths.length > 0 ? Math.min(...p.lengths) : null;
  const maxLength = p.lengths.length > 0 ? Math.max(...p.lengths) : null;

  return (
    <article className="group relative min-w-0">
      <div className="overflow-hidden rounded-[1.15rem] bg-white ring-1 ring-sand/80 transition duration-300 sm:rounded-[1.35rem] lg:hover:-translate-y-1 lg:hover:shadow-[0_18px_46px_rgba(74,27,12,0.10)]">
        <Link href={`/products/${p.slug}`} className="block">
          <div className="relative aspect-[4/5] overflow-hidden bg-[#f5ebe4]">
            {img ? (
              <>
                <Image
                  src={img.url}
                  alt={img.alt ?? p.name}
                  fill
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                  className={`object-cover transition duration-500 lg:group-hover:scale-[1.035] ${img2 ? "lg:group-hover:opacity-0" : ""}`}
                />
                {img2 && (
                  <Image
                    src={img2.url}
                    alt=""
                    fill
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                    className="object-cover opacity-0 transition duration-500 lg:group-hover:scale-[1.035] lg:group-hover:opacity-100"
                  />
                )}
              </>
            ) : (
              <div className="grid h-full place-items-center bg-gradient-to-br from-petal to-peach/50">
                <span className="display text-5xl text-cocoa/20 sm:text-6xl">{p.name.charAt(0)}</span>
              </div>
            )}

            <div className="absolute left-2 top-2 flex max-w-[70%] flex-col items-start gap-1 sm:left-3 sm:top-3 sm:gap-1.5">
              {p.isNew && <span className="rounded-full bg-white/95 px-2 py-1 text-[8px] font-bold uppercase tracking-[0.08em] text-cocoa shadow-sm backdrop-blur sm:px-3 sm:text-[9px]">New</span>}
              {p.isBestSeller && <span className="rounded-full bg-cocoa px-2 py-1 text-[8px] font-bold uppercase tracking-[0.08em] text-cream shadow-sm sm:px-3 sm:text-[9px]">Best seller</span>}
              {onSale && <span className="rounded-full bg-flame px-2 py-1 text-[8px] font-bold uppercase tracking-[0.07em] text-white shadow-sm sm:px-3 sm:text-[9px]">-{discount}%</span>}
            </div>

            <div className="absolute inset-x-3 bottom-3 hidden translate-y-3 items-center justify-between rounded-full bg-white/94 px-4 py-2.5 text-xs font-semibold text-cocoa opacity-0 shadow-lg backdrop-blur transition duration-300 lg:flex lg:group-hover:translate-y-0 lg:group-hover:opacity-100">
              <span>View product</span><ArrowUpRight className="size-4" />
            </div>
          </div>
        </Link>

        {labels && (
          <div className="absolute right-2 top-2 z-10 sm:right-3 sm:top-3">
            <WishlistButton productId={p.id} saved={saved} labels={labels} compact />
          </div>
        )}

        <div className="p-3 sm:p-4 lg:p-5">
          <div className="mb-1.5 flex items-center gap-1.5 text-[9px] font-semibold uppercase tracking-[0.08em] text-ink-soft sm:text-[10px]">
            {p.textures.length > 0 && <span className="truncate">{p.textures.slice(0, 2).join(" · ")}</span>}
            {minLength != null && maxLength != null && <><span className="opacity-40">•</span><span className="shrink-0">{minLength}&quot;–{maxLength}&quot;</span></>}
          </div>

          <Link href={`/products/${p.slug}`} className="block min-h-[2.4em] font-body text-[13px] font-semibold leading-[1.2] text-ink transition hover:text-flame sm:text-[14px] lg:text-[15px]">
            {p.name}
          </Link>

          {(p.salesCount > 0 || p.ratingCount > 0) && (
            <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-[9px] font-medium text-ink-soft sm:text-[10px]">
              {p.salesCount > 0 && <span className="rounded-full bg-petal px-2 py-1 text-cocoa">{p.salesCount.toLocaleString()} sold</span>}
              {p.ratingCount > 0 && <span className="inline-flex items-center gap-1"><Star className="size-3 fill-current text-flame" strokeWidth={1.4} />{p.ratingAvg?.toFixed(1)} <span className="opacity-60">({p.ratingCount})</span></span>}
            </div>
          )}

          <div className="mt-2.5 flex flex-wrap items-end gap-x-2 gap-y-1 border-t border-sand/70 pt-2.5 sm:mt-3 sm:pt-3">
            <span className="text-[15px] font-bold text-cocoa sm:text-base">{formatCents(p.basePriceCents, p.currency)}</span>
            {onSale && <span className="pb-0.5 text-[10px] text-ink-soft line-through sm:text-xs">{formatCents(p.compareAtCents!, p.currency)}</span>}
          </div>
        </div>
      </div>
    </article>
  );
}
