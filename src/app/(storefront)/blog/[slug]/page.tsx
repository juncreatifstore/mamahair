import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { getLocale } from "@/i18n/server";

function esc(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function inline(s: string) {
  return esc(s)
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\[(.+?)\]\((https?:\/\/[^)]+|\/[^)]*)\)/g, '<a href="$2">$1</a>');
}

function renderMarkdown(md: string) {
  return md
    .split(/\n{2,}/)
    .map((block) => {
      const b = block.trim();
      if (b.startsWith("### ")) return `<h3>${esc(b.slice(4))}</h3>`;
      if (b.startsWith("## ")) return `<h2>${esc(b.slice(3))}</h2>`;
      if (b.startsWith("# ")) return `<h2>${esc(b.slice(2))}</h2>`;
      if (b.split("\n").every((l) => l.startsWith("- "))) {
        return `<ul>${b.split("\n").map((l) => `<li>${inline(l.slice(2))}</li>`).join("")}</ul>`;
      }
      return `<p>${inline(b).replace(/\n/g, "<br>")}</p>`;
    })
    .join("");
}

async function getPost(slug: string) {
  const locale = await getLocale();
  const localized = await db.post.findUnique({ where: { slug_locale: { slug, locale } } });
  if (localized?.publishedAt) return localized;
  const english = await db.post.findUnique({ where: { slug_locale: { slug, locale: "en" } } });
  return english?.publishedAt ? english : null;
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) notFound();

  const site = process.env.NEXT_PUBLIC_SITE_URL?.trim() || "https://mamahair.vercel.app";
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.excerpt || undefined,
    image: post.coverUrl || undefined,
    datePublished: post.publishedAt?.toISOString(),
    dateModified: post.updatedAt.toISOString(),
    mainEntityOfPage: `${site}/blog/${post.slug}`,
    publisher: { "@type": "Organization", name: "MAMAHAIR" },
  };

  return (
    <article className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Link href="/blog" className="text-sm font-medium text-flame hover:underline">← Journal</Link>
      <h1 className="mt-5 text-4xl text-cocoa sm:text-5xl">{post.title}</h1>
      {post.publishedAt && (
        <p className="mt-3 text-sm text-ink-soft">{new Intl.DateTimeFormat("en", { dateStyle: "long" }).format(post.publishedAt)}</p>
      )}
      {post.excerpt && <p className="mt-5 text-lg leading-8 text-ink-soft">{post.excerpt}</p>}
      {post.coverUrl && (
        <div className="relative mt-8 aspect-[16/9] overflow-hidden rounded-3xl bg-petal">
          <Image src={post.coverUrl} alt={post.title} fill priority sizes="(max-width: 768px) 100vw, 768px" className="object-cover" />
        </div>
      )}
      <div className="prose-page mt-10" dangerouslySetInnerHTML={{ __html: renderMarkdown(post.content) }} />
    </article>
  );
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  try {
    const post = await getPost(slug);
    if (!post) return { title: "Article", alternates: { canonical: `/blog/${slug}` } };
    return {
      title: post.title,
      description: post.excerpt || undefined,
      alternates: { canonical: `/blog/${post.slug}` },
      openGraph: {
        type: "article" as const,
        title: post.title,
        description: post.excerpt || undefined,
        url: `/blog/${post.slug}`,
        images: post.coverUrl ? [post.coverUrl] : undefined,
        publishedTime: post.publishedAt?.toISOString(),
        modifiedTime: post.updatedAt.toISOString(),
      },
      twitter: {
        card: post.coverUrl ? "summary_large_image" as const : "summary" as const,
        title: post.title,
        description: post.excerpt || undefined,
        images: post.coverUrl ? [post.coverUrl] : undefined,
      },
    };
  } catch (error) {
    console.error("blog metadata lookup failed", error);
    return { title: "MAMAHAIR Journal", alternates: { canonical: `/blog/${slug}` } };
  }
}
