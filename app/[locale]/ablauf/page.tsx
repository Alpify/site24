import { getTranslations } from "next-intl/server";
import { buildPageMetadata } from "@/lib/build-page-metadata";
import { StepTimeline } from "@/components/step-timeline";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "metadata.workflow" });
  return buildPageMetadata({
    locale,
    pathname: "/ablauf",
    title: t("title"),
    description: t("description"),
  });
}

export default async function WorkflowPage() {
  const t = await getTranslations("workflowPage");

  const steps = [
    { title: t("steps.s1Title"), description: t("steps.s1Body") },
    { title: t("steps.s2Title"), description: t("steps.s2Body") },
    { title: t("steps.s3Title"), description: t("steps.s3Body") },
    { title: t("steps.s4Title"), description: t("steps.s4Body") },
    { title: t("steps.s5Title"), description: t("steps.s5Body") },
  ];

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
          <div className="max-w-3xl">
            <StepTimeline steps={steps} />
          </div>
        </div>
      </section>

      <section className="border-t border-border bg-card py-12 md:py-16">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-xl font-semibold text-foreground">
            {t("noteTitle")}
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-muted">
            {t("noteBody")}
          </p>
        </div>
      </section>
    </>
  );
}
