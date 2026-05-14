import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { buttonClassName } from "@/components/ui/button";

export default async function LocaleNotFound() {
  const t = await getTranslations("notFound");

  return (
    <section className="flex flex-1 flex-col items-center justify-center px-4 py-24 text-center">
      <p className="text-sm font-medium text-accent">404</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground">
        {t("title")}
      </h1>
      <p className="mt-4 max-w-md text-muted">{t("body")}</p>
      <Link href="/" className={`${buttonClassName("primary", "mt-8")} px-6`}>
        {t("cta")}
      </Link>
    </section>
  );
}
