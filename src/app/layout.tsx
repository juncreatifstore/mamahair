import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MAMAHAIR.COM",
  description: "MAMAHAIR storefront diagnostic",
};

/**
 * Temporary diagnostic root layout.
 * Keep this completely static so runtime DB, Supabase, site URL and dynamic
 * metadata cannot mask the source of a Server Components render failure.
 */
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
