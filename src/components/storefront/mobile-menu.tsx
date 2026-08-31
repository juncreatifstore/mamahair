"use client";
import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";

export function MobileMenu({ nav, label }: { nav: { href: string; label: string }[]; label: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="lg:hidden">
      <button aria-label={label} aria-expanded={open} onClick={() => setOpen(true)} className="grid size-10 place-items-center rounded-pill hover:bg-petal"><Menu className="size-5" /></button>
      {open && (
        <div className="fixed inset-0 z-50 bg-ink/40" onClick={() => setOpen(false)}>
          <nav className="h-full w-80 max-w-[85vw] bg-cream p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between"><span className="display text-xl text-cocoa">{label}</span><button aria-label="Close" onClick={() => setOpen(false)}><X className="size-5" /></button></div>
            <ul className="mt-6 space-y-1">
              {nav.map((n) => <li key={n.href}><Link href={n.href} onClick={() => setOpen(false)} className="block rounded-xl px-3 py-3 text-base font-medium hover:bg-petal">{n.label}</Link></li>)}
            </ul>
          </nav>
        </div>
      )}
    </div>
  );
}
