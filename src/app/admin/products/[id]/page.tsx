import Image from "next/image";
import { notFound } from "next/navigation";
import { adminGetProduct, adminListCategories, saveVariant, deleteVariant, generateVariants, uploadProductImages, deleteProductImage, updateImageMeta, setProductStatus, duplicateProduct, addBundleItem, removeBundleItem } from "@/server/admin/products";
import { getSection } from "@/lib/settings";
import { ProductForm } from "@/components/admin/product-form";
import { ImageReorder } from "@/components/admin/image-reorder";
import { PageHeader, Card } from "@/components/admin/ui";
import { Field, Input, Checkbox, Select } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit-button";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { fromCents, formatCents } from "@/lib/money";
import { TEXTURES, DENSITIES, LACE_TYPES, LENGTHS, CAP_SIZES } from "@/lib/catalog";

const KINDS = ["MAIN", "GALLERY", "VARIANT", "WORN", "LACE_DETAIL", "TEXTURE", "PACKAGING"];

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [product, categories, commerce] = await Promise.all([adminGetProduct(id), adminListCategories(), getSection("commerce")]);
  if (!product) notFound();
  const opts = (v: unknown) => (v ?? {}) as Record<string, string>;
  const active = product.variants.filter((v) => v.isActive);

  return (
    <>
      <PageHeader title={product.name} sub={`/${product.slug} · ${product.status}`}>
        <Button href={`/products/${product.slug}`} variant="ghost" size="sm">View in store</Button>
        <form action={async () => { "use server"; await duplicateProduct(id); }}><Button variant="ghost" size="sm" type="submit">Duplicate</Button></form>
        {product.status !== "ACTIVE" && <form action={async () => { "use server"; await setProductStatus(id, "ACTIVE"); }}><Button size="sm" type="submit">Publish</Button></form>}
        {product.status === "ACTIVE" && <form action={async () => { "use server"; await setProductStatus(id, "DRAFT"); }}><Button variant="ghost" size="sm" type="submit">Hide</Button></form>}
        {product.status !== "ARCHIVED" && <form action={async () => { "use server"; await setProductStatus(id, "ARCHIVED"); }}><Button variant="danger" size="sm" type="submit">Archive</Button></form>}
      </PageHeader>

      <ProductForm product={product} categories={categories} currencies={commerce.enabledCurrencies} />

      <div className="mt-8 space-y-6">
        <Card title="Media">
          <ImageReorder productId={id} images={product.images} />
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {product.images.map((img) => (
              <div key={img.id} className="rounded-xl border border-sand p-2">
                <div className="relative aspect-square overflow-hidden rounded-lg bg-petal"><Image src={img.url} alt={img.alt ?? ""} fill sizes="200px" className="object-cover" /></div>
                <form action={async (fd) => { "use server"; await updateImageMeta(id, img.id, fd); }} className="mt-2 flex flex-wrap items-end gap-2 text-xs">
                  <Field label="Type"><Select name="kind" defaultValue={img.kind} className="h-9">{KINDS.map((k) => <option key={k} value={k}>{k.replace("_", " ")}</option>)}</Select></Field>
                  <Field label="Alt"><Input name="alt" defaultValue={img.alt ?? ""} className="h-9" /></Field>
                  <button className="h-9 rounded-pill border border-sand px-3">Save</button>
                </form>
                <form action={async () => { "use server"; await deleteProductImage(id, img.id); }} className="mt-1"><button className="text-xs text-red-700 underline">Remove</button></form>
              </div>
            ))}
          </div>
          <form action={async (fd) => { "use server"; await uploadProductImages(id, fd); }} className="mt-4 flex flex-wrap items-end gap-3 rounded-xl border border-dashed border-sand p-3">
            <Field label="Add images (JPG/PNG/WebP, max 5 MB each, up to 10)"><Input type="file" name="files" accept="image/jpeg,image/png,image/webp,image/avif" multiple required className="py-2" /></Field>
            <Field label="Type"><Select name="kind" defaultValue="GALLERY">{KINDS.filter((k) => k !== "MAIN").map((k) => <option key={k} value={k}>{k.replace("_", " ")}</option>)}</Select></Field>
            <Field label="Alt text"><Input name="alt" /></Field>
            <SubmitButton variant="ghost" pendingText="Uploading…">Upload</SubmitButton>
          </form>
          <p className="mt-2 text-xs text-ink-soft">First image = main image. Recommended 1200×1500 px. Assign an image to a variant in the variant row below.</p>
        </Card>

        <Card title={`Variants & inventory (${active.length})`}>
          <div className="space-y-3">
            {product.variants.map((v) => {
              const o = opts(v.options);
              return (
                <form key={v.id} action={async (fd) => { "use server"; await saveVariant(id, fd); }} className={`grid grid-cols-2 gap-2 rounded-xl border p-3 sm:grid-cols-4 lg:grid-cols-8 ${v.isActive ? "border-sand" : "border-dashed border-sand opacity-60"}`}>
                  <input type="hidden" name="id" value={v.id} />
                  <Field label="SKU" className="col-span-2"><Input name="sku" defaultValue={v.sku} required /></Field>
                  <Field label="Texture"><Input name="opt_texture" defaultValue={o.texture ?? ""} list="textures" /></Field>
                  <Field label='Length "'><Input name="opt_length" defaultValue={o.length ?? ""} list="lengths" /></Field>
                  <Field label="Density"><Input name="opt_density" defaultValue={o.density ?? ""} list="densities" /></Field>
                  <Field label="Lace"><Input name="opt_lace" defaultValue={o.lace ?? ""} list="laces" /></Field>
                  <Field label="Color"><Input name="opt_color" defaultValue={o.color ?? ""} /></Field>
                  <Field label="Cap"><Input name="opt_capSize" defaultValue={o.capSize ?? ""} list="caps" /></Field>
                  <Field label="Label (auto if empty)" className="col-span-2"><Input name="name" defaultValue={v.name} /></Field>
                  <Field label="Price"><Input name="price" type="number" step="0.01" defaultValue={fromCents(v.priceCents)} required /></Field>
                  <Field label="Compare-at"><Input name="compareAt" type="number" step="0.01" defaultValue={v.compareAtCents ? fromCents(v.compareAtCents) : ""} /></Field>
                  <Field label="Cost"><Input name="cost" type="number" step="0.01" defaultValue={v.costCents ? fromCents(v.costCents) : ""} /></Field>
                  <Field label="Stock"><Input name="quantity" type="number" min="0" defaultValue={v.inventory?.quantity ?? 0} /></Field>
                  <Field label="Weight g"><Input name="weightGrams" type="number" min="0" defaultValue={v.weightGrams ?? ""} /></Field>
                  <Field label="Image"><Select name="imageId" defaultValue={v.imageId ?? ""}><option value="">—</option>{product.images.map((im, i) => <option key={im.id} value={im.id}>#{i + 1} {im.kind}</option>)}</Select></Field>
                  <div className="col-span-2 flex flex-wrap items-center gap-3 sm:col-span-4 lg:col-span-8">
                    <Checkbox name="isDefault" label="Default" defaultChecked={v.isDefault} />
                    <input type="hidden" name="activePresent" value="1" />
                    <Checkbox name="active" label="Active" defaultChecked={v.isActive} />
                    {v.inventory && v.inventory.reserved > 0 && <Badge tone="honey">{v.inventory.reserved} reserved</Badge>}
                    <span className="text-xs text-ink-soft">{formatCents(v.priceCents, product.currency)}</span>
                    <SubmitButton size="sm" variant="ghost">Save</SubmitButton>
                  </div>
                </form>
              );
            })}
            {active.length > 1 && <div className="flex flex-wrap gap-2">{active.map((v) => <form key={v.id} action={async () => { "use server"; await deleteVariant(id, v.id); }}><button className="text-xs text-red-700 underline">Deactivate {v.name}</button></form>)}</div>}
            <datalist id="textures">{TEXTURES.map((v) => <option key={v} value={v} />)}</datalist><datalist id="lengths">{LENGTHS.map((v) => <option key={v} value={v} />)}</datalist><datalist id="densities">{DENSITIES.map((v) => <option key={v} value={v} />)}</datalist><datalist id="laces">{LACE_TYPES.map((v) => <option key={v} value={v} />)}</datalist><datalist id="caps">{CAP_SIZES.map((v) => <option key={v} value={v} />)}</datalist>

            <form action={async (fd) => { "use server"; await saveVariant(id, fd); }} className="grid grid-cols-2 gap-2 rounded-xl border border-dashed border-sand p-3 sm:grid-cols-4 lg:grid-cols-8">
              <Field label="New variant SKU" className="col-span-2"><Input name="sku" required /></Field>
              <Field label="Texture"><Input name="opt_texture" list="textures" /></Field><Field label='Length "'><Input name="opt_length" list="lengths" /></Field><Field label="Density"><Input name="opt_density" list="densities" /></Field><Field label="Lace"><Input name="opt_lace" list="laces" /></Field><Field label="Color"><Input name="opt_color" /></Field><Field label="Cap"><Input name="opt_capSize" list="caps" /></Field>
              <Field label="Price"><Input name="price" type="number" step="0.01" required /></Field><Field label="Stock"><Input name="quantity" type="number" min="0" defaultValue={0} /></Field>
              <div className="flex items-end"><SubmitButton size="sm">Add variant</SubmitButton></div>
            </form>
          </div>

          <details className="mt-6 rounded-xl bg-petal p-4">
            <summary className="cursor-pointer text-sm font-semibold">Generate variant combinations</summary>
            <form action={async (fd) => { "use server"; await generateVariants(id, fd); }} className="mt-3 space-y-3">
              <p className="text-xs text-ink-soft">Pick the values for each axis. One variant is created per combination (texture × length × density × lace × color) at the base price, stock 0. Existing SKUs are skipped.</p>
              <Gen name="gen_texture" label="Textures" values={product.textures.length ? product.textures : TEXTURES} />
              <Gen name="gen_length" label="Lengths" values={(product.lengths.length ? product.lengths : LENGTHS).map(String)} />
              <Gen name="gen_density" label="Densities" values={product.densities.length ? product.densities : DENSITIES} />
              <Gen name="gen_lace" label="Lace" values={product.laceTypes.length ? product.laceTypes : LACE_TYPES} />
              <Gen name="gen_color" label="Colors" values={product.colors} />
              <SubmitButton size="sm" pendingText="Generating…">Generate variants</SubmitButton>
            </form>
          </details>
        </Card>

        <Card title="Set / bundle components">
          <p className="mb-3 text-xs text-ink-soft">Add product variants by SKU to build sets (Wig + Care Kit, 3 Bundles + Closure…). Set price is defined in Pricing.</p>
          <ul className="divide-y divide-sand text-sm">{product.bundleItems.map((bi) => <li key={bi.id} className="flex items-center justify-between py-2"><span>{bi.variant.product.name} · {bi.variant.name} <span className="text-ink-soft">× {bi.quantity} · {bi.variant.sku}</span></span><form action={async () => { "use server"; await removeBundleItem(id, bi.id); }}><button className="text-xs text-red-700 underline">Remove</button></form></li>)}</ul>
          <form action={async (fd) => { "use server"; await addBundleItem(id, fd); }} className="mt-3 flex flex-wrap items-end gap-2"><Field label="Variant SKU"><Input name="sku" required /></Field><Field label="Qty"><Input name="quantity" type="number" min="1" defaultValue={1} className="w-20" /></Field><SubmitButton size="sm" variant="ghost">Add component</SubmitButton></form>
        </Card>
      </div>
    </>
  );
}

function Gen({ name, label, values }: { name: string; label: string; values: string[] }) {
  if (!values.length) return null;
  return <div><p className="mb-1 text-xs font-medium">{label}</p><div className="flex flex-wrap gap-2">{values.map((v) => <label key={v} className="inline-flex items-center gap-1 rounded-pill border border-sand bg-white px-2.5 py-1 text-xs has-[:checked]:border-cocoa"><input type="checkbox" name={name} value={v} className="accent-cocoa" />{v}</label>)}</div></div>;
}
