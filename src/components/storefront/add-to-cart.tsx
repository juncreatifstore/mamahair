"use client";
import { useMemo, useState, useTransition } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { addToCart } from "@/server/cart";
import { Button } from "@/components/ui/button";
import { formatCents } from "@/lib/money";
import { cn } from "@/lib/utils";
import { OPTION_KEYS, OPTION_LABELS, type OptionKey } from "@/lib/catalog";
import { useVariantImage } from "./variant-image-context";

type V = { id: string; name: string; sku: string; priceCents: number; compareAtCents: number | null; isDefault: boolean; options: unknown; inventory: { quantity: number; reserved: number } | null; image: { url: string } | null };

/** Sélecteur d'options par axe (texture, longueur, densité, lace, couleur…) → variante → ajout panier. */
export function AddToCart({ variants, currency, labels, onVariantChange }: { variants: V[]; currency: string; labels: { add: string; added: string; out: string; choose: string; onlyLeft: string }; onVariantChange?: (v: V) => void }) {
  const opts = (v: V) => (v.options ?? {}) as Record<string, string>;
  const axes = useMemo(() => OPTION_KEYS.filter((k) => variants.some((v) => opts(v)[k])).map((k) => ({ key: k, values: [...new Set(variants.map((v) => opts(v)[k]).filter(Boolean))] })), [variants]);
  const initial = variants.find((v) => v.isDefault) ?? variants[0];
  const [sel, setSel] = useState<Record<string, string>>(initial ? opts(initial) : {});
  const [qty, setQty] = useState(1);
  const [msg, setMsg] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const router = useRouter();
  const variantImage = useVariantImage();

  const inStock = (v: V) => (v.inventory?.quantity ?? 0) - (v.inventory?.reserved ?? 0) > 0;
  const match = axes.length === 0 ? initial : variants.find((v) => axes.every((a) => opts(v)[a.key] === sel[a.key]));
  const available = match ? Math.max(0, (match.inventory?.quantity ?? 0) - (match.inventory?.reserved ?? 0)) : 0;

  const candidatesFor = (key: OptionKey, value: string) => variants.filter((v) => {
    const o = opts(v);
    if (o[key] !== value) return false;
    return axes.every((a) => a.key === key || !sel[a.key] || o[a.key] === sel[a.key]);
  });

  const optionAvailable = (key: OptionKey, value: string) => candidatesFor(key, value).some(inStock);
  const optionImage = (key: OptionKey, value: string) => candidatesFor(key, value).find((v) => v.image?.url)?.image?.url ?? variants.find((v) => opts(v)[key] === value && v.image?.url)?.image?.url ?? null;

  const pick = (key: OptionKey, value: string) => {
    if (!optionAvailable(key, value)) return;
    const next = { ...sel, [key]: value };
    let nv = variants.find((v) => axes.every((a) => opts(v)[a.key] === next[a.key]) && inStock(v));

    if (!nv) {
      nv = variants.find((v) => opts(v)[key] === value && inStock(v));
      if (nv) Object.assign(next, opts(nv));
    }

    setSel(next);
    setQty(1);
    setMsg(null);
    if (nv) {
      variantImage?.setSelectedImageUrl(nv.image?.url ?? null);
      onVariantChange?.(nv);
    }
  };

  return (
    <div className="space-y-5">
      {axes.length > 0 && <p className="text-sm font-medium">{labels.choose}</p>}
      {axes.map((a) => (
        <div key={a.key}>
          <div className="mb-2 flex items-center justify-between gap-3">
            <p className="text-xs text-ink-soft">{OPTION_LABELS[a.key]}: <span className="font-medium text-ink">{a.key === "length" ? `${sel[a.key]}\"` : sel[a.key]}</span></p>
          </div>
          <div className="flex flex-wrap gap-2">
            {a.values.map((value) => {
              const selected = sel[a.key] === value;
              const enabled = optionAvailable(a.key, value);
              const thumb = a.key === "color" ? optionImage(a.key, value) : null;
              return (
                <button
                  key={value}
                  type="button"
                  disabled={!enabled}
                  onClick={() => pick(a.key, value)}
                  aria-pressed={selected}
                  className={cn(
                    "group inline-flex min-h-11 items-center gap-2 rounded-pill border px-3.5 py-2 text-sm transition",
                    selected ? "border-cocoa bg-cocoa text-cream shadow-sm" : "border-sand bg-white hover:border-cocoa/50 hover:bg-petal/40",
                    !enabled && "cursor-not-allowed opacity-40 line-through hover:border-sand hover:bg-white",
                  )}
                >
                  {thumb && <span className="relative size-7 overflow-hidden rounded-full border border-sand bg-petal"><Image src={thumb} alt="" fill sizes="28px" className="object-cover" /></span>}
                  <span>{a.key === "length" ? `${value}\"` : value}</span>
                </button>
              );
            })}
          </div>
        </div>
      ))}

      {match && (
        <div className="rounded-2xl bg-petal/60 p-4">
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <p className="text-2xl font-semibold text-cocoa">{formatCents(match.priceCents, currency)}</p>
            {match.compareAtCents && match.compareAtCents > match.priceCents && <span className="text-base text-ink-soft line-through">{formatCents(match.compareAtCents, currency)}</span>}
          </div>
          <p className="mt-1 text-xs text-ink-soft">{match.name} · SKU {match.sku}</p>
          <p className={cn("mt-2 text-xs font-medium", available > 0 ? "text-green-700" : "text-red-700")}>{available > 0 ? `${available} available` : labels.out}</p>
        </div>
      )}

      <div className="flex items-center gap-3">
        <div className="flex h-12 items-center rounded-pill border border-sand bg-white">
          <button type="button" aria-label="Decrease" onClick={() => setQty((q) => Math.max(1, q - 1))} className="px-4 text-lg">−</button>
          <span className="w-6 text-center text-sm font-semibold">{qty}</span>
          <button type="button" aria-label="Increase" onClick={() => setQty((q) => Math.min(Math.max(1, available), q + 1))} disabled={available <= 0 || qty >= available} className="px-4 text-lg disabled:opacity-40">+</button>
        </div>
        <Button size="lg" className="flex-1" disabled={pending || !match || available <= 0} onClick={() => match && start(async () => { const res = await addToCart(match.id, qty); setMsg(res.error ?? labels.added); if (!res.error) router.refresh(); })}>
          {!match || available <= 0 ? labels.out : pending ? "…" : labels.add}
        </Button>
      </div>
      {msg && <p className="text-sm text-flame" role="status">{msg}</p>}
      {available > 0 && available <= 5 && <p className="text-xs text-ink-soft">{labels.onlyLeft.replace("{n}", String(available))}</p>}
    </div>
  );
}
