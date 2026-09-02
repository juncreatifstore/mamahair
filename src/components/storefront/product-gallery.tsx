"use client";
import { useEffect, useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
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
  const move = (dir: -1 | 1) => {
    if (images.length < 2) return;
    setI((current) => (current + dir + images.length) % images.length);
  };

  return (
    <div className="space-y-3 sm:space-y-4">
      <div className="relative aspect-[4/5] overflow-hidden rounded-[1.6rem] border border-sand bg-petal shadow-[0_20px_70px_rgba(74,27,12,0.07)] sm:rounded-[2rem]">
        {cur ? (
          <Image src={cur.url} alt={cur.alt ?? name} fill priority sizes="(max-width: 768px) 100vw, 55vw" className="object-cover transition duration-500" />
        ) : (
          <div className="grid h-full place-items-center"><span className="display text-8xl text-cocoa/25">{name.charAt(0)}</span></div>
        )}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-cocoa/15 to-transparent" />

        {cur?.kind && cur.kind !== "MAIN" && cur.kind !== "GALLERY" && (
          <span className="absolute left-3 top-3 rounded-full border border-white/60 bg-white/90 px-3 py-1.5 text-[9px] font-bold uppercase tracking-[0.12em] text-cocoa backdrop-blur sm:left-4 sm:top-4 sm:text-[10px]">
            {cur.kind.replaceAll("_", " ")}
          </span>
        )}

        {images.length > 1 && (
          <>
            <button type="button" aria-label="Previous image" onClick={() => move(-1)} className="absolute left-3 top-1/2 grid size-10 -translate-y-1/2 place-items-center rounded-full bg-white/88 text-cocoa shadow-md backdrop-blur transition hover:bg-white sm:left-4 sm:size-11">
              <ChevronLeft className="size-5" />
            </button>
            <button type="button" aria-label="Next image" onClick={() => move(1)} className="absolute right-3 top-1/2 grid size-10 -translate-y-1/2 place-items-center rounded-full bg-white/88 text-cocoa shadow-md backdrop-blur transition hover:bg-white sm:right-4 sm:size-11">
              <ChevronRight className="size-5" />
            </button>
            <span className="absolute bottom-3 right-3 rounded-full bg-cocoa/85 px-3 py-1.5 text-[10px] font-semibold text-cream backdrop-blur sm:bottom-4 sm:right-4 sm:text-[11px]">{i + 1} / {images.length}</span>
          </>
        )}
      </div>

      {images.length > 1 && (
        <div className="no-scrollbar -mx-4 flex gap-2.5 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0">
          {images.map((img, idx) => (
            <button
              key={img.id}
              type="button"
              onClick={() => setI(idx)}
              aria-label={`Image ${idx + 1}`}
              className={cn(
                "relative aspect-[4/5] w-[70px] shrink-0 overflow-hidden rounded-[1rem] border bg-petal transition sm:w-[88px] sm:rounded-2xl",
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
