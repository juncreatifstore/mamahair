"use client";

import { useState } from "react";
import { Loader2, Sparkles, WandSparkles } from "lucide-react";

type Mode = "all" | "identity" | "details" | "usage" | "seo";

type AIResult = Partial<Record<"slug" | "sku" | "shortDesc" | "description" | "howToUse" | "ingredients" | "seoTitle" | "seoDescription", string>> & { notes?: string[] };

const FIELD_KEYS = ["slug", "sku", "shortDesc", "description", "howToUse", "ingredients", "seoTitle", "seoDescription"] as const;

export function ProductAIAssistant() {
  const [language, setLanguage] = useState("English");
  const [instructions, setInstructions] = useState("");
  const [loading, setLoading] = useState<Mode | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [notes, setNotes] = useState<string[]>([]);

  async function generate(mode: Mode, button: HTMLButtonElement) {
    const form = button.closest("form");
    if (!form) return;

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
      setMessage("AI suggestions inserted into the product form. Review them before saving.");
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
          <p className="mt-3 text-sm leading-6 text-ink-soft">Generate product copy from the facts already entered. AI will not invent ingredients, hair origin, certifications or unsupported product claims.</p>
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

      {message && <p className="mt-3 rounded-xl border border-sand bg-white px-3 py-2 text-xs leading-5 text-cocoa">{message}</p>}
      {notes.length > 0 && <div className="mt-3 rounded-xl bg-amber-50 px-3 py-2 text-xs leading-5 text-amber-900"><strong>AI notes:</strong> {notes.join(" · ")}</div>}
    </section>
  );
}

function AIButton({ label, mode, active, onRun, primary = false }: { label: string; mode: Mode; active: Mode | null; onRun: (mode: Mode, button: HTMLButtonElement) => void; primary?: boolean }) {
  const busy = active === mode;
  return <button type="button" disabled={active !== null} onClick={(event) => onRun(mode, event.currentTarget)} className={primary ? "inline-flex items-center gap-2 rounded-xl bg-cocoa px-3.5 py-2.5 text-xs font-semibold text-cream disabled:opacity-50" : "inline-flex items-center gap-2 rounded-xl border border-cocoa/25 bg-white px-3.5 py-2.5 text-xs font-semibold text-cocoa hover:bg-petal/50 disabled:opacity-50"}>{busy ? <Loader2 className="size-3.5 animate-spin" /> : <WandSparkles className="size-3.5" />}{busy ? "Generating…" : label}</button>;
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

function applyResult(form: HTMLFormElement, result: AIResult, mode: Mode) {
  const allowed = mode === "identity" ? ["slug", "sku"] : mode === "details" ? ["shortDesc", "description"] : mode === "usage" ? ["howToUse", "ingredients"] : mode === "seo" ? ["seoTitle", "seoDescription"] : [...FIELD_KEYS];
  for (const key of allowed) {
    const value = result[key as keyof AIResult];
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
