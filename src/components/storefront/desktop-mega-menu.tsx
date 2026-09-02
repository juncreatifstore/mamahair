import Link from "next/link";
import { ChevronDown, Sparkles } from "lucide-react";

type Category = { id: string; slug: string; name: string; isActive?: boolean };

const TEXTURES = ["Straight", "Body Wave", "Deep Wave", "Loose Wave", "Water Wave", "Curly", "Kinky Curly"];
const WIGS = [
  ["Glueless Wigs", "/shop?type=WIG&search=glueless"],
  ["HD Lace Wigs", "/shop?type=WIG&lace=HD%20Lace"],
  ["Lace Front Wigs", "/shop?type=WIG&search=lace%20front"],
  ["Bob Wigs", "/shop?type=WIG&search=bob"],
  ["V-Part / U-Part", "/shop?type=WIG&search=part"],
];
const COLORS = ["Natural Black", "1B", "Brown", "Burgundy", "613 Blonde", "Highlight", "Ombre"];

export function DesktopMegaMenu({ categories }: { categories: Category[] }) {
  const active = categories.filter((c) => c.isActive !== false).slice(0, 8);
  return (
    <div className="group relative h-full">
      <Link href="/shop" className="inline-flex h-full items-center gap-1.5 py-4 text-[11px] font-bold uppercase tracking-[.1em] text-cocoa transition hover:text-flame">
        Shop Hair <ChevronDown className="size-3.5 transition group-hover:rotate-180" />
      </Link>
      <div className="invisible absolute left-1/2 top-full z-50 w-[900px] -translate-x-[20%] translate-y-2 opacity-0 transition duration-150 group-hover:visible group-hover:translate-y-0 group-hover:opacity-100">
        <div className="grid grid-cols-[1fr_1fr_1fr_1fr] gap-8 rounded-b-[1.75rem] border border-sand bg-white p-7 shadow-[0_24px_70px_rgba(74,27,12,.16)]">
          <MenuColumn title="Wigs" items={WIGS} />
          <MenuColumn title="Textures" items={TEXTURES.map((x) => [x, `/shop?texture=${encodeURIComponent(x)}`])} />
          <MenuColumn title="Color" items={COLORS.map((x) => [x, `/shop?color=${encodeURIComponent(x)}`])} />
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[.16em] text-flame">Collections</p>
            <div className="mt-4 space-y-2.5">
              {active.map((c) => <Link key={c.id} href={`/shop/${c.slug}`} className="block text-sm font-medium text-cocoa transition hover:translate-x-1 hover:text-flame">{c.name}</Link>)}
            </div>
            <div className="mt-6 rounded-2xl bg-petal p-4">
              <div className="flex items-center gap-2 text-cocoa"><Sparkles className="size-4 text-flame" /><span className="text-xs font-bold uppercase tracking-[.08em]">Best sellers</span></div>
              <p className="mt-2 text-xs leading-5 text-ink-soft">Shop customer favorites and trending textures.</p>
              <Link href="/shop?bestSeller=1" className="mt-3 inline-block text-xs font-bold text-flame">Shop best sellers →</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MenuColumn({ title, items }: { title: string; items: string[][] }) {
  return <div><p className="text-[10px] font-bold uppercase tracking-[.16em] text-flame">{title}</p><div className="mt-4 space-y-2.5">{items.map(([label, href]) => <Link key={`${label}-${href}`} href={href} className="block text-sm font-medium text-cocoa transition hover:translate-x-1 hover:text-flame">{label}</Link>)}</div></div>;
}
