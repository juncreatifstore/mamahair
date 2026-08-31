"use client";
import { useActionState } from "react";
import { subscribeNewsletter } from "@/server/newsletter";

export function NewsletterForm({ cta, done, dark }: { cta: string; done: string; dark?: boolean }) {
  const [state, action] = useActionState<{ error?: string; ok?: boolean }, FormData>(subscribeNewsletter, {});
  if (state.ok) return <p className={`text-sm ${dark ? "text-peach" : "text-cocoa"}`}>{done}</p>;
  return (
    <form action={action} className="flex gap-2">
      <input name="email" type="email" required placeholder="you@email.com" className={`h-11 flex-1 rounded-pill px-4 text-sm ${dark ? "bg-cream/10 text-cream placeholder:text-cream/50" : "border border-sand bg-white"}`} />
      <input type="hidden" name="source" value={dark ? "footer" : "home"} />
      <button className="h-11 rounded-pill bg-flame px-5 text-sm font-medium text-white hover:bg-flame-deep">{cta}</button>
      {state.error && <span className="text-xs text-red-300">{state.error}</span>}
    </form>
  );
}
