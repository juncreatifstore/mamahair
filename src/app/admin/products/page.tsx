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
  return (
    <>
      <PageHeader title="Products"><Button href="/admin/products/new">Add product</Button></PageHeader>
      <form className="mb-4 flex flex-wrap gap-2"><Input name="q" placeholder="Search name or SKU…" defaultValue={sp.q} className="max-w-sm" />{["", "ACTIVE", "DRAFT", "ARCHIVED"].map((s) => <Link key={s} href={s ? `/admin/products?status=${s}` : "/admin/products"} className={cn("rounded-pill border px-3 py-2 text-sm", (sp.status ?? "") === s ? "border-cocoa bg-cocoa text-cream" : "border-sand bg-white")}>{s || "All"}</Link>)}</form>
      <Table head={["", "Product", "Type", "Category", "Price", "Stock", "♥", "Status"]}>
        {products.map((p) => {
          const stock = p.variants.reduce((s, v) => s + (v.inventory?.quantity ?? 0), 0);
          return (
            <tr key={p.id} className="hover:bg-petal/40">
              <td className={td}><div className="relative size-10 overflow-hidden rounded-lg bg-petal">{p.images[0] && <Image src={p.images[0].url} alt="" fill sizes="40px" className="object-cover" />}</div></td>
              <td className={td}><Link href={`/admin/products/${p.id}`} className="font-semibold">{p.name}</Link>{p.isFeatured && <Badge tone="honey" className="ml-2">Featured</Badge>}{p.isBestSeller && <Badge tone="cocoa" className="ml-1">Best</Badge>}{p.isNew && <Badge className="ml-1">New</Badge>}</td>
              <td className={td}>{PRODUCT_TYPES[p.productType]}</td>
              <td className={td}>{p.category?.name ?? "—"}</td>
              <td className={td}>{formatCents(p.basePriceCents, p.currency)}</td>
              <td className={td}><span className={stock === 0 ? "font-semibold text-red-700" : ""}>{stock}</span> <span className="text-ink-soft">/ {p.variants.length} var.</span></td>
              <td className={td}>{p._count.wishlistItems}</td>
              <td className={td}><Badge tone={p.status === "ACTIVE" ? "green" : p.status === "DRAFT" ? "neutral" : "red"}>{p.status}</Badge></td>
            </tr>
          );
        })}
        {products.length === 0 && <tr><td className={td} colSpan={8}>No products. Add your first one.</td></tr>}
      </Table>

      <Card title="Categories" className="mt-8">
        <ul className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {categories.map((c) => <li key={c.id} className="flex items-center gap-3 rounded-xl border border-sand p-2"><div className="relative size-12 overflow-hidden rounded-lg bg-petal">{c.imageUrl && <Image src={c.imageUrl} alt="" fill sizes="48px" className="object-cover" />}</div><div className="flex-1 text-sm"><p className="font-medium">{c.name}</p><p className="text-xs text-ink-soft">/{c.slug}</p></div><form action={async (fd) => { "use server"; await uploadCategoryImage(c.slug, fd); }} className="flex items-center gap-1"><input type="file" name="file" accept="image/*" className="w-24 text-xs" /><button className="text-xs underline">Set image</button></form></li>)}
        </ul>
        <form action={async (fd) => { "use server"; await saveCategory(fd); }} className="flex flex-wrap items-end gap-3"><Field label="Category name"><Input name="name" required /></Field><Field label="Slug"><Input name="slug" placeholder="auto" /></Field><Field label="Description"><Input name="description" className="min-w-64" /></Field><SubmitButton variant="ghost">Add / update category</SubmitButton></form>
      </Card>
    </>
  );
}
