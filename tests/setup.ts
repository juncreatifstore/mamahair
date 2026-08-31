import { vi } from "vitest";

/** Les tests unitaires ne touchent jamais la base : `@/lib/db` est remplacé par un double.
 *  Chaque test peut redéfinir le comportement avec vi.mocked(db.<model>.<method>). */
vi.mock("@/lib/db", () => {
  const model = () => ({ findMany: vi.fn(), findUnique: vi.fn(), findFirst: vi.fn(), findUniqueOrThrow: vi.fn(), create: vi.fn(), update: vi.fn(), updateMany: vi.fn(), delete: vi.fn(), deleteMany: vi.fn(), count: vi.fn(), aggregate: vi.fn(), upsert: vi.fn(), fields: {} });
  const db = {
    order: model(), orderItem: model(), payment: model(), webhookEvent: model(), stockReservation: model(), inventory: model(), cart: model(), cartItem: model(), product: model(), productVariant: model(), discount: model(), setting: model(), shippingRate: model(), taxRate: model(), user: model(), review: model(),
    $transaction: vi.fn(),
    $executeRaw: vi.fn(),
    $queryRaw: vi.fn(),
  };
  return { db };
});
vi.mock("@/lib/email", () => ({ sendOrderConfirmation: vi.fn(async () => {}), sendRefund: vi.fn(async () => {}), sendOrderShipped: vi.fn(async () => {}), sendOrderProcessing: vi.fn(async () => {}), sendOrderDelivered: vi.fn(async () => {}), sendWelcome: vi.fn(async () => {}), sendAbandonedCart: vi.fn(async () => {}) }));
