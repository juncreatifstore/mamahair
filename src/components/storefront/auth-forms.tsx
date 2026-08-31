"use client";
import { useActionState } from "react";
import Link from "next/link";
import { signIn, signUp, requestPasswordReset, updatePassword, type AuthState } from "@/server/auth";
import { Field, Input } from "@/components/ui/input";
import { Alert } from "@/components/ui/alert";
import { SubmitButton } from "@/components/ui/submit-button";
import type { Dict } from "@/i18n";

type T = Dict["auth"];

export function LoginForm({ next, t }: { next: string; t: T }) {
  const [state, action] = useActionState<AuthState, FormData>(signIn, {});
  return (
    <form action={action} className="space-y-4">
      {state.error && <Alert>{state.error}</Alert>}
      <input type="hidden" name="next" value={next} />
      <Field label={t.email}><Input name="email" type="email" required autoComplete="email" /></Field>
      <Field label={t.password}><Input name="password" type="password" required autoComplete="current-password" /></Field>
      <SubmitButton className="w-full" pendingText="…">{t.signIn}</SubmitButton>
      <div className="flex justify-between text-sm text-ink-soft"><Link href="/forgot-password" className="underline">{t.forgot}</Link><span>{t.noAccount} <Link href="/register" className="text-flame underline">{t.create}</Link></span></div>
    </form>
  );
}

export function RegisterForm({ t }: { t: T }) {
  const [state, action] = useActionState<AuthState, FormData>(signUp, {});
  return (
    <form action={action} className="space-y-4">
      {state.error && <Alert>{state.error}</Alert>}
      {state.message && <Alert tone="success">{state.message}</Alert>}
      <div className="grid gap-4 sm:grid-cols-2"><Field label={t.firstName}><Input name="firstName" autoComplete="given-name" /></Field><Field label={t.lastName}><Input name="lastName" autoComplete="family-name" /></Field></div>
      <Field label={t.email}><Input name="email" type="email" required autoComplete="email" /></Field>
      <Field label={t.password} hint="8+ characters"><Input name="password" type="password" minLength={8} required autoComplete="new-password" /></Field>
      <SubmitButton className="w-full" pendingText="…">{t.create}</SubmitButton>
      <p className="text-center text-sm text-ink-soft">{t.hasAccount} <Link href="/login" className="text-flame underline">{t.signIn}</Link></p>
    </form>
  );
}

export function ForgotForm({ t }: { t: T }) {
  const [state, action] = useActionState<AuthState, FormData>(requestPasswordReset, {});
  return (
    <form action={action} className="space-y-4">
      {state.error && <Alert>{state.error}</Alert>}
      {state.message && <Alert tone="success">{state.message}</Alert>}
      <Field label={t.email}><Input name="email" type="email" required autoComplete="email" /></Field>
      <SubmitButton className="w-full" pendingText="…">{t.reset}</SubmitButton>
    </form>
  );
}

export function PasswordForm({ t }: { t: T }) {
  const [state, action] = useActionState<AuthState, FormData>(updatePassword, {});
  return (
    <form action={action} className="space-y-4">
      {state.error && <Alert>{state.error}</Alert>}
      <Field label={t.newPassword}><Input name="password" type="password" minLength={8} required autoComplete="new-password" /></Field>
      <SubmitButton pendingText="…">{t.update}</SubmitButton>
    </form>
  );
}
