import { z } from "zod";
import { addressSchema } from "./address";

export const checkoutSchema = z.object({
  email: z.string().email("Enter a valid email").max(200),
  shippingRateId: z.string().min(1, "Choose a delivery method"),
  notes: z.string().max(500).optional().or(z.literal("")),
  saveAddress: z.boolean().optional(),
  address: addressSchema,
});
export type CheckoutInput = z.infer<typeof checkoutSchema>;
