import Link from "next/link";
import Image from "next/image";
import { adminListCategories, duplicateProduct, saveCategory, setProductStatus, uploadCategoryImage } from "@/server/admin/products";
import { getAdminProductCatalog } from "@/server/admin/product-catalog";
import { PageHeader, Table, td, Card } from "@/components/admin/ui";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input, Field } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit-button";
import { formatCents } from "@/lib/money";
import { PRODUCT_TYPES } from "@/lib/catalog";
import { cn } from "@/lib/utils";

 type SearchParams = {
  q?: string;
  status?: string;
  type?: string;
  category?: string;
  stock?: string;
  view?: string;
};

export default async function AdminProductsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const sp = await searchParams;
  const view = sp.view === "categories" ? "categories" : "catalog";
  const [rawProducts, categories] = await Promise.all([
    getAdminProductCatalog({ q: sp.q, status: sp.status, type: sp.type, category: sp.category }),
    adminListCategories(),
  ]);

  const productRows = rawProducts.map((p) => {
    const stock = p.variants.reduce((acc, v) => {
      const quantity = v.inventory?.quantity ?? 0;
      const reserved = v.inventory?.reserved ?? 0;
      const available = Math.max(0, quantity - reserved);
      acc.available += available;
      acc.reserved += reserved;
      if (available > 0 && available <= (v.inventory?.lowStockAt ?? 5)) acc.lowVariants += 1;
      return acc;
    }, { available: 0, reserved: 0, lowVariants: 0 });
    return { ...p, stock };
  });

  const products = productRows.filter((p) => {
    if (!sp.stock) return true;
    if (sp.stock === "out") return p.stock.available === 0;
    if (sp.stock === "low") return p.stock.available > 0 && p.stock.lowVariants > 0;
    if (sp.stock === "in") return p.stock.available > 0;
    return true;
  });

  const inventory = productRows.reduce((acc, p) => {
    if (p.status === "ACTIVE") acc.activeProducts += 1;
    acc.availableUnits += p.stock.available;
    acc.reservedUnits += p.stock.reserved;
    acc.lowStockVariants += p.stock.lowVariants;
    acc.sales += p.salesCount;
    if (p.stock.available === 0) acc.outOfStockProducts += 1;
    return acc;
  }, { activeProducts: 0, outOfStockProducts: 0, lowStockVariants: 0, availableUnits: 0, reservedUnits: 0, sales: 0 });

  return (
    <div className="space-y-6">
      <PageHeader title="Products"><Button href="/admin/products/new">Add product</Button></PageHeader>

      <div className="flex gap-2 overflow-x-auto rounded-2xl border border-sand bg-white p-1.5">
        <Tab href="/admin/products" active={view === "catalog"}>Catalogue</Tab>
        <Tab href="/admin/products?view=categories" active={view === "categories"}>Categories</Tab>
      </div>

      {view === "catalog" ? (
        <>
          <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            <Metric label="Active" value={inventory.activeProducts} />
            <Metric label="Available units" value={inventory.availableUnits} />
            <Metric label="Reserved" value={inventory.reservedUnits} />
            <Metric label="Low stock" value={inventory.lowStockVariants} warn={inventory.lowStockVariants > 0} />
            <Metric label="Out of stock" value={inventory.outOfStockProducts} danger={inventory.outOfStockProducts > 0} />
            <Metric label="Units sold" value={inventory.sales} />
          </section>

          <section className="rounded-3xl border border-sand bg-white p-4 shadow-sm md:p-5">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-cocoa">Product catalogue</h2>
                <p className="text-sm text-ink-soft">{products.length} result{products.length === 1 ? "" : "s"} · search, filter and manage products from one place.</p>
              </div>
              {(sp.q || sp.status || sp.type || sp.category || sp.stock) && <Link href="/admin/products" className="text-sm font-semibold text-flame hover:underline">Clear filters</Link>}
            </div>

            <form method="get" className="grid gap-3 md:grid-cols-2 xl:grid-cols-[minmax(240px,1.5fr)_repeat(4,minmax(130px,1fr))_auto]">
              <Input name="q" placeholder="Search product, product SKU or variant SKU…" defaultValue={sp.q} />
              <select name="status" defaultValue={sp.status ?? ""} className="rounded-xl border border-sand bg-white px-3 py-2 text-sm">
                <option value="">All statuses</option><option value="ACTIVE">Active</option><option value="DRAFT">Draft</option><option value="ARCHIVED">Archived</option>
              </select>
              <select name="type" defaultValue={sp.type ?? ""} className="rounded-xl border border-sand bg-white px-3 py-2 text-sm">
                <option value="">All product types</option>{Object.entries(PRODUCT_TYPES).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
              <select name="category" defaultValue={sp.category ?? ""} className="rounded-xl border border-sand bg-white px-3 py-2 text-sm">
                <option value="">All categories</option>{categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <select name="stock" defaultValue={sp.stock ?? ""} className="rounded-xl border border-sand bg-white px-3 py-2 text-sm">
                <option value="">All stock</option><option value="in">In stock</option><option value="low">Low stock</option><option value="out">Out of stock</option>
              </select>
              <button className="rounded-xl bg-cocoa px-5 py-2 text-sm font-semibold text-white">Filter</button>
            </form>
          </section>

          <div className="overflow-x-auto rounded-3xl border border-sand bg-white shadow-sm">
            <Table head={["Product", "Type", "Price", "Stock", "Sales", "Reviews", "Status", "Actions"]}>
              {products.map((p) => {
                const stockTone = p.stock.available === 0 ? "text-red-700" : p.stock.lowVariants > 0 ? "text-amber-700" : "text-emerald-700";
                return (
                  <tr key={p.id} className="align-middle transition hover:bg-petal/35">
                    <td className={td}>
                      <div className="flex min-w-[260px] items-center gap-3">
                        <div className="relative size-14 shrink-0 overflow-hidden rounded-xl bg-petal ring-1 ring-sand/70">{p.images[0] && <Image src={p.images[0].url} alt="" fill sizes="56px" className="object-cover" />}</div>
                        <div className="min-w-0">
                          <Link href={`/admin/products/${p.id}`} className="block truncate font-semibold text-cocoa hover:text-flame">{p.name}</Link>
                          <p className="mt-0.5 truncate text-xs text-ink-soft">{p.sku || "No product SKU"} · {p.category?.name ?? "Uncategorized"}</p>
                          <div className="mt-1.5 flex flex-wrap gap-1">
                            {p.isFeatured && <Badge tone="honey">Featured</Badge>}
                            {p.isBestSeller && <Badge tone="cocoa">Best seller</Badge>}
                            {p.isNew && <Badge>New</Badge>}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className={td}><span className="text-sm">{PRODUCT_TYPES[p.productType]}</span><p className="mt-1 text-xs text-ink-soft">{p.variants.length} variant{p.variants.length === 1 ? "" : "s"}</p></td>
                    <td className={td}><span className="font-semibold text-cocoa">{formatCents(p.basePriceCents, p.currency)}</span>{p.compareAtCents && p.compareAtCents > p.basePriceCents ? <p className="mt-1 text-xs text-ink-soft line-through">{formatCents(p.compareAtCents, p.currency)}</p> : null}</td>
                    <td className={td}><span className={cn("font-semibold", stockTone)}>{p.stock.available} available</span><p className="mt-1 text-xs text-ink-soft">{p.stock.reserved} reserved{p.stock.lowVariants > 0 ? ` · ${p.stock.lowVariants} low` : ""}</p></td>
                    <td className={td}><span className="font-semibold text-cocoa">{p.salesCount}</span><p className="mt-1 text-xs text-ink-soft">♥ {p._count.wishlistItems}</p></td>
                    <td className={td}>{p.ratingCount > 0 ? <><span className="font-semibold text-cocoa">{p.ratingAvg?.toFixed(1) ?? "—"} ★</span><p className="mt-1 text-xs text-ink-soft">{p.ratingCount} review{p.ratingCount === 1 ? "" : "s"}</p></> : <span className="text-sm text-ink-soft">No reviews</span>}</td>
                    <td className={td}><Badge tone={p.status === "ACTIVE" ? "green" : p.status === "DRAFT" ? "neutral" : "red"}>{p.status}</Badge></td>
                    <td className={td}>
                      <div className="flex min-w-[210px] flex-wrap gap-2">
                        <Link href={`/admin/products/${p.id}`} className="rounded-lg border border-sand px-2.5 py-1.5 text-xs font-semibold text-cocoa hover:bg-petal">Edit</Link>
                        {p.status === "ACTIVE" && <Link href={`/products/${p.slug}`} target="_blank" className="rounded-lg border border-sand px-2.5 py-1.5 text-xs font-semibold text-cocoa hover:bg-petal">View</Link>}
                        <form action={async () => { "use server"; await duplicateProduct(p.id); }}><button className="rounded-lg border border-sand px-2.5 py-1.5 text-xs font-semibold text-cocoa hover:bg-petal">Duplicate</button></form>
                        {p.status !== "ARCHIVED" ? <form action={async () => { "use server"; await setProductStatus(p.id, "ARCHIVED"); }}><button className="rounded-lg bg-red-50 px-2.5 py-1.5 text-xs font-semibold text-red-700">Archive</button></form> : <form action={async () => { "use server"; await setProductStatus(p.id, "DRAFT"); }}><button className="rounded-lg bg-amber-50 px-2.5 py-1.5 text-xs font-semibold text-amber-800">Restore draft</button></form>}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {products.length === 0 && <tr><td className={td} colSpan={8}><div className="py-8 text-center"><p className="font-semibold text-cocoa">No products match these filters.</p><p className="mt-1 text-sm text-ink-soft">Clear the filters or add a new product.</p></div></td></tr>}
            </Table>
          </div>
        </>
      ) : (
        <CategoryManager categories={categories} />
      )}
    </div>
  );
}

function CategoryManager({ categories }: { categories: Awaited<ReturnType<typeof adminListCategories>> }) {
  return (
    <Card title="Categories">
      <div className="mb-6 rounded-2xl bg-petal/45 p-4 text-sm text-ink-soft">Manage the groups customers use to browse your catalogue. Category images can also be used on the storefront and homepage.</div>
      <div className="grid gap-4 lg:grid-cols-2">
        {categories.map((c) => (
          <div key={c.id} className="rounded-2xl border border-sand bg-white p-4">
            <div className="flex items-start gap-4">
              <div className="relative size-20 shrink-0 overflow-hidden rounded-xl bg-petal">{c.imageUrl ? <Image src={c.imageUrl} alt={c.name} fill sizes="80px" className="object-cover" /> : <div className="grid h-full place-items-center text-xs text-ink-soft">No image</div>}</div>
              <div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><p className="font-semibold text-cocoa">{c.name}</p><Badge tone={c.isActive ? "green" : "neutral"}>{c.isActive ? "Active" : "Hidden"}</Badge>{c.showOnHome && <Badge tone="honey">Home</Badge>}</div><p className="mt-1 text-xs text-ink-soft">/{c.slug} · {c._count.products} products · order {c.sortOrder}</p></div>
            </div>
            <form action={async (fd) => { "use server"; await saveCategory(fd); }} className="mt-4 grid gap-3 sm:grid-cols-2">
              <input type="hidden" name="id" value={c.id} />
              <Field label="Name"><Input name="name" defaultValue={c.name} required /></Field>
              <Field label="Slug"><Input name="slug" defaultValue={c.slug} required /></Field>
              <Field label="Description" className="sm:col-span-2"><Input name="description" defaultValue={c.description ?? ""} /></Field>
              <Field label="Sort order"><Input name="sortOrder" type="number" defaultValue={c.sortOrder} /></Field>
              <div className="flex flex-wrap items-end gap-4 pb-2 text-sm"><label className="inline-flex items-center gap-2"><input type="checkbox" name="isActive" defaultChecked={c.isActive} className="accent-cocoa" /> Active</label><label className="inline-flex items-center gap-2"><input type="checkbox" name="showOnHome" defaultChecked={c.showOnHome} className="accent-cocoa" /> Show on home</label></div>
              <div className="sm:col-span-2"><SubmitButton size="sm" variant="ghost">Save category</SubmitButton></div>
            </form>
            <form action={async (fd) => { "use server"; await uploadCategoryImage(c.id, fd); }} className="mt-4 flex flex-wrap items-end gap-3 border-t border-sand pt-4"><Field label="Category image"><Input type="file" name="file" accept="image/jpeg,image/png,image/webp,image/avif" required className="py-2" /></Field><SubmitButton size="sm" variant="ghost" pendingText="Uploading…">Replace image</SubmitButton></form>
          </div>
        ))}
        {categories.length === 0 && <p className="text-sm text-ink-soft">No categories yet.</p>}
      </div>
      <div className="mt-6 border-t border-sand pt-6">
        <p className="mb-3 font-semibold text-cocoa">Add category</p>
        <form action={async (fd) => { "use server"; await saveCategory(fd); }} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="Category name"><Input name="name" required /></Field><Field label="Slug"><Input name="slug" placeholder="auto from name" /></Field><Field label="Description"><Input name="description" /></Field><Field label="Sort order"><Input name="sortOrder" type="number" defaultValue={0} /></Field>
          <div className="flex flex-wrap items-center gap-4 text-sm sm:col-span-2"><label className="inline-flex items-center gap-2"><input type="checkbox" name="isActive" defaultChecked className="accent-cocoa" /> Active</label><label className="inline-flex items-center gap-2"><input type="checkbox" name="showOnHome" defaultChecked className="accent-cocoa" /> Show on home</label></div>
          <div className="sm:col-span-2"><SubmitButton variant="ghost">Add category</SubmitButton></div>
        </form>
      </div>
    </Card>
  );
}

function Tab({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return <Link href={href} className={cn("whitespace-nowrap rounded-xl px-4 py-2 text-sm font-semibold transition", active ? "bg-cocoa text-white" : "text-ink-soft hover:bg-petal hover:text-cocoa")}>{children}</Link>;
}

function Metric({ label, value, warn = false, danger = false }: { label: string; value: number; warn?: boolean; danger?: boolean }) {
  return <div className="rounded-2xl border border-sand bg-white p-4 shadow-sm"><p className="text-[10px] font-bold uppercase tracking-[0.14em] text-ink-soft">{label}</p><p className={cn("mt-2 text-3xl font-semibold text-cocoa", warn && "text-amber-700", danger && "text-red-700")}>{value}</p></div>;
}
