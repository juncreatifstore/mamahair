"use client";

import { usePathname } from "next/navigation";
import { useState, useTransition } from "react";
import { ChevronDown, Film, RefreshCw, Sparkles } from "lucide-react";
import { checkProductVideoAI, startProductVideoAI } from "@/server/admin/product-video-ai";
import { cn } from "@/lib/utils";

export function ProductVideoAIStudio() {
  const pathname = usePathname();
  const match = pathname.match(/^\/admin\/products\/([^/]+)$/);
  const productId = match?.[1] ?? null;
  const [open, setOpen] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [videoId, setVideoId] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  if (!productId || productId === "new" || productId === "inventory") return null;

  const start = () => {
    setError(null); setVideoUrl(null);
    startTransition(async () => {
      const result = await startProductVideoAI({ productId, prompt });
      if (!result.ok || !result.videoId) return setError(result.error || "Could not start AI video generation.");
      setVideoId(result.videoId); setStatus(result.status || "queued"); setProgress(result.progress || 0);
    });
  };

  const check = () => {
    if (!videoId) return;
    setError(null);
    startTransition(async () => {
      const result = await checkProductVideoAI({ productId, videoId });
      if (!result.ok) return setError(result.error || "Could not check AI video.");
      setStatus(result.status || "in_progress"); setProgress(result.progress || 0); if (result.videoUrl) setVideoUrl(result.videoUrl);
    });
  };

  return (
    <section className="mb-4 overflow-hidden rounded-2xl border border-cocoa/10 bg-white shadow-sm">
      <button type="button" onClick={() => setOpen((v) => !v)} className="flex w-full items-center justify-between gap-4 px-4 py-3 text-left sm:px-5">
        <div className="flex min-w-0 items-center gap-3">
          <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-cocoa text-cream"><Film className="size-4" /></span>
          <div className="min-w-0"><div className="flex items-center gap-2"><p className="truncate text-sm font-semibold text-cocoa">AI Product Video</p><span className="rounded-full bg-flame/10 px-2 py-0.5 text-[9px] font-bold text-flame">Video</span></div><p className="mt-0.5 truncate text-xs text-ink-soft">Create a short vertical product video when needed.</p></div>
        </div>
        <ChevronDown className={cn("size-4 shrink-0 text-cocoa/60 transition", open && "rotate-180")} />
      </button>

      {open && <div className="border-t border-sand/70 bg-[#fffdfa] p-4 sm:p-5">
        <label className="block text-xs font-semibold text-cocoa">Optional video direction<textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="Slow turntable movement, soft luxury lighting, close-up texture reveal…" className="mt-1.5 min-h-16 w-full rounded-xl border border-sand px-3 py-2.5 text-sm font-normal outline-none focus:border-cocoa" /></label>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <button type="button" onClick={start} disabled={pending} className="inline-flex items-center gap-2 rounded-xl bg-cocoa px-3 py-2 text-xs font-semibold text-cream disabled:opacity-55"><Sparkles className="size-3.5" />{pending && !videoId ? "Starting…" : "Generate video"}</button>
          {videoId && <button type="button" onClick={check} disabled={pending} className="inline-flex items-center gap-2 rounded-xl border border-cocoa px-3 py-2 text-xs font-semibold text-cocoa disabled:opacity-55"><RefreshCw className="size-3.5" />Check progress</button>}
          {status && <span className="rounded-full bg-petal px-2.5 py-1 text-[11px] font-semibold text-cocoa">{status.replaceAll("_", " ")} · {progress}%</span>}
        </div>
        {videoId && <p className="mt-2 text-[11px] text-ink-soft">Job: {videoId}</p>}
        {error && <p role="alert" className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">{error}</p>}
        {videoUrl && <div className="mt-4 overflow-hidden rounded-xl border border-sand bg-black"><video src={videoUrl} controls playsInline className="mx-auto max-h-[520px] w-full object-contain" /></div>}
      </div>}
    </section>
  );
}
