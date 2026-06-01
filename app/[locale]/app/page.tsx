import { desc, eq, type InferSelectModel } from "drizzle-orm";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import NextLink from "next/link";

import { auth } from "@/auth";
import { Link } from "@/i18n/routing";
import { buildPageMetadata } from "@/lib/build-page-metadata";
import { buttonClassName } from "@/components/ui/button";
import { createProject } from "@/lib/projects/actions";
import { getDb } from "@/lib/db";
import { projects } from "@/lib/db/schema";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "metadata.app" });
  return {
    ...buildPageMetadata({
      locale,
      pathname: "/app",
      title: t("title"),
      description: t("description"),
    }),
    robots: { index: false, follow: false },
  };
}

export default async function AppProjectsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ limit?: string }>;
}) {
  const { locale } = await params;
  const sp = await searchParams;
  const session = await auth();
  if (!session?.user?.id) {
    redirect(`/${locale}/login`);
  }

  const t = await getTranslations("appPage");
  let rows: InferSelectModel<typeof projects>[] = [];
  try {
    rows = await getDb()
      .select()
      .from(projects)
      .where(eq(projects.userId, session.user.id))
      .orderBy(desc(projects.createdAt));
  } catch {
    return (
      <section className="border-b border-border bg-card py-16">
        <div className="mx-auto max-w-2xl px-[max(1rem,env(safe-area-inset-left))] sm:px-6 lg:pr-[max(1rem,env(safe-area-inset-right))]">
          <h1 className="text-2xl font-semibold text-foreground">{t("dbErrorTitle")}</h1>
          <p className="mt-3 text-sm text-muted">{t("dbErrorBody")}</p>
          <Link href="/" className={`${buttonClassName("secondary", "mt-8")} inline-flex`}>
            {t("backHome")}
          </Link>
        </div>
      </section>
    );
  }

  const dateFmt = new Intl.DateTimeFormat(locale === "de" ? "de-DE" : "en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  const hasProject = rows.length > 0;
  const primary = rows[0];
  const showMultiHint = rows.length > 1;

  return (
    <section className="border-b border-border bg-card py-12 md:py-16">
      <div className="mx-auto max-w-2xl px-[max(1rem,env(safe-area-inset-left))] sm:px-6 lg:pr-[max(1rem,env(safe-area-inset-right))]">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
          {t("title")}
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-muted">{t("lead")}</p>

        {sp.limit === "1" ? (
          <p
            role="alert"
            className="mt-6 rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-950 dark:text-amber-100"
          >
            {t("limitAlert")}
          </p>
        ) : null}

        {!hasProject ? (
          <>
            <form
              id="neues-projekt"
              method="post"
              action={createProject.bind(null, locale)}
              className="mt-10 space-y-5 rounded-2xl border border-border/80 bg-card p-6 shadow-sm sm:p-7"
            >
              <div>
                <label htmlFor="project-name" className="text-sm font-medium text-foreground">
                  {t("nameLabel")}
                </label>
                <input
                  id="project-name"
                  name="name"
                  type="text"
                  required
                  maxLength={120}
                  autoComplete="off"
                  placeholder={t("namePlaceholder")}
                  className="mt-2 w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none ring-ring placeholder:text-muted/70 focus-visible:ring-2"
                />
              </div>
              <div>
                <label htmlFor="project-idea" className="text-sm font-medium text-foreground">
                  {t("ideaLabel")}
                </label>
                <textarea
                  id="project-idea"
                  name="idea"
                  rows={5}
                  maxLength={20000}
                  placeholder={t("ideaPlaceholder")}
                  className="mt-2 w-full resize-y rounded-lg border border-border bg-background px-3 py-2.5 text-sm leading-relaxed text-foreground outline-none ring-ring placeholder:text-muted/70 focus-visible:ring-2"
                />
              </div>
              <button type="submit" className={buttonClassName("primary", "min-h-11 w-full px-5 sm:w-auto")}>
                {t("createSubmit")}
              </button>
            </form>
          </>
        ) : rows.length === 1 ? (
          <div className="mt-10 rounded-2xl border border-border/80 bg-gradient-to-br from-card to-background/60 p-6 shadow-sm ring-1 ring-border/40">
            <h2 className="text-base font-semibold text-foreground">{t("soloTitle")}</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted">{t("soloSubtitle")}</p>
            <p className="mt-4 text-lg font-medium text-foreground">{primary.name}</p>
            <p className="mt-1 text-xs text-muted">{dateFmt.format(primary.createdAt)}</p>
            <NextLink
              href={`/${locale}/app/${primary.id}`}
              className={`${buttonClassName("primary", "mt-6 inline-flex min-h-11 px-6")}`}
            >
              {t("soloCta")}
            </NextLink>
          </div>
        ) : (
          <>
            {showMultiHint ? (
              <p className="mt-6 rounded-xl border border-border bg-background/80 px-4 py-3 text-sm text-muted">
                {t("multiLegacyHint")}
              </p>
            ) : null}
            <h2
              id="projektliste"
              className="mt-10 scroll-mt-24 text-sm font-semibold uppercase tracking-wide text-muted"
            >
              {t("listHeading")}
            </h2>
            <ul className="mt-4 divide-y divide-border rounded-xl border border-border bg-background/40">
              {rows.map((p) => (
                <li key={p.id}>
                  <NextLink
                    href={`/${locale}/app/${p.id}`}
                    aria-label={t("openProjectAria", { name: p.name })}
                    className="flex flex-row items-center justify-between gap-3 px-4 py-3 transition-colors hover:bg-background/80"
                  >
                    <span className="min-w-0 flex-1 font-medium text-foreground">{p.name}</span>
                    <div className="flex shrink-0 items-center gap-3">
                      <time className="text-xs text-muted" dateTime={p.createdAt.toISOString()}>
                        {dateFmt.format(p.createdAt)}
                      </time>
                      <span className="text-xs font-medium text-accent">{t("openLabel")}</span>
                    </div>
                  </NextLink>
                </li>
              ))}
            </ul>
          </>
        )}

        <div className="mt-8">
          <Link href="/" className={`${buttonClassName("ghost", "")} text-sm`}>
            {t("backHome")}
          </Link>
        </div>
      </div>
    </section>
  );
}
