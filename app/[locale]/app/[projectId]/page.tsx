import { and, desc, eq, type InferSelectModel } from "drizzle-orm";
import { notFound, redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { auth } from "@/auth";
import { Link } from "@/i18n/routing";
import { buildPageMetadata } from "@/lib/build-page-metadata";
import { buttonClassName } from "@/components/ui/button";
import { createDraft, expandDraftWithAi } from "@/lib/projects/actions";
import { getDb } from "@/lib/db";
import { drafts, projects } from "@/lib/db/schema";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; projectId: string }>;
}) {
  const { locale, projectId } = await params;
  const t = await getTranslations({ locale, namespace: "metadata.project" });
  const session = await auth();
  let title = t("titleFallback");
  if (session?.user?.id) {
    try {
      const [project] = await getDb()
        .select({ name: projects.name })
        .from(projects)
        .where(and(eq(projects.id, projectId), eq(projects.userId, session.user.id)))
        .limit(1);
      if (project) {
        title = t("titleWithName", { name: project.name });
      }
    } catch {
      // keep titleFallback
    }
  }
  return {
    ...buildPageMetadata({
      locale,
      pathname: `/app/${projectId}`,
      title,
      description: t("description"),
    }),
    robots: { index: false, follow: false },
  };
}

function DbError({
  title,
  body,
  backLabel,
}: {
  title: string;
  body: string;
  backLabel: string;
}) {
  return (
    <section className="border-b border-border bg-card py-16">
      <div className="mx-auto max-w-2xl px-[max(1rem,env(safe-area-inset-left))] sm:px-6 lg:pr-[max(1rem,env(safe-area-inset-right))]">
        <h1 className="text-2xl font-semibold text-foreground">{title}</h1>
        <p className="mt-3 text-sm text-muted">{body}</p>
        <Link href="/app" className={`${buttonClassName("secondary", "mt-8")} inline-flex`}>
          {backLabel}
        </Link>
      </div>
    </section>
  );
}

export default async function ProjectWorkspacePage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; projectId: string }>;
  searchParams: Promise<{ aiError?: string }>;
}) {
  const { locale, projectId } = await params;
  const sp = await searchParams;
  const session = await auth();
  if (!session?.user?.id) {
    redirect(`/${locale}/login`);
  }

  const t = await getTranslations("projectPage");

  let project: InferSelectModel<typeof projects> | undefined;
  try {
    const [row] = await getDb()
      .select()
      .from(projects)
      .where(and(eq(projects.id, projectId), eq(projects.userId, session.user.id)))
      .limit(1);
    project = row;
  } catch {
    return (
      <DbError
        title={t("dbErrorTitle")}
        body={t("dbErrorBody")}
        backLabel={t("backToProjects")}
      />
    );
  }

  if (!project) {
    notFound();
  }

  let draftRows: InferSelectModel<typeof drafts>[] = [];
  try {
    draftRows = await getDb()
      .select()
      .from(drafts)
      .where(eq(drafts.projectId, projectId))
      .orderBy(desc(drafts.createdAt));
  } catch {
    return (
      <DbError
        title={t("dbErrorTitle")}
        body={t("dbErrorBody")}
        backLabel={t("backToProjects")}
      />
    );
  }

  const dateFmt = new Intl.DateTimeFormat(locale === "de" ? "de-DE" : "en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  const aiEnabled = Boolean(process.env.OPENROUTER_API_KEY);

  return (
    <section className="border-b border-border bg-card py-12 md:py-16">
      <div className="mx-auto max-w-2xl px-[max(1rem,env(safe-area-inset-left))] sm:px-6 lg:pr-[max(1rem,env(safe-area-inset-right))]">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-baseline sm:justify-between">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
            {project.name}
          </h1>
          <Link
            href="/app"
            className="text-sm font-medium text-accent underline-offset-4 hover:underline"
          >
            {t("backToProjects")}
          </Link>
        </div>
        <p className="mt-3 text-sm leading-relaxed text-muted">{t("lead")}</p>
        {!aiEnabled ? (
          <p className="mt-2 text-xs leading-relaxed text-muted">{t("aiSetupHint")}</p>
        ) : null}
        {sp.aiError === "api" ? (
          <p
            role="alert"
            className="mt-4 rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-800 dark:text-red-200"
          >
            {t("aiErrorApi")}
          </p>
        ) : null}
        {sp.aiError === "config" ? (
          <p
            role="alert"
            className="mt-4 rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-800 dark:text-red-200"
          >
            {t("aiErrorConfig")}
          </p>
        ) : null}

        <h2 className="mt-10 text-sm font-semibold uppercase tracking-wide text-muted">
          {t("draftListHeading")}
        </h2>
        {draftRows.length === 0 ? (
          <p className="mt-3 text-sm text-muted">{t("draftEmpty")}</p>
        ) : (
          <ul className="mt-4 divide-y divide-border rounded-xl border border-border bg-background/40">
            {draftRows.map((d) => (
              <li key={d.id} className="px-4 py-3">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="font-medium text-foreground">{d.title}</div>
                    {d.body ? (
                      <p className="mt-1 line-clamp-3 whitespace-pre-wrap text-xs text-muted">
                        {d.body}
                      </p>
                    ) : null}
                    <time
                      className="mt-2 block text-xs text-muted"
                      dateTime={d.createdAt.toISOString()}
                    >
                      {dateFmt.format(d.createdAt)}
                    </time>
                  </div>
                  {aiEnabled ? (
                    <form
                      action={expandDraftWithAi.bind(null, locale, projectId, d.id)}
                      className="shrink-0"
                    >
                      <button
                        type="submit"
                        className={buttonClassName("secondary", "min-h-9 px-3 py-2 text-xs")}
                      >
                        {t("aiExpand")}
                      </button>
                    </form>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        )}

        <form
          action={createDraft.bind(null, locale, projectId)}
          className="mt-10 flex flex-col gap-4 rounded-xl border border-border bg-background/60 p-4"
        >
          <div>
            <label htmlFor="draft-title" className="text-xs font-medium text-muted">
              {t("draftTitleLabel")}
            </label>
            <input
              id="draft-title"
              name="title"
              type="text"
              required
              maxLength={200}
              autoComplete="off"
              placeholder={t("draftTitlePlaceholder")}
              className="mt-1.5 w-full rounded-lg border border-border bg-card px-3 py-2.5 text-sm text-foreground outline-none ring-ring placeholder:text-muted/70 focus-visible:ring-2"
            />
          </div>
          <div>
            <label htmlFor="draft-body" className="text-xs font-medium text-muted">
              {t("draftBodyLabel")}
            </label>
            <textarea
              id="draft-body"
              name="body"
              rows={4}
              maxLength={50000}
              placeholder={t("draftBodyPlaceholder")}
              className="mt-1.5 w-full resize-y rounded-lg border border-border bg-card px-3 py-2.5 text-sm text-foreground outline-none ring-ring placeholder:text-muted/70 focus-visible:ring-2"
            />
          </div>
          <button type="submit" className={buttonClassName("primary", "min-h-11 self-start px-5")}>
            {t("draftCreateSubmit")}
          </button>
        </form>
      </div>
    </section>
  );
}
