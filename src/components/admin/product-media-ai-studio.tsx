"use client";

import { usePathname, useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { ImagePlus, Images, ScanLine, Sparkles, Stamp, WandSparkles } from "lucide-react";
import { generateProductMediaAI } from "@/server/admin/product-media-ai";

const ACTIONS = [
  { key: "generate", label: "Generate studio photo", description: "Create a new premium catalog image from product facts.", icon: ImagePlus },
  { key: "enhance", label: "Retouch main photo", description: "Improve lighting, sharpness and background while preserving the product.", icon: WandSparkles },
  { key: "brand", label: "Add MAMAHAIR logo", description: "Create a branded copy using the logo configured in Settings.", icon: Stamp },
  { key: "marketing", label: "Generate campaign image", description: "Create a premium editorial marketing visual from product facts.", icon: Images },
] as const;

export function ProductMediaAIStudio() {
  const pathname = usePathname();
  const router = useRouter();
  const match = pathname.match(/^\/admin\/products\/([^/]+)$/);
  const productId = match?.[1] ?? null;
  const [prompt, setPrompt] = useState("");
  const [active, setActive] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  if (!productId || productId === "new" || productId === "inventory") return null;

  const run = (operation: (typeof ACTIONS)[number]["key"]) => {
    setError(null);
    setMessage(null);
    setActive(operation);
    startTransition(async () => {
      const result = await generateProductMediaAI({ productId, operation, prompt });
      if (!result.ok) {
        setError(result.error || "AI media generation failed.");
        setActive(null);
        return;
      }
      setMessage("AI image created and saved to this product's Media Studio. Review it before using it as a main or variant image.");
      setActive(null);
      router.refresh();
    });
  };

  return (
    <section className="mb-6 overflow-hidden rounded-[1.7rem] border border-flame/20 bg-white shadow-[0_16px_45px_rgba(74,27,12,.04)]">
      <div className="flex flex-col gap-4 border-b border-sand/70 bg-[#fbf8f5] px-5 py-5 md:flex-row md:items-center md:justify-between md:px-6">
        <div className="flex items-start gap-3">
          <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-flame text-white"><ScanLine className="size-5" /></span>
          <div><div className="flex flex-wrap items-center gap-2"><h2 className="text-xl font-semibold text-cocoa">MAMAHAIR AI Media Studio</h2><span className="rounded-full bg-cocoa px-2.5 py-1 text-[10px] font-bold uppercase tracking-[.12em] text-cream">Images</span></div><p className="mt-1 max-w-3xl text-sm leading-6 text-ink-soft">Generate, retouch and brand product visuals. Every result is saved as a new image so the original photo is never overwritten.</p></div>
        </div>
      </div>

      <div className="p-5 md:p-6">
        <label className="block text-sm font-semibold text-cocoa">Optional art direction<textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="Example: warm cream background, soft studio shadow, luxury editorial lighting…" className="mt-2 min-h-20 w-full rounded-2xl border border-sand bg-white px-4 py-3 text-sm font-normal text-ink outline-none focus:border-cocoa" /></label>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {ACTIONS.map((item) => {
            const Icon = item.icon;
            const loading = pending && active === item.key;
            return <button key={item.key} type="button" disabled={pending} onClick={() => run(item.key)} className="rounded-2xl border border-sand bg-white p-4 text-left transition hover:border-cocoa/35 hover:bg-petal/30 disabled:opacity-55"><span className="grid size-9 place-items-center rounded-xl bg-petal text-flame"><Icon className="size-4" /></span><p className="mt-4 text-sm font-semibold text-cocoa">{loading ? "Generating…" : item.label}</p><p className="mt-1 text-xs leading-5 text-ink-soft">{item.description}</p></button>;
          })}
        </div>
        {error && <p role="alert" className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
        {message && <p className="mt-4 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{message}</p>}
        <div className="mt-4 flex items-start gap-2 rounded-xl bg-petal/45 px-4 py-3 text-xs leading-5 text-ink-soft"><Sparkles className="mt-0.5 size-4 shrink-0 text-flame" /><p><strong className="text-cocoa">Brand protection:</strong> retouching is instructed to preserve the product's color, texture, length and construction. Logo mode uses the actual logo configured under Admin → Settings → Branding as a visual reference.</p></div>
      </div>
    </section>
  );
}
