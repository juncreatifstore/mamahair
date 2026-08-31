import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { getSection } from "@/lib/settings";
import { saveAddress, deleteAddress } from "@/server/account";
import { Field, Input, Select, Checkbox } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit-button";
import { getT } from "@/i18n/server";
import { COUNTRY_NAMES } from "@/lib/utils";

export default async function AddressesPage() {
  const [user, t, commerce] = await Promise.all([requireUser("/account/addresses"), getT(), getSection("commerce")]);
  const addresses = await db.address.findMany({ where: { userId: user.id }, orderBy: { isDefault: "desc" } });
  return (
    <div>
      <h2 className="text-2xl text-cocoa">{t.account.addresses}</h2>
      <ul className="mt-6 grid gap-4 sm:grid-cols-2">
        {addresses.map((a) => <li key={a.id} className="rounded-3xl bg-white p-5 text-sm"><p className="font-semibold">{a.fullName} {a.isDefault && <span className="ml-1 text-xs text-flame">(default)</span>}</p><p className="mt-1 whitespace-pre-line text-ink-soft">{[a.line1, a.line2, `${a.city}${a.region ? ", " + a.region : ""} ${a.postalCode ?? ""}`, COUNTRY_NAMES[a.country] ?? a.country, a.phone].filter(Boolean).join("\n")}</p><form action={deleteAddress.bind(null, a.id)} className="mt-3"><button className="text-xs underline">Delete</button></form></li>)}
      </ul>
      <form action={async (fd) => { "use server"; await saveAddress(fd); }} className="mt-8 max-w-md space-y-4 rounded-3xl bg-white p-6">
        <h3 className="font-body text-base font-semibold">Add an address</h3>
        <Field label="Country"><Select name="country" defaultValue={commerce.enabledCountries[0]}>{commerce.enabledCountries.map((c) => <option key={c} value={c}>{COUNTRY_NAMES[c] ?? c}</option>)}</Select></Field>
        <Field label="Full name"><Input name="fullName" required /></Field>
        <Field label="Address"><Input name="line1" required /></Field>
        <Field label="Apartment, suite"><Input name="line2" /></Field>
        <div className="grid gap-4 sm:grid-cols-3"><Field label="City"><Input name="city" required /></Field><Field label="State"><Input name="region" /></Field><Field label="ZIP"><Input name="postalCode" /></Field></div>
        <Field label="Phone"><Input name="phone" /></Field>
        <Checkbox name="isDefault" label="Use as default address" />
        <SubmitButton>{t.account.save}</SubmitButton>
      </form>
    </div>
  );
}
