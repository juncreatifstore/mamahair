"use client";
import { useState, useTransition } from "react";
import { uploadHomeImage } from "@/server/admin/settings";

export function HomeImageUpload() {
  const [url, setUrl] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [pending, start] = useTransition();
  return (
    <form onSubmit={(e) => { e.preventDefault(); const fd = new FormData(e.currentTarget); start(async () => { const r = await uploadHomeImage(fd); setUrl(r.url ?? null); setErr(r.error ?? null); }); }} className="flex flex-wrap items-center gap-2 rounded-xl bg-white p-3 text-sm">
      <input type="file" name="file" accept="image/*" required className="text-xs" />
      <button disabled={pending} className="rounded-pill border border-sand px-3 py-1.5">{pending ? "Uploading…" : "Upload image → URL"}</button>
      {url && <input readOnly value={url} onFocus={(e) => e.currentTarget.select()} className="min-w-64 flex-1 rounded-lg border border-sand px-2 py-1 text-xs" />}
      {err && <span className="text-xs text-red-700">{err}</span>}
    </form>
  );
}
