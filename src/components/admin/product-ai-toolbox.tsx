"use client";

import { usePathname } from "next/navigation";
import { useState } from "react";
import { Bot, Film, Images, Languages, Sparkles, X } from "lucide-react";
import { ProductAICopilot } from "@/components/admin/product-ai-copilot";
import { ProductMediaAIStudioSafe } from "@/components/admin/product-media-ai-studio-safe";
import { ProductAITranslations } from "@/components/admin/product-ai-translations";
import { ProductVideoAIStudio } from "@/components/admin/product-video-ai-studio";
import { cn } from "@/lib/utils";

type ToolKey = "copy" | "media" | "translations" | "video";

const TOOLS = [
  { key: "copy" as const, label: "Copy", description: "Descriptions, how-to, SEO", icon: Bot },
  { key: "media" as const, label: "Media", description: "Generate, retouch, brand", icon: Images },
  { key: "translations" as const, label: "Translations", description: "EN · FR · ES · HT", icon: Languages },
  { key: "video" as const, label: "Video", description: "Product video studio", icon: Film },
];

export function ProductAIToolbox() {
  const pathname = usePathname();
  const isEditor = pathname === "/admin/products/new" || /^\/admin\/products\/[^/]+$/.test(pathname);
  const isNew = pathname === "/admin/products/new";
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState<ToolKey>("copy");

  if (!isEditor) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-5 right-5 z-40 inline-flex items-center gap-2 rounded-full bg-cocoa px-4 py-3 text-sm font-semibold text-cream shadow-[0_16px_45px_rgba(74,27,12,.22)] transition hover:-translate-y-0.5"
      >
        <Sparkles className="size-4" />
        AI Tools
      </button>

      {open && (
        <div className="fixed inset-0 z-50 bg-cocoa/20 backdrop-blur-[2px]" onMouseDown={() => setOpen(false)}>
          <section
            className="absolute inset-x-3 bottom-3 max-h-[86vh] overflow-hidden rounded-[1.5rem] border border-sand bg-[#fbf8f5] shadow-[0_28px_80px_rgba(74,27,12,.24)] sm:left-auto sm:right-5 sm:w-[720px]"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-4 border-b border-sand bg-white px-4 py-3 sm:px-5">
              <div className="flex items-center gap-3">
                <span className="grid size-9 place-items-center rounded-xl bg-cocoa text-cream"><Sparkles className="size-4" /></span>
                <div>
                  <div className="flex items-center gap-2"><p className="text-sm font-semibold text-cocoa">MAMAHAIR AI Tools</p><span className="rounded-full bg-flame/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-[.1em] text-flame">AI</span></div>
                  <p className="mt-0.5 text-xs text-ink-soft">Copy, media, translations and video in one panel.</p>
                </div>
              </div>
              <button type="button" onClick={() => setOpen(false)} className="grid size-9 place-items-center rounded-xl border border-sand bg-white text-cocoa hover:bg-petal/40" aria-label="Close AI tools"><X className="size-4" /></button>
            </div>

            <div className="border-b border-sand bg-white px-3 py-3 sm:px-4">
              <div className="grid gap-2 grid-cols-2 sm:grid-cols-4">
                {TOOLS.map((tool) => {
                  const disabled = isNew && (tool.key === "translations" || tool.key === "video");
                  const Icon = tool.icon;
                  return (
                    <button
                      key={tool.key}
                      type="button"
                      disabled={disabled}
                      onClick={() => setActive(tool.key)}
                      className={cn(
                        "flex items-center gap-2 rounded-xl border px-3 py-2.5 text-left transition",
                        active === tool.key ? "border-cocoa bg-petal/55" : "border-sand bg-white hover:border-cocoa/30",
                        disabled && "cursor-not-allowed opacity-40",
                      )}
                    >
                      <span className={cn("grid size-8 shrink-0 place-items-center rounded-lg", active === tool.key ? "bg-cocoa text-cream" : "bg-petal text-flame")}><Icon className="size-3.5" /></span>
                      <span className="min-w-0"><span className="block text-xs font-semibold text-cocoa">{tool.label}</span><span className="block truncate text-[10px] text-ink-soft">{disabled ? "After creation" : tool.description}</span></span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="max-h-[calc(86vh-132px)] overflow-y-auto p-3 sm:p-4">
              {active === "copy" && <ProductAICopilot />}
              {active === "media" && <ProductMediaAIStudioSafe />}
              {active === "translations" && !isNew && <ProductAITranslations />}
              {active === "video" && !isNew && <ProductVideoAIStudio />}
            </div>
          </section>
        </div>
      )}
    </>
  );
}
