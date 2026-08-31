import { LoginForm } from "@/components/storefront/auth-forms";
import { getT } from "@/i18n/server";
export const metadata = { robots: { index: false } };
export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const [{ next }, t] = await Promise.all([searchParams, getT()]);
  return <div className="mx-auto max-w-md px-4 py-16 sm:px-6"><h1 className="text-4xl text-cocoa">{t.auth.welcome}</h1><div className="mt-8 rounded-3xl bg-white p-6"><LoginForm next={next ?? "/account"} t={t.auth} /></div></div>;
}
