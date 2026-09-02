"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Check, ChevronDown, Languages, Loader2, RefreshCw, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

const LANGUAGES = [
  { locale: "en", label: "English" },
  { locale: "fr", label: "Français" },
  { locale: "es", label: "Español" },
  { locale: "ht", label: "Kreyòl" },
] as const;

type Locale = (typeof LANGUAGES)[number]["locale"];
type Translation = { locale: string; name: string; shortDesc: string | null; description: string | null; ingredients: string | null; howToUse: string | null; };

export function ProductAITranslations() {
  const pathname = usePathname();
  const router = useRouter();
  const match = pathname.match(/^\/admin\/products\/([^/]+)$/);
  const productId = match?.[1] ?? null;
  const [open, setOpen] = useState(false);
  const [translations, setTranslations] = useState<Translation[]>([]);
  const [loading, setLoading] = useState<Locale | "all" | "status" | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const translatedLocales = useMemo(() => new Set(translations.map((item) => item.locale)), [translations]);

  useEffect(() => {
    if (!productId || productId === "new" || productId === "inventory") return;
    let cancelled = false;
    setLoading("status");
    fetch(`/api/admin/ai/product-translations?productId=${encodeURIComponent(productId)}`, { cache: "no-store" })
      .then(async (response) => {
        const payload = await response.json() as { translations?: Translation[]; error?: string };
        if (!response.ok) throw new Error(payload.error || "Could not load translations.");
        if (!cancelled) setTranslations(payload.translations ?? []);
      })
      .catch((err) => { if (!cancelled) setError(err instanceof Error ? err.message : "Could not load translations."); })
      .finally(() => { if (!cancelled) setLoading(null); });
    return () => { cancelled = true; };
  }, [productId]);

  if (!productId || productId === "new" || productId === "inventory") return null;

  async function generate(locale: Locale) {
    setError(null); setMessage(null); setLoading(locale);
    try {
      const response = await fetch("/api/admin/ai/product-translations", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ productId, locale }) });
      const payload = await response.json() as { translation?: Translation; error?: string };
      if (!response.ok || !payload.translation) throw new Error(payload.error || "AI translation failed.");
      setTranslations((current) => [...current.filter((item) => item.locale !== locale), payload.translation!]);
      setMessage(`${LANGUAGES.find((item) => item.locale === locale)?.label ?? locale} saved.`); router.refresh();
    } catch (err) { setError(err instanceof Error ? err.message : "AI translation failed."); }
    finally { setLoading(null); }
  }

  async function generateAll() {
    setError(null); setMessage(null); setLoading("all");
    try {
      for (const item of LANGUAGES) {
        const response = await fetch("/api/admin/ai/product-translations", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ productId, locale: item.locale }) });
        const payload = await response.json() as { translation?: Translation; error?: string };
        if (!response.ok || !payload.translation) throw new Error(`${item.label}: ${payload.error || "translation failed"}`);
        setTranslations((current) => [...current.filter((translation) => translation.locale !== item.locale), payload.translation!]);
      }
      setMessage("All translations saved."); router.refresh();
    } catch (err) { setError(err instanceof Error ? err.message : "AI translations failed."); }
    finally { setLoading(null); }
  }

  return (
    <section className="mb-4 overflow-hidden rounded-2xl border border-cocoa/10 bg-white shadow-sm">
      <button type="button" onClick={() => setOpen((v) => !v)} className="flex w-full items-center justify-between gap-4 px-4 py-3 text-left sm:px-5">
        <div className="flex min-w-0 items-center gap-3">
          <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-cocoa text-cream"><Languages className="size-4" /></span>
          <div className="min-w-0"><div className="flex items-center gap-2"><p className="truncate text-sm font-semibold text-cocoa">AI Translations</p><span className="rounded-full bg-petal px-2 py-0.5 text-[9px] font-bold text-flame">EN · FR · ES · HT</span></div><p className="mt-0.5 truncate text-xs text-ink-soft">{translatedLocales.size}/4 languages saved</p></div>
        </div>
        <ChevronDown className={cn("size-4 shrink-0 text-cocoa/60 transition", open && "rotate-180")} />
      </button>

      {open && <div className="border-t border-sand/70 bg-[#fffdfa] p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs leading-5 text-ink-soft">Generate localized product copy while preserving product facts.</p>
          <button type="button" disabled={loading !== null} onClick={generateAll} className="inline-flex items-center gap-2 rounded-xl bg-cocoa px-3 py-2 text-xs font-semibold text-cream disabled:opacity-50">{loading === "all" ? <Loader2 className="size-3.5 animate-spin" /> : <Sparkles className="size-3.5" />}Generate all</button>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {LANGUAGES.map((item) => { const done = translatedLocales.has(item.locale); const busy = loading === item.locale; return <button key={item.locale} type="button" disabled={loading !== null} onClick={() => generate(item.locale)} className="inline-flex items-center gap-2 rounded-xl border border-sand bg-white px-3 py-2 text-xs font-semibold text-cocoa hover:bg-petal/35 disabled:opacity-50">{busy ? <Loader2 className="size-3.5 animate-spin" /> : done ? <Check className="size-3.5 text-emerald-700" /> : <Languages className="size-3.5" />}{item.label}{done && !busy ? <RefreshCw className="size-3 text-cocoa/40" /> : null}</button>; })}
        </div>
        {loading === "status" && <p className="mt-3 text-xs text-ink-soft">Checking translations…</p>}
        {message && <p className="mt-3 rounded-lg bg-emerald-50 px-3 py-2 text-xs text-emerald-700">{message}</p>}
        {error && <p role="alert" className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">{error}</p>}
      </div>}
    </section>
  );
}
