import type { PaymentProvider as ProviderEnum } from "@prisma/client";

export type CheckoutLine = { name: string; imageUrl?: string; unitCents: number; quantity: number; taxCode?: string };

export type CreateCheckoutInput = {
  orderId: string;
  cartId: string;
  email: string;
  currency: string;
  lines: CheckoutLine[];
  shipping: { name: string; cents: number; minDays?: number | null; maxDays?: number | null };
  discountCents: number;
  discountLabel?: string | null;
  address: { fullName: string; line1: string; line2?: string; city: string; region?: string; postalCode?: string; country: string; phone?: string };
  locale: string;
  successUrl: string;
  cancelUrl: string;
  expiresAt: Date;
  automaticTax: boolean;
};

export type CreateCheckoutResult = { providerId: string; redirectUrl: string };

export type WebhookOutcome =
  | { kind: "paid"; orderId: string; providerId: string; intentId?: string | null; amountCents: number; currency: string; taxCents: number; method?: string | null; raw?: unknown }
  | { kind: "expired"; orderId: string }
  | { kind: "refunded"; providerId: string; amountCents: number }
  | { kind: "ignored" };

export interface PaymentProvider {
  readonly id: ProviderEnum;
  createCheckout(input: CreateCheckoutInput): Promise<CreateCheckoutResult>;
  /** Vérifie la signature et normalise l'événement. Doit lever si signature invalide. */
  parseWebhook(rawBody: string, headers: Headers): Promise<{ eventId: string; type: string; outcome: WebhookOutcome }>;
  refund(intentId: string, amountCents?: number): Promise<{ refundId: string }>;
  /** Ferme une session de paiement encore ouverte (annulation admin, expiration côté boutique). Ne doit pas lever si déjà fermée. */
  cancelCheckout(providerId: string): Promise<void>;
}
