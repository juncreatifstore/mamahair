"use server";

import { redirect } from "next/navigation";
import { createSupabaseServer } from "@/lib/supabase/server";
import { rateLimit } from "@/lib/rate-limit";
import { sendWelcome } from "@/lib/email";
import { logger } from "@/lib/logger";
import { z } from "zod";

export type AuthState = { error?: string; message?: string };
const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
const credentials = z.object({ email: z.string().email(), password: z.string().min(8).max(200) });

export async function signIn(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const rl = await rateLimit("signin", 10, 10 * 60_000);
  if (!rl.ok) return { error: "Too many attempts. Try again in a few minutes." };
  const parsed = credentials.safeParse({ email: formData.get("email"), password: formData.get("password") });
  if (!parsed.success) return { error: "Enter a valid email and password (8+ characters)." };
  const supabase = await createSupabaseServer();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) return { error: "Email or password is incorrect." };
  const next = String(formData.get("next") || "/account");
  redirect(next.startsWith("/") && !next.startsWith("//") ? next : "/account");
}

export async function signUp(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const rl = await rateLimit("signup", 5, 10 * 60_000);
  if (!rl.ok) return { error: "Too many attempts. Try again later." };

  const parsed = credentials.safeParse({ email: formData.get("email"), password: formData.get("password") });
  if (!parsed.success) return { error: "Enter a valid email and a password of 8+ characters." };

  const firstName = String(formData.get("firstName") ?? "").slice(0, 60);
  const lastName = String(formData.get("lastName") ?? "").slice(0, 60);

  let hasSession = false;

  try {
    const supabase = await createSupabaseServer();
    const { data, error } = await supabase.auth.signUp({
      ...parsed.data,
      options: {
        data: { first_name: firstName, last_name: lastName },
        emailRedirectTo: `${SITE}/auth/callback?next=/account`,
      },
    });

    if (error) {
      logger.error("signup.supabase", error);
      return { error: error.message || "Unable to create your account. Please try again." };
    }

    if (data.user?.email) {
      void sendWelcome(data.user.email, firstName).catch((e) => logger.error("welcome.failed", e));
    }

    hasSession = Boolean(data.session);
  } catch (error) {
    logger.error("signup.failed", error);
    const message = error instanceof Error ? error.message : "Unknown registration error";

    if (message.includes("Supabase server configuration is missing")) {
      return { error: "Registration is temporarily unavailable because Supabase authentication is not configured on the server." };
    }

    return { error: "We could not create your account right now. Please try again in a moment." };
  }

  if (hasSession) redirect("/account");
  return { message: "Account created. Check your email to confirm, then sign in." };
}

export async function requestPasswordReset(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const rl = await rateLimit("reset", 3, 15 * 60_000);
  if (!rl.ok) return { error: "Too many attempts. Try again later." };
  const email = String(formData.get("email") ?? "");
  if (z.string().email().safeParse(email).success) {
    const supabase = await createSupabaseServer();
    await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${SITE}/auth/callback?next=/reset-password` });
  }
  return { message: "If an account exists for this email, a reset link is on its way." };
}

export async function updatePassword(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const password = String(formData.get("password") ?? "");
  if (password.length < 8) return { error: "Password must be at least 8 characters." };
  const supabase = await createSupabaseServer();
  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { error: error.message };
  redirect("/account?password=updated");
}

export async function signOut() {
  const supabase = await createSupabaseServer();
  await supabase.auth.signOut();
  redirect("/");
}
