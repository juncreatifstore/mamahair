"use client";

import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { ImagePlus, Images, ScanLine, Sparkles, Stamp, WandSparkles } from "lucide-react";

type Operation = "generate" | "enhance" | "brand" | "marketing";

const ACTIONS: { key: Operation; label: string; description: string; requirement: string; icon: typeof ImagePlus }[] = [
  { key: "generate", label: "Generate studio photo", description: "Create a new premium catalog image from product facts.", requirement: "No source photo required", icon: ImagePlus },
  { key: "enhance", label: "Retouch main photo", description: "Improve lighting, sharpness and background while preserving the product.", requirement: "Requires a product photo", icon: WandSparkles },
  { key: "brand", label: "Add MAMAHAIR logo", description: "Create a branded copy using the logo configured in Settings.", requirement: "Requires photo + configured logo", icon: Stamp },
  { key: "marketing", label: "Generate campaign image", description: "Create a premium editorial marketing visual from product facts.", requirement: "No source photo required", icon: Images },
];

export function ProductMediaAIStudioSafe() {
  const pathname = usePathname();
  const router = useRouter();
  const match = pathname.match(/^\/admin\/products\/([^/]+)$/);
  const productId = match?.[1] ?? null;
  const isNew = productId === "new";
  const [prompt, setPrompt] = useState("");
  const [active, setActive] = useState<Operation | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  if (!productId || productId === "inventory") return null;

  async function run(operation: Operation) {
    if (isNew || active) return;
    setActive(operation);
    setError(null);
    setMessage(null);
    try {
      const response = await fetch("/api/admin/ai/product-media", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, operation, prompt }),
      });
      const payload = await response.json() as { ok?: boolean; error?: string };
      if (!response.ok || !payload.ok) throw new Error(payload.error || "AI media generation failed.");
      setMessage("AI image created and added to this product. Review it in Media Studio before making it the main or variant image.");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "AI media generation failed.");
    } finally {
      setActive(null);
    }
  }

  return (
    <section id="ai-media" className="mb-6 scroll-mt-6 overflow-hidden rounded-[1.7rem] border border-flame/20 bg-white shadow-[0_16px_45px_rgba(74,27,12,.04)]">
      <div className="border-b border-sand/70 bg-[#fbf8f5] px-5 py-5 md:px-6">
        <div className="flex items-start gap-3">
          <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-flame text-white"><ScanLine className="size-5" /></span>
          <div>
            <div className="flex flex-wrap items-center gap-2"><h2 className="text-xl font-semibold text-cocoa">MAMAHAIR AI Media Studio</h2><span className="rounded-full bg-cocoa px-2.5 py-1 text-[10px] font-bold uppercase tracking-[.12em] text-cream">Images</span></div>
            <p className="mt-1 max-w-3xl text-sm leading-6 text-ink-soft">{isNew ? "AI Media is visible now and unlocks as soon as this product exists. Create the product first so every generated file can be attached safely to the correct media library." : "Generate, retouch and brand product visuals. Every AI result is saved as a new image so your original media stays untouched."}</p>
          </div>
        </div>
      </div>

      <div className="p-5 md:p-6">
        {!isNew && <label className="block text-sm font-semibold text-cocoa">Optional art direction
          <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="Example: warm cream background, soft studio shadow, luxury editorial lighting…" className="mt-2 min-h-20 w-full rounded-2xl border border-sand bg-white px-4 py-3 text-sm font-normal text-ink outline-none focus:border-cocoa" />
        </label>}

        <div className={isNew ? "grid gap-3 sm:grid-cols-2 xl:grid-cols-4" : "mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4"}>
          {ACTIONS.map((item) => {
            const Icon = item.icon;
            const loading = active === item.key;
            return (
              <button key={item.key} type="button" disabled={isNew || active !== null} onClick={() => run(item.key)} className="rounded-2xl border border-sand bg-white p-4 text-left transition hover:border-cocoa/35 hover:bg-petal/30 disabled:cursor-not-allowed disabled:opacity-55">
                <div className="flex items-start justify-between gap-3">
                  <span className="grid size-9 place-items-center rounded-xl bg-petal text-flame"><Icon className="size-4" /></span>
                  <span className="rounded-full bg-[#fbf8f5] px-2 py-1 text-[9px] font-bold uppercase tracking-[.08em] text-cocoa/60">{item.requirement}</span>
                </div>
                <p className="mt-4 text-sm font-semibold text-cocoa">{loading ? "Generating…" : item.label}</p>
                <p className="mt-1 text-xs leading-5 text-ink-soft">{isNew ? item.description : item.description}</p>
              </button>
            );
          })}
        </div>

        {isNew && <div className="mt-4 rounded-xl border border-dashed border-flame/30 bg-petal/40 px-4 py-3 text-sm leading-6 text-cocoa"><strong>Create the product first.</strong> Then return to this AI Media panel on the product page. Studio/campaign generation can work from product facts; Retouch needs a product photo; Branding needs a product photo and the MAMAHAIR logo configured in Settings.</div>}
        {error && <p role="alert" className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
        {message && <p className="mt-4 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{message}</p>}
        {!isNew && <div className="mt-4 flex items-start gap-2 rounded-xl bg-petal/45 px-4 py-3 text-xs leading-5 text-ink-soft"><Sparkles className="mt-0.5 size-4 shrink-0 text-flame" /><p><strong className="text-cocoa">Safe workflow:</strong> retouching is instructed to preserve the visible product. Branding uses the logo configured in Admin → Settings → Branding. AI-created files are added as new images instead of replacing originals.</p></div>}
      </div>
    </section>
  );
}
