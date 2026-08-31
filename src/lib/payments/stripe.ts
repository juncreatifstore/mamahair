import Stripe from "stripe";
import type { PaymentProvider, CreateCheckoutInput, WebhookOutcome } from "./types";

let stripeClient: Stripe | null = null;

export function getStripe() {
  const apiKey = process.env.STRIPE_SECRET_KEY?.trim();
  if (!apiKey) throw new Error("STRIPE_SECRET_KEY is not configured");
  if (!stripeClient) stripeClient = new Stripe(apiKey, { typescript: true });
  return stripeClient;
}

/**
 * Backward-compatible lazy Stripe export.
 * Accessing a Stripe property initializes the real client only at runtime,
 * so Next.js can import modules during build/page-data collection without a key.
 */
export const stripe = new Proxy({} as Stripe, {
  get(_target, prop) {
    const client = getStripe() as unknown as Record<PropertyKey, unknown>;
    const value = client[prop];
    return typeof value === "function" ? value.bind(client) : value;
  },
});

const LOCALES: Record<string, Stripe.Checkout.SessionCreateParams.Locale> = { en: "en", es: "es", fr: "fr", ht: "fr" };

export const stripeProvider: PaymentProvider = {
  id: "STRIPE",

  async createCheckout(input: CreateCheckoutInput) {
    let couponId: string | undefined;
    if (input.discountCents > 0) {
      const coupon = await getStripe().coupons.create({ amount_off: input.discountCents, currency: input.currency.toLowerCase(), duration: "once", name: input.discountLabel ?? "Discount" });
      couponId = coupon.id;
    }
    const customer = await getStripe().customers.create({
      email: input.email,
      name: input.address.fullName,
      phone: input.address.phone || undefined,
      address: { line1: input.address.line1, line2: input.address.line2 || undefined, city: input.address.city, state: input.address.region || undefined, postal_code: input.address.postalCode || undefined, country: input.address.country },
      shipping: { name: input.address.fullName, address: { line1: input.address.line1, line2: input.address.line2 || undefined, city: input.address.city, state: input.address.region || undefined, postal_code: input.address.postalCode || undefined, country: input.address.country } },
      metadata: { orderId: input.orderId },
    });

    const session = await getStripe().checkout.sessions.create({
      mode: "payment",
      customer: customer.id,
      customer_update: input.automaticTax ? { shipping: "auto", address: "auto" } : undefined,
      locale: LOCALES[input.locale] ?? "auto",
      line_items: input.lines.map((l) => ({
        quantity: l.quantity,
        price_data: {
          currency: input.currency.toLowerCase(),
          unit_amount: l.unitCents,
          product_data: { name: l.name, images: l.imageUrl ? [l.imageUrl] : undefined, ...(input.automaticTax && l.taxCode ? { tax_code: l.taxCode } : {}) },
        },
      })),
      shipping_options: [{
        shipping_rate_data: {
          type: "fixed_amount",
          display_name: input.shipping.name,
          fixed_amount: { amount: input.shipping.cents, currency: input.currency.toLowerCase() },
          ...(input.shipping.minDays && input.shipping.maxDays
            ? { delivery_estimate: { minimum: { unit: "business_day", value: input.shipping.minDays }, maximum: { unit: "business_day", value: input.shipping.maxDays } } }
            : {}),
          ...(input.automaticTax ? { tax_behavior: "exclusive", tax_code: "txcd_92010001" } : {}),
        },
      }],
      discounts: couponId ? [{ coupon: couponId }] : undefined,
      automatic_tax: input.automaticTax ? { enabled: true } : undefined,
      expires_at: Math.floor(input.expiresAt.getTime() / 1000),
      metadata: { orderId: input.orderId, cartId: input.cartId },
      client_reference_id: input.orderId,
      success_url: input.successUrl,
      cancel_url: input.cancelUrl,
    });
    if (!session.url) throw new Error("Stripe did not return a checkout URL");
    return { providerId: session.id, redirectUrl: session.url };
  },

  async parseWebhook(rawBody, headers) {
    const sig = headers.get("stripe-signature");
    if (!sig || !process.env.STRIPE_WEBHOOK_SECRET) throw new Error("Missing Stripe signature or webhook secret");
    const event = getStripe().webhooks.constructEvent(rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET);
    let outcome: WebhookOutcome = { kind: "ignored" };

    if (event.type === "checkout.session.completed" || event.type === "checkout.session.async_payment_succeeded") {
      const s = event.data.object as Stripe.Checkout.Session;
      if (s.payment_status === "paid" && s.metadata?.orderId) {
        outcome = {
          kind: "paid",
          orderId: s.metadata.orderId,
          providerId: s.id,
          intentId: typeof s.payment_intent === "string" ? s.payment_intent : s.payment_intent?.id ?? null,
          amountCents: s.amount_total ?? 0,
          currency: (s.currency ?? "").toUpperCase(),
          taxCents: s.total_details?.amount_tax ?? 0,
          method: s.payment_method_types?.[0] ?? null,
          raw: { customer: s.customer, payment_intent: s.payment_intent, amount_total: s.amount_total, total_details: s.total_details },
        };
      }
    } else if (event.type === "checkout.session.expired" || event.type === "checkout.session.async_payment_failed") {
      const s = event.data.object as Stripe.Checkout.Session;
      if (s.metadata?.orderId) outcome = { kind: "expired", orderId: s.metadata.orderId };
    } else if (event.type === "charge.refunded") {
      const c = event.data.object as Stripe.Charge;
      const intent = typeof c.payment_intent === "string" ? c.payment_intent : c.payment_intent?.id;
      if (intent) outcome = { kind: "refunded", providerId: intent, amountCents: c.amount_refunded };
    }
    return { eventId: event.id, type: event.type, outcome };
  },

  async refund(intentId, amountCents) {
    const r = await getStripe().refunds.create({ payment_intent: intentId, ...(amountCents ? { amount: amountCents } : {}) });
    return { refundId: r.id };
  },

  async cancelCheckout(providerId) {
    try {
      const s = await getStripe().checkout.sessions.retrieve(providerId);
      if (s.status === "open") await getStripe().checkout.sessions.expire(providerId);
    } catch {
      /* session inexistante, déjà fermée, ou Stripe non configuré : rien à faire */
    }
  },
};
