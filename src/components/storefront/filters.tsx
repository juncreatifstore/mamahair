"use client";
import { useState } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { SlidersHorizontal, X } from "lucide-react";
import { HAIR_TYPE_LABELS, cn } from "@/lib/utils";
import { TEXTURES, LENGTHS, LACE_TYPES, DENSITIES, PRODUCT_TYPES } from "@/lib/catalog";
import type { Dict } from "@/i18n";

type L = Dict["shop"];

export function Filters({ categories, colors, t, currencySymbol }: { categories: { slug: string; name: string }[]; colors: string[]; t: L; currencySymbol: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [open, setOpen] = useState(false);

  const set = (key: string, value: string | null) => {
    const next = new URLSearchParams(params.toString());
    if (!value || next.get(key) === value) next.delete(key); else next.set(key, value);
    next.delete("page");
    router.push(`${pathname}?${next.toString()}`, { scroll: false });
  };
  const chip = (active: boolean) => cn("rounded-pill border px-3 py-1.5 text-sm transition-colors", active ? "border-cocoa bg-cocoa text-cream" : "border-sand bg-white hover:border-cocoa/50");
  const active = [...params.keys()].filter((k) => k !== "sort" && k !== "page").length;

  const body = (
    <div className="space-y-6">
      <Group label={t.category}>
        {categories.map((c) => <button key={c.slug} onClick={() => router.push(pathname.endsWith(`/${c.slug}`) ? `/shop?${params}` : `/shop/${c.slug}?${params}`)} className={chip(pathname.endsWith(`/${c.slug}`))}>{c.name}</button>)}
      </Group>
      <Group label="Type">{Object.entries(PRODUCT_TYPES).map(([k, l]) => <button key={k} onClick={() => set("type", k)} className={chip(params.get("type") === k)}>{l}</button>)}</Group>
      <Group label={t.texture}>{TEXTURES.map((v) => <button key={v} onClick={() => set("texture", v)} className={chip(params.get("texture") === v)}>{v}</button>)}</Group>
      <Group label={t.length}>{LENGTHS.map((v) => <button key={v} onClick={() => set("length", String(v))} className={chip(params.get("length") === String(v))}>{`${v}"`}</button>)}</Group>
      {colors.length > 0 && <Group label={t.color}>{colors.map((v) => <button key={v} onClick={() => set("color", v)} className={chip(params.get("color") === v)}>{v}</button>)}</Group>}
      <Group label={t.lace}>{LACE_TYPES.map((v) => <button key={v} onClick={() => set("lace", v)} className={chip(params.get("lace") === v)}>{v}</button>)}</Group>
      <Group label={t.density}>{DENSITIES.map((v) => <button key={v} onClick={() => set("density", v)} className={chip(params.get("density") === v)}>{v}</button>)}</Group>
      <Group label={t.hairType}>{Object.entries(HAIR_TYPE_LABELS).map(([k, l]) => <button key={k} onClick={() => set("hairType", k)} className={chip(params.get("hairType") === k)}>{l}</button>)}</Group>
      <div>
        <p className="mb-2 text-sm font-semibold">{t.price}</p>
        <form className="flex items-center gap-2" onSubmit={(e) => { e.preventDefault(); const f = new FormData(e.currentTarget); const n = new URLSearchParams(params.toString()); const mn = String(f.get("min") ?? ""), mx = String(f.get("max") ?? ""); if (mn) n.set("minPrice", mn); else n.delete("minPrice"); if (mx) n.set("maxPrice", mx); else n.delete("maxPrice"); router.push(`${pathname}?${n}`, { scroll: false }); }}>
          <span className="text-sm text-ink-soft">{currencySymbol}</span>
          <input name="min" type="number" min={0} placeholder="Min" defaultValue={params.get("minPrice") ?? ""} className="h-9 w-20 rounded-lg border border-sand bg-white px-2 text-sm" />
          <span>–</span>
          <input name="max" type="number" min={0} placeholder="Max" defaultValue={params.get("maxPrice") ?? ""} className="h-9 w-20 rounded-lg border border-sand bg-white px-2 text-sm" />
          <button className="h-9 rounded-pill border border-sand px-3 text-sm">OK</button>
        </form>
      </div>
      <Group label={t.availability}>
        <button onClick={() => set("inStock", "1")} className={chip(!!params.get("inStock"))}>{t.inStock}</button>
        <button onClick={() => set("isNew", "1")} className={chip(!!params.get("isNew"))}>{t.newOnly}</button>
        <button onClick={() => set("bestSeller", "1")} className={chip(!!params.get("bestSeller"))}>{t.bestOnly}</button>
      </Group>
      <div>
        <p className="mb-2 text-sm font-semibold">{t.sort}</p>
        <select value={params.get("sort") ?? "newest"} onChange={(e) => set("sort", e.target.value)} className="h-10 w-full rounded-xl border border-sand bg-white px-3 text-sm">
          <option value="newest">{t.newest}</option><option value="popular">{t.popular}</option><option value="price-asc">{t.priceAsc}</option><option value="price-desc">{t.priceDesc}</option>
        </select>
      </div>
      {active > 0 && <button onClick={() => router.push(pathname.startsWith("/shop/") ? "/shop" : pathname)} className="text-sm text-flame underline">{t.clear}</button>}
    </div>
  );

  return (
    <>
      <div className="hidden lg:block">{body}</div>
      <div className="lg:hidden">
        <button onClick={() => setOpen(true)} className="inline-flex h-10 items-center gap-2 rounded-pill border border-sand bg-white px-4 text-sm font-medium"><SlidersHorizontal className="size-4" /> {t.filters}{active > 0 && <span className="rounded-pill bg-cocoa px-2 text-xs text-cream">{active}</span>}</button>
        {open && (
          <div className="fixed inset-0 z-50 bg-ink/40" onClick={() => setOpen(false)}>
            <div className="absolute inset-y-0 right-0 flex w-[88vw] max-w-sm flex-col bg-cream" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between border-b border-sand px-5 py-4"><span className="font-semibold">{t.filters}</span><button aria-label="Close" onClick={() => setOpen(false)}><X className="size-5" /></button></div>
              <div className="flex-1 overflow-y-auto px-5 py-5">{body}</div>
              <div className="border-t border-sand p-4"><button onClick={() => setOpen(false)} className="h-11 w-full rounded-pill bg-flame text-sm font-medium text-white">{t.apply}</button></div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

function Group({ label, children }: { label: string; children: React.ReactNode }) { return <div><p className="mb-2 text-sm font-semibold">{label}</p><div className="flex flex-wrap gap-2">{children}</div></div>; }
