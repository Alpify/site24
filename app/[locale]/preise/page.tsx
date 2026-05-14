import { getTranslations } from "next-intl/server";
import { buildPageMetadata } from "@/lib/build-page-metadata";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "metadata.pricing" });
  return buildPageMetadata({
    locale,
    pathname: "/preise",
    title: t("title"),
    description: t("description"),
  });
}

export default async function PricingPage() {
  const t = await getTranslations("pricingPage");

  return (
    <>
      <section className="border-b border-border bg-card">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
          <h1 className="text-4xl font-semibold tracking-tight text-foreground md:text-5xl">
            {t("heroTitle")}
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-muted">{t("heroSubtitle")}</p>
        </div>
      </section>

      <section className="py-16 md:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <h2 className="text-2xl font-semibold text-foreground">
              {t("soonTitle")}
            </h2>
            <p className="mt-4 text-muted">{t("soonBody")}</p>
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {(["starter", "pro", "org"] as const).map((key) => (
              <div
                key={key}
                className="rounded-2xl border border-dashed border-border bg-card/50 p-6"
              >
                <h3 className="text-lg font-semibold text-foreground">
                  {t(`cards.${key}Title`)}
                </h3>
                <p className="mt-3 text-sm text-muted">{t(`cards.${key}Body`)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
