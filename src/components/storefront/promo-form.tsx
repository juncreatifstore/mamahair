"use client";
import { useState, useTransition } from "react";
import { applyDiscount, removeDiscount } from "@/server/cart";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function PromoForm({ current, labels }: { current: string | null; labels: { promo: string; apply: string } }) {
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  if (current)
    return (
      <div className="flex items-center justify-between rounded-lg bg-forest/10 px-3 py-2 text-sm">
        <span>Code <strong>{current}</strong> applied</span>
        <button className="underline" onClick={() => start(() => removeDiscount())}>Remove</button>
      </div>
    );

  return (
    <div className="space-y-1.5">
      <div className="flex gap-2">
        <Input placeholder={labels.promo} value={code} onChange={(e) => setCode(e.target.value)} />
        <Button variant="ghost" disabled={pending || !code} onClick={() => start(async () => { const r = await applyDiscount(code); setError(r.error ?? null); if (!r.error) setCode(""); })}>
          {labels.apply}
        </Button>
      </div>
      {error && <p className="text-xs text-red-700">{error}</p>}
    </div>
  );
}
