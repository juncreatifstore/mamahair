"use client";

import { useMemo, useState, useTransition } from "react";
import Image from "next/image";
import { GripVertical, ImageIcon, MoveLeft, MoveRight, Star } from "lucide-react";
import { reorderProductImages } from "@/server/admin/product-images";

const KIND_LABELS: Record<string, string> = {
  MAIN: "Main",
  GALLERY: "Gallery",
  VARIANT: "Variant",
  WORN: "Worn / model",
  LACE_DETAIL: "Lace detail",
  TEXTURE: "Texture",
  PACKAGING: "Packaging",
};

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
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  if (images.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-sand bg-cream/40 p-8 text-center">
        <ImageIcon className="mx-auto size-8 text-cocoa/40" />
        <p className="mt-3 text-sm font-semibold text-cocoa">No product photos yet</p>
        <p className="mt-1 text-xs text-ink-soft">Upload product photos below to build the storefront gallery.</p>
      </div>
    );
  }

  const dirty = order.join("|") !== savedOrder.join("|");

  const move = (index: number, direction: -1 | 1) => {
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= order.length) return;
    const next = [...order];
    [next[index], next[nextIndex]] = [next[nextIndex], next[index]];
    setOrder(next);
    setError(null);
  };

  const makeMain = (id: string) => {
    setOrder((current) => [id, ...current.filter((imageId) => imageId !== id)]);
    setError(null);
  };

  const moveBefore = (sourceId: string, targetId: string) => {
    if (sourceId === targetId) return;
    setOrder((current) => {
      const next = current.filter((id) => id !== sourceId);
      const targetIndex = next.indexOf(targetId);
      if (targetIndex < 0) return current;
      next.splice(targetIndex, 0, sourceId);
      return next;
    });
    setError(null);
  };

  const save = () => {
    startTransition(async () => {
      const result = await reorderProductImages(productId, order);
      if (result?.error) {
        setError(result.error);
        return;
      }
      setSavedOrder([...order]);
      setError(null);
    });
  };

  return (
    <div className="rounded-[1.5rem] border border-sand bg-cream/40 p-3 sm:p-4">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-cocoa">Storefront gallery</p>
          <p className="mt-0.5 max-w-2xl text-xs leading-5 text-ink-soft">
            Drag photos to reorder them. The first photo becomes the main product image shown on cards and product pages.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {dirty && <span className="rounded-full bg-honey/20 px-2.5 py-1 text-[11px] font-semibold text-amber-800">Unsaved order</span>}
          <button
            type="button"
            disabled={!dirty || pending}
            onClick={save}
            className="h-9 rounded-full bg-cocoa px-4 text-xs font-semibold text-cream transition hover:bg-cocoa-deep disabled:cursor-not-allowed disabled:opacity-40"
          >
            {pending ? "Saving…" : "Save image order"}
          </button>
        </div>
      </div>

      {error && <p className="mb-3 rounded-xl bg-red-50 px-3 py-2 text-xs text-red-800" role="alert">{error}</p>}

      <div className={`grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5 ${pending ? "pointer-events-none opacity-60" : ""}`}>
        {order.map((id, index) => {
          const image = images.find((item) => item.id === id);
          if (!image) return null;
          const isMain = index === 0;
          const isDragging = draggedId === id;
          const isOver = overId === id && draggedId !== id;

          return (
            <div
              key={id}
              draggable
              onDragStart={(event) => {
                setDraggedId(id);
                event.dataTransfer.effectAllowed = "move";
                event.dataTransfer.setData("text/plain", id);
              }}
              onDragOver={(event) => {
                event.preventDefault();
                event.dataTransfer.dropEffect = "move";
                setOverId(id);
              }}
              onDragLeave={() => setOverId((current) => current === id ? null : current)}
              onDrop={(event) => {
                event.preventDefault();
                const sourceId = event.dataTransfer.getData("text/plain") || draggedId;
                if (sourceId) moveBefore(sourceId, id);
                setDraggedId(null);
                setOverId(null);
              }}
              onDragEnd={() => {
                setDraggedId(null);
                setOverId(null);
              }}
              className={`group overflow-hidden rounded-2xl border bg-white transition ${isMain ? "border-cocoa shadow-[0_10px_30px_rgba(74,27,12,.08)] ring-1 ring-cocoa/20" : "border-sand"} ${isDragging ? "scale-[.98] opacity-45" : ""} ${isOver ? "ring-2 ring-flame/60" : ""}`}
            >
              <div className="relative aspect-[4/5] overflow-hidden bg-petal">
                <Image src={image.url} alt="" fill sizes="(max-width: 640px) 50vw, 220px" className="object-cover" />
                <div className="absolute inset-x-2 top-2 flex items-start justify-between gap-2">
                  <span className="inline-flex items-center gap-1 rounded-full bg-white/95 px-2 py-1 text-[10px] font-bold text-cocoa shadow-sm">
                    <GripVertical className="size-3" /> #{index + 1}
                  </span>
                  <span className="rounded-full bg-white/95 px-2 py-1 text-[9px] font-bold uppercase tracking-[.04em] text-ink shadow-sm">
                    {isMain ? "MAIN" : KIND_LABELS[image.kind] ?? image.kind.replaceAll("_", " ")}
                  </span>
                </div>
                {isMain && (
                  <div className="absolute inset-x-2 bottom-2 flex items-center gap-1 rounded-full bg-cocoa/95 px-2.5 py-1.5 text-[10px] font-semibold text-cream shadow-sm">
                    <Star className="size-3 fill-current" /> Main storefront photo
                  </div>
                )}
              </div>

              <div className="space-y-2 p-2.5">
                {!isMain && (
                  <button
                    type="button"
                    onClick={() => makeMain(id)}
                    className="w-full rounded-xl bg-petal px-2 py-2 text-[11px] font-semibold text-cocoa transition hover:bg-peach/60"
                  >
                    Make main photo
                  </button>
                )}
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    type="button"
                    disabled={index === 0}
                    onClick={() => move(index, -1)}
                    className="inline-flex items-center justify-center gap-1 rounded-xl border border-sand px-2 py-2 text-[11px] disabled:opacity-30"
                    aria-label="Move image left"
                  >
                    <MoveLeft className="size-3.5" /> Earlier
                  </button>
                  <button
                    type="button"
                    disabled={index === order.length - 1}
                    onClick={() => move(index, 1)}
                    className="inline-flex items-center justify-center gap-1 rounded-xl border border-sand px-2 py-2 text-[11px] disabled:opacity-30"
                    aria-label="Move image right"
                  >
                    Later <MoveRight className="size-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-4 grid gap-2 text-[11px] text-ink-soft sm:grid-cols-3">
        <p className="rounded-xl bg-white px-3 py-2"><strong className="text-cocoa">Recommended:</strong> 1200 × 1500 px or another 4:5 portrait ratio.</p>
        <p className="rounded-xl bg-white px-3 py-2"><strong className="text-cocoa">Main photo:</strong> clean product view with consistent lighting and background.</p>
        <p className="rounded-xl bg-white px-3 py-2"><strong className="text-cocoa">Gallery:</strong> add worn, lace-detail, texture and packaging photos when relevant.</p>
      </div>
    </div>
  );
}
