"use client";
import { useMemo, useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, Gift, RotateCcw, ShieldCheck, Truck } from "lucide-react";
import { addToCart } from "@/server/cart";
import { Button } from "@/components/ui/button";
import { formatCents } from "@/lib/money";
import { cn } from "@/lib/utils";
import { OPTION_KEYS, OPTION_LABELS, type OptionKey } from "@/lib/catalog";
import { useVariantImage } from "./variant-image-context";

type V = { id: string; name: string; sku: string; priceCents: number; compareAtCents: number | null; isDefault: boolean; options: unknown; inventory: { quantity: number; reserved: number } | null; image: { url: string } | null };

export function AddToCart({ variants, currency, labels, onVariantChange }: { variants: V[]; currency: string; labels: { add: string; added: string; out: string; choose: string; onlyLeft: string }; onVariantChange?: (v: V) => void }) {
  const opts = (v: V) => (v.options ?? {}) as Record<string, string>;
  const inStock = (v: V) => (v.inventory?.quantity ?? 0) - (v.inventory?.reserved ?? 0) > 0;
  const axes = useMemo(() => OPTION_KEYS.filter((k) => variants.some((v) => opts(v)[k])).map((k) => ({ key: k, values: [...new Set(variants.map((v) => opts(v)[k]).filter(Boolean))] })), [variants]);
  const initial = variants.find((v) => v.isDefault && inStock(v)) ?? variants.find(inStock) ?? variants.find((v) => v.isDefault) ?? variants[0];
  const [sel, setSel] = useState<Record<string, string>>(initial ? opts(initial) : {});
  const [qty, setQty] = useState(1);
  const [msg, setMsg] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const router = useRouter();
  const variantImage = useVariantImage();

  const match = axes.length === 0 ? initial : variants.find((v) => axes.every((a) => opts(v)[a.key] === sel[a.key]));
  const available = match ? Math.max(0, (match.inventory?.quantity ?? 0) - (match.inventory?.reserved ?? 0)) : 0;
  const discount = match?.compareAtCents && match.compareAtCents > match.priceCents ? Math.round((1 - match.priceCents / match.compareAtCents) * 100) : 0;

  const candidatesFor = (key: OptionKey, value: string) => variants.filter((v) => opts(v)[key] === value);
  const optionAvailable = (key: OptionKey, value: string) => candidatesFor(key, value).some(inStock);
  const optionImage = (key: OptionKey, value: string) => candidatesFor(key, value).find((v) => v.image?.url)?.image?.url ?? null;

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

  const submit = (buyNow = false) => {
    if (!match || available <= 0) return;
    start(async () => {
      setMsg(null);
      const res = await addToCart(match.id, qty);
      if (res.error) {
        setMsg(res.error);
        return;
      }
      if (buyNow) {
        router.push("/checkout");
        return;
      }
      setMsg(labels.added);
      router.refresh();
    });
  };

  return (
    <div>
      {match && (
        <div className="mb-6 rounded-[1.4rem] bg-[#fbf7f3] p-4 ring-1 ring-sand/70 sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[.14em] text-flame">Selected option</p>
              <div className="mt-1.5 flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <p className="text-[2rem] font-semibold leading-none text-cocoa sm:text-[2.2rem]">{formatCents(match.priceCents, currency)}</p>
                {match.compareAtCents && match.compareAtCents > match.priceCents && <span className="text-sm text-ink-soft line-through">{formatCents(match.compareAtCents, currency)}</span>}
                {discount > 0 && <span className="rounded-full bg-flame px-2.5 py-1 text-[10px] font-bold uppercase tracking-[.06em] text-white">Save {discount}%</span>}
              </div>
            </div>
            <div className={cn("rounded-full px-3 py-1.5 text-[11px] font-semibold", available > 0 ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700")}>
              {available > 0 ? `${available} available` : labels.out}
            </div>
          </div>
          <p className="mt-2 text-xs text-ink-soft">{match.name} · SKU {match.sku}</p>
        </div>
      )}

      {axes.length > 0 && <p className="mb-4 text-sm font-semibold text-cocoa">{labels.choose}</p>}

      <div className="space-y-6">
        {axes.map((a) => (
          <div key={a.key}>
            <div className="mb-2.5 flex items-center justify-between gap-3">
              <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-ink-soft">{OPTION_LABELS[a.key]}</p>
              <span className="rounded-full bg-petal px-2.5 py-1 text-[11px] font-semibold text-cocoa">{a.key === "length" ? `${sel[a.key]}\"` : sel[a.key]}</span>
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
                      "group inline-flex min-h-11 items-center gap-2 rounded-full border px-3.5 py-2 text-sm font-medium transition",
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

      <div className="mt-6 grid grid-cols-[112px_1fr] gap-3 sm:grid-cols-[124px_1fr]">
        <div className="flex h-[52px] items-center justify-between rounded-full border border-sand bg-white px-1">
          <button type="button" aria-label="Decrease" onClick={() => setQty((q) => Math.max(1, q - 1))} className="grid size-11 place-items-center rounded-full text-xl transition hover:bg-petal">−</button>
          <span className="min-w-6 text-center text-sm font-semibold text-cocoa">{qty}</span>
          <button type="button" aria-label="Increase" onClick={() => setQty((q) => Math.min(Math.max(1, available), q + 1))} disabled={available <= 0 || qty >= available} className="grid size-11 place-items-center rounded-full text-xl transition hover:bg-petal disabled:opacity-35">+</button>
        </div>
        <Button size="lg" className="h-[52px] w-full justify-center text-sm shadow-[0_14px_34px_rgba(216,90,48,0.22)]" disabled={pending || !match || available <= 0} onClick={() => submit(false)}>
          {!match || available <= 0 ? labels.out : pending ? "…" : labels.add}
        </Button>
      </div>

      <button
        type="button"
        disabled={pending || !match || available <= 0}
        onClick={() => submit(true)}
        className="mt-3 flex h-[52px] w-full items-center justify-center rounded-full border border-cocoa bg-white px-5 text-sm font-bold uppercase tracking-[.06em] text-cocoa transition hover:bg-cocoa hover:text-cream disabled:cursor-not-allowed disabled:opacity-45"
      >
        {!match || available <= 0 ? labels.out : pending ? "Preparing checkout…" : "Buy now · Secure checkout"}
      </button>

      {msg && <p className="mt-3 rounded-xl bg-petal px-3 py-2 text-sm text-flame" role="status">{msg}</p>}
      {available > 0 && available <= 5 && <p className="mt-3 text-xs font-semibold text-amber-700">{labels.onlyLeft.replace("{n}", String(available))}</p>}

      <div className="mt-5 grid gap-2 border-t border-sand pt-5 text-[11px] text-ink-soft sm:grid-cols-2 sm:text-xs">
        <p className="flex items-center gap-2 rounded-xl bg-cream px-3 py-2.5"><ShieldCheck className="size-4 shrink-0 text-cocoa" /> Secure checkout; available methods are shown at payment</p>
        <Link href="/pages/shipping" className="flex items-center gap-2 rounded-xl bg-cream px-3 py-2.5 transition hover:bg-petal"><Truck className="size-4 shrink-0 text-cocoa" /> Delivery options and rates are calculated at checkout</Link>
        <Link href="/pages/returns" className="flex items-center gap-2 rounded-xl bg-cream px-3 py-2.5 transition hover:bg-petal"><RotateCcw className="size-4 shrink-0 text-cocoa" /> View the current return policy</Link>
        <Link href="/account/rewards" className="flex items-center gap-2 rounded-xl bg-cream px-3 py-2.5 transition hover:bg-petal"><Gift className="size-4 shrink-0 text-cocoa" /> Signed-in purchases can earn Mama Rewards</Link>
      </div>
    </div>
  );
}
