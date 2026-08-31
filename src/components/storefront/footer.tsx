import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight, Mail, MapPin } from "lucide-react";
import { getBrand } from "@/lib/settings";
import { getT } from "@/i18n/server";
import { NewsletterForm } from "./newsletter-form";

export async function Footer() {
  const [b, t] = await Promise.all([getBrand(), getT()]);
  const footerLogo = b.branding.logoLightUrl || b.branding.logoUrl;
  const social = [["Instagram", b.social.instagram], ["TikTok", b.social.tiktok], ["Facebook", b.social.facebook], ["YouTube", b.social.youtube], ["Pinterest", b.social.pinterest]].filter(([, u]) => u);

  return (
    <footer className="mt-24 overflow-hidden bg-cocoa-deep text-cream">
      <div className="border-b border-cream/10 bg-cocoa px-4 py-4 sm:px-6">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-x-8 gap-y-2 text-center text-[10px] font-bold uppercase tracking-[0.16em] text-cream/72 md:justify-between">
          <span>Premium quality</span><span>Secure checkout</span><span>Worldwide ready</span><span>Curated for confidence</span>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 md:py-18">
        <div className="grid gap-10 border-b border-cream/10 pb-12 md:grid-cols-[1.35fr_0.8fr_0.8fr_1.25fr]">
          <div>
            {footerLogo ? (
              <Image src={footerLogo} alt={b.storeName} width={190} height={58} className="h-11 w-auto object-contain" />
            ) : (
              <p className="display text-3xl tracking-[0.08em]">{b.storeName}</p>
            )}
            <p className="mt-5 max-w-sm text-sm leading-7 text-cream/65">{b.tagline}</p>

            <div className="mt-6 space-y-2 text-xs text-cream/62">
              {b.contact.email && <a href={`mailto:${b.contact.email}`} className="flex items-center gap-2 hover:text-peach"><Mail className="size-3.5" />{b.contact.email}</a>}
              {b.contact.addressLine && <p className="flex items-start gap-2"><MapPin className="mt-0.5 size-3.5 shrink-0" />{[b.contact.addressLine, b.contact.city, b.contact.region, b.contact.country].filter(Boolean).join(", ")}</p>}
            </div>

            {social.length > 0 && (
              <div className="mt-6 flex flex-wrap gap-2">
                {social.map(([n, u]) => <a key={n} href={u} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 rounded-full border border-cream/15 px-3 py-2 text-[10px] font-bold uppercase tracking-[0.08em] text-cream/70 transition hover:border-peach hover:bg-cream/5 hover:text-peach">{n}<ArrowUpRight className="size-3" /></a>)}
              </div>
            )}
          </div>

          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-peach">{t.footer.help}</p>
            <div className="mt-5 space-y-3 text-sm">
              <Link href="/pages/shipping" className="block text-cream/65 transition hover:translate-x-1 hover:text-cream">{t.footer.shipping}</Link>
              <Link href="/pages/returns" className="block text-cream/65 transition hover:translate-x-1 hover:text-cream">{t.footer.returns}</Link>
              <Link href="/pages/faq" className="block text-cream/65 transition hover:translate-x-1 hover:text-cream">{t.footer.faq}</Link>
              {b.contact.email && <a href={`mailto:${b.contact.email}`} className="block text-cream/65 transition hover:translate-x-1 hover:text-cream">{t.footer.contact}</a>}
              {b.contact.whatsapp && <a href={`https://wa.me/${b.contact.whatsapp.replace(/\D/g, "")}`} target="_blank" rel="noreferrer" className="block text-cream/65 transition hover:translate-x-1 hover:text-cream">WhatsApp</a>}
            </div>
          </div>

          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-peach">{t.footer.company}</p>
            <div className="mt-5 space-y-3 text-sm">
              <Link href="/pages/about" className="block text-cream/65 transition hover:translate-x-1 hover:text-cream">{t.footer.about}</Link>
              <Link href="/blog" className="block text-cream/65 transition hover:translate-x-1 hover:text-cream">Blog</Link>
              <Link href="/pages/privacy" className="block text-cream/65 transition hover:translate-x-1 hover:text-cream">{t.footer.privacy}</Link>
              <Link href="/pages/terms" className="block text-cream/65 transition hover:translate-x-1 hover:text-cream">{t.footer.terms}</Link>
              <Link href="/shop" className="block text-cream/65 transition hover:translate-x-1 hover:text-cream">{t.footer.shop}</Link>
            </div>
          </div>

          <div className="rounded-[1.6rem] border border-cream/10 bg-cream/[0.045] p-5 sm:p-6">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-peach">Private list</p>
            <h3 className="mt-2 text-2xl text-cream">{t.home.newsletter}</h3>
            <p className="mt-3 text-sm leading-6 text-cream/62">{t.home.newsletterText}</p>
            <div className="mt-5"><NewsletterForm cta={t.home.newsletterCta} done={t.home.newsletterDone} dark /></div>
          </div>
        </div>

        <div className="flex flex-col gap-4 pt-6 text-[11px] text-cream/45 md:flex-row md:items-center md:justify-between">
          <p>© {new Date().getFullYear()} {b.companyName}. {t.footer.rights}</p>
          <p>{t.footer.payments}: Visa · Mastercard · Amex · Apple Pay · Google Pay</p>
        </div>
      </div>
    </footer>
  );
}
