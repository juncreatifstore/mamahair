import { RegisterForm } from "@/components/storefront/auth-forms";
import { getT } from "@/i18n/server";
export const metadata = { robots: { index: false } };
export default async function RegisterPage() {
  const t = await getT();
  return <div className="mx-auto max-w-md px-4 py-16 sm:px-6"><h1 className="text-4xl text-cocoa">{t.auth.createTitle}</h1><p className="mt-2 text-ink-soft">{t.auth.createText}</p><div className="mt-8 rounded-3xl bg-white p-6"><RegisterForm t={t.auth} /></div></div>;
}
