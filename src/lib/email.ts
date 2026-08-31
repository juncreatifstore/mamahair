import { Resend } from "resend";
import { formatCents } from "./money";
import { getBrand, getSection } from "./settings";
import { logger } from "./logger";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const FALLBACK_SITE = "https://mamahair.vercel.app";

function siteUrl() {
  const raw = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (!raw) return FALLBACK_SITE;
  try {
    const u = new URL(raw);
    if (!['http:', 'https:'].includes(u.protocol)) return FALLBACK_SITE;
    return u.origin;
  } catch {
    return FALLBACK_SITE;
  }
}

const SITE = siteUrl();

type EmailItem = {
  productName: string;
  variantName: string;
  quantity: number;
  totalCents: number;
  imageUrl?: string | null;
  sku?: string | null;
};

type OrderLike = {
  number: number;
  email: string;
  currency: string;
  totalCents: number;
  subtotalCents?: number;
  discountCents?: number;
  shippingCents?: number;
  taxCents?: number;
  locale?: string;
  items: EmailItem[];
};

type CartEmailItem = {
  productName: string;
  variantName: string;
  quantity: number;
  imageUrl?: string | null;
};

function esc(value: unknown) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function safeUrl(value?: string | null) {
  if (!value) return null;
  try {
    const u = new URL(value);
    return ['http:', 'https:'].includes(u.protocol) ? u.toString() : null;
  } catch {
    return null;
  }
}

async function branding() {
  const [b, e] = await Promise.all([getBrand(), getSection("email")]);
  return {
    name: b.storeName,
    logo: safeUrl(b.branding.logoUrl),
    primary: b.branding.primaryColor,
    accent: b.branding.accentColor,
    from: `${e.fromName} <${process.env.EMAIL_FROM_OVERRIDE ?? e.fromEmail}>`,
    replyTo: e.replyTo,
    footer: e.footerText,
    contact: b.contact,
    social: b.social,
  };
}

function layout(b: Awaited<ReturnType<typeof branding>>, title: string, body: string, cta?: { label: string; url: string }) {
  const head = b.logo
    ? `<img src="${esc(b.logo)}" alt="${esc(b.name)}" style="display:block;margin:0 auto;max-width:190px;max-height:52px;width:auto;height:auto">`
    : `<span style="font-family:Georgia,'Times New Roman',serif;font-size:30px;letter-spacing:.04em;color:${esc(b.primary)}">${esc(b.name)}</span>`;
  const ctaUrl = safeUrl(cta?.url);
  const button = cta && ctaUrl
    ? `<table role="presentation" cellspacing="0" cellpadding="0" style="margin:28px 0 4px"><tr><td style="border-radius:999px;background:${esc(b.accent)}"><a href="${esc(ctaUrl)}" style="display:inline-block;padding:14px 28px;color:#fff;text-decoration:none;font-weight:700;font-size:14px">${esc(cta.label)}</a></td></tr></table>`
    : "";
  const socials = [
    ["Instagram", safeUrl(b.social.instagram)],
    ["TikTok", safeUrl(b.social.tiktok)],
    ["Facebook", safeUrl(b.social.facebook)],
  ].filter(([, url]) => Boolean(url)) as [string, string][];
  const social = socials.map(([label, url]) => `<a href="${esc(url)}" style="color:#7e7069;text-decoration:underline;margin:0 6px">${label}</a>`).join("");

  return `<!doctype html>
<html>
  <body style="margin:0;padding:0;background:#FAF6F1;font-family:Arial,Helvetica,sans-serif;color:#2b1a12">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#FAF6F1">
      <tr><td align="center" style="padding:28px 14px">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:620px">
          <tr><td align="center" style="padding:8px 0 24px">${head}</td></tr>
          <tr><td style="background:#ffffff;border:1px solid #eee3dc;border-radius:24px;padding:34px 30px;box-shadow:0 8px 30px rgba(74,27,12,.05)">
            <div style="font-size:11px;letter-spacing:.16em;text-transform:uppercase;color:${esc(b.accent)};font-weight:700;margin-bottom:10px">${esc(b.name)}</div>
            <h1 style="font-family:Georgia,'Times New Roman',serif;font-weight:500;font-size:30px;line-height:1.2;margin:0 0 18px;color:${esc(b.primary)}">${esc(title)}</h1>
            <div style="font-size:15px;line-height:1.7;color:#3b2b23">${body}</div>
            ${button}
          </td></tr>
          <tr><td align="center" style="padding:24px 18px 4px;color:#8a7b73;font-size:12px;line-height:1.7">
            ${esc(b.footer)}<br>
            ${esc(b.contact.email)}${b.contact.whatsapp ? ` · WhatsApp ${esc(b.contact.whatsapp)}` : ""}<br>
            ${social ? `<span style="display:inline-block;margin-top:6px">${social}</span><br>` : ""}
            <a href="${esc(SITE)}" style="color:#8a7b73">${esc(SITE.replace(/^https?:\/\//, ""))}</a>
          </td></tr>
        </table>
      </td></tr>
    </table>
  </body>
</html>`;
}

