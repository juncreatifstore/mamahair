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
    <div className="space-y-4">
      <div className="relative aspect-[4/5] overflow-hidden rounded-[32px] border border-sand bg-petal shadow-[0_20px_70px_rgba(74,27,12,0.07)]">
        {cur ? (
          <Image src={cur.url} alt={cur.alt ?? name} fill priority sizes="(max-width: 768px) 100vw, 50vw" className="object-cover transition duration-500" />
        ) : (
          <div className="grid h-full place-items-center"><span className="display text-8xl text-cocoa/25">{name.charAt(0)}</span></div>
        )}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-cocoa/10 to-transparent" />
        {cur?.kind && cur.kind !== "MAIN" && cur.kind !== "GALLERY" && (
          <span className="absolute left-4 top-4 rounded-full border border-white/60 bg-white/90 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-cocoa backdrop-blur">
            {cur.kind.replaceAll("_", " ")}
          </span>
        )}
        {images.length > 1 && <span className="absolute bottom-4 right-4 rounded-full bg-cocoa/85 px-3 py-1.5 text-[11px] font-semibold text-cream backdrop-blur">{i + 1} / {images.length}</span>}
      </div>

      {images.length > 1 && (
        <div className="no-scrollbar flex gap-2.5 overflow-x-auto pb-1">
          {images.map((img, idx) => (
            <button
              key={img.id}
              type="button"
              onClick={() => setI(idx)}
              aria-label={`Image ${idx + 1}`}
              className={cn(
                "relative aspect-[4/5] w-[76px] shrink-0 overflow-hidden rounded-2xl border bg-petal transition sm:w-[88px]",
                idx === i ? "border-cocoa ring-1 ring-cocoa" : "border-sand opacity-75 hover:opacity-100",
              )}
            >
              <Image src={img.url} alt="" fill sizes="88px" className="object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
