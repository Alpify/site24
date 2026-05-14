"use server";

import { signIn, signOut } from "@/auth";

export async function signInWithGoogle(locale: string) {
  await signIn("google", { redirectTo: `/${locale}/app` });
}

export async function signOutToLocale(locale: string) {
  await signOut({ redirectTo: `/${locale}` });
}
