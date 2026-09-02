"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Check, Languages, Loader2, RefreshCw, Sparkles } from "lucide-react";

const LANGUAGES = [
  { locale: "en", label: "English" },
  { locale: "fr", label: "Français" },
  { locale: "es", label: "Español" },
  { locale: "ht", label: "Kreyòl ayisyen" },
] as const;

type Locale = (typeof LANGUAGES)[number]["locale"];
type Translation = {
  locale: string;
  name: string;
  shortDesc: string | null;
  description: string | null;
  ingredients: string | null;
  howToUse: string | null;
};

export function ProductAITranslations() {
  const pathname = usePathname();
  const router = useRouter();
  const match = pathname.match(/^\/admin\/products\/([^/]+)$/);
  const productId = match?.[1] ?? null;
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
    setError(null);
    setMessage(null);
    setLoading(locale);
    try {
      const response = await fetch("/api/admin/ai/product-translations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, locale }),
      });
      const payload = await response.json() as { translation?: Translation; error?: string };
      if (!response.ok || !payload.translation) throw new Error(payload.error || "AI translation failed.");
      setTranslations((current) => [...current.filter((item) => item.locale !== locale), payload.translation!]);
      setMessage(`${LANGUAGES.find((item) => item.locale === locale)?.label ?? locale} translation saved.`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "AI translation failed.");
    } finally {
      setLoading(null);
    }
  }

  async function generateAll() {
    setError(null);
    setMessage(null);
    setLoading("all");
    try {
      for (const item of LANGUAGES) {
        const response = await fetch("/api/admin/ai/product-translations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ productId, locale: item.locale }),
        });
        const payload = await response.json() as { translation?: Translation; error?: string };
        if (!response.ok || !payload.translation) throw new Error(`${item.label}: ${payload.error || "translation failed"}`);
        setTranslations((current) => [...current.filter((translation) => translation.locale !== item.locale), payload.translation!]);
      }
      setMessage("All four product translations were generated and saved.");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "AI translations failed.");
    } finally {
      setLoading(null);
    }
  }

  return (
    <section className="mb-6 overflow-hidden rounded-[1.7rem] border border-cocoa/10 bg-white shadow-[0_16px_45px_rgba(74,27,12,.04)]">
      <div className="flex flex-col gap-4 border-b border-sand/70 bg-[#fbf8f5] px-5 py-5 md:flex-row md:items-center md:justify-between md:px-6">
        <div className="flex items-start gap-3">
          <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-cocoa text-cream"><Languages className="size-5" /></span>
          <div>
            <div className="flex flex-wrap items-center gap-2"><h2 className="text-xl font-semibold text-cocoa">AI Translations</h2><span className="rounded-full bg-petal px-2.5 py-1 text-[10px] font-bold uppercase tracking-[.12em] text-flame">EN · FR · ES · HT</span></div>
            <p className="mt-1 max-w-3xl text-sm leading-6 text-ink-soft">Generate localized product copy from the current source product. Empty ingredients stay empty and product facts are preserved.</p>
          </div>
        </div>
        <button type="button" disabled={loading !== null} onClick={generateAll} className="inline-flex items-center justify-center gap-2 rounded-xl bg-cocoa px-4 py-2.5 text-xs font-semibold text-cream disabled:opacity-50">
          {loading === "all" ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
          {loading === "all" ? "Generating all…" : "Generate all languages"}
        </button>
      </div>

      <div className="grid gap-3 p-5 sm:grid-cols-2 xl:grid-cols-4 md:p-6">
        {LANGUAGES.map((item) => {
          const done = translatedLocales.has(item.locale);
          const busy = loading === item.locale;
          return (
            <div key={item.locale} className="rounded-2xl border border-sand bg-white p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[.14em] text-flame">{item.locale.toUpperCase()}</p>
                  <p className="mt-1 text-sm font-semibold text-cocoa">{item.label}</p>
                </div>
                <span className={done ? "grid size-8 place-items-center rounded-full bg-emerald-50 text-emerald-700" : "grid size-8 place-items-center rounded-full bg-petal text-cocoa/50"}>{done ? <Check className="size-4" /> : <Languages className="size-4" />}</span>
              </div>
              <p className="mt-3 text-xs leading-5 text-ink-soft">{done ? "Translation saved. Generate again to refresh it from the current product copy." : "No saved translation yet."}</p>
              <button type="button" disabled={loading !== null} onClick={() => generate(item.locale)} className="mt-4 inline-flex items-center gap-2 rounded-xl border border-cocoa/20 px-3 py-2 text-xs font-semibold text-cocoa hover:bg-petal/40 disabled:opacity-50">
                {busy ? <Loader2 className="size-3.5 animate-spin" /> : done ? <RefreshCw className="size-3.5" /> : <Sparkles className="size-3.5" />}
                {busy ? "Generating…" : done ? "Regenerate" : "Generate"}
              </button>
            </div>
          );
        })}
      </div>

      {loading === "status" && <p className="px-6 pb-5 text-xs text-ink-soft">Checking existing translations…</p>}
      {message && <p className="mx-5 mb-5 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700 md:mx-6">{message}</p>}
      {error && <p role="alert" className="mx-5 mb-5 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 md:mx-6">{error}</p>}
    </section>
  );
}
