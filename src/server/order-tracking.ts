"use server";

import { db } from "@/lib/db";

export type OrderTrackingState = {
  error?: string;
  order?: {
    number: number;
    status: string;
    createdAt: string;
    carrier?: string | null;
    trackingNumber?: string | null;
    trackingUrl?: string | null;
  };
};

export async function lookupOrderTracking(_prev: OrderTrackingState, formData: FormData): Promise<OrderTrackingState> {
  const numberRaw = String(formData.get("number") ?? "").trim().replace(/^#/, "");
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const number = Number(numberRaw);

  if (!Number.isInteger(number) || number <= 0 || !email.includes("@") || email.length > 254) {
    return { error: "Enter a valid order number and the email used at checkout." };
  }

  const order = await db.order.findFirst({
    where: { number, email: { equals: email, mode: "insensitive" } },
    select: {
      number: true,
      status: true,
      createdAt: true,
      shipment: { select: { carrier: true, trackingNumber: true, trackingUrl: true } },
    },
  });

  if (!order) return { error: "We couldn't find an order matching those details." };

  return {
    order: {
      number: order.number,
      status: order.status,
      createdAt: order.createdAt.toISOString(),
      carrier: order.shipment?.carrier,
      trackingNumber: order.shipment?.trackingNumber,
      trackingUrl: order.shipment?.trackingUrl,
    },
  };
}
