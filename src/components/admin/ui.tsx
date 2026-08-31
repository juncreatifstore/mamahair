import { cn } from "@/lib/utils";

export function PageHeader({ title, children, sub }: { title: string; children?: React.ReactNode; sub?: string }) {
  return <div className="mb-6 flex flex-wrap items-center justify-between gap-3"><div><h1 className="text-3xl text-cocoa">{title}</h1>{sub && <p className="mt-1 text-sm text-ink-soft">{sub}</p>}</div>{children && <div className="flex flex-wrap gap-2">{children}</div>}</div>;
}
export function Card({ children, className, title, action }: { children: React.ReactNode; className?: string; title?: string; action?: React.ReactNode }) {
  return <section className={cn("rounded-2xl bg-white p-5", className)}>{title && <div className="mb-4 flex items-center justify-between"><h2 className="font-body text-base font-semibold">{title}</h2>{action}</div>}{children}</section>;
}
export function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return <div className="rounded-2xl bg-white p-5"><p className="text-sm text-ink-soft">{label}</p><p className="display mt-1 text-3xl text-cocoa">{value}</p>{sub && <p className="mt-1 text-xs text-ink-soft">{sub}</p>}</div>;
}
export function Table({ head, children }: { head: string[]; children: React.ReactNode }) {
  return <div className="overflow-x-auto rounded-2xl bg-white"><table className="w-full text-sm"><thead className="border-b border-sand text-left text-xs text-ink-soft"><tr>{head.map((h, i) => <th key={i} className="px-4 py-3 font-medium">{h}</th>)}</tr></thead><tbody className="divide-y divide-sand">{children}</tbody></table></div>;
}
export const td = "px-4 py-3 align-middle";

/** Mini graphique barres (SVG, sans dépendance). */
export function BarChart({ data, format }: { data: { label: string; value: number }[]; format: (v: number) => string }) {
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <div>
      <div className="flex h-40 items-end gap-[3px]">
        {data.map((d) => <div key={d.label} title={`${d.label}: ${format(d.value)}`} className="flex-1 rounded-t bg-flame/80 hover:bg-flame" style={{ height: `${Math.max(2, (d.value / max) * 100)}%` }} />)}
      </div>
      <div className="mt-1 flex justify-between text-[10px] text-ink-soft"><span>{data[0]?.label}</span><span>{data[data.length - 1]?.label}</span></div>
    </div>
  );
}
