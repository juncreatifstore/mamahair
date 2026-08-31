import { cn } from "@/lib/utils";

const tones = {
  neutral: "bg-sand text-ink", green: "bg-emerald-100 text-emerald-900", honey: "bg-peach text-cocoa", red: "bg-red-100 text-red-800", blue: "bg-sky-100 text-sky-900", cocoa: "bg-cocoa text-cream", flame: "bg-flame text-white",
} as const;

export function Badge({ children, tone = "neutral", className }: { children: React.ReactNode; tone?: keyof typeof tones; className?: string }) {
  return <span className={cn("inline-flex items-center rounded-pill px-2.5 py-0.5 text-xs font-medium", tones[tone], className)}>{children}</span>;
}

export const statusTone: Record<string, keyof typeof tones> = {
  PENDING_PAYMENT: "neutral", PAID: "honey", PROCESSING: "blue", READY_TO_SHIP: "blue", SHIPPED: "blue", DELIVERED: "green", CANCELLED: "red", REFUNDED: "red", PARTIALLY_REFUNDED: "red",
};
