import { getTranslations } from "next-intl/server";
import { HOME_METRIC_IDS } from "@/lib/content/home-extras";

export async function HomeMetrics() {
  const t = await getTranslations("home");

  return (
    <section className="border-b border-border bg-background py-16 md:py-24">
      <div className="mx-auto max-w-6xl px-[max(1rem,env(safe-area-inset-left))] sm:px-6 lg:px-8 lg:pr-[max(1.5rem,env(safe-area-inset-right))]">
        <h2 className="text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
          {t("metricsTitle")}
        </h2>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted">
          {t("metricsSubtitle")}
        </p>
        <dl className="mt-10 grid gap-4 sm:grid-cols-3">
          {HOME_METRIC_IDS.map((id) => (
            <div
              key={id}
              className="rounded-2xl border border-border bg-card p-6 text-center shadow-sm"
            >
              <dt className="text-xs font-semibold uppercase tracking-wide text-muted">
                {t(`${id}Label`)}
              </dt>
              <dd className="mt-2 text-2xl font-semibold tabular-nums text-accent md:text-3xl">
                {t(`${id}Value`)}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
