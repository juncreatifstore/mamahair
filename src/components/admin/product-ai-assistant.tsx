"use client";

import { useState } from "react";
import { Loader2, Search, Sparkles, WandSparkles } from "lucide-react";

const FIELD_KEYS = ["slug", "sku", "shortDesc", "description", "howToUse", "ingredients", "seoTitle", "seoDescription"] as const;
type FieldKey = (typeof FIELD_KEYS)[number];
type Mode = "all" | "identity" | "details" | "usage" | "seo" | FieldKey;

type AIResult = Partial<Record<FieldKey, string>> & {
  notes?: string[];
  focusKeyword?: string;
  secondaryKeywords?: string[];
  seoSuggestions?: string[];
};

const FIELD_ACTIONS: { key: FieldKey; label: string }[] = [
  { key: "slug", label: "URL slug" },
  { key: "sku", label: "SKU" },
  { key: "shortDesc", label: "Short description" },
  { key: "description", label: "Full description" },
  { key: "howToUse", label: "How to / install" },
  { key: "ingredients", label: "Ingredients" },
  { key: "seoTitle", label: "SEO title" },
  { key: "seoDescription", label: "Meta description" },
];

export function ProductAIAssistant() {
  const [language, setLanguage] = useState("English");
  const [instructions, setInstructions] = useState("");
  const [loading, setLoading] = useState<Mode | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [notes, setNotes] = useState<string[]>([]);
  const [seoInsights, setSeoInsights] = useState<{ focusKeyword: string; secondaryKeywords: string[]; suggestions: string[] } | null>(null);

  async function generate(mode: Mode, button: HTMLButtonElement) {
    const form = findProductForm(button);
    if (!form) {
      setMessage("Product form not found.");
      return;
    }

    const data = new FormData(form);
    const context: Record<string, unknown> = {
      name: text(data, "name"),
      productType: text(data, "productType"),
      brand: text(data, "brand"),
      category: selectedText(form, "categoryId"),
      slug: text(data, "slug"),
      sku: text(data, "sku"),
      shortDesc: text(data, "shortDesc"),
      description: text(data, "description"),
      howToUse: text(data, "howToUse"),
      ingredients: text(data, "ingredients"),
      hairMaterial: text(data, "hairMaterial"),
      hairOrigin: text(data, "hairOrigin"),
      hairGrade: text(data, "hairGrade"),
      wigType: text(data, "wigType"),
      capSize: text(data, "capSize"),
      closureType: text(data, "closureType"),
      parting: text(data, "parting"),
      textures: data.getAll("textures").map(String),
      lengths: data.getAll("lengths").map(String),
      densities: data.getAll("densities").map(String),
      laceTypes: data.getAll("laceTypes").map(String),
      colors: text(data, "colors"),
      canBleach: text(data, "canBleach"),
      canDye: text(data, "canDye"),
      heatSafe: text(data, "heatSafe"),
      prePlucked: text(data, "prePlucked"),
      babyHair: text(data, "babyHair"),
      glueless: text(data, "glueless"),
      adjustableStrap: text(data, "adjustableStrap"),
      weightGrams: text(data, "weightGrams"),
      basePrice: text(data, "basePrice"),
      currency: text(data, "currency"),
      seoTitle: text(data, "seoTitle"),
      seoDescription: text(data, "seoDescription"),
      extraInstructions: instructions.trim(),
    };

    if (!String(context.name ?? "").trim()) {
      setMessage("Add the product name first so AI has a reliable starting point.");
      return;
    }

    setLoading(mode);
    setMessage(null);
    setNotes([]);
    if (!isSeoMode(mode)) setSeoInsights(null);
    try {
      const response = await fetch("/api/admin/ai/product-copy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode, language, context }),
      });
      const payload = await response.json() as { result?: AIResult; error?: string };
      if (!response.ok || !payload.result) throw new Error(payload.error || "AI generation failed.");
      applyResult(form, payload.result, mode);
      setNotes(payload.result.notes ?? []);
      if (isSeoMode(mode)) {
        setSeoInsights({
          focusKeyword: payload.result.focusKeyword ?? "",
          secondaryKeywords: payload.result.secondaryKeywords ?? [],
          suggestions: payload.result.seoSuggestions ?? [],
        });
      }
      setMessage(isFieldMode(mode) ? `${fieldLabel(mode)} updated by AI. Review it before saving.` : "AI suggestions inserted into the product form. Review them before saving.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "AI generation failed.");
    } finally {
      setLoading(null);
    }
  }

  return (
    <section className="rounded-[1.6rem] border border-flame/25 bg-gradient-to-br from-[#fff8f4] via-white to-[#fbf5ef] p-4 shadow-sm sm:p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-2xl">
          <div className="flex items-center gap-2"><span className="grid size-9 place-items-center rounded-xl bg-cocoa text-cream"><Sparkles className="size-4" /></span><div><p className="text-[10px] font-bold uppercase tracking-[.16em] text-flame">MAMAHAIR AI</p><h2 className="text-lg font-semibold text-cocoa">AI Product Assistant</h2></div></div>
          <p className="mt-3 text-sm leading-6 text-ink-soft">Generate or improve one field at a time, or generate a complete product draft. AI uses the facts already entered and avoids unsupported claims.</p>
        </div>
        <label className="text-xs font-semibold text-cocoa">Output language<select value={language} onChange={(e) => setLanguage(e.target.value)} className="mt-1 block min-w-40 rounded-xl border border-sand bg-white px-3 py-2 text-sm font-medium outline-none"><option>English</option><option>French</option><option>Spanish</option><option>Haitian Creole</option></select></label>
      </div>

      <div className="mt-4 grid gap-3 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-end">
        <label className="text-xs font-semibold text-cocoa">Extra instructions<input value={instructions} onChange={(e) => setInstructions(e.target.value)} placeholder="Example: premium tone, emphasize glueless install, avoid exaggerated claims..." className="mt-1 w-full rounded-xl border border-sand bg-white px-3 py-2.5 text-sm font-normal outline-none focus:border-cocoa" /></label>
        <div className="flex flex-wrap gap-2">
          <AIButton label="Generate all" mode="all" active={loading} onRun={generate} primary />
          <AIButton label="Slug + SKU" mode="identity" active={loading} onRun={generate} />
          <AIButton label="Product details" mode="details" active={loading} onRun={generate} />
          <AIButton label="How to / install" mode="usage" active={loading} onRun={generate} />
          <AIButton label="SEO" mode="seo" active={loading} onRun={generate} />
        </div>
      </div>

      <div className="mt-4 border-t border-sand/70 pt-4">
        <p className="mb-2 text-[10px] font-bold uppercase tracking-[.14em] text-cocoa/60">Generate one field</p>
        <div className="flex flex-wrap gap-2">
          {FIELD_ACTIONS.map((item) => <AIButton key={item.key} label={item.label} mode={item.key} active={loading} onRun={generate} compact />)}
        </div>
        <p className="mt-2 text-[11px] leading-5 text-ink-soft">Ingredients are never fabricated: if exact ingredients are not already provided, AI leaves that field unchanged.</p>
      </div>

      {seoInsights && (seoInsights.focusKeyword || seoInsights.secondaryKeywords.length > 0 || seoInsights.suggestions.length > 0) && (
        <div className="mt-4 rounded-2xl border border-sand bg-white p-4">
          <div className="flex items-center gap-2"><Search className="size-4 text-flame" /><p className="text-sm font-semibold text-cocoa">AI SEO guidance</p><span className="rounded-full bg-petal px-2 py-1 text-[9px] font-bold uppercase tracking-[.1em] text-cocoa">Advisory</span></div>
          <p className="mt-1 text-[11px] leading-5 text-ink-soft">These keyword suggestions are editorial guidance only. MAMAHAIR does not store them as product fields and AI does not claim search volume or ranking data.</p>
          {seoInsights.focusKeyword && <div className="mt-3"><p className="text-[10px] font-bold uppercase tracking-[.12em] text-cocoa/55">Focus keyword</p><span className="mt-1 inline-flex rounded-full bg-cocoa px-3 py-1.5 text-xs font-semibold text-cream">{seoInsights.focusKeyword}</span></div>}
          {seoInsights.secondaryKeywords.length > 0 && <div className="mt-3"><p className="text-[10px] font-bold uppercase tracking-[.12em] text-cocoa/55">Secondary keywords</p><div className="mt-2 flex flex-wrap gap-2">{seoInsights.secondaryKeywords.map((keyword) => <span key={keyword} className="rounded-full border border-sand bg-petal/45 px-3 py-1.5 text-xs font-medium text-cocoa">{keyword}</span>)}</div></div>}
          {seoInsights.suggestions.length > 0 && <div className="mt-3"><p className="text-[10px] font-bold uppercase tracking-[.12em] text-cocoa/55">On-page recommendations</p><ul className="mt-2 space-y-1.5 text-xs leading-5 text-ink-soft">{seoInsights.suggestions.map((suggestion) => <li key={suggestion} className="flex gap-2"><span className="mt-2 size-1.5 shrink-0 rounded-full bg-flame" />{suggestion}</li>)}</ul></div>}
        </div>
      )}

      {message && <p className="mt-3 rounded-xl border border-sand bg-white px-3 py-2 text-xs leading-5 text-cocoa">{message}</p>}
      {notes.length > 0 && <div className="mt-3 rounded-xl bg-amber-50 px-3 py-2 text-xs leading-5 text-amber-900"><strong>AI notes:</strong> {notes.join(" · ")}</div>}
    </section>
  );
}

