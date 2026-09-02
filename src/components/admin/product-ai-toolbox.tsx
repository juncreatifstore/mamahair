"use client";

import { usePathname } from "next/navigation";
import { useState } from "react";
import { Bot, Film, Images, Languages, Sparkles } from "lucide-react";
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
    <section className="mb-4 overflow-hidden rounded-2xl border border-cocoa/10 bg-white shadow-[0_8px_26px_rgba(74,27,12,.035)]">
      <button type="button" onClick={() => setOpen((value) => !value)} className="flex w-full items-center justify-between gap-4 px-4 py-3 text-left sm:px-5">
        <div className="flex min-w-0 items-center gap-3">
          <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-cocoa text-cream"><Sparkles className="size-4" /></span>
          <div className="min-w-0">
            <div className="flex items-center gap-2"><p className="text-sm font-semibold text-cocoa">AI Tools</p><span className="rounded-full bg-flame/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-[.1em] text-flame">MAMAHAIR AI</span></div>
            <p className="mt-0.5 truncate text-xs text-ink-soft">Copy, media, translations and video in one workspace.</p>
          </div>
        </div>
        <span className="shrink-0 text-xs font-semibold text-cocoa">{open ? "Close" : "Open tools"}</span>
      </button>

      {open && (
        <div className="border-t border-sand/70 p-3 sm:p-4">
          <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
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
                    "flex items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition",
                    active === tool.key ? "border-cocoa bg-petal/55" : "border-sand bg-white hover:border-cocoa/30",
                    disabled && "cursor-not-allowed opacity-40",
                  )}
                >
                  <span className={cn("grid size-8 shrink-0 place-items-center rounded-lg", active === tool.key ? "bg-cocoa text-cream" : "bg-petal text-flame")}><Icon className="size-3.5" /></span>
                  <span className="min-w-0"><span className="block text-xs font-semibold text-cocoa">{tool.label}</span><span className="block truncate text-[10px] text-ink-soft">{disabled ? "Available after creation" : tool.description}</span></span>
                </button>
              );
            })}
          </div>

          <div className="mt-3">
            {active === "copy" && <ProductAICopilot />}
            {active === "media" && <ProductMediaAIStudioSafe />}
            {active === "translations" && !isNew && <ProductAITranslations />}
            {active === "video" && !isNew && <ProductVideoAIStudio />}
          </div>
        </div>
      )}
    </section>
  );
}
