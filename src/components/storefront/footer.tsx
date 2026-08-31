import Link from "next/link";
import Image from "next/image";
import { getBrand } from "@/lib/settings";
import { getT } from "@/i18n/server";
import { NewsletterForm } from "./newsletter-form";

export async function Footer() {
  const [b, t] = await Promise.all([getBrand(), getT()]);
  const footerLogo = b.branding.logoLightUrl || b.branding.logoUrl;
  const social = [["Instagram", b.social.instagram], ["TikTok", b.social.tiktok], ["Facebook", b.social.facebook], ["YouTube", b.social.youtube], ["Pinterest", b.social.pinterest]].filter(([, u]) => u);
  return (
    <footer className="mt-24 bg-cocoa text-cream">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-[1.6fr_1fr_1fr_1.4fr]">
        <div>
          {footerLogo ? (
            <Image src={footerLogo} alt={b.storeName} width={180} height={54} className="h-10 w-auto object-contain" />
          ) : (
            <p className="display text-3xl tracking-wide">{b.storeName}</p>
          )}
          <p className="mt-3 max-w-sm text-sm text-cream/75">{b.tagline}</p>
          {social.length > 0 && <div className="mt-5 flex flex-wrap gap-3 text-sm">{social.map(([n, u]) => <a key={n} href={u} target="_blank" rel="noreferrer" className="text-cream/75 hover:text-peach">{n}</a>)}</div>}
        </div>
        <div className="space-y-2 text-sm">
          <p className="font-semibold">{t.footer.help}</p>
          <Link href="/pages/shipping" className="block text-cream/75 hover:text-peach">{t.footer.shipping}</Link>
          <Link href="/pages/returns" className="block text-cream/75 hover:text-peach">{t.footer.returns}</Link>
          <Link href="/pages/faq" className="block text-cream/75 hover:text-peach">{t.footer.faq}</Link>
          {b.contact.email && <a href={`mailto:${b.contact.email}`} className="block text-cream/75 hover:text-peach">{t.footer.contact}</a>}
          {b.contact.whatsapp && <a href={`https://wa.me/${b.contact.whatsapp.replace(/\D/g, "")}`} target="_blank" rel="noreferrer" className="block text-cream/75 hover:text-peach">WhatsApp</a>}
        </div>
        <div className="space-y-2 text-sm">
          <p className="font-semibold">{t.footer.company}</p>
          <Link href="/pages/about" className="block text-cream/75 hover:text-peach">{t.footer.about}</Link>
          <Link href="/pages/privacy" className="block text-cream/75 hover:text-peach">{t.footer.privacy}</Link>
          <Link href="/pages/terms" className="block text-cream/75 hover:text-peach">{t.footer.terms}</Link>
          <Link href="/shop" className="block text-cream/75 hover:text-peach">{t.footer.shop}</Link>
        </div>
        <div>
          <p className="font-semibold">{t.home.newsletter}</p>
          <p className="mt-1 text-sm text-cream/75">{t.home.newsletterText}</p>
          <div className="mt-3"><NewsletterForm cta={t.home.newsletterCta} done={t.home.newsletterDone} dark /></div>
        </div>
      </div>
      <div className="border-t border-cream/10 px-4 py-5 text-center text-xs text-cream/60">
        © {new Date().getFullYear()} {b.companyName}. {t.footer.rights} · {t.footer.payments}: Visa · Mastercard · Amex · Apple Pay · Google Pay
        {b.contact.addressLine && <span className="block mt-1">{[b.contact.addressLine, b.contact.city, b.contact.region, b.contact.postalCode, b.contact.country].filter(Boolean).join(", ")}</span>}
      </div>
    </footer>
  );
}
