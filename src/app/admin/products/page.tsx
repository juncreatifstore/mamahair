import Link from "next/link";
import Image from "next/image";
import { adminListProducts, adminListCategories, saveCategory, uploadCategoryImage } from "@/server/admin/products";
import { PageHeader, Table, td, Card } from "@/components/admin/ui";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input, Field } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit-button";
import { formatCents } from "@/lib/money";
import { PRODUCT_TYPES } from "@/lib/catalog";
import { cn } from "@/lib/utils";

export default async function AdminProductsPage({ searchParams }: { searchParams: Promise<{ q?: string; status?: string }> }) {
  const sp = await searchParams;
  const [products, categories] = await Promise.all([adminListProducts(sp.q, sp.status), adminListCategories()]);

  const inventory = products.reduce(
    (acc, p) => {
      if (p.status === "ACTIVE") acc.activeProducts += 1;
      let productAvailable = 0;
      for (const v of p.variants) {
        const quantity = v.inventory?.quantity ?? 0;
        const reserved = v.inventory?.reserved ?? 0;
        const available = Math.max(0, quantity - reserved);
        acc.availableUnits += available;
        acc.reservedUnits += reserved;
        productAvailable += available;
        if (available <= (v.inventory?.lowStockAt ?? 5)) acc.lowStockVariants += 1;
      }
      if (p.variants.length > 0 && productAvailable === 0) acc.outOfStockProducts += 1;
      return acc;
    },
    { activeProducts: 0, outOfStockProducts: 0, lowStockVariants: 0, availableUnits: 0, reservedUnits: 0 },
  );

  return (
    <>
      <PageHeader title="Products"><Button href="/admin/products/new">Add product</Button></PageHeader>

      <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <Metric label="Active products" value={inventory.activeProducts} />
        <Metric label="Available units" value={inventory.availableUnits} />
        <Metric label="Reserved units" value={inventory.reservedUnits} />
        <Metric label="Low-stock variants" value={inventory.lowStockVariants} warn={inventory.lowStockVariants > 0} />
        <Metric label="Out of stock" value={inventory.outOfStockProducts} danger={inventory.outOfStockProducts > 0} />
      </div>

      <form className="mb-4 flex flex-wrap gap-2"><Input name="q" placeholder="Search name or SKU…" defaultValue={sp.q} className="max-w-sm" />{["", "ACTIVE", "DRAFT", "ARCHIVED"].map((s) => <Link key={s} href={s ? `/admin/products?status=${s}` : "/admin/products"} className={cn("rounded-pill border px-3 py-2 text-sm", (sp.status ?? "") === s ? "border-cocoa bg-cocoa text-cream" : "border-sand bg-white")}>{s || "All"}</Link>)}</form>
      <Table head={["", "Product", "Type", "Category", "Price", "Available", "Reserved", "♥", "Status"]}>
        {products.map((p) => {
          const totals = p.variants.reduce((acc, v) => {
            const quantity = v.inventory?.quantity ?? 0;
            const reserved = v.inventory?.reserved ?? 0;
            acc.available += Math.max(0, quantity - reserved);
            acc.reserved += reserved;
            return acc;
          }, { available: 0, reserved: 0 });
          const lowStock = p.variants.some((v) => {
            const quantity = v.inventory?.quantity ?? 0;
            const reserved = v.inventory?.reserved ?? 0;
            return Math.max(0, quantity - reserved) <= (v.inventory?.lowStockAt ?? 5);
          });
          return (
            <tr key={p.id} className="hover:bg-petal/40">
              <td className={td}><div className="relative size-10 overflow-hidden rounded-lg bg-petal">{p.images[0] && <Image src={p.images[0].url} alt="" fill sizes="40px" className="object-cover" />}</div></td>
              <td className={td}><Link href={`/admin/products/${p.id}`} className="font-semibold">{p.name}</Link>{p.isFeatured && <Badge tone="honey" className="ml-2">Featured</Badge>}{p.isBestSeller && <Badge tone="cocoa" className="ml-1">Best</Badge>}{p.isNew && <Badge className="ml-1">New</Badge>}</td>
              <td className={td}>{PRODUCT_TYPES[p.productType]}</td>
              <td className={td}>{p.category?.name ?? "—"}</td>
              <td className={td}>{formatCents(p.basePriceCents, p.currency)}</td>
              <td className={td}><span className={totals.available === 0 ? "font-semibold text-red-700" : lowStock ? "font-semibold text-amber-700" : "font-semibold text-green-700"}>{totals.available}</span> <span className="text-xs text-ink-soft">/ {p.variants.length} var.</span></td>
              <td className={td}>{totals.reserved > 0 ? <Badge tone="honey">{totals.reserved}</Badge> : <span className="text-ink-soft">0</span>}</td>
              <td className={td}>{p._count.wishlistItems}</td>
              <td className={td}><Badge tone={p.status === "ACTIVE" ? "green" : p.status === "DRAFT" ? "neutral" : "red"}>{p.status}</Badge></td>
            </tr>
          );
        })}
        {products.length === 0 && <tr><td className={td} colSpan={9}>No products. Add your first one.</td></tr>}
      </Table>

      <Card title="Categories" className="mt-8">
        <div className="grid gap-4 lg:grid-cols-2">
          {categories.map((c) => (
            <div key={c.id} className="rounded-2xl border border-sand bg-white p-4">
              <div className="flex items-start gap-4">
                <div className="relative size-20 shrink-0 overflow-hidden rounded-xl bg-petal">
                  {c.imageUrl ? <Image src={c.imageUrl} alt={c.name} fill sizes="80px" className="object-cover" /> : <div className="grid h-full place-items-center text-xs text-ink-soft">No image</div>}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold">{c.name}</p>
                    <Badge tone={c.isActive ? "green" : "neutral"}>{c.isActive ? "Active" : "Hidden"}</Badge>
                    {c.showOnHome && <Badge tone="honey">Home</Badge>}
                  </div>
                  <p className="mt-1 text-xs text-ink-soft">/{c.slug} · {c._count.products} products · order {c.sortOrder}</p>
                </div>
              </div>

              <form action={async (fd) => { "use server"; await saveCategory(fd); }} className="mt-4 grid gap-3 sm:grid-cols-2">
                <input type="hidden" name="id" value={c.id} />
                <Field label="Name"><Input name="name" defaultValue={c.name} required /></Field>
                <Field label="Slug"><Input name="slug" defaultValue={c.slug} required /></Field>
                <Field label="Description" className="sm:col-span-2"><Input name="description" defaultValue={c.description ?? ""} /></Field>
                <Field label="Sort order"><Input name="sortOrder" type="number" defaultValue={c.sortOrder} /></Field>
                <div className="flex flex-wrap items-end gap-4 pb-2 text-sm">
                  <label className="inline-flex items-center gap-2"><input type="checkbox" name="isActive" defaultChecked={c.isActive} className="accent-cocoa" /> Active</label>
                  <label className="inline-flex items-center gap-2"><input type="checkbox" name="showOnHome" defaultChecked={c.showOnHome} className="accent-cocoa" /> Show on home</label>
                </div>
                <div className="sm:col-span-2"><SubmitButton size="sm" variant="ghost">Save category</SubmitButton></div>
              </form>

              <form action={async (fd) => { "use server"; await uploadCategoryImage(c.id, fd); }} className="mt-4 flex flex-wrap items-end gap-3 border-t border-sand pt-4">
                <Field label="Category image"><Input type="file" name="file" accept="image/jpeg,image/png,image/webp,image/avif" required className="py-2" /></Field>
                <SubmitButton size="sm" variant="ghost" pendingText="Uploading…">Replace image</SubmitButton>
              </form>
            </div>
          ))}
          {categories.length === 0 && <p className="text-sm text-ink-soft">No categories yet.</p>}
        </div>

        <div className="mt-6 border-t border-sand pt-6">
          <p className="mb-3 font-semibold">Add category</p>
          <form action={async (fd) => { "use server"; await saveCategory(fd); }} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Field label="Category name"><Input name="name" required /></Field>
            <Field label="Slug"><Input name="slug" placeholder="auto from name" /></Field>
            <Field label="Description"><Input name="description" /></Field>
            <Field label="Sort order"><Input name="sortOrder" type="number" defaultValue={0} /></Field>
            <div className="flex flex-wrap items-center gap-4 text-sm sm:col-span-2">
              <label className="inline-flex items-center gap-2"><input type="checkbox" name="isActive" defaultChecked className="accent-cocoa" /> Active</label>
              <label className="inline-flex items-center gap-2"><input type="checkbox" name="showOnHome" defaultChecked className="accent-cocoa" /> Show on home</label>
            </div>
            <div className="sm:col-span-2"><SubmitButton variant="ghost">Add category</SubmitButton></div>
          </form>
        </div>
      </Card>
    </>
  );
}

function Metric({ label, value, warn = false, danger = false }: { label: string; value: number; warn?: boolean; danger?: boolean }) {
  return (
    <div className="rounded-2xl border border-sand bg-white p-4 shadow-sm">
      <p className="text-xs font-medium uppercase tracking-wide text-ink-soft">{label}</p>
      <p className={cn("mt-2 text-3xl font-semibold text-cocoa", warn && "text-amber-700", danger && "text-red-700")}>{value}</p>
    </div>
  );
}
