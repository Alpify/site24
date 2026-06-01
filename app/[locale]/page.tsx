import { getTranslations } from "next-intl/server";

import { auth } from "@/auth";
import { Link } from "@/i18n/routing";
import { buildPageMetadata } from "@/lib/build-page-metadata";
import { FeatureCard } from "@/components/feature-card";
import { HomeMetrics } from "@/components/home-metrics";
import { HomeSeoPrinciples } from "@/components/home-seo-principles";
import { HomeStory } from "@/components/home-story";
import { HomeTestimonials } from "@/components/home-testimonials";
import { JsonLdSite } from "@/components/json-ld-site";
import { Section } from "@/components/section";
import { buttonClassName } from "@/components/ui/button";
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

  return (
    <>
      <JsonLdSite locale={locale} description={tMeta("description")} />
      <section className="hero-surface border-b border-border">
        <div className="relative mx-auto max-w-6xl px-[max(1rem,env(safe-area-inset-left))] py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-28 lg:pr-[max(1.5rem,env(safe-area-inset-right))]">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent sm:text-sm">
              {t("eyebrow")}
            </p>
            <h1 className="mt-3 text-[clamp(1.75rem,5vw,3.25rem)] font-semibold leading-[1.12] tracking-tight text-foreground">
              {t("title")}
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-relaxed text-muted sm:text-lg">
              {t("subtitle")}
            </p>
            <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted">
              {t("disclaimer")}
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-4">
              <Link
                href={session?.user ? "/app" : "/login"}
                className={buttonClassName(
                  "primary",
                  "inline-flex min-h-12 w-full min-w-[10.5rem] justify-center px-8 py-3.5 text-base shadow-md sm:w-auto",
                )}
              >
                {session?.user ? t("heroSingleLogged") : t("heroSingleGuest")}
              </Link>
              <Link
                href="/produkt"
                className={buttonClassName(
                  "secondary",
                  "inline-flex min-h-12 w-full min-w-[10.5rem] justify-center px-8 py-3.5 text-base sm:w-auto",
                )}
              >
                {t("heroSecondary")}
              </Link>
              <p className="w-full max-w-xl text-sm leading-relaxed text-muted sm:basis-full">
                <Link href="/ablauf" className="font-medium text-foreground underline-offset-4 hover:underline">
                  {t("storyLinkWorkflow")}
                </Link>
                <span className="mx-2 text-border">·</span>
                <span className="text-muted">
                  {t("priceFunnelBefore")}
                  <Link href="/preise" className="font-medium text-foreground underline-offset-4 hover:underline">
                    {t("priceFunnelLink")}
                  </Link>
                  {t("priceFunnelAfter")}
                </span>
              </p>
            </div>
          </div>
          <dl className="mt-14 grid gap-4 sm:grid-cols-3 sm:gap-5">
            <div className="rounded-xl border border-border/80 bg-background/60 p-4 backdrop-blur-sm sm:p-5">
              <dt className="text-xs font-semibold uppercase tracking-wide text-muted">
                {t("stats.templates")}
              </dt>
              <dd className="mt-2 text-sm leading-relaxed text-foreground">
                {t("stats.templatesValue")}
              </dd>
            </div>
            <div className="rounded-xl border border-border/80 bg-background/60 p-4 backdrop-blur-sm sm:p-5">
              <dt className="text-xs font-semibold uppercase tracking-wide text-muted">
                {t("stats.nocode")}
              </dt>
              <dd className="mt-2 text-sm leading-relaxed text-foreground">
                {t("stats.nocodeValue")}
              </dd>
            </div>
            <div className="rounded-xl border border-border/80 bg-background/60 p-4 backdrop-blur-sm sm:p-5">
              <dt className="text-xs font-semibold uppercase tracking-wide text-muted">
                {t("stats.hosting")}
              </dt>
              <dd className="mt-2 text-sm leading-relaxed text-foreground">
                {t("stats.hostingValue")}
              </dd>
            </div>
          </dl>
        </div>
      </section>

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