function AIButton({ label, mode, active, onRun, primary = false, compact = false }: { label: string; mode: Mode; active: Mode | null; onRun: (mode: Mode, button: HTMLButtonElement) => void; primary?: boolean; compact?: boolean }) {
  const busy = active === mode;
  const base = compact ? "px-3 py-2 text-[11px]" : "px-3.5 py-2.5 text-xs";
  return <button type="button" disabled={active !== null} onClick={(event) => onRun(mode, event.currentTarget)} className={primary ? `inline-flex items-center gap-2 rounded-xl bg-cocoa ${base} font-semibold text-cream disabled:opacity-50` : `inline-flex items-center gap-2 rounded-xl border border-cocoa/25 bg-white ${base} font-semibold text-cocoa hover:bg-petal/50 disabled:opacity-50`}>{busy ? <Loader2 className="size-3.5 animate-spin" /> : <WandSparkles className="size-3.5" />}{busy ? "Generating…" : label}</button>;
}

function findProductForm(button: HTMLButtonElement) {
  const parent = button.closest("form");
  if (parent instanceof HTMLFormElement && parent.elements.namedItem("name") && parent.elements.namedItem("productType")) return parent;
  return Array.from(document.forms).find((form) => form.elements.namedItem("name") && form.elements.namedItem("productType")) ?? null;
}

