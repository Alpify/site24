import { getTranslations } from "next-intl/server";

import { auth } from "@/auth";
import { Link } from "@/i18n/routing";
import { buildPageMetadata } from "@/lib/build-page-metadata";
import { FeatureCard } from "@/components/feature-card";
import { Section } from "@/components/section";
import { buttonClassName } from "@/components/ui/button";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "metadata.product" });
  return buildPageMetadata({
    locale,
    pathname: "/produkt",
    title: t("title"),
    description: t("description"),
  });
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  await params;
  const session = await auth();
  const t = await getTranslations("productPage");

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

      <Section title={t("featuresTitle")} subtitle={t("featuresSubtitle")}>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <FeatureCard title={t("f1Title")} description={t("f1Body")} />
          <FeatureCard title={t("f2Title")} description={t("f2Body")} />
          <FeatureCard title={t("f3Title")} description={t("f3Body")} />
          <FeatureCard title={t("f4Title")} description={t("f4Body")} />
          <FeatureCard title={t("f5Title")} description={t("f5Body")} />
          <FeatureCard title={t("f6Title")} description={t("f6Body")} />
        </div>
      </Section>

      <section className="border-t border-border bg-background py-12 md:py-14">
        <div className="mx-auto max-w-2xl px-4 text-sm leading-relaxed text-muted sm:px-6 lg:px-8">
          <p>
            {t("seoTeaser")}{" "}
            <Link
              href="/#seo-principles"
              className="font-medium text-accent underline-offset-4 hover:underline"
            >
              {t("seoTeaserCta")}
            </Link>
          </p>
        </div>
      </section>

      <section className="border-t border-border bg-card py-16 md:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-semibold text-foreground">
            {t("ctaTitle")}
          </h2>
          <p className="mt-3 max-w-2xl text-muted">{t("ctaBody")}</p>
          <div className="mt-8 flex flex-wrap gap-4">
            <Link href="/ablauf" className={buttonClassName("primary", "min-h-11 px-5")}>
              {t("ctaPrimary")}
            </Link>
            <Link
              href="/hosting"
              className={buttonClassName("secondary", "min-h-11 px-5")}
            >
              {t("ctaSecondary")}
            </Link>
            {!session?.user ? (
              <Link href="/login" className={buttonClassName("secondary", "min-h-11 px-5")}>
                {t("ctaGoogle")}
              </Link>
            ) : null}
          </div>
        </div>
      </section>
    </>
  );
}
