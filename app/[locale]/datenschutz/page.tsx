import { getTranslations } from "next-intl/server";
import { buildPageMetadata } from "@/lib/build-page-metadata";

const PRIVACY_SECTIONS = [
  "s1",
  "s2",
  "s3",
  "s4",
  "s5",
  "s6",
  "s7",
  "s8",
  "s9",
  "s10",
] as const;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "metadata.privacy" });
  return buildPageMetadata({
    locale,
    pathname: "/datenschutz",
    title: t("title"),
    description: t("description"),
  });
}

export default async function PrivacyPage() {
  const t = await getTranslations("privacyPage");

  return (
    <article className="py-14 md:py-20">
      <div className="mx-auto max-w-3xl px-[max(1rem,env(safe-area-inset-left))] sm:px-6 lg:px-8 lg:pr-[max(1rem,env(safe-area-inset-right))]">
        <h1 className="text-[clamp(1.75rem,4vw,2.5rem)] font-semibold tracking-tight text-foreground">
          {t("title")}
        </h1>
        <p className="mt-5 rounded-xl border border-border bg-background p-4 text-sm leading-relaxed text-muted">
          {t("statusBanner")}
        </p>
        <p className="mt-6 text-sm leading-relaxed text-muted">{t("lead")}</p>
        <div className="mt-12 space-y-10 text-sm leading-relaxed text-muted">
          {PRIVACY_SECTIONS.map((id) => (
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
