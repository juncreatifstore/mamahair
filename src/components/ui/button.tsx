import * as React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "light";
type Size = "sm" | "md" | "lg";

const base = "inline-flex items-center justify-center gap-2 font-medium rounded-pill transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap";
const variants: Record<Variant, string> = {
  primary: "bg-flame text-white hover:bg-flame-deep",
  secondary: "bg-cocoa text-cream hover:bg-cocoa-deep",
  ghost: "bg-transparent text-ink border border-sand hover:bg-petal",
  light: "bg-white text-cocoa hover:bg-petal",
  danger: "bg-red-700 text-white hover:bg-red-800",
};
const sizes: Record<Size, string> = { sm: "h-9 px-4 text-sm", md: "h-11 px-6 text-sm", lg: "h-13 px-8 text-base" };

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: Size; href?: string };

export function Button({ className, variant = "primary", size = "md", href, ...props }: Props) {
  const cls = cn(base, variants[variant], sizes[size], className);
  if (href) return <Link href={href} className={cls}>{props.children}</Link>;
  return <button className={cls} {...props} />;
}
