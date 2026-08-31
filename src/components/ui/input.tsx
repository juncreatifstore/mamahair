import * as React from "react";
import { cn } from "@/lib/utils";

const field = "w-full h-11 rounded-xl border border-sand bg-white px-3.5 text-sm text-ink placeholder:text-ink-soft/60 focus:border-cocoa";

export function Input({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) { return <input className={cn(field, className)} {...props} />; }
export function Textarea({ className, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) { return <textarea className={cn(field, "h-auto py-2.5 min-h-28", className)} {...props} />; }
export function Select({ className, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) { return <select className={cn(field, className)} {...props} />; }

export function Field({ label, error, children, hint, className }: { label: string; error?: string; hint?: string; children: React.ReactNode; className?: string }) {
  return (
    <label className={cn("block space-y-1.5", className)}>
      <span className="text-sm font-medium">{label}</span>
      {children}
      {hint && !error && <span className="block text-xs text-ink-soft">{hint}</span>}
      {error && <span className="block text-xs text-red-700">{error}</span>}
    </label>
  );
}

export function Checkbox({ label, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return (
    <label className="inline-flex items-center gap-2 text-sm">
      <input type="checkbox" className="size-4 accent-cocoa" {...props} />
      {label}
    </label>
  );
}
