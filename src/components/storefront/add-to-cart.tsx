"use client";
import { useMemo, useState, useTransition } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Check, ShieldCheck, Truck } from "lucide-react";
import { addToCart } from "@/server/cart";
import { Button } from "@/components/ui/button";
import { formatCents } from "@/lib/money";
import { cn } from "@/lib/utils";
import { OPTION_KEYS, OPTION_LABELS, type OptionKey } from "@/lib/catalog";
import { useVariantImage } from "./variant-image-context";

type V = { id: string; name: string; sku: string; priceCents: number; compareAtCents: number | null; isDefault: boolean; options: unknown; inventory: { quantity: number; reserved: number } | null; image: { url: string } | null };

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
    <div className="rounded-[28px] border border-sand bg-white p-5 shadow-[0_18px_60px_rgba(74,27,12,0.05)] sm:p-6">
      {axes.length > 0 && <p className="text-sm font-semibold text-cocoa">{labels.choose}</p>}

      <div className="mt-4 space-y-5">
        {axes.map((a) => (
          <div key={a.key}>
            <div className="mb-2.5 flex items-center justify-between gap-3">
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-ink-soft">{OPTION_LABELS[a.key]}</p>
              <span className="text-xs font-medium text-cocoa">{a.key === "length" ? `${sel[a.key]}\"` : sel[a.key]}</span>
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
                      "group inline-flex min-h-11 items-center gap-2 rounded-full border px-3.5 py-2 text-sm transition",
                      selected ? "border-cocoa bg-cocoa text-cream shadow-sm" : "border-sand bg-white hover:border-cocoa/50 hover:bg-petal/40",
                      !enabled && "cursor-not-allowed opacity-35 line-through hover:border-sand hover:bg-white",
                    )}
                  >
                    {thumb && <span className="relative size-7 overflow-hidden rounded-full border border-white/70 bg-petal"><Image src={thumb} alt="" fill sizes="28px" className="object-cover" /></span>}
                    <span>{a.key === "length" ? `${value}\"` : value}</span>
                    {selected && <Check className="size-3.5" />}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {match && (
        <div className="mt-6 rounded-2xl bg-cream p-4 ring-1 ring-sand/70">
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <p className="text-2xl font-semibold text-cocoa">{formatCents(match.priceCents, currency)}</p>
            {match.compareAtCents && match.compareAtCents > match.priceCents && <span className="text-sm text-ink-soft line-through">{formatCents(match.compareAtCents, currency)}</span>}
          </div>
          <div className="mt-1.5 flex flex-wrap items-center justify-between gap-2 text-xs">
            <p className="text-ink-soft">{match.name} · SKU {match.sku}</p>
            <p className={cn("font-semibold", available > 0 ? "text-green-700" : "text-red-700")}>{available > 0 ? `${available} available` : labels.out}</p>
          </div>
        </div>
      )}

      <div className="mt-5 flex items-center gap-3">
        <div className="flex h-12 items-center rounded-full border border-sand bg-white">
          <button type="button" aria-label="Decrease" onClick={() => setQty((q) => Math.max(1, q - 1))} className="px-4 text-lg">−</button>
          <span className="w-6 text-center text-sm font-semibold">{qty}</span>
          <button type="button" aria-label="Increase" onClick={() => setQty((q) => Math.min(Math.max(1, available), q + 1))} disabled={available <= 0 || qty >= available} className="px-4 text-lg disabled:opacity-40">+</button>
        </div>
        <Button size="lg" className="flex-1 shadow-[0_12px_30px_rgba(216,90,48,0.18)]" disabled={pending || !match || available <= 0} onClick={() => match && start(async () => { const res = await addToCart(match.id, qty); setMsg(res.error ?? labels.added); if (!res.error) router.refresh(); })}>
          {!match || available <= 0 ? labels.out : pending ? "…" : labels.add}
        </Button>
      </div>

      {msg && <p className="mt-3 rounded-xl bg-petal px-3 py-2 text-sm text-flame" role="status">{msg}</p>}
      {available > 0 && available <= 5 && <p className="mt-3 text-xs font-medium text-amber-700">{labels.onlyLeft.replace("{n}", String(available))}</p>}

      <div className="mt-5 grid gap-2 border-t border-sand pt-4 text-xs text-ink-soft sm:grid-cols-2">
        <p className="flex items-center gap-2"><ShieldCheck className="size-4 text-cocoa" /> Secure payment</p>
        <p className="flex items-center gap-2"><Truck className="size-4 text-cocoa" /> Tracked shipping</p>
      </div>
    </div>
  );
}
