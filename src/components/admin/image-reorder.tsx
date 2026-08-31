"use client";

import { useMemo, useState, useTransition } from "react";
import Image from "next/image";
import { reorderImages } from "@/server/admin/products";

export function ImageReorder({
  productId,
  images,
}: {
  productId: string;
  images: { id: string; url: string; kind: string }[];
}) {
  const initialOrder = useMemo(() => images.map((i) => i.id), [images]);
  const [order, setOrder] = useState(initialOrder);
  const [savedOrder, setSavedOrder] = useState(initialOrder);
  const [pending, startTransition] = useTransition();

  if (images.length < 2) return null;

  const dirty = order.join("|") !== savedOrder.join("|");

  const move = (index: number, direction: -1 | 1) => {
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= order.length) return;
    const next = [...order];
    [next[index], next[nextIndex]] = [next[nextIndex], next[index]];
    setOrder(next);
  };

  const makeMain = (id: string) => {
    setOrder((current) => [id, ...current.filter((imageId) => imageId !== id)]);
  };

  const save = () => {
    startTransition(async () => {
      await reorderImages(productId, order);
      setSavedOrder(order);
    });
  };

  return (
    <div className="rounded-2xl border border-sand bg-cream/50 p-3">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-sm font-semibold">Image order</p>
          <p className="text-xs text-ink-soft">The first image is the storefront main image.</p>
        </div>
        <div className="flex items-center gap-2">
          {dirty && <span className="rounded-pill bg-honey/20 px-2.5 py-1 text-xs font-medium text-amber-800">Unsaved changes</span>}
          <button
            type="button"
            disabled={!dirty || pending}
            onClick={save}
            className="h-9 rounded-pill bg-cocoa px-4 text-xs font-semibold text-cream disabled:cursor-not-allowed disabled:opacity-40"
          >
            {pending ? "Saving…" : "Save order"}
          </button>
        </div>
      </div>

      <div className={`grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 ${pending ? "pointer-events-none opacity-60" : ""}`}>
        {order.map((id, index) => {
          const image = images.find((item) => item.id === id);
          if (!image) return null;
          const isMain = index === 0;

          return (
            <div key={id} className={`overflow-hidden rounded-xl border bg-white ${isMain ? "border-cocoa ring-1 ring-cocoa" : "border-sand"}`}>
              <div className="relative aspect-square overflow-hidden bg-petal">
                <Image src={image.url} alt="" fill sizes="160px" className="object-cover" />
                <span className="absolute left-2 top-2 grid size-6 place-items-center rounded-full bg-white/90 text-[11px] font-semibold shadow-sm">
                  {index + 1}
                </span>
                {isMain && (
                  <span className="absolute bottom-2 left-2 rounded-pill bg-cocoa px-2 py-1 text-[10px] font-semibold text-cream">
                    MAIN
                  </span>
                )}
                {!isMain && image.kind !== "GALLERY" && (
                  <span className="absolute bottom-2 right-2 rounded-pill bg-white/90 px-2 py-1 text-[9px] font-medium text-ink shadow-sm">
                    {image.kind.replaceAll("_", " ")}
                  </span>
                )}
              </div>

              <div className="space-y-2 p-2">
                {!isMain && (
                  <button
                    type="button"
                    onClick={() => makeMain(id)}
                    className="w-full rounded-lg bg-petal px-2 py-1.5 text-[11px] font-semibold text-cocoa hover:bg-peach/50"
                  >
                    Make main
                  </button>
                )}
                <div className="grid grid-cols-2 gap-1">
                  <button
                    type="button"
                    disabled={index === 0}
                    onClick={() => move(index, -1)}
                    className="rounded-lg border border-sand px-2 py-1.5 text-xs disabled:opacity-30"
                    aria-label="Move image left"
                  >
                    ←
                  </button>
                  <button
                    type="button"
                    disabled={index === order.length - 1}
                    onClick={() => move(index, 1)}
                    className="rounded-lg border border-sand px-2 py-1.5 text-xs disabled:opacity-30"
                    aria-label="Move image right"
                  >
                    →
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
