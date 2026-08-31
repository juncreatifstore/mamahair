export { stripe } from "./payments/stripe";
export const STRIPE_TAX_ENABLED = process.env.STRIPE_TAX_ENABLED !== "false";
