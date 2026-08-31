import { z } from "zod";

const opt = (max: number) => z.string().max(max).optional().or(z.literal(""));

export const addressSchema = z.object({
  fullName: z.string().min(2, "Full name is required").max(120),
  line1: z.string().min(3, "Address is required").max(200),
  line2: opt(200),
  city: z.string().min(1, "City is required").max(120),
  region: opt(120),
  postalCode: opt(20),
  country: z.string().length(2, "Country is required"),
  phone: opt(30),
});
export type AddressInput = z.infer<typeof addressSchema>;