function text(data: FormData, key: string) {
  const value = data.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function selectedText(form: HTMLFormElement, name: string) {
  const field = form.elements.namedItem(name);
  if (field instanceof HTMLSelectElement) return field.selectedOptions[0]?.text ?? "";
  return "";
}

function isFieldMode(mode: Mode): mode is FieldKey {
  return FIELD_KEYS.includes(mode as FieldKey);
}

function isSeoMode(mode: Mode) {
  return mode === "seo" || mode === "all" || mode === "seoTitle" || mode === "seoDescription";
}

function fieldLabel(key: FieldKey) {
  return FIELD_ACTIONS.find((item) => item.key === key)?.label ?? key;
}

function applyResult(form: HTMLFormElement, result: AIResult, mode: Mode) {
  const allowed: readonly FieldKey[] = isFieldMode(mode)
    ? [mode]
    : mode === "identity"
      ? ["slug", "sku"]
      : mode === "details"
        ? ["shortDesc", "description"]
        : mode === "usage"
          ? ["howToUse", "ingredients"]
          : mode === "seo"
            ? ["seoTitle", "seoDescription"]
            : FIELD_KEYS;

  for (const key of allowed) {
    const value = result[key];
    if (typeof value !== "string" || !value.trim()) continue;
    const field = form.elements.namedItem(key);
    if (field instanceof HTMLInputElement || field instanceof HTMLTextAreaElement) {
      const setter = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(field), "value")?.set;
      setter?.call(field, value);
      field.dispatchEvent(new Event("input", { bubbles: true }));
      field.dispatchEvent(new Event("change", { bubbles: true }));
    }
  }
}
