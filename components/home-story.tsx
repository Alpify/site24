import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/routing";

export async function HomeStory() {
  const t = await getTranslations("home");

  return (
    <section className="border-b border-border bg-background py-16 md:py-24">
      <div className="mx-auto max-w-3xl px-[max(1rem,env(safe-area-inset-left))] sm:px-6 lg:px-8 lg:pr-[max(1.5rem,env(safe-area-inset-right))]">
        <h2 className="text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
          {t("storyTitle")}
        </h2>
        <div className="mt-6 space-y-4 text-base leading-relaxed text-muted">
          <p>{t("storyP1")}</p>
          <p>{t("storyP2")}</p>
          <p>{t("storyP3")}</p>
        </div>
        <p className="mt-8 flex flex-wrap gap-x-4 gap-y-2 text-sm">
          <Link
            href="/produkt"
            className="font-medium text-accent underline-offset-4 hover:underline"
          >
            {t("storyLinkProduct")}
          </Link>
          <span className="text-border" aria-hidden>
            ·
          </span>
          <Link
            href="/ablauf"
            className="font-medium text-accent underline-offset-4 hover:underline"
          >
            {t("storyLinkWorkflow")}
          </Link>
        </p>
      </div>
    </section>
  );
}
