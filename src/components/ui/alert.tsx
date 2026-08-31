import { cn } from "@/lib/utils";

export function Alert({ children, tone = "error", className }: { children: React.ReactNode; tone?: "error" | "success" | "info"; className?: string }) {
  const t = { error: "bg-red-50 text-red-800 border-red-200", success: "bg-emerald-50 text-emerald-900 border-emerald-200", info: "bg-petal text-ink border-peach" }[tone];
  return <div role={tone === "error" ? "alert" : "status"} className={cn("rounded-xl border px-4 py-3 text-sm", t, className)}>{children}</div>;
}
