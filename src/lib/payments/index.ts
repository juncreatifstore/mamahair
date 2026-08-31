import type { PaymentProvider as ProviderEnum } from "@prisma/client";
import type { PaymentProvider } from "./types";
import { stripeProvider } from "./stripe";

/**
 * Registre des fournisseurs de paiement.
 * Pour ajouter Mercado Pago (OXXO, SPEI) ou PayPal : implémenter `PaymentProvider`
 * dans lib/payments/mercadopago.ts et l'enregistrer ici + activer dans Settings → Payments.
 */
const providers: Partial<Record<ProviderEnum, PaymentProvider>> = { STRIPE: stripeProvider };

export function getPaymentProvider(id: ProviderEnum = "STRIPE"): PaymentProvider {
  const p = providers[id];
  if (!p) throw new Error(`Payment provider ${id} is not configured`);
  return p;
}

/** Fournisseurs disponibles pour un pays/devise (base pour le choix au checkout). */
export function providersFor(country: string, currency: string, settings: { stripeEnabled: boolean; mercadoPagoEnabled: boolean; paypalEnabled: boolean }): ProviderEnum[] {
  const out: ProviderEnum[] = [];
  if (settings.stripeEnabled) out.push("STRIPE");
  if (settings.mercadoPagoEnabled && country === "MX" && currency === "MXN" && providers.MERCADO_PAGO) out.push("MERCADO_PAGO");
  if (settings.paypalEnabled && providers.PAYPAL) out.push("PAYPAL");
  return out;
}
