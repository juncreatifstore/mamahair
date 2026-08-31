import { adminListPages, savePage, adminListHomeBlocks, saveHomeBlock } from "@/server/admin/settings";
import { getSection } from "@/lib/settings";
import { HOME_DEFAULTS } from "@/lib/home-blocks";
import { PageHeader, Card } from "@/components/admin/ui";
import { Field, Input, Textarea, Select } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit-button";
import { HomeImageUpload } from "@/components/admin/home-image-upload";

export default async function ContentPage() {
  const [pages, blocks, loc] = await Promise.all([adminListPages(), adminListHomeBlocks(), getSection("localization")]);
  const keys = Object.keys(HOME_DEFAULTS);
  return (
    <>
      <PageHeader title="Content" sub="Store pages per language, and the editable blocks of the home page." />
      <h2 className="mb-3 text-xl text-cocoa">Home page blocks</h2>
      <p className="mb-3 text-sm text-ink-soft">Each block is JSON. Upload an image below to get a URL, then paste it in <code>imageUrl</code>. Keys: {keys.join(", ")}.</p>
      <HomeImageUpload />
      <div className="mt-4 grid gap-6 lg:grid-cols-2">
        {keys.map((key) => {
          const existing = blocks.filter((b) => b.key === key);
          return (
            <Card key={key} title={key}>
              {[...existing, ...(existing.length ? [] : [{ id: "new", key, locale: "en", data: HOME_DEFAULTS[key as keyof typeof HOME_DEFAULTS], isActive: true }])].map((b) => (
                <form key={b.id} action={async (fd) => { "use server"; await saveHomeBlock(fd); }} className="mb-4 space-y-2">
                  <input type="hidden" name="key" value={key} />
                  <div className="flex gap-2"><Field label="Locale"><Select name="locale" defaultValue={b.locale} className="h-9">{loc.enabledLocales.map((l) => <option key={l} value={l}>{l}</option>)}</Select></Field></div>
                  <Textarea name="data" defaultValue={JSON.stringify(b.data, null, 2)} className="min-h-40 font-mono text-xs" />
                  <SubmitButton size="sm" variant="ghost">Save block</SubmitButton>
                </form>
              ))}
              {existing.length > 0 && <form action={async (fd) => { "use server"; await saveHomeBlock(fd); }} className="space-y-2 rounded-xl border border-dashed border-sand p-3"><input type="hidden" name="key" value={key} /><Field label="Add translation"><Select name="locale" className="h-9">{loc.enabledLocales.map((l) => <option key={l} value={l}>{l}</option>)}</Select></Field><Textarea name="data" defaultValue={JSON.stringify(HOME_DEFAULTS[key as keyof typeof HOME_DEFAULTS], null, 2)} className="min-h-24 font-mono text-xs" /><SubmitButton size="sm" variant="ghost">Add</SubmitButton></form>}
            </Card>
          );
        })}
      </div>

      <h2 className="mb-3 mt-10 text-xl text-cocoa">Pages</h2>
      <p className="mb-4 text-sm text-ink-soft">Same slug per language: /pages/about exists once per locale. Use ## for headings, blank lines between paragraphs, - for lists.</p>
      <div className="grid gap-6 lg:grid-cols-2">
        {pages.map((p) => (
          <Card key={p.id} title={`/pages/${p.slug} · ${p.locale}`}>
            <form action={async (fd) => { "use server"; await savePage(fd); }} className="space-y-3">
              <input type="hidden" name="slug" value={p.slug} /><input type="hidden" name="locale" value={p.locale} />
              <Field label="Title"><Input name="title" defaultValue={p.title} required /></Field>
              <Field label="Content"><Textarea name="content" defaultValue={p.content} className="min-h-48 font-mono text-xs" /></Field>
              <div className="grid gap-3 sm:grid-cols-2"><Field label="SEO title"><Input name="seoTitle" defaultValue={p.seoTitle ?? ""} /></Field><Field label="SEO description"><Input name="seoDescription" defaultValue={p.seoDescription ?? ""} /></Field></div>
              <SubmitButton size="sm">Save page</SubmitButton>
            </form>
          </Card>
        ))}
        <Card title="New page or translation">
          <form action={async (fd) => { "use server"; await savePage(fd); }} className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-2"><Field label="Slug"><Input name="slug" pattern="[a-z0-9-]+" placeholder="about" required /></Field><Field label="Locale"><Select name="locale">{loc.enabledLocales.map((l) => <option key={l} value={l}>{l}</option>)}</Select></Field></div>
            <Field label="Title"><Input name="title" required /></Field>
            <Field label="Content"><Textarea name="content" className="min-h-40" /></Field>
            <SubmitButton size="sm">Create</SubmitButton>
          </form>
        </Card>
      </div>
    </>
  );
}
