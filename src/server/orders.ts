import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";

export async function listMyOrders() {
  const user = await requireUser("/account/orders");
  return db.order.findMany({ where: { userId: user.id, status: { not: "PENDING_PAYMENT" } }, orderBy: { createdAt: "desc" }, include: { items: true, shipment: true } });
}

/** Protection IDOR : la commande doit appartenir à l'utilisateur connecté. */
export async function getMyOrder(id: string) {
  const user = await requireUser("/account/orders");
  return db.order.findFirst({ where: { id, userId: user.id }, include: { items: true, shipment: true, payment: true, shippingRate: true, history: { orderBy: { createdAt: "asc" } } } });
}
