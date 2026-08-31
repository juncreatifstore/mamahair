"use client";
import { useState, useTransition } from "react";
import Image from "next/image";
import { reorderImages } from "@/server/admin/products";

/** Réorganisation par flèches (robuste sur mobile, sans dépendance drag-and-drop). */
export function ImageReorder({ productId, images }: { productId: string; images: { id: string; url: string; kind: string }[] }) {
  const [order, setOrder] = useState(images.map((i) => i.id));
  const [pending, start] = useTransition();
  if (images.length < 2) return null;
  const move = (i: number, dir: -1 | 1) => { const n = [...order]; const j = i + dir; if (j < 0 || j >= n.length) return; [n[i], n[j]] = [n[j], n[i]]; setOrder(n); };
  return (
    <div className={`flex flex-wrap items-center gap-2 ${pending ? "opacity-50" : ""}`}>
      {order.map((id, i) => { const im = images.find((x) => x.id === id)!; return <div key={id} className="flex flex-col items-center gap-1"><div className="relative size-16 overflow-hidden rounded-lg bg-petal"><Image src={im.url} alt="" fill sizes="64px" className="object-cover" />{i === 0 && <span className="absolute bottom-0 left-0 right-0 bg-cocoa/80 text-center text-[9px] text-cream">MAIN</span>}</div><div className="flex gap-1 text-xs"><button type="button" onClick={() => move(i, -1)} aria-label="Move left">←</button><button type="button" onClick={() => move(i, 1)} aria-label="Move right">→</button></div></div>; })}
      <button type="button" onClick={() => start(() => reorderImages(productId, order))} className="h-9 rounded-pill border border-sand bg-white px-3 text-xs">Save order</button>
    </div>
  );
}
