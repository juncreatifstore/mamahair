import { Resend } from "resend";
import { formatCents } from "./money";
import { getBrand, getSection } from "./settings";
import { logger } from "./logger";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

type OrderLike = {
  number: number; email: string; currency: string; totalCents: number; locale?: string;
  items: { productName: string; variantName: string; quantity: number; totalCents: number }[];
};

async function branding() {
  const [b, e] = await Promise.all([getBrand(), getSection("email")]);
  return { name: b.storeName, logo: b.branding.logoUrl, primary: b.branding.primaryColor, accent: b.branding.accentColor, from: `${e.fromName} <${process.env.EMAIL_FROM_OVERRIDE ?? e.fromEmail}>`, replyTo: e.replyTo, footer: e.footerText, contact: b.contact, social: b.social };
}

function layout(b: Awaited<ReturnType<typeof branding>>, title: string, body: string, cta?: { label: string; url: string }) {
  const head = b.logo ? `<img src="${b.logo}" alt="${b.name}" style="height:40px">` : `<span style="font-family:Georgia,serif;font-size:26px;letter-spacing:.04em;color:${b.primary}">${b.name}</span>`;
  const button = cta ? `<p style="margin:28px 0"><a href="${cta.url}" style="background:${b.accent};color:#fff;text-decoration:none;padding:14px 26px;border-radius:999px;font-weight:600;display:inline-block">${cta.label}</a></p>` : "";
  const social = [b.social.instagram && `<a href="${b.social.instagram}" style="color:#888;margin:0 6px">Instagram</a>`, b.social.tiktok && `<a href="${b.social.tiktok}" style="color:#888;margin:0 6px">TikTok</a>`, b.social.facebook && `<a href="${b.social.facebook}" style="color:#888;margin:0 6px">Facebook</a>`].filter(Boolean).join("");
  return `<!doctype html><html><body style="margin:0;background:#FAF6F1;font-family:Poppins,Arial,sans-serif;color:#2b1a12">
  <div style="max-width:560px;margin:0 auto;padding:32px 20px">
    <div style="text-align:center;padding:12px 0 28px">${head}</div>
    <div style="background:#fff;border-radius:20px;padding:32px 28px">
      <h1 style="font-family:Georgia,'Playfair Display',serif;font-weight:500;font-size:26px;margin:0 0 16px;color:${b.primary}">${title}</h1>
      <div style="font-size:15px;line-height:1.65">${body}</div>${button}
    </div>
    <p style="text-align:center;font-size:12px;color:#8a7b73;margin-top:28px">${b.footer}<br>${b.contact.email}${b.contact.whatsapp ? ` · WhatsApp ${b.contact.whatsapp}` : ""}<br><span style="display:inline-block;margin-top:8px">${social}</span><br><a href="${SITE}" style="color:#8a7b73">${SITE.replace(/^https?:\/\//, "")}</a></p>
  </div></body></html>`;
}

function itemsTable(o: OrderLike) {
  const rows = o.items.map((i) => `<tr><td style="padding:8px 0;border-bottom:1px solid #f1e8e2">${i.productName}<br><span style="color:#8a7b73;font-size:13px">${i.variantName} × ${i.quantity}</span></td><td style="text-align:right;vertical-align:top;padding:8px 0;border-bottom:1px solid #f1e8e2">${formatCents(i.totalCents, o.currency)}</td></tr>`).join("");
  return `<table style="width:100%;border-collapse:collapse;margin:18px 0">${rows}<tr><td style="padding-top:12px;font-weight:600">Total</td><td style="text-align:right;padding-top:12px;font-weight:600">${formatCents(o.totalCents, o.currency)}</td></tr></table>`;
}

async function send(to: string, subject: string, html: string) {
  const b = await branding();
  if (!resend) {
    logger.info("email.skipped (RESEND_API_KEY missing)", { to, subject });
    return;
  }
  try {
    await resend.emails.send({ from: b.from, to, replyTo: b.replyTo || undefined, subject, html });
  } catch (err) {
    await logger.error("email.failed", err, { to, subject });
  }
}

// ---- Transactionnels ----
export async function sendWelcome(to: string, firstName?: string | null) {
  const b = await branding();
  await send(to, `Welcome to ${b.name}`, layout(b, `Welcome${firstName ? `, ${firstName}` : ""}`, `<p>Your ${b.name} account is ready. Track orders, save your wishlist and check out faster.</p>`, { label: "Start shopping", url: `${SITE}/shop` }));
}

export async function sendOrderConfirmation(o: OrderLike) {
  const b = await branding();
  await send(o.email, `Order #${o.number} confirmed`, layout(b, "Thank you for your order", `<p>We received order <strong>#${o.number}</strong> and your payment is confirmed. We'll email you again when it ships.</p>${itemsTable(o)}`, { label: "View my order", url: `${SITE}/account/orders` }));
}

export async function sendOrderProcessing(o: OrderLike) {
  const b = await branding();
  await send(o.email, `Order #${o.number} is being prepared`, layout(b, "We're preparing your order", `<p>Order <strong>#${o.number}</strong> is being inspected and packed with care.</p>${itemsTable(o)}`));
}

export async function sendOrderShipped(o: OrderLike & { carrier?: string | null; trackingNumber?: string | null; trackingUrl?: string | null }) {
  const b = await branding();
  const tracking = o.trackingNumber ? `<p>${o.carrier ?? "Carrier"} tracking: ${o.trackingUrl ? `<a href="${o.trackingUrl}" style="color:${b.accent}">${o.trackingNumber}</a>` : `<strong>${o.trackingNumber}</strong>`}</p>` : "";
  await send(o.email, `Order #${o.number} is on its way`, layout(b, "Your order shipped", `<p>Order <strong>#${o.number}</strong> has left our studio.</p>${tracking}${itemsTable(o)}`, o.trackingUrl ? { label: "Track my package", url: o.trackingUrl } : undefined));
}

export async function sendOrderDelivered(o: OrderLike) {
  const b = await branding();
  await send(o.email, `Order #${o.number} delivered`, layout(b, "Delivered", `<p>Order <strong>#${o.number}</strong> was delivered. We'd love to hear what you think.</p>`, { label: "Leave a review", url: `${SITE}/account/orders` }));
}

export async function sendRefund(o: OrderLike & { refundedCents: number }) {
  const b = await branding();
  await send(o.email, `Refund for order #${o.number}`, layout(b, "Your refund is on its way", `<p>We refunded <strong>${formatCents(o.refundedCents, o.currency)}</strong> for order #${o.number}. It usually appears on your statement within 5–10 business days.</p>`));
}

export async function sendAbandonedCart(to: string, items: { productName: string; variantName: string; quantity: number }[], code?: string | null) {
  const b = await branding();
  const list = items.map((i) => `<li>${i.productName} — ${i.variantName} × ${i.quantity}</li>`).join("");
  const promo = code ? `<p>Use code <strong>${code}</strong> at checkout.</p>` : "";
  await send(to, `You left something behind`, layout(b, "Still thinking about it?", `<p>Your cart is saved:</p><ul>${list}</ul>${promo}`, { label: "Return to my cart", url: `${SITE}/cart` }));
}
