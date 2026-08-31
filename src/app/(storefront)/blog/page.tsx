import Link from "next/link";
import Image from "next/image";
import { db } from "@/lib/db";
import { getLocale } from "@/i18n/server";

export const dynamic = "force-dynamic";

export default async function BlogPage() {
  const locale = await getLocale();
  let posts = await db.post.findMany({
    where: { locale, publishedAt: { not: null } },
    orderBy: { publishedAt: "desc" },
    select: { id: true, slug: true, title: true, excerpt: true, coverUrl: true, publishedAt: true },
  });

  if (posts.length === 0 && locale !== "en") {
    posts = await db.post.findMany({
      where: { locale: "en", publishedAt: { not: null } },
      orderBy: { publishedAt: "desc" },
      select: { id: true, slug: true, title: true, excerpt: true, coverUrl: true, publishedAt: true },
    });
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
      <div className="max-w-2xl">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-flame">MAMAHAIR Journal</p>
        <h1 className="mt-3 text-4xl text-cocoa sm:text-5xl">Hair tips, care & inspiration</h1>
        <p className="mt-4 text-ink-soft">Guides, routines and inspiration for wigs, bundles, textured hair and healthy hair care.</p>
      </div>

      {posts.length === 0 ? (
        <div className="mt-10 rounded-3xl bg-white p-8 text-sm text-ink-soft">No published articles yet.</div>
      ) : (
        <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => (
            <article key={post.id} className="overflow-hidden rounded-3xl bg-white">
              {post.coverUrl && (
                <Link href={`/blog/${post.slug}`} className="relative block aspect-[16/10] bg-petal">
                  <Image src={post.coverUrl} alt={post.title} fill sizes="(max-width: 768px) 100vw, 33vw" className="object-cover" />
                </Link>
              )}
              <div className="p-6">
                {post.publishedAt && <p className="text-xs text-ink-soft">{new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(post.publishedAt)}</p>}
                <h2 className="mt-2 text-2xl text-cocoa"><Link href={`/blog/${post.slug}`} className="hover:text-flame">{post.title}</Link></h2>
                {post.excerpt && <p className="mt-3 text-sm leading-6 text-ink-soft">{post.excerpt}</p>}
                <Link href={`/blog/${post.slug}`} className="mt-5 inline-block text-sm font-medium text-flame hover:underline">Read article</Link>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

export const metadata = {
  title: "Journal",
  description: "Hair care guides, wig tips and textured-hair inspiration from MAMAHAIR.",
  alternates: { canonical: "/blog" },
  openGraph: {
    type: "website" as const,
    title: "MAMAHAIR Journal",
    description: "Hair care guides, wig tips and textured-hair inspiration from MAMAHAIR.",
    url: "/blog",
  },
};
