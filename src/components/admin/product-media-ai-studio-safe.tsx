"use client";

import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { ChevronDown, ImagePlus, Images, ScanLine, Sparkles, Stamp, WandSparkles } from "lucide-react";
import { cn } from "@/lib/utils";

type Operation = "generate" | "enhance" | "brand" | "marketing";

const ACTIONS: { key: Operation; label: string; description: string; requirement: string; icon: typeof ImagePlus }[] = [
  { key: "generate", label: "Studio photo", description: "Create a premium catalog image from product facts.", requirement: "No photo required", icon: ImagePlus },
  { key: "enhance", label: "Retouch main photo", description: "Improve lighting, sharpness and background while preserving the product.", requirement: "Needs product photo", icon: WandSparkles },
  { key: "brand", label: "Add MAMAHAIR logo", description: "Create a branded copy using the configured logo.", requirement: "Needs photo + logo", icon: Stamp },
  { key: "marketing", label: "Campaign image", description: "Create a premium editorial marketing visual from product facts.", requirement: "No photo required", icon: Images },
];

export function ProductMediaAIStudioSafe() {
  const pathname = usePathname();
  const router = useRouter();
  const match = pathname.match(/^\/admin\/products\/([^/]+)$/);
  const productId = match?.[1] ?? null;
  const isNew = productId === "new";
  const [open, setOpen] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [active, setActive] = useState<Operation | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  if (!productId || productId === "inventory") return null;

  async function run(operation: Operation) {
    if (isNew || active) return;
    setActive(operation); setError(null); setMessage(null);
    try {
      const response = await fetch("/api/admin/ai/product-media", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, operation, prompt }),
      });
      const payload = await response.json() as { ok?: boolean; error?: string };
      if (!response.ok || !payload.ok) throw new Error(payload.error || "AI media generation failed.");
      setMessage("AI image created and added to this product. Review it in Media Studio.");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "AI media generation failed.");
    } finally {
      setActive(null);
    }
  }

  return (
    <section id="ai-media" className="mb-4 scroll-mt-6 overflow-hidden rounded-2xl border border-flame/15 bg-white shadow-sm">
      <button type="button" onClick={() => setOpen((v) => !v)} className="flex w-full items-center justify-between gap-4 px-4 py-3 text-left sm:px-5">
        <div className="flex min-w-0 items-center gap-3">
          <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-flame text-white"><ScanLine className="size-4" /></span>
          <div className="min-w-0">
            <div className="flex items-center gap-2"><p className="truncate text-sm font-semibold text-cocoa">AI Media Studio</p><span className="rounded-full bg-cocoa px-2 py-0.5 text-[9px] font-bold uppercase tracking-[.1em] text-cream">Images</span></div>
            <p className="mt-0.5 truncate text-xs text-ink-soft">{isNew ? "Available after the product is created." : "Generate, retouch or brand product visuals."}</p>
          </div>
        </div>
        <ChevronDown className={cn("size-4 shrink-0 text-cocoa/60 transition", open && "rotate-180")} />
      </button>

      {open && <div className="border-t border-sand/70 bg-[#fffdfa] p-4 sm:p-5">
        {!isNew && <label className="block text-xs font-semibold text-cocoa">Optional art direction
          <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="Warm cream background, soft studio shadow, luxury editorial lighting…" className="mt-1.5 min-h-16 w-full rounded-xl border border-sand bg-white px-3 py-2.5 text-sm font-normal text-ink outline-none focus:border-cocoa" />
        </label>}

        <div className={cn("grid gap-2 sm:grid-cols-2 xl:grid-cols-4", !isNew && "mt-4")}>
          {ACTIONS.map((item) => {
            const Icon = item.icon; const loading = active === item.key;
            return <button key={item.key} type="button" disabled={isNew || active !== null} onClick={() => run(item.key)} className="rounded-xl border border-sand bg-white p-3 text-left transition hover:border-cocoa/35 hover:bg-petal/30 disabled:cursor-not-allowed disabled:opacity-55"><div className="flex items-center gap-2"><span className="grid size-8 shrink-0 place-items-center rounded-lg bg-petal text-flame"><Icon className="size-3.5" /></span><div className="min-w-0"><p className="truncate text-xs font-semibold text-cocoa">{loading ? "Generating…" : item.label}</p><p className="mt-0.5 text-[10px] text-cocoa/50">{item.requirement}</p></div></div><p className="mt-2 text-[11px] leading-4 text-ink-soft">{item.description}</p></button>;
          })}
        </div>

        {isNew && <p className="mt-3 rounded-lg border border-dashed border-flame/25 bg-petal/35 px-3 py-2 text-xs leading-5 text-cocoa">Create the product first. The same AI Media tools unlock automatically on the product page.</p>}
        {error && <p role="alert" className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">{error}</p>}
        {message && <p className="mt-3 rounded-lg bg-emerald-50 px-3 py-2 text-xs text-emerald-700">{message}</p>}
        {!isNew && <div className="mt-3 flex items-start gap-2 text-[11px] leading-4 text-ink-soft"><Sparkles className="mt-0.5 size-3.5 shrink-0 text-flame" /><p>AI outputs are added as new images; originals stay untouched.</p></div>}
      </div>}
    </section>
  );
}
