import Link from "next/link";
import { cn } from "@/lib/utils";
export function SettingsTabs({ tabs, active }: { tabs: { key: string; title: string }[]; active: string }) {
  return <div className="no-scrollbar flex gap-1 overflow-x-auto rounded-pill bg-white p-1">{tabs.map((t) => <Link key={t.key} href={`/admin/settings?tab=${t.key}`} className={cn("shrink-0 rounded-pill px-4 py-2 text-sm font-medium", active === t.key ? "bg-cocoa text-cream" : "hover:bg-petal")}>{t.title}</Link>)}</div>;
}
