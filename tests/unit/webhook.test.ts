import { describe, it, expect } from "vitest";
import Stripe from "stripe";
import { stripeProvider } from "@/lib/payments/stripe";

/** Vérifie la signature et la normalisation des événements Stripe sans réseau. */
const secret = "whsec_test_secret";
process.env.STRIPE_WEBHOOK_SECRET = secret;
const stripe = new Stripe("sk_test_dummy", { typescript: true });

function signed(event: object) {
  const payload = JSON.stringify(event);
  const header = stripe.webhooks.generateTestHeaderString({ payload, secret });
  return { payload, headers: new Headers({ "stripe-signature": header }) };
}

describe("stripe webhook parsing", () => {
  it("rejects an invalid signature", async () => {
    await expect(stripeProvider.parseWebhook("{}", new Headers({ "stripe-signature": "t=1,v1=bad" }))).rejects.toThrow();
  });
  it("normalizes checkout.session.completed into a paid outcome", async () => {
    const { payload, headers } = signed({ id: "evt_1", object: "event", type: "checkout.session.completed", data: { object: { id: "cs_1", object: "checkout.session", payment_status: "paid", amount_total: 12345, total_details: { amount_tax: 345 }, payment_intent: "pi_1", metadata: { orderId: "o1", cartId: "c1" } } } });
    const r = await stripeProvider.parseWebhook(payload, headers);
    expect(r.eventId).toBe("evt_1");
    expect(r.outcome).toMatchObject({ kind: "paid", orderId: "o1", amountCents: 12345, taxCents: 345, intentId: "pi_1" });
  });
  it("normalizes expired sessions and ignores unrelated events", async () => {
    const e = signed({ id: "evt_2", object: "event", type: "checkout.session.expired", data: { object: { id: "cs_2", object: "checkout.session", metadata: { orderId: "o2" } } } });
    expect((await stripeProvider.parseWebhook(e.payload, e.headers)).outcome).toEqual({ kind: "expired", orderId: "o2" });
    const i = signed({ id: "evt_3", object: "event", type: "customer.created", data: { object: { id: "cus_1" } } });
    expect((await stripeProvider.parseWebhook(i.payload, i.headers)).outcome).toEqual({ kind: "ignored" });
  });
});
