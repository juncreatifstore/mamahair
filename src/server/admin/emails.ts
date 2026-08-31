"use server";

import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { EMAIL_TEMPLATES, type EmailTemplate } from "@/lib/admin/email-templates";
import {
  sendWelcome,
  sendOrderConfirmation,
  sendOrderProcessing,
  sendOrderShipped,
  sendOrderDelivered,
  sendRefund,
  sendAbandonedCart,
} from "@/lib/email";

export async function adminSendTestEmail(formData: FormData): Promise<{ ok?: boolean; error?: string }> {
  await requireAdmin();

  const to = String(formData.get("to") ?? "").trim().toLowerCase();
  const template = String(formData.get("template") ?? "") as EmailTemplate;

  if (!/^\S+@\S+\.\S+$/.test(to)) return { error: "Enter a valid recipient email." };
  if (!EMAIL_TEMPLATES.includes(template)) return { error: "Choose a valid email template." };
  if (!process.env.RESEND_API_KEY) return { error: "RESEND_API_KEY is not configured. The test email was not sent." };

  const product = await db.product.findFirst({
    where: { status: "ACTIVE" },
    orderBy: { updatedAt: "desc" },
    select: {
      name: true,
      images: { take: 1, orderBy: { sortOrder: "asc" }, select: { url: true } },
      variants: { where: { isActive: true }, take: 1, orderBy: [{ isDefault: "desc" }, { priceCents: "asc" }], select: { name: true, sku: true, priceCents: true, image: { select: { url: true } } } },
    },
  });

  const variant = product?.variants[0];
  const imageUrl = variant?.image?.url ?? product?.images[0]?.url ?? null;
  const item = {
    productName: product?.name ?? "Body Wave HD Lace Wig",
    variantName: variant?.name ?? "Body Wave · 24\" · 180% · Natural Black",
    quantity: 1,
    totalCents: variant?.priceCents ?? 18900,
    imageUrl,
    sku: variant?.sku ?? "MAMA-TEST-001",
  };
  const secondItem = {
    productName: "Silk Hair Care Set",
    variantName: "Hydration Set",
    quantity: 1,
    totalCents: 3900,
    imageUrl: null,
    sku: "MAMA-TEST-002",
  };
  const subtotalCents = item.totalCents + secondItem.totalCents;
  const order = {
    number: 1048,
    email: to,
    currency: "USD",
    subtotalCents,
    discountCents: 1500,
    shippingCents: 0,
    taxCents: 1374,
    totalCents: subtotalCents - 1500 + 1374,
    items: [item, secondItem],
  };

  switch (template) {
    case "WELCOME":
      await sendWelcome(to, "Maya");
      break;
    case "ORDER_CONFIRMATION":
      await sendOrderConfirmation(order);
      break;
    case "ORDER_PROCESSING":
      await sendOrderProcessing(order);
      break;
    case "ORDER_SHIPPED":
      await sendOrderShipped({ ...order, carrier: "DHL Express", trackingNumber: "MAMA123456789", trackingUrl: "https://www.dhl.com/" });
      break;
    case "ORDER_DELIVERED":
      await sendOrderDelivered(order);
      break;
    case "REFUND":
      await sendRefund({ ...order, refundedCents: 5000 });
      break;
    case "ABANDONED_CART":
      await sendAbandonedCart(to, [
        { productName: item.productName, variantName: item.variantName, quantity: 1, imageUrl: item.imageUrl },
        { productName: secondItem.productName, variantName: secondItem.variantName, quantity: 1, imageUrl: secondItem.imageUrl },
      ], process.env.ABANDONED_CART_CODE ?? "COME10");
      break;
  }

  return { ok: true };
}
