"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export function AccountNav({ items }: { items: { href: string; label: string }[] }) {
  const p = usePathname();
  return (
    <nav className="no-scrollbar flex gap-2 overflow-x-auto md:flex-col">
      {items.map((i) => <Link key={i.href} href={i.href} className={cn("shrink-0 rounded-pill px-4 py-2 text-sm font-medium", p === i.href ? "bg-cocoa text-cream" : "bg-white hover:bg-petal")}>{i.label}</Link>)}
    </nav>
  );
}
