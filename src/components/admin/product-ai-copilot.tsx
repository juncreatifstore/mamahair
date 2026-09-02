"use client";

import { usePathname } from "next/navigation";
import { useState, useTransition } from "react";
import { Bot, ChevronDown, FileText, Link2, Search, Sparkles, WandSparkles } from "lucide-react";
import { generateProductAI } from "@/server/admin/product-ai";
import { cn } from "@/lib/utils";

const MODES = [
  { key: "all", label: "Full listing", icon: Sparkles, fields: ["shortDesc", "description", "howToUse", "ingredients", "slug", "sku", "seoTitle", "seoDescription"] },
  { key: "details", label: "Details", icon: FileText, fields: ["shortDesc", "description"] },
  { key: "usage", label: "How to / install", icon: WandSparkles, fields: ["howToUse"] },
  { key: "ingredients", label: "Ingredients", icon: FileText, fields: ["ingredients"] },
  { key: "identifiers", label: "Slug + SKU", icon: Link2, fields: ["slug", "sku"] },
  { key: "seo", label: "SEO", icon: Search, fields: ["seoTitle", "seoDescription"] },
] as const;

function productForm() {
  return document.querySelector<HTMLInputElement>('input[name="name"]')?.closest("form") ?? null;
}

function currentContext(form: HTMLFormElement) {
  const fd = new FormData(form);
  const read = (name: string) => String(fd.get(name) ?? "").trim();
  const list = (name: string) => fd.getAll(name).map(String).filter(Boolean);
  return {
    name: read("name"), productType: read("productType"), sku: read("sku"), slug: read("slug"), brand: read("brand"), categoryId: read("categoryId"),
    shortDesc: read("shortDesc"), description: read("description"), howToUse: read("howToUse"), ingredients: read("ingredients"), currency: read("currency"), basePrice: read("basePrice"),
    hairMaterial: read("hairMaterial"), hairOrigin: read("hairOrigin"), capSize: read("capSize"), wigType: read("wigType"), closureType: read("closureType"), parting: read("parting"), hairGrade: read("hairGrade"),
    textures: list("textures"), lengths: list("lengths"), densities: list("densities"), laceTypes: list("laceTypes"), colors: read("colors"), hairTypes: list("hairTypes"), concerns: list("concerns"),
    canBleach: read("canBleach"), canDye: read("canDye"), heatSafe: read("heatSafe"), prePlucked: read("prePlucked"), babyHair: read("babyHair"), glueless: read("glueless"), adjustableStrap: read("adjustableStrap"),
    seoTitle: read("seoTitle"), seoDescription: read("seoDescription"),
  };
}

function applyField(form: HTMLFormElement, name: string, value: string) {
  if (!value) return;
  const field = form.elements.namedItem(name);
  if (!(field instanceof HTMLInputElement || field instanceof HTMLTextAreaElement)) return;
  field.value = value;
  field.dispatchEvent(new Event("input", { bubbles: true }));
  field.dispatchEvent(new Event("change", { bubbles: true }));
}

export function ProductAICopilot() {
  const pathname = usePathname();
  const isEditor = pathname === "/admin/products/new" || /^\/admin\/products\/[^/]+$/.test(pathname);
  const [open, setOpen] = useState(false);
  const [language, setLanguage] = useState("en");
  const [activeMode, setActiveMode] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  if (!isEditor) return null;

  const run = (mode: (typeof MODES)[number]) => {
    const form = productForm();
    if (!form) return setError("Product form is not ready yet.");
    const context = currentContext(form);
    if (!context.name) return setError("Add the product name first so AI has a reliable starting point.");

    setActiveMode(mode.key); setMessage(null); setError(null);
    startTransition(async () => {
      const result = await generateProductAI({ mode: mode.key, language, context });
      if (!result.ok || !result.data) {
        setError(result.error || "AI generation failed."); setActiveMode(null); return;
      }
      for (const field of mode.fields) applyField(form, field, String(result.data[field] ?? ""));
      setMessage(`${mode.label} completed. Review before saving.`); setActiveMode(null);
    });
  };

  return (
    <section className="mb-4 overflow-hidden rounded-2xl border border-cocoa/12 bg-white shadow-sm">
      <button type="button" onClick={() => setOpen((v) => !v)} className="flex w-full items-center justify-between gap-4 px-4 py-3 text-left sm:px-5">
        <div className="flex min-w-0 items-center gap-3">
          <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-cocoa text-cream"><Bot className="size-4" /></span>
          <div className="min-w-0">
            <div className="flex items-center gap-2"><p className="truncate text-sm font-semibold text-cocoa">AI Product Copilot</p><span className="rounded-full bg-flame/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-[.1em] text-flame">AI</span></div>
            <p className="mt-0.5 truncate text-xs text-ink-soft">Generate copy, identifiers and SEO only when you need it.</p>
          </div>
        </div>
        <ChevronDown className={cn("size-4 shrink-0 text-cocoa/60 transition", open && "rotate-180")} />
      </button>

      {open && <div className="border-t border-sand/70 bg-[#fffdfa] p-4 sm:p-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <p className="max-w-2xl text-xs leading-5 text-ink-soft">Enter factual product attributes first. AI fills customer-facing copy without intentionally inventing origin, grade, ingredients, shipping promises or guarantees.</p>
          <label className="flex items-center gap-2 text-xs font-semibold text-cocoa">Language<select value={language} onChange={(e) => setLanguage(e.target.value)} className="rounded-lg border border-sand bg-white px-2.5 py-1.5 text-xs"><option value="en">English</option><option value="fr">Français</option><option value="es">Español</option><option value="ht">Kreyòl</option></select></label>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {MODES.map((mode) => {
            const Icon = mode.icon; const loading = pending && activeMode === mode.key;
            return <button key={mode.key} type="button" disabled={pending} onClick={() => run(mode)} className={cn("inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold transition", mode.key === "all" ? "border-cocoa bg-cocoa text-cream" : "border-sand bg-white text-cocoa hover:border-cocoa/35 hover:bg-petal/30", pending && "opacity-60")}><Icon className="size-3.5" />{loading ? "Generating…" : mode.label}</button>;
          })}
        </div>
        {error && <p role="alert" className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">{error}</p>}
        {message && <p className="mt-3 rounded-lg bg-emerald-50 px-3 py-2 text-xs text-emerald-700">{message}</p>}
      </div>}
    </section>
  );
}
