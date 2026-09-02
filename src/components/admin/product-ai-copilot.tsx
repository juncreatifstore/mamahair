"use client";

import { usePathname } from "next/navigation";
import { useState, useTransition } from "react";
import { Bot, FileText, Link2, Search, Sparkles, WandSparkles } from "lucide-react";
import { generateProductAI } from "@/server/admin/product-ai";
import { cn } from "@/lib/utils";

const MODES = [
  { key: "all", label: "Generate full listing", icon: Sparkles, fields: ["shortDesc", "description", "howToUse", "ingredients", "slug", "sku", "seoTitle", "seoDescription"] },
  { key: "details", label: "Product details", icon: FileText, fields: ["shortDesc", "description"] },
  { key: "usage", label: "How to use / install", icon: WandSparkles, fields: ["howToUse"] },
  { key: "ingredients", label: "Format ingredients", icon: FileText, fields: ["ingredients"] },
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
    name: read("name"),
    productType: read("productType"),
    sku: read("sku"),
    slug: read("slug"),
    brand: read("brand"),
    categoryId: read("categoryId"),
    shortDesc: read("shortDesc"),
    description: read("description"),
    howToUse: read("howToUse"),
    ingredients: read("ingredients"),
    currency: read("currency"),
    basePrice: read("basePrice"),
    hairMaterial: read("hairMaterial"),
    hairOrigin: read("hairOrigin"),
    capSize: read("capSize"),
    wigType: read("wigType"),
    closureType: read("closureType"),
    parting: read("parting"),
    hairGrade: read("hairGrade"),
    textures: list("textures"),
    lengths: list("lengths"),
    densities: list("densities"),
    laceTypes: list("laceTypes"),
    colors: read("colors"),
    hairTypes: list("hairTypes"),
    concerns: list("concerns"),
    canBleach: read("canBleach"),
    canDye: read("canDye"),
    heatSafe: read("heatSafe"),
    prePlucked: read("prePlucked"),
    babyHair: read("babyHair"),
    glueless: read("glueless"),
    adjustableStrap: read("adjustableStrap"),
    seoTitle: read("seoTitle"),
    seoDescription: read("seoDescription"),
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
  const [language, setLanguage] = useState("en");
  const [activeMode, setActiveMode] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  if (!isEditor) return null;

  const run = (mode: (typeof MODES)[number]) => {
    const form = productForm();
    if (!form) {
      setError("Product form is not ready yet.");
      return;
    }
    const context = currentContext(form);
    if (!context.name) {
      setError("Add the product name first so AI has a reliable starting point.");
      return;
    }

    setActiveMode(mode.key);
    setMessage(null);
    setError(null);
    startTransition(async () => {
      const result = await generateProductAI({ mode: mode.key, language, context });
      if (!result.ok || !result.data) {
        setError(result.error || "AI generation failed.");
        setActiveMode(null);
        return;
      }
      for (const field of mode.fields) applyField(form, field, String(result.data[field] ?? ""));
      setMessage(`${mode.label} completed. Review the generated content before saving.`);
      setActiveMode(null);
    });
  };

  return (
    <section className="mb-6 overflow-hidden rounded-[1.7rem] border border-cocoa/15 bg-gradient-to-br from-white via-[#fffaf7] to-petal/55 shadow-[0_16px_45px_rgba(74,27,12,.05)]">
      <div className="flex flex-col gap-4 border-b border-sand/70 px-5 py-5 md:flex-row md:items-center md:justify-between md:px-6">
        <div className="flex items-start gap-3">
          <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-cocoa text-cream"><Bot className="size-5" /></span>
          <div>
            <div className="flex flex-wrap items-center gap-2"><h2 className="text-xl font-semibold text-cocoa">MAMAHAIR AI Product Copilot</h2><span className="rounded-full bg-flame/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[.12em] text-flame">AI</span></div>
            <p className="mt-1 max-w-3xl text-sm leading-6 text-ink-soft">Generate or improve product copy from the facts already entered. AI will not intentionally invent ingredients, origin, grade, shipping promises or product guarantees.</p>
          </div>
        </div>
        <label className="flex shrink-0 items-center gap-2 text-xs font-semibold text-cocoa">Output language<select value={language} onChange={(e) => setLanguage(e.target.value)} className="rounded-xl border border-sand bg-white px-3 py-2 text-sm"><option value="en">English</option><option value="fr">Français</option><option value="es">Español</option><option value="ht">Kreyòl</option></select></label>
      </div>

      <div className="p-5 md:p-6">
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {MODES.map((mode) => {
            const Icon = mode.icon;
            const loading = pending && activeMode === mode.key;
            return <button key={mode.key} type="button" disabled={pending} onClick={() => run(mode)} className={cn("flex min-h-20 flex-col items-start justify-between rounded-2xl border p-3.5 text-left transition", mode.key === "all" ? "border-cocoa bg-cocoa text-cream" : "border-sand bg-white text-cocoa hover:border-cocoa/35 hover:bg-petal/35", pending && "opacity-60")}><Icon className="size-4" /><span className="mt-3 text-xs font-semibold leading-4">{loading ? "Generating…" : mode.label}</span></button>;
          })}
        </div>
        {error && <p role="alert" className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
        {message && <p className="mt-4 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{message}</p>}
        <p className="mt-4 text-xs leading-5 text-ink-soft"><strong className="text-cocoa">Tip:</strong> enter factual attributes first (material, texture, length, lace, density, color, etc.), then let AI write the customer-facing copy. For hair-care ingredients, paste the real ingredient list first; AI will format it rather than invent a formula.</p>
      </div>
    </section>
  );
}
