"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export function AccountNav({ items }: { items: { href: string; label: string }[] }) {
  const pathname = usePathname();
  const active = (href: string) => pathname === href || (href !== "/account" && pathname.startsWith(`${href}/`));

  return (
    <>
      <nav className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 pb-1 md:hidden">
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active(item.href) ? "page" : undefined}
            className={cn(
              "shrink-0 rounded-full border px-4 py-2.5 text-xs font-semibold transition",
              active(item.href)
                ? "border-cocoa bg-cocoa text-cream shadow-sm"
                : "border-sand bg-white text-cocoa hover:border-cocoa/35 hover:bg-petal/40",
            )}
          >
            {item.label}
          </Link>
        ))}
      </nav>

      <nav className="hidden overflow-hidden rounded-[1.5rem] border border-sand/80 bg-white p-2 shadow-[0_14px_40px_rgba(74,27,12,0.04)] md:block">
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active(item.href) ? "page" : undefined}
            className={cn(
              "group flex items-center justify-between gap-3 rounded-[1rem] px-3.5 py-3 text-sm font-medium transition",
              active(item.href)
                ? "bg-cocoa text-cream"
                : "text-cocoa hover:bg-petal/55",
            )}
          >
            <span>{item.label}</span>
            <ChevronRight className={cn("size-4 transition", active(item.href) ? "text-cream/70" : "text-ink-soft/45 group-hover:translate-x-0.5")} />
          </Link>
        ))}
      </nav>
    </>
  );
}
