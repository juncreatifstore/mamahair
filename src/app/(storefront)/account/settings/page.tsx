import { requireUser } from "@/lib/auth";
import { updateProfile, deleteAccount } from "@/server/account";
import { getLocale, getT } from "@/i18n/server";
import { getSection } from "@/lib/settings";
import { Field, Input, Select } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit-button";
import { PasswordForm } from "@/components/storefront/auth-forms";
import { LOCALE_NAMES } from "@/i18n";

const DELETE_TEXT = {
  en: { title: "Delete my account", body: "This permanently deletes your profile, addresses, wishlist, cart, reviews and reward points. Your past orders are kept for accounting but are no longer linked to you. This cannot be undone.", label: "Type DELETE to confirm", button: "Delete my account", confirm: "Type DELETE exactly to confirm.", staff: "Admin and staff accounts cannot be deleted here.", error: "We could not delete your account. Please try again or contact us." },
  fr: { title: "Supprimer mon compte", body: "Cette action supprime définitivement votre profil, vos adresses, vos favoris, votre panier, vos avis et vos points de fidélité. Vos commandes passées sont conservées pour la comptabilité mais ne sont plus liées à vous. Action irréversible.", label: "Tapez DELETE pour confirmer", button: "Supprimer mon compte", confirm: "Tapez exactement DELETE pour confirmer.", staff: "Les comptes administrateur et équipe ne peuvent pas être supprimés ici.", error: "Impossible de supprimer votre compte. Réessayez ou contactez-nous." },
  es: { title: "Eliminar mi cuenta", body: "Esto elimina de forma permanente tu perfil, direcciones, favoritos, carrito, reseñas y puntos. Tus pedidos anteriores se conservan para la contabilidad, pero ya no estarán vinculados a ti. No se puede deshacer.", label: "Escribe DELETE para confirmar", button: "Eliminar mi cuenta", confirm: "Escribe exactamente DELETE para confirmar.", staff: "Las cuentas de administrador y personal no se pueden eliminar aquí.", error: "No pudimos eliminar tu cuenta. Inténtalo de nuevo o contáctanos." },
  ht: { title: "Efase kont mwen", body: "Sa ap efase pwofil ou, adrès ou, favori ou, panye ou, avi ou ak pwen fidelite ou pou tout tan. Kòmand ou te fè yo rete pou kontablite, men yo p ap lye ak ou ankò. Ou pa ka anile sa.", label: "Tape DELETE pou konfime", button: "Efase kont mwen", confirm: "Tape DELETE egzakteman pou konfime.", staff: "Kont administratè ak ekip pa ka efase isit la.", error: "Nou pa t ka efase kont ou. Eseye ankò oswa kontakte nou." },
};

export default async function SettingsPage({ searchParams }: { searchParams: Promise<{ password?: string; delete?: string }> }) {
  const [user, t, loc, commerce, sp, locale] = await Promise.all([requireUser(), getT(), getSection("localization"), getSection("commerce"), searchParams, getLocale()]);
  const d = DELETE_TEXT[locale as keyof typeof DELETE_TEXT] ?? DELETE_TEXT.en;
  const deleteError = sp.delete === "confirm" ? d.confirm : sp.delete === "staff" ? d.staff : sp.delete === "error" ? d.error : null;
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
      {user.role === "CLIENT" && (
        <form action={deleteAccount} className="space-y-4 rounded-3xl border border-red-200 bg-white p-6 md:col-span-2">
          <h2 className="text-2xl text-red-800">{d.title}</h2>
          <p className="text-sm text-ink-soft">{d.body}</p>
          {deleteError && <p className="text-sm text-red-700">{deleteError}</p>}
          <Field label={d.label}><Input name="confirm" required autoComplete="off" placeholder="DELETE" /></Field>
          <button type="submit" className="rounded-full bg-red-700 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-red-800">{d.button}</button>
        </form>
      )}
    </div>
  );
}
