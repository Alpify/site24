import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { buildPageMetadata } from "@/lib/build-page-metadata";
import { buttonClassName } from "@/components/ui/button";
import { siteConfig } from "@/lib/site-config";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "metadata.hosting" });
  return buildPageMetadata({
    locale,
    pathname: "/hosting",
    title: t("title"),
    description: t("description"),
  });
}

export default async function HostingPage() {
  const t = await getTranslations("hostingPage");

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
          <p className="max-w-3xl text-lg leading-relaxed text-muted">
            {t("intro")}
          </p>

          <div className="mt-12 grid gap-10 lg:grid-cols-2">
            <div className="rounded-2xl border border-border bg-card p-8 shadow-sm">
              <p className="text-sm font-medium uppercase tracking-wide text-accent">
                {t("partnerLabel")}
              </p>
              <p className="mt-2 text-2xl font-semibold text-foreground">
                {siteConfig.partnerHosting.name}
              </p>
              <p className="mt-3 text-sm text-muted">{t("partnerNote")}</p>
              <a
                href={siteConfig.partnerHosting.url}
                target="_blank"
                rel="noopener noreferrer"
                className={`${buttonClassName("primary", "mt-6")} w-full sm:w-auto`}
              >
                {t("openPartner")}
              </a>
            </div>

            <div className="rounded-2xl border border-border bg-card p-8 shadow-sm">
              <h2 className="text-lg font-semibold text-foreground">
                {t("checklistTitle")}
              </h2>
              <ul className="mt-4 space-y-3 text-sm text-muted">
                <li className="flex gap-2">
                  <span className="text-accent" aria-hidden>
                    ✓
                  </span>
                  {t("c1")}
                </li>
                <li className="flex gap-2">
                  <span className="text-accent" aria-hidden>
                    ✓
                  </span>
                  {t("c2")}
                </li>
                <li className="flex gap-2">
                  <span className="text-accent" aria-hidden>
                    ✓
                  </span>
                  {t("c3")}
                </li>
                <li className="flex gap-2">
                  <span className="text-accent" aria-hidden>
                    ✓
                  </span>
                  {t("c4")}
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-12">
            <Link href="/" className={buttonClassName("secondary", "px-5")}>
              {t("backCta")}
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