function imageCell(url?: string | null) {
  const safe = safeUrl(url);
  if (!safe) return `<td width="64" style="padding:12px 12px 12px 0;vertical-align:top"><div style="width:58px;height:70px;border-radius:12px;background:#FAECE7"></div></td>`;
  return `<td width="64" style="padding:12px 12px 12px 0;vertical-align:top"><img src="${esc(safe)}" alt="" width="58" height="70" style="display:block;width:58px;height:70px;object-fit:cover;border-radius:12px;background:#FAECE7"></td>`;
}

function itemsTable(o: OrderLike) {
  const rows = o.items.map((i) => `<tr>
    ${imageCell(i.imageUrl)}
    <td style="padding:12px 8px 12px 0;border-bottom:1px solid #f1e8e2;vertical-align:top">
      <div style="font-weight:700;color:#2b1a12">${esc(i.productName)}</div>
      <div style="color:#8a7b73;font-size:13px;margin-top:3px">${esc(i.variantName)} · Qty ${i.quantity}${i.sku ? ` · SKU ${esc(i.sku)}` : ""}</div>
    </td>
    <td style="text-align:right;vertical-align:top;padding:12px 0;border-bottom:1px solid #f1e8e2;white-space:nowrap;font-weight:600">${formatCents(i.totalCents, o.currency)}</td>
  </tr>`).join("");

  const details = [
    o.subtotalCents != null ? ["Subtotal", formatCents(o.subtotalCents, o.currency)] : null,
    o.discountCents ? ["Discount", `−${formatCents(o.discountCents, o.currency)}`] : null,
    o.shippingCents != null ? ["Shipping", o.shippingCents === 0 ? "Free" : formatCents(o.shippingCents, o.currency)] : null,
    o.taxCents != null ? ["Tax", formatCents(o.taxCents, o.currency)] : null,
  ].filter(Boolean) as [string, string][];

  const detailRows = details.map(([label, value]) => `<tr><td colspan="2" style="padding:4px 0;color:#7d6d65">${esc(label)}</td><td style="padding:4px 0;text-align:right;color:#7d6d65">${esc(value)}</td></tr>`).join("");

  return `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="width:100%;border-collapse:collapse;margin:22px 0 8px">
    ${rows}
    ${detailRows}
    <tr><td colspan="2" style="padding-top:12px;font-weight:800;font-size:16px">Total</td><td style="text-align:right;padding-top:12px;font-weight:800;font-size:16px;color:${esc("#4A1B0C")}">${formatCents(o.totalCents, o.currency)}</td></tr>
  </table>`;
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
  await send(
    to,
    `Welcome to ${b.name}`,
    layout(
      b,
      `Welcome${firstName ? `, ${firstName}` : ""}`,
      `<p style="margin:0 0 14px">Your account is ready.</p><p style="margin:0;color:#75665f">Track orders, save your wishlist, keep your preferences and check out faster whenever you come back.</p>`,
      { label: "Start shopping", url: `${SITE}/shop` },
    ),
  );
}

export async function sendOrderConfirmation(o: OrderLike) {
  const b = await branding();
  await send(
    o.email,
    `Order #${o.number} confirmed`,
    layout(
      b,
      "Thank you for your order",
      `<p style="margin:0 0 8px">Payment for order <strong>#${o.number}</strong> is confirmed.</p><p style="margin:0;color:#75665f">We're preparing everything carefully and will email you again as your order moves forward.</p>${itemsTable(o)}`,
      { label: "View my order", url: `${SITE}/account/orders` },
    ),
  );
}

export async function sendOrderProcessing(o: OrderLike) {
  const b = await branding();
  await send(
    o.email,
    `Order #${o.number} is being prepared`,
    layout(
      b,
      "We're preparing your order",
      `<p style="margin:0;color:#75665f">Order <strong>#${o.number}</strong> is being inspected, prepared and packed with care.</p>${itemsTable(o)}`,
      { label: "View order", url: `${SITE}/account/orders` },
    ),
  );
}

