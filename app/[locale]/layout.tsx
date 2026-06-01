import { NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { auth } from "@/auth";
import { LocaleHtmlLang } from "@/components/locale-html-lang";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { signOutToLocale, switchGoogleAccount } from "@/lib/auth/actions";
import { routing } from "@/i18n/routing";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!routing.locales.includes(locale as (typeof routing.locales)[number])) {
    notFound();
  }

  setRequestLocale(locale);
  const messages = await getMessages();
  const session = await auth();
  const signOutAction = session?.user
    ? signOutToLocale.bind(null, locale)
    : undefined;
  const switchAccountAction = session?.user
    ? switchGoogleAccount.bind(null, locale)
    : undefined;

  return (
    <NextIntlClientProvider messages={messages}>
      <LocaleHtmlLang />
      <SiteHeader
        user={session?.user ?? null}
        signOutAction={signOutAction}
        switchAccountAction={switchAccountAction}
      />
      <main className="flex flex-1 flex-col">{children}</main>
      <SiteFooter />
    </NextIntlClientProvider>
  );
}
