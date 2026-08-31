"use client";
import { useMemo, useState, useTransition } from "react";
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

  const match = axes.length === 0 ? initial : variants.find((v) => axes.every((a) => opts(v)[a.key] === sel[a.key]));
  const available = match ? Math.max(0, (match.inventory?.quantity ?? 0) - (match.inventory?.reserved ?? 0)) : 0;
  const pick = (key: OptionKey, value: string) => {
    const next = { ...sel, [key]: value };
    if (!variants.some((v) => axes.every((a) => opts(v)[a.key] === next[a.key]))) { const first = variants.find((v) => opts(v)[key] === value); if (first) Object.assign(next, opts(first)); }
    setSel(next); setMsg(null);
    const nv = variants.find((v) => axes.every((a) => opts(v)[a.key] === next[a.key]));
    if (nv) {
      variantImage?.setSelectedImageUrl(nv.image?.url ?? null);
      onVariantChange?.(nv);
    }
  };
  const isAvailable = (key: OptionKey, value: string) => variants.some((v) => opts(v)[key] === value && (v.inventory?.quantity ?? 0) - (v.inventory?.reserved ?? 0) > 0);

  return (
    <div className="space-y-5">
      {axes.length > 0 && <p className="text-sm font-medium">{labels.choose}</p>}
      {axes.map((a) => (
        <div key={a.key}>
          <p className="mb-2 text-xs text-ink-soft">{OPTION_LABELS[a.key]}: <span className="font-medium text-ink">{a.key === "length" ? `${sel[a.key]}\"` : sel[a.key]}</span></p>
          <div className="flex flex-wrap gap-2">
            {a.values.map((v) => <button key={v} onClick={() => pick(a.key, v)} className={cn("rounded-pill border px-4 py-2 text-sm", sel[a.key] === v ? "border-cocoa bg-cocoa text-cream" : "border-sand bg-white hover:border-cocoa/50", !isAvailable(a.key, v) && "opacity-50 line-through")}>{a.key === "length" ? `${v}\"` : v}</button>)}
          </div>
        </div>
      ))}
      {match && (
        <p className="text-2xl font-semibold text-cocoa">
          {formatCents(match.priceCents, currency)}
          {match.compareAtCents && match.compareAtCents > match.priceCents && <span className="ml-3 text-base font-normal text-ink-soft line-through">{formatCents(match.compareAtCents, currency)}</span>}
          <span className="ml-3 text-xs font-normal text-ink-soft">SKU {match.sku}</span>
        </p>
      )}
      <div className="flex items-center gap-3">
        <div className="flex h-12 items-center rounded-pill border border-sand bg-white">
          <button aria-label="Decrease" onClick={() => setQty((q) => Math.max(1, q - 1))} className="px-4 text-lg">−</button>
          <span className="w-6 text-center text-sm font-semibold">{qty}</span>
          <button aria-label="Increase" onClick={() => setQty((q) => Math.min(Math.max(1, available), q + 1))} className="px-4 text-lg">+</button>
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
