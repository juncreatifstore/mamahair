"use client";

import { usePathname } from "next/navigation";
import { useState, useTransition } from "react";
import { Film, RefreshCw, Sparkles } from "lucide-react";
import { checkProductVideoAI, startProductVideoAI } from "@/server/admin/product-video-ai";

export function ProductVideoAIStudio() {
  const pathname = usePathname();
  const match = pathname.match(/^\/admin\/products\/([^/]+)$/);
  const productId = match?.[1] ?? null;
  const [prompt, setPrompt] = useState("");
  const [videoId, setVideoId] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  if (!productId || productId === "new" || productId === "inventory") return null;

  const start = () => {
    setError(null);
    setVideoUrl(null);
    startTransition(async () => {
      const result = await startProductVideoAI({ productId, prompt });
      if (!result.ok || !result.videoId) {
        setError(result.error || "Could not start AI video generation.");
        return;
      }
      setVideoId(result.videoId);
      setStatus(result.status || "queued");
      setProgress(result.progress || 0);
    });
  };

  const check = () => {
    if (!videoId) return;
    setError(null);
    startTransition(async () => {
      const result = await checkProductVideoAI({ productId, videoId });
      if (!result.ok) {
        setError(result.error || "Could not check AI video.");
        return;
      }
      setStatus(result.status || "in_progress");
      setProgress(result.progress || 0);
      if (result.videoUrl) setVideoUrl(result.videoUrl);
    });
  };

  return (
    <section className="mb-6 overflow-hidden rounded-[1.7rem] border border-cocoa/15 bg-white shadow-[0_16px_45px_rgba(74,27,12,.04)]">
      <div className="flex items-start gap-3 border-b border-sand/70 bg-[#fbf8f5] px-5 py-5 md:px-6">
        <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-cocoa text-cream"><Film className="size-5" /></span>
        <div><div className="flex flex-wrap items-center gap-2"><h2 className="text-xl font-semibold text-cocoa">AI Product Video</h2><span className="rounded-full bg-flame/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[.12em] text-flame">Sora</span></div><p className="mt-1 max-w-3xl text-sm leading-6 text-ink-soft">Create an 8-second vertical product video. The main product photo is used as a reference when available.</p></div>
      </div>
      <div className="p-5 md:p-6">
        <label className="block text-sm font-semibold text-cocoa">Optional video direction<textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="Example: slow turntable movement, soft luxury lighting, close-up texture reveal…" className="mt-2 min-h-20 w-full rounded-2xl border border-sand px-4 py-3 text-sm font-normal outline-none focus:border-cocoa" /></label>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button type="button" onClick={start} disabled={pending} className="inline-flex items-center gap-2 rounded-xl bg-cocoa px-4 py-2.5 text-sm font-semibold text-cream disabled:opacity-55"><Sparkles className="size-4" />{pending && !videoId ? "Starting…" : "Generate product video"}</button>
          {videoId && <button type="button" onClick={check} disabled={pending} className="inline-flex items-center gap-2 rounded-xl border border-cocoa px-4 py-2.5 text-sm font-semibold text-cocoa disabled:opacity-55"><RefreshCw className="size-4" />Check progress</button>}
          {status && <span className="rounded-full bg-petal px-3 py-1.5 text-xs font-semibold text-cocoa">{status.replaceAll("_", " ")} · {progress}%</span>}
        </div>
        {videoId && <p className="mt-3 text-xs text-ink-soft">Job: {videoId}. Video generation is asynchronous; use “Check progress” until it is completed.</p>}
        {error && <p role="alert" className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
        {videoUrl && <div className="mt-5 overflow-hidden rounded-2xl border border-sand bg-black"><video src={videoUrl} controls playsInline className="mx-auto max-h-[640px] w-full object-contain" /></div>}
      </div>
    </section>
  );
}
