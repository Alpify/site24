import { getTranslations } from "next-intl/server";

import { auth } from "@/auth";
import { Link } from "@/i18n/routing";
import { buildPageMetadata } from "@/lib/build-page-metadata";
import { FeatureCard } from "@/components/feature-card";
import { HomeHero, type HeroStepCopy } from "@/components/home-hero";
import { HomeMetrics } from "@/components/home-metrics";
import { HomeSeoPrinciples } from "@/components/home-seo-principles";
import { HomeStory } from "@/components/home-story";
import { HomeTestimonials } from "@/components/home-testimonials";
import { JsonLdSite } from "@/components/json-ld-site";
import { Section } from "@/components/section";
import { siteConfig } from "@/lib/site-config";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "metadata.home" });
  const base = siteConfig.url.replace(/\/$/, "");
  return buildPageMetadata({
    locale,
    pathname: "/",
    title: t("title"),
    description: t("description"),
    ogImageAbsoluteUrl: siteConfig.siteHasOgImage
      ? `${base}/og.png`
      : undefined,
  });
}

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const session = await auth();
  const t = await getTranslations("home");
  const tMeta = await getTranslations({ locale, namespace: "metadata.home" });

  const stepIds = ["brief", "layout", "polish", "hosting"] as const;
  const steps: HeroStepCopy[] = stepIds.map((id) => ({
    id,
    title: t(`heroSteps.${id}.title`),
    teaser: t(`heroSteps.${id}.teaser`),
    items: [
      t(`heroSteps.${id}.item1`),
      t(`heroSteps.${id}.item2`),
      t(`heroSteps.${id}.item3`),
    ],
  }));

  return (
    <>
      <JsonLdSite locale={locale} description={tMeta("description")} />
      <HomeHero
        isLoggedIn={Boolean(session?.user)}
        copy={{
          eyebrow: t("eyebrow"),
          title: t("title"),
          subtitle: t("subtitle"),
          hint: t("hint"),
          ctaPrimary: session?.user ? t("heroCtaLogged") : t("heroCtaGuest"),
          ctaSecondary: t("heroSecondary"),
          stepsLabel: t("heroStepsLabel"),
          steps,
        }}
      />

      <HomeStory />

      <Section title={t("valueTitle")} subtitle={t("valueSubtitle")}>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
          <FeatureCard
            title={t("values.v1Title")}
            description={t("values.v1Body")}
            icon={<SparkIcon />}
          />
          <FeatureCard
            title={t("values.v2Title")}
            description={t("values.v2Body")}
            icon={<ListIcon />}
          />
          <FeatureCard
            title={t("values.v3Title")}
            description={t("values.v3Body")}
            icon={<PenIcon />}
          />
          <FeatureCard
            title={t("values.v4Title")}
            description={t("values.v4Body")}
            icon={<CloudIcon />}
          />
        </div>
      </Section>

      <HomeTestimonials />

      <HomeMetrics />

      <HomeSeoPrinciples />

      <section className="border-t border-border bg-card py-14 md:py-24">
        <div className="mx-auto max-w-6xl px-[max(1rem,env(safe-area-inset-left))] sm:px-6 lg:px-8 lg:pr-[max(1.5rem,env(safe-area-inset-right))]">
          <div className="max-w-xl">
            <h2 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl md:text-3xl">
              {t("proofTitle")}
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-muted sm:text-base">
              {t("proofBody")}
            </p>
            <p className="mt-4 text-sm">
              <Link href="/ablauf" className="font-medium text-accent underline-offset-4 hover:underline">
                {t("proofCta")}
              </Link>
            </p>
          </div>
        </div>
      </section>
    </>
  );
}

function SparkIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M12 8c-2 3-4 4-4 4s2 1 4 4 4 4 4 4-2-1-4-4-4-4-4-4z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ListIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function PenIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 20h9M16.5 3.5a2.12 2.12 0 013 3L7 19l-4 1 1-4L16.5 3.5z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CloudIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M7 18a4 4 0 01-.36-7.98 5 5 0 019.74-2A3.5 3.5 0 0117.5 18H7z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}
