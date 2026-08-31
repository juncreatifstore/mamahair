export const EMAIL_TEMPLATES = [
  "WELCOME",
  "ORDER_CONFIRMATION",
  "ORDER_PROCESSING",
  "ORDER_SHIPPED",
  "ORDER_DELIVERED",
  "REFUND",
  "ABANDONED_CART",
] as const;

export type EmailTemplate = (typeof EMAIL_TEMPLATES)[number];

export const EMAIL_TEMPLATE_LABELS: Record<EmailTemplate, string> = {
  WELCOME: "Welcome",
  ORDER_CONFIRMATION: "Order confirmed",
  ORDER_PROCESSING: "Order processing",
  ORDER_SHIPPED: "Order shipped",
  ORDER_DELIVERED: "Order delivered",
  REFUND: "Refund",
  ABANDONED_CART: "Abandoned cart",
};
