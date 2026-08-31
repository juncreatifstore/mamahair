"use client";
import Image from "next/image";
import Link from "next/link";
import { useState, useTransition } from "react";
import { removeCartItem, updateCartItem } from "@/server/cart";
import { toggleWishlist } from "@/server/wishlist";
import { formatCents } from "@/lib/money";

type Item = { id: string; quantity: number; variant: { name: string; priceCents: number; image: { url: string } | null; product: { id: string; name: string; slug: string; images: { url: string }[] } } };

export function CartLine({ item, currency, labels }: { item: Item; currency: string; labels: { remove: string; wishlist: string } }) {
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);
  const img = item.variant.image?.url ?? item.variant.product.images[0]?.url;
  const upd = (q: number) => start(async () => { const r = await updateCartItem(item.id, q); setErr(r?.error ?? null); });
  return (
    <div className={`flex gap-4 py-5 ${pending ? "opacity-50" : ""}`}>
      <div className="relative size-24 shrink-0 overflow-hidden rounded-2xl bg-petal">{img && <Image src={img} alt="" fill sizes="96px" className="object-cover" />}</div>
      <div className="flex flex-1 flex-col">
        <div className="flex justify-between gap-3">
          <div><Link href={`/products/${item.variant.product.slug}`} className="font-medium hover:text-flame">{item.variant.product.name}</Link><p className="text-sm text-ink-soft">{item.variant.name}</p></div>
          <p className="font-semibold text-cocoa">{formatCents(item.variant.priceCents * item.quantity, currency)}</p>
        </div>
        {err && <p className="text-xs text-red-700">{err}</p>}
        <div className="mt-auto flex flex-wrap items-center gap-4 text-sm">
          <div className="flex h-9 items-center rounded-pill border border-sand bg-white"><button className="px-3" onClick={() => upd(item.quantity - 1)}>−</button><span className="w-5 text-center">{item.quantity}</span><button className="px-3" onClick={() => upd(item.quantity + 1)}>+</button></div>
          <button className="text-ink-soft underline hover:text-ink" onClick={() => start(() => removeCartItem(item.id))}>{labels.remove}</button>
          <button className="text-ink-soft underline hover:text-ink" onClick={() => start(async () => { await toggleWishlist(item.variant.product.id); await removeCartItem(item.id); })}>{labels.wishlist}</button>
        </div>
      </div>
    </div>
  );
}
