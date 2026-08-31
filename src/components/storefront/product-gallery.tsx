"use client";
import { useEffect, useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { useVariantImage } from "./variant-image-context";

export function ProductGallery({ images, name }: { images: { id: string; url: string; alt: string | null; kind: string }[]; name: string }) {
  const [i, setI] = useState(0);
  const variantImage = useVariantImage();

  useEffect(() => {
    if (!variantImage?.selectedImageUrl) return;
    const idx = images.findIndex((img) => img.url === variantImage.selectedImageUrl);
    if (idx >= 0) setI(idx);
  }, [images, variantImage?.selectedImageUrl]);

  const cur = images[i];
  return (
    <div className="space-y-3">
      <div className="relative aspect-[4/5] overflow-hidden rounded-3xl bg-petal">
        {cur ? <Image src={cur.url} alt={cur.alt ?? name} fill priority sizes="(max-width: 768px) 100vw, 50vw" className="object-cover" /> : <div className="grid h-full place-items-center"><span className="display text-8xl text-cocoa/25">{name.charAt(0)}</span></div>}
        {cur?.kind && cur.kind !== "MAIN" && cur.kind !== "GALLERY" && <span className="absolute left-3 top-3 rounded-pill bg-cream/90 px-2.5 py-1 text-[11px] font-medium">{cur.kind.replace("_", " ").toLowerCase()}</span>}
      </div>
      {images.length > 1 && (
        <div className="no-scrollbar flex gap-2 overflow-x-auto">
          {images.map((img, idx) => <button key={img.id} onClick={() => setI(idx)} aria-label={`Image ${idx + 1}`} className={cn("relative size-20 shrink-0 overflow-hidden rounded-xl border-2 bg-petal", idx === i ? "border-cocoa" : "border-transparent")}><Image src={img.url} alt="" fill sizes="80px" className="object-cover" /></button>)}
        </div>
      )}
    </div>
  );
}
