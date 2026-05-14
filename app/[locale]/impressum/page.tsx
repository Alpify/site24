import { getTranslations } from "next-intl/server";
import { buildPageMetadata } from "@/lib/build-page-metadata";
import { siteConfig } from "@/lib/site-config";

const IMPRINT_BLOCKS = ["b1", "b2", "b3", "b4", "b5"] as const;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "metadata.imprint" });
  return buildPageMetadata({
    locale,
    pathname: "/impressum",
    title: t("title"),
    description: t("description"),
  });
}

export default async function ImprintPage() {
  const t = await getTranslations("imprintPage");

  return (
    <article className="py-14 md:py-20">
      <div className="mx-auto max-w-3xl px-[max(1rem,env(safe-area-inset-left))] sm:px-6 lg:px-8 lg:pr-[max(1rem,env(safe-area-inset-right))]">
        <h1 className="text-[clamp(1.75rem,4vw,2.5rem)] font-semibold tracking-tight text-foreground">
          {t("title")}
        </h1>
        <p className="mt-5 rounded-xl border border-border bg-background p-4 text-sm leading-relaxed text-muted">
          {t("statusBanner")}
        </p>
        <div className="mt-10 space-y-8 text-sm leading-relaxed text-muted">
          <div>
            <p className="font-semibold text-foreground">{t("company")}</p>
            <p className="mt-2">{t("address")}</p>
            <p className="mt-3">
              {t("emailLabel")}{" "}
              <a
                href={`mailto:${siteConfig.contactEmail}`}
                className="font-medium text-accent underline-offset-4 hover:underline"
              >
                {siteConfig.contactEmail}
              </a>
            </p>
            <p className="mt-3">{t("representative")}</p>
          </div>
          {IMPRINT_BLOCKS.map((id) => (
            <section key={id}>
              <h2 className="text-base font-semibold text-foreground">
                {t(`${id}Title`)}
              </h2>
              <p className="mt-3 whitespace-pre-line">{t(`${id}Body`)}</p>
            </section>
          ))}
        </div>
      </div>
    </article>
  );
}
