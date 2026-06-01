"use server";

import { signIn, signOut } from "@/auth";

export async function signInWithGoogle(locale: string) {
  await signIn("google", { redirectTo: `/${locale}/app` });
}

export async function signOutToLocale(locale: string) {
  await signOut({ redirectTo: `/${locale}` });
}

/** Abmelden von site24, danach Google-Kontoauswahl beim erneuten Login. */
export async function switchGoogleAccount(locale: string) {
  await signOut({ redirect: false });
  await signIn(
    "google",
    { redirectTo: `/${locale}/app` },
    { prompt: "select_account" },
  );
}
