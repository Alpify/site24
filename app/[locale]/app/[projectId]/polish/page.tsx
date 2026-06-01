import { and, desc, eq } from "drizzle-orm";
import { notFound, redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { auth } from "@/auth";
import { ApplyTemplateButton, ExpandDraftAiButton } from "@/components/project-content-actions";
import { buttonClassName } from "@/components/ui/button";
import { createDraft, deleteDraft } from "@/lib/projects/actions";
import { getDb } from "@/lib/db";
import { drafts, projects } from "@/lib/db/schema";
import { SITE_TEMPLATE_CATALOG } from "@/lib/templates/catalog";

const MAX_DRAFTS_PER_PROJECT = 12;

export default async function WorkflowPolishPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; projectId: string }>;
  searchParams: Promise<{ aiError?: string; draftLimit?: string }>;
}) {
  const { locale, projectId } = await params;
  const sp = await searchParams;
  const session = await auth();
  if (!session?.user?.id) {
    redirect(`/${locale}/login`);
  }

  const t = await getTranslations("projectPage");
  const tw = await getTranslations("workflow");

  const [project] = await getDb()
    .select()
    .from(projects)
    .where(and(eq(projects.id, projectId), eq(projects.userId, session.user.id)))
    .limit(1);

  if (!project) {
    notFound();
  }

  const draftRows = await getDb()
    .select()
    .from(drafts)
    .where(eq(drafts.projectId, projectId))
    .orderBy(desc(drafts.updatedAt), desc(drafts.createdAt));

  const dateFmt = new Intl.DateTimeFormat(locale === "de" ? "de-DE" : "en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  const draftCount = draftRows.length;
  const atDraftCap = draftCount >= MAX_DRAFTS_PER_PROJECT;
  const aiEnabled = Boolean(process.env.OPENROUTER_API_KEY);

  return (
    <div className="mx-auto mt-6 max-w-3xl space-y-10 lg:mt-8">
      <header className="space-y-2 border-b border-border/70 pb-8">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted">{tw("polish.kicker")}</p>
        <h2 className="text-xl font-semibold tracking-tight text-foreground md:text-2xl">
          {tw("polish.pageTitle")}
        </h2>
        <p className="max-w-2xl text-sm leading-relaxed text-muted">{tw("polish.pageLead")}</p>
        <p className="text-xs text-muted">
          {t("draftCountLabel", { count: draftCount, max: MAX_DRAFTS_PER_PROJECT })}
        </p>
        {!aiEnabled && process.env.NODE_ENV === "development" ? (
          <p className="text-xs leading-relaxed text-muted">{t("aiSetupHint")}</p>
        ) : null}
        {sp.draftLimit === "1" ? (
          <p
            role="alert"
            className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm text-amber-950 dark:text-amber-100"
          >
            {t("draftLimitAlert")}
          </p>
        ) : null}
        {sp.aiError === "api" ? (
          <p
            role="alert"
            className="rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-800 dark:text-red-200"
          >
            {t("aiErrorApi")}
          </p>
        ) : null}
        {sp.aiError === "config" ? (
          <p
            role="alert"
            className="rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-800 dark:text-red-200"
          >
            {t("aiErrorConfig")}
          </p>
        ) : null}
        {sp.aiError === "state" ? (
          <p
            role="alert"
            className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm text-amber-950 dark:text-amber-100"
          >
            {t("aiErrorState")}
          </p>
        ) : null}
      </header>

      <section aria-labelledby="drafts-heading" className="space-y-3">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <h3 id="drafts-heading" className="text-base font-semibold text-foreground">
              {t("sectionDraftsTitle")}
            </h3>
            <p className="mt-0.5 text-sm text-muted">{t("sectionDraftsLeadShort")}</p>
          </div>
        </div>
        {draftRows.length === 0 ? (
          <p className="rounded-lg border border-dashed border-border/80 bg-muted/10 px-4 py-8 text-center text-sm text-muted">
            {t("draftEmpty")}
          </p>
        ) : (
          <ul className="divide-y divide-border/80 rounded-xl border border-border/80 bg-card/40">
            {draftRows.map((d) => (
              <li key={d.id} className="px-4 py-4 sm:px-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                  <div className="min-w-0 flex-1 space-y-1.5">
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <h4 className="text-[15px] font-medium text-foreground">{d.title}</h4>
                      <time className="shrink-0 text-xs tabular-nums text-muted" dateTime={d.updatedAt.toISOString()}>
                        {dateFmt.format(d.updatedAt)}
                      </time>
                    </div>
                    {d.body ? (
                      <p className="line-clamp-3 whitespace-pre-wrap text-sm leading-relaxed text-muted">{d.body}</p>
                    ) : (
                      <p className="text-sm italic text-muted">{t("draftNoBodyYet")}</p>
                    )}
                  </div>
                  <div className="flex shrink-0 flex-wrap items-center gap-2 sm:flex-col sm:items-stretch">
                    <ExpandDraftAiButton
                      locale={locale}
                      projectId={projectId}
                      draftId={d.id}
                      label={t("draftSuggestButton")}
                      pendingLabel={t("actionPending")}
                      className={buttonClassName("secondary", "min-h-9 w-full px-3 py-2 text-xs sm:w-auto sm:min-h-10 sm:px-4 sm:text-sm")}
                    />
                    <form action={deleteDraft} className="inline-block w-full sm:w-auto">
                      <input type="hidden" name="locale" value={locale} />
                      <input type="hidden" name="projectId" value={projectId} />
                      <input type="hidden" name="draftId" value={d.id} />
                      <button
                        type="submit"
                        className={buttonClassName(
                          "ghost",
                          "min-h-9 w-full px-3 py-2 text-xs text-muted hover:text-red-600 sm:w-auto sm:text-sm",
                        )}
                      >
                        {t("deleteDraftSubmit")}
                      </button>
                    </form>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section
        aria-labelledby="new-draft-heading"
        className="rounded-2xl border border-border/70 bg-card/50 p-5 shadow-sm sm:p-6"
      >
        <h3 id="new-draft-heading" className="text-base font-semibold text-foreground">
          {t("sectionNewTitle")}
        </h3>
        <p className="mt-1 text-sm text-muted">{t("sectionNewLeadShort")}</p>
        <form
          method="post"
          action={createDraft.bind(null, locale, projectId)}
          className="mt-5 flex max-w-xl flex-col gap-4"
        >
          <div>
            <label htmlFor="draft-title" className="text-sm font-medium text-foreground">
              {t("draftTitleLabel")}
            </label>
            <input
              id="draft-title"
              name="title"
              type="text"
              required
              maxLength={200}
              autoComplete="off"
              disabled={atDraftCap}
              placeholder={t("draftTitlePlaceholder")}
              className="mt-2 w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none ring-ring placeholder:text-muted/70 focus-visible:ring-2 disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>
          <div>
            <label htmlFor="draft-body" className="text-sm font-medium text-foreground">
              {t("draftBodyLabel")}
            </label>
            <textarea
              id="draft-body"
              name="body"
              rows={4}
              maxLength={50000}
              disabled={atDraftCap}
              placeholder={t("draftBodyPlaceholder")}
              className="mt-2 w-full resize-y rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none ring-ring placeholder:text-muted/70 focus-visible:ring-2 disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>
          <button
            type="submit"
            disabled={atDraftCap}
            className={buttonClassName("primary", "min-h-11 self-start px-6 disabled:pointer-events-none disabled:opacity-50")}
          >
            {t("draftCreateSubmit")}
          </button>
        </form>
      </section>

      <details className="group rounded-2xl border border-border/70 bg-muted/5 p-1 open:bg-card/60">
        <summary className="cursor-pointer list-none rounded-xl px-4 py-3 text-sm font-medium text-foreground marker:content-none [&::-webkit-details-marker]:hidden">
          <span className="flex items-center justify-between gap-2">
            <span>{tw("templates.openCatalog")}</span>
            <span className="text-xs font-normal text-muted group-open:rotate-0">▾</span>
          </span>
          <span className="mt-1 block text-xs font-normal text-muted">{tw("templates.catalogHint")}</span>
        </summary>
        <div className="border-t border-border/60 px-3 pb-4 pt-3 sm:px-4">
          <h3 className="text-base font-semibold text-foreground">{tw("templates.heading")}</h3>
          <p className="mt-1 text-sm text-muted">{tw("templates.lead")}</p>
          <ul className="mt-4 space-y-2">
            {SITE_TEMPLATE_CATALOG.map((tpl) => (
              <li
                key={tpl.id}
                className="flex flex-col gap-3 rounded-lg border border-border/60 bg-background/80 p-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground">{tw(`templates.${tpl.i18nKey}.title`)}</p>
                  <p className="mt-0.5 text-xs text-muted sm:text-sm">{tw(`templates.${tpl.i18nKey}.description`)}</p>
                </div>
                <ApplyTemplateButton
                  locale={locale}
                  projectId={projectId}
                  templateId={tpl.id}
                  label={tw("templates.apply")}
                  pendingLabel={t("actionPending")}
                  className={buttonClassName("secondary", "min-h-9 shrink-0 px-3 text-xs sm:min-h-10 sm:px-4 sm:text-sm")}
                />
              </li>
            ))}
          </ul>
        </div>
      </details>
    </div>
  );
}
