"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Search, X } from "lucide-react";
import { formatCents } from "@/lib/money";

type Sugg = { products: { slug: string; name: string; basePriceCents: number; currency: string; images: { url: string }[] }[]; categories: { slug: string; name: string }[] };

export function SearchBox({ placeholder }: { placeholder: string }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [data, setData] = useState<Sugg | null>(null);
  const router = useRouter();
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    ref.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  useEffect(() => {
    if (q.trim().length < 2) { setData(null); return; }
    const ctrl = new AbortController();
    const id = setTimeout(() => {
      fetch(`/api/search?q=${encodeURIComponent(q)}`, { signal: ctrl.signal }).then((r) => r.json()).then(setData).catch(() => null);
    }, 200);
    return () => { clearTimeout(id); ctrl.abort(); };
  }, [q]);

  const submit = (e: React.FormEvent) => { e.preventDefault(); if (q.trim()) { setOpen(false); router.push(`/search?q=${encodeURIComponent(q.trim())}`); } };

  return (
    <>
      <button aria-label="Search" onClick={() => setOpen(true)} className="grid size-10 place-items-center rounded-pill hover:bg-petal"><Search className="size-5" /></button>
      {open && (
        <div className="fixed inset-0 z-50 bg-ink/40 p-4 pt-20" onClick={() => setOpen(false)}>
          <div className="mx-auto max-w-2xl rounded-2xl bg-cream p-4 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <form onSubmit={submit} className="flex items-center gap-2">
              <Search className="size-5 text-ink-soft" />
              <input ref={ref} value={q} onChange={(e) => setQ(e.target.value)} placeholder={placeholder} className="h-11 flex-1 bg-transparent text-base outline-none" />
              <button type="button" aria-label="Close" onClick={() => setOpen(false)}><X className="size-5" /></button>
            </form>
            {data && (data.products.length > 0 || data.categories.length > 0) && (
              <div className="mt-3 border-t border-sand pt-3">
                {data.categories.length > 0 && <div className="mb-2 flex flex-wrap gap-2">{data.categories.map((c) => <Link key={c.slug} href={`/shop/${c.slug}`} onClick={() => setOpen(false)} className="rounded-pill bg-petal px-3 py-1 text-sm">{c.name}</Link>)}</div>}
                <ul>
                  {data.products.map((p) => (
                    <li key={p.slug}>
                      <Link href={`/products/${p.slug}`} onClick={() => setOpen(false)} className="flex items-center gap-3 rounded-xl px-2 py-2 hover:bg-petal">
                        <div className="relative size-12 overflow-hidden rounded-lg bg-petal">{p.images[0] && <Image src={p.images[0].url} alt="" fill sizes="48px" className="object-cover" />}</div>
                        <span className="flex-1 text-sm font-medium">{p.name}</span>
                        <span className="text-sm">{formatCents(p.basePriceCents, p.currency)}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
                <button onClick={submit} className="mt-2 w-full rounded-xl py-2 text-sm text-flame hover:bg-petal">See all results for “{q}”</button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