export async function sendOrderShipped(o: OrderLike & { carrier?: string | null; trackingNumber?: string | null; trackingUrl?: string | null }) {
  const b = await branding();
  const trackingUrl = safeUrl(o.trackingUrl);
  const tracking = o.trackingNumber
    ? `<div style="margin:20px 0;padding:16px 18px;border-radius:16px;background:#FAECE7"><div style="font-size:12px;text-transform:uppercase;letter-spacing:.12em;color:#8a7b73">Tracking</div><div style="margin-top:5px;font-weight:700">${esc(o.carrier ?? "Carrier")} · ${trackingUrl ? `<a href="${esc(trackingUrl)}" style="color:${esc(b.accent)}">${esc(o.trackingNumber)}</a>` : esc(o.trackingNumber)}</div></div>`
    : "";
  await send(
    o.email,
    `Order #${o.number} is on its way`,
    layout(
      b,
      "Your order shipped",
      `<p style="margin:0;color:#75665f">Order <strong>#${o.number}</strong> has left our studio and is on its way to you.</p>${tracking}${itemsTable(o)}`,
      trackingUrl ? { label: "Track my package", url: trackingUrl } : { label: "View my order", url: `${SITE}/account/orders` },
    ),
  );
}

export async function sendOrderDelivered(o: OrderLike) {
  const b = await branding();
  await send(
    o.email,
    `Order #${o.number} delivered`,
    layout(
      b,
      "Delivered",
      `<p style="margin:0 0 10px">Order <strong>#${o.number}</strong> was marked as delivered.</p><p style="margin:0;color:#75665f">We hope you love your new hair. Your feedback helps other customers choose with confidence.</p>`,
      { label: "View order & leave a review", url: `${SITE}/account/orders` },
    ),
  );
}

export async function sendRefund(o: OrderLike & { refundedCents: number }) {
  const b = await branding();
  await send(
    o.email,
    `Refund for order #${o.number}`,
    layout(
      b,
      "Your refund is on its way",
      `<div style="margin:18px 0;padding:18px;border-radius:16px;background:#FAECE7;text-align:center"><div style="font-size:12px;text-transform:uppercase;letter-spacing:.12em;color:#8a7b73">Refund</div><div style="margin-top:4px;font-family:Georgia,serif;font-size:26px;color:${esc(b.primary)}">${formatCents(o.refundedCents, o.currency)}</div></div><p style="margin:0;color:#75665f">The refund for order #${o.number} usually appears on your statement within 5–10 business days, depending on your bank.</p>`,
      { label: "View my orders", url: `${SITE}/account/orders` },
    ),
  );
}

export async function sendAbandonedCart(to: string, items: CartEmailItem[], code?: string | null) {
  const b = await branding();
  const cards = items.slice(0, 4).map((i) => `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-bottom:1px solid #f1e8e2"><tr>
    ${imageCell(i.imageUrl)}
    <td style="padding:12px 0;vertical-align:top"><div style="font-weight:700">${esc(i.productName)}</div><div style="font-size:13px;color:#8a7b73;margin-top:3px">${esc(i.variantName)} · Qty ${i.quantity}</div></td>
  </tr></table>`).join("");
  const more = items.length > 4 ? `<p style="font-size:13px;color:#8a7b73">+ ${items.length - 4} more item${items.length - 4 > 1 ? "s" : ""}</p>` : "";
  const promo = code
    ? `<div style="margin:20px 0;padding:16px;border:1px dashed ${esc(b.accent)};border-radius:16px;text-align:center;background:#fffaf7"><div style="font-size:12px;text-transform:uppercase;letter-spacing:.12em;color:#8a7b73">Your code</div><div style="margin-top:5px;font-size:22px;font-weight:800;letter-spacing:.08em;color:${esc(b.primary)}">${esc(code)}</div></div>`
    : "";
  await send(
    to,
    "You left something beautiful behind",
    layout(
      b,
      "Your cart is still waiting",
      `<p style="margin:0 0 16px;color:#75665f">We saved the items you were considering. Come back whenever you're ready.</p>${cards}${more}${promo}<p style="margin:18px 0 0;font-size:13px;color:#8a7b73">Availability can change, so returning sooner gives you the best chance of keeping your selected options.</p>`,
      { label: "Return to my cart", url: `${SITE}/cart` },
    ),
  );
}
