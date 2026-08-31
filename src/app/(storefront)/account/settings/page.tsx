import { requireUser } from "@/lib/auth";
import { updateProfile } from "@/server/account";
import { getT } from "@/i18n/server";
import { getSection } from "@/lib/settings";
import { Field, Input, Select } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit-button";
import { PasswordForm } from "@/components/storefront/auth-forms";
import { LOCALE_NAMES } from "@/i18n";

export default async function SettingsPage({ searchParams }: { searchParams: Promise<{ password?: string }> }) {
  const [user, t, loc, commerce, sp] = await Promise.all([requireUser(), getT(), getSection("localization"), getSection("commerce"), searchParams]);
  return (
    <div className="grid gap-6 md:grid-cols-2">
      <form action={async (fd) => { "use server"; await updateProfile(fd); }} className="space-y-4 rounded-3xl bg-white p-6">
        <h2 className="text-2xl text-cocoa">{t.account.profile}</h2>
        <Field label={t.auth.email}><Input value={user.email} disabled /></Field>
        <div className="grid gap-4 sm:grid-cols-2"><Field label={t.auth.firstName}><Input name="firstName" defaultValue={user.firstName ?? ""} /></Field><Field label={t.auth.lastName}><Input name="lastName" defaultValue={user.lastName ?? ""} /></Field></div>
        <Field label="Phone"><Input name="phone" defaultValue={user.phone ?? ""} /></Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t.nav.language}><Select name="locale" defaultValue={user.locale}>{loc.enabledLocales.map((l) => <option key={l} value={l}>{LOCALE_NAMES[l as keyof typeof LOCALE_NAMES] ?? l}</option>)}</Select></Field>
          <Field label={t.nav.currency}><Select name="currency" defaultValue={user.currency}>{commerce.enabledCurrencies.map((c) => <option key={c} value={c}>{c}</option>)}</Select></Field>
        </div>
        <SubmitButton>{t.account.save}</SubmitButton>
      </form>
      <div className="rounded-3xl bg-white p-6"><h2 className="text-2xl text-cocoa">{t.auth.reset}</h2>{sp.password === "updated" && <p className="mt-2 text-sm text-emerald-800">Password updated.</p>}<div className="mt-4"><PasswordForm t={t.auth} /></div></div>
    </div>
  );
}
