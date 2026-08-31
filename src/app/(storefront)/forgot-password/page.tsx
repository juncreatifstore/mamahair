import { ForgotForm } from "@/components/storefront/auth-forms";
import { getT } from "@/i18n/server";
export const metadata = { robots: { index: false } };
export default async function ForgotPage() {
  const t = await getT();
  return <div className="mx-auto max-w-md px-4 py-16 sm:px-6"><h1 className="text-4xl text-cocoa">{t.auth.reset}</h1><div className="mt-8 rounded-3xl bg-white p-6"><ForgotForm t={t.auth} /></div></div>;
}
