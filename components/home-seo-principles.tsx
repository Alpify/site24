import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/routing";

const SEO_ITEM_KEYS = [1, 2, 3, 4, 5, 6] as const;

export async function HomeSeoPrinciples() {
  const t = await getTranslations("home");

  return (
    <section
      id="seo-principles"
      className="border-b border-border bg-card py-16 md:py-24"
    >
      <div className="mx-auto max-w-6xl px-[max(1rem,env(safe-area-inset-left))] sm:px-6 lg:px-8 lg:pr-[max(1.5rem,env(safe-area-inset-right))]">
        <h2 className="text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
          {t("seoPrinciplesTitle")}
        </h2>
        <p className="mt-4 max-w-3xl text-base leading-relaxed text-muted">
          {t("seoPrinciplesLead")}
        </p>
        <ul className="mt-8 max-w-3xl list-inside list-disc space-y-2 text-sm leading-relaxed text-muted marker:text-accent">
          {SEO_ITEM_KEYS.map((n) => (
            <li key={n}>{t(`seoPrinciplesItem${n}`)}</li>
          ))}
        </ul>
        <p className="mt-8 max-w-3xl rounded-lg border border-border bg-background p-4 text-xs leading-relaxed text-muted">
          {t("seoPrinciplesDisclaimer")}
        </p>
        <p className="mt-6 text-sm">
          <Link
            href="/produkt"
            className="font-medium text-accent underline-offset-4 hover:underline"
          >
            {t("seoPrinciplesLinkProduct")}
          </Link>
        </p>
      </div>
    </section>
  );
}
