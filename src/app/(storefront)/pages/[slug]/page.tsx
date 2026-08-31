import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { getLocale } from "@/i18n/server";
import { getSection } from "@/lib/settings";

/** Rendu markdown simple (titres, paragraphes, listes, gras, liens). */
function renderMarkdown(md: string) {
  return md.split(/\n{2,}/).map((block) => {
    const b = block.trim();
    if (b.startsWith("### ")) return `<h3>${esc(b.slice(4))}</h3>`;
    if (b.startsWith("## ")) return `<h2>${esc(b.slice(3))}</h2>`;
    if (b.startsWith("# ")) return `<h2>${esc(b.slice(2))}</h2>`;
    if (b.split("\n").every((l) => l.startsWith("- "))) return `<ul>${b.split("\n").map((l) => `<li>${inline(l.slice(2))}</li>`).join("")}</ul>`;
    return `<p>${inline(b).replace(/\n/g, "<br>")}</p>`;
  }).join("");
}
const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const inline = (s: string) => esc(s).replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>").replace(/\[(.+?)\]\((https?:\/\/[^)]+|\/[^)]*)\)/g, '<a href="$2">$1</a>');

/** Page par slug + locale (repli sur "en"). Les politiques Settings alimentent shipping/returns/privacy/terms si la page n'existe pas. */
async function loadPage(slug: string, locale: string) {
  const page = (await db.page.findUnique({ where: { slug_locale: { slug, locale } } })) ?? (await db.page.findUnique({ where: { slug_locale: { slug, locale: "en" } } }));
  if (page?.isActive) return page;
  const policies = await getSection("policies");
  const map: Record<string, [string, string]> = { shipping: ["Shipping policy", policies.shipping], returns: ["Returns", policies.returns], privacy: ["Privacy policy", policies.privacy], terms: ["Terms & conditions", policies.terms] };
  if (map[slug]?.[1]) return { slug, locale, title: map[slug][0], content: map[slug][1], seoTitle: null, seoDescription: null };
  return null;
}

export default async function StaticPage({ params }: { params: Promise<{ slug: string }> }) {
  const [{ slug }, locale] = await Promise.all([params, getLocale()]);
  const page = await loadPage(slug, locale);
  if (!page) notFound();
  return <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6"><h1 className="text-4xl text-cocoa sm:text-5xl">{page.title}</h1><div className="prose-page mt-8" dangerouslySetInnerHTML={{ __html: renderMarkdown(page.content) }} /></div>;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const [{ slug }, locale] = await Promise.all([params, getLocale()]);
  const page = await loadPage(slug, locale);
  return { title: page?.seoTitle ?? page?.title ?? "Page", description: page?.seoDescription ?? undefined };
}
