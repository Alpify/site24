import { and, count, eq } from "drizzle-orm";
import { notFound, redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { auth } from "@/auth";
import { WorkflowHostingPanel } from "@/components/workflow-hosting-panel";
import { Link } from "@/i18n/routing";
import { buttonClassName } from "@/components/ui/button";
import { siteConfig } from "@/lib/site-config";
import { getDb } from "@/lib/db";
import { drafts, projects } from "@/lib/db/schema";
import { BRIEF_QUESTIONS, parseBriefPayload } from "@/lib/workflow/brief-questions";
import { getLayoutProposalDef, parseLayoutPayload } from "@/lib/workflow/layout-proposals";
import {
  HOSTING_CHECK_IDS,
  type HostingCheckId,
} from "@/lib/workflow/hosting-checklist";

export default async function WorkflowHostingPage({
  params,
}: {
  params: Promise<{ locale: string; projectId: string }>;
}) {
  const { locale, projectId } = await params;
  const session = await auth();
  if (!session?.user?.id) {
    redirect(`/${locale}/login`);
  }

  const [project] = await getDb()
    .select()
    .from(projects)
    .where(and(eq(projects.id, projectId), eq(projects.userId, session.user.id)))
    .limit(1);

  if (!project) {
    notFound();
  }

  const [countRow] = await getDb()
    .select({ c: count() })
    .from(drafts)
    .where(eq(drafts.projectId, projectId));

  const draftCount = countRow?.c ?? 0;
  const t = await getTranslations("workflow");
  const brief = parseBriefPayload(project.workflowBriefJson);
  const layout = parseLayoutPayload(project.workflowBuilderJson);

  const hostingItems = Object.fromEntries(
    HOSTING_CHECK_IDS.map((id) => [id, t(`hosting.checklist.${id}`)]),
  ) as Record<HostingCheckId, string>;

  return (
    <div className="mt-8 space-y-8">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-muted">{t("hosting.kicker")}</p>
        <h2 className="mt-2 text-lg font-semibold text-foreground sm:text-xl">{t("hosting.title")}</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted">{t("hosting.lead")}</p>
      </div>

      <dl className="divide-y divide-border rounded-xl border border-border bg-background/40 text-sm">
        <div className="grid gap-2 px-4 py-3 sm:grid-cols-3">
          <dt className="font-medium text-muted">{t("hosting.briefLabel")}</dt>
          <dd className="sm:col-span-2 space-y-2 text-foreground">
            {brief ? (
              <ul className="space-y-1.5">
                {brief.answers.map((a) => {
                  const labels = a.optionIds.map((oid) => {
                    const q = BRIEF_QUESTIONS.find((x) => x.id === a.id);
                    const opt = q?.options.find((o) => o.id === oid);
                    return t(`brief.options.${a.id}.${opt?.i18nKey ?? oid}`);
                  });
                  return (
                    <li key={a.id} className="text-sm">
                      <span className="text-muted">{t(`brief.questions.${a.id}`)}</span>
                      {": "}
                      <span className="font-medium">
                        {labels.join(", ")}
                        {a.customText ? ` — ${a.customText}` : ""}
                      </span>
                    </li>
                  );
                })}
              </ul>
            ) : (
              t("hosting.empty")
            )}
            {project.workflowGoals?.trim() ? (
              <p className="whitespace-pre-wrap text-muted">{project.workflowGoals}</p>
            ) : null}
          </dd>
        </div>
        <div className="grid gap-1 px-4 py-3 sm:grid-cols-3">
          <dt className="font-medium text-muted">{t("hosting.layoutLabel")}</dt>
          <dd className="sm:col-span-2 text-foreground">
            {layout ? (
              t(`layout.proposals.${getLayoutProposalDef(layout.proposalId)?.i18nKey ?? "focusLanding"}.title`)
            ) : (
              t("hosting.empty")
            )}
          </dd>
        </div>
        <div className="grid gap-1 px-4 py-3 sm:grid-cols-3">
          <dt className="font-medium text-muted">{t("hosting.polishLabel")}</dt>
          <dd className="sm:col-span-2 text-foreground">
            {t("hosting.draftCount", { count: draftCount })}
          </dd>
        </div>
      </dl>

      <WorkflowHostingPanel
        locale={locale}
        projectId={projectId}
        initialJson={project.workflowStructure}
        copy={{
          checklistTitle: t("hosting.checklistTitle"),
          save: t("hosting.saveChecklist"),
          pendingSave: t("hosting.pendingSave"),
          items: hostingItems,
        }}
      />

      <div className="rounded-2xl border border-border/80 bg-card/60 p-5">
        <h3 className="text-base font-semibold text-foreground">{t("hosting.partnerTitle")}</h3>
        <p className="mt-2 text-sm text-muted">{t("hosting.partnerLead")}</p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link href={`/app/${projectId}/preview`} className={buttonClassName("primary", "min-h-11 px-5")}>
            {t("hosting.openPreview")}
          </Link>
          <a
            href={`/api/projects/${projectId}/export`}
            className={buttonClassName("secondary", "min-h-11 inline-flex items-center px-5")}
          >
            {t("hosting.downloadHtml")}
          </a>
          <Link href="/hosting" className={buttonClassName("ghost", "min-h-11 px-5")}>
            {t("hosting.partnerLink")}
          </Link>
          <a
            href={siteConfig.partnerHosting.url}
            target="_blank"
            rel="noopener noreferrer"
            className={buttonClassName("ghost", "min-h-11 px-5")}
          >
            {siteConfig.partnerHosting.name}
          </a>
        </div>
      </div>
    </div>
  );
}
