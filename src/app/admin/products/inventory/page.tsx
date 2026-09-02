import Image from "next/image";
import Link from "next/link";
import { PageHeader } from "@/components/admin/ui";
import { Input } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCents } from "@/lib/money";
import { getAdminInventory, updateVariantInventory, type InventoryFilter } from "@/server/admin/product-inventory";
import { cn } from "@/lib/utils";

export default async function InventoryPage({ searchParams }: { searchParams: Promise<{ q?: string; stock?: string }> }) {
  const sp = await searchParams;
  const stock = (["out", "low", "available"].includes(sp.stock ?? "") ? sp.stock : "") as InventoryFilter;
  const variants = await getAdminInventory(sp.q ?? "", stock);

  const totals = variants.reduce((acc, variant) => {
    const quantity = variant.inventory?.quantity ?? 0;
    const reserved = variant.inventory?.reserved ?? 0;
    const available = Math.max(0, quantity - reserved);
    const lowAt = variant.inventory?.lowStockAt ?? 5;
    acc.total += quantity;
    acc.reserved += reserved;
    acc.available += available;
    if (available === 0) acc.out += 1;
    else if (available <= lowAt) acc.low += 1;
    return acc;
  }, { total: 0, reserved: 0, available: 0, low: 0, out: 0 });

  const qs = (nextStock: string) => {
    const p = new URLSearchParams();
    if (sp.q) p.set("q", sp.q);
    if (nextStock) p.set("stock", nextStock);
    const query = p.toString();
    return query ? `/admin/products/inventory?${query}` : "/admin/products/inventory";
  };

  return (
    <main>
      <PageHeader title="Inventory Center" sub="Manage stock for every active product variant from one place.">
        <Button href="/admin/products" variant="ghost" size="sm">Back to products</Button>
      </PageHeader>

      <div className="mb-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <Metric label="Variants shown" value={variants.length} />
        <Metric label="Total stock" value={totals.total} />
        <Metric label="Available" value={totals.available} tone="good" />
        <Metric label="Reserved" value={totals.reserved} tone="warn" />
        <Metric label="Low / out" value={`${totals.low} / ${totals.out}`} tone={totals.low + totals.out > 0 ? "danger" : "default"} />
      </div>

      <div className="mb-5 rounded-[1.5rem] border border-sand bg-white p-4 shadow-sm">
        <form className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
          <div className="flex flex-col gap-3 sm:flex-row">
            <Input name="q" defaultValue={sp.q ?? ""} placeholder="Search product, variant or SKU…" className="min-w-0 flex-1" />
            {stock && <input type="hidden" name="stock" value={stock} />}
            <button className="rounded-xl bg-cocoa px-4 py-2.5 text-sm font-semibold text-cream">Search</button>
          </div>
          <div className="no-scrollbar flex gap-2 overflow-x-auto">
            {["", "available", "low", "out"].map((value) => (
              <Link key={value || "all"} href={qs(value)} className={cn("shrink-0 rounded-full border px-3.5 py-2 text-xs font-semibold", stock === value ? "border-cocoa bg-cocoa text-cream" : "border-sand bg-white text-cocoa hover:border-cocoa/30")}>
                {value === "" ? "All" : value === "available" ? "Healthy" : value === "low" ? "Low stock" : "Out of stock"}
              </Link>
            ))}
          </div>
        </form>
      </div>

      <div className="space-y-3">
        {variants.map((variant) => {
          const quantity = variant.inventory?.quantity ?? 0;
          const reserved = variant.inventory?.reserved ?? 0;
          const available = Math.max(0, quantity - reserved);
          const lowAt = variant.inventory?.lowStockAt ?? 5;
          const stockTone = available === 0 ? "red" : available <= lowAt ? "honey" : "green";
          const stockLabel = available === 0 ? "Out of stock" : available <= lowAt ? "Low stock" : "Healthy";
          const image = variant.product.images[0]?.url;

          return (
            <article key={variant.id} className="rounded-[1.5rem] border border-sand bg-white p-4 shadow-[0_10px_30px_rgba(74,27,12,.035)] sm:p-5">
              <div className="grid gap-4 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,.75fr)_minmax(0,1fr)] xl:items-center">
                <div className="flex min-w-0 items-center gap-4">
                  <div className="relative size-16 shrink-0 overflow-hidden rounded-2xl bg-petal">
                    {image ? <Image src={image} alt="" fill sizes="64px" className="object-cover" /> : <div className="grid h-full place-items-center text-[10px] text-ink-soft">No image</div>}
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link href={`/admin/products/${variant.product.id}`} className="truncate font-semibold text-cocoa hover:underline">{variant.product.name}</Link>
                      <Badge tone={variant.product.status === "ACTIVE" ? "green" : variant.product.status === "DRAFT" ? "neutral" : "red"}>{variant.product.status}</Badge>
                    </div>
                    <p className="mt-1 truncate text-sm text-ink-soft">{variant.name}</p>
                    <p className="mt-1 font-mono text-[11px] text-ink-soft">{variant.sku}</p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center">
                  <StockStat label="On hand" value={quantity} />
                  <StockStat label="Reserved" value={reserved} />
                  <StockStat label="Available" value={available} strong />
                </div>

                <div>
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2"><Badge tone={stockTone}>{stockLabel}</Badge><span className="text-xs text-ink-soft">Alert at ≤ {lowAt}</span></div>
                    <span className="text-sm font-semibold text-cocoa">{formatCents(variant.priceCents, variant.product.currency)}</span>
                  </div>
                  <form action={updateVariantInventory} className="grid grid-cols-[1fr_1fr_auto] gap-2">
                    <input type="hidden" name="variantId" value={variant.id} />
                    <label className="text-[10px] font-bold uppercase tracking-[.1em] text-ink-soft">Stock<Input name="quantity" type="number" min={reserved} defaultValue={quantity} className="mt-1" /></label>
                    <label className="text-[10px] font-bold uppercase tracking-[.1em] text-ink-soft">Low at<Input name="lowStockAt" type="number" min="0" defaultValue={lowAt} className="mt-1" /></label>
                    <SubmitButton size="sm" variant="ghost" className="self-end" pendingText="Saving…">Save</SubmitButton>
                  </form>
                  {reserved > 0 && <p className="mt-2 text-[11px] text-amber-700">Stock cannot be reduced below {reserved} because those units are reserved by open orders.</p>}
                </div>
              </div>
            </article>
          );
        })}

        {variants.length === 0 && <div className="rounded-[1.5rem] border border-dashed border-sand bg-white p-10 text-center"><p className="font-semibold text-cocoa">No variants match this filter.</p><p className="mt-1 text-sm text-ink-soft">Try another search or stock status.</p></div>}
      </div>
    </main>
  );
}

function Metric({ label, value, tone = "default" }: { label: string; value: number | string; tone?: "default" | "good" | "warn" | "danger" }) {
  return <div className="rounded-2xl border border-sand bg-white p-4 shadow-sm"><p className="text-[10px] font-bold uppercase tracking-[.12em] text-ink-soft">{label}</p><p className={cn("mt-2 text-3xl font-semibold text-cocoa", tone === "good" && "text-green-700", tone === "warn" && "text-amber-700", tone === "danger" && "text-red-700")}>{value}</p></div>;
}

function StockStat({ label, value, strong = false }: { label: string; value: number; strong?: boolean }) {
  return <div className="rounded-xl bg-cream p-3"><p className="text-[9px] font-bold uppercase tracking-[.1em] text-ink-soft">{label}</p><p className={cn("mt-1 text-xl text-cocoa", strong && "font-semibold")}>{value}</p></div>;
}
