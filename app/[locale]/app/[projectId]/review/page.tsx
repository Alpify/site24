import { and, count, eq } from "drizzle-orm";
import { notFound, redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { auth } from "@/auth";
import { Link } from "@/i18n/routing";
import { buttonClassName } from "@/components/ui/button";
import { getDb } from "@/lib/db";
import { drafts, projects } from "@/lib/db/schema";
import type { BuilderAnswer } from "@/lib/workflow/builder-proposals";
import { getProposalDef, parseBuilderPayload } from "@/lib/workflow/builder-proposals";

export default async function WorkflowReviewPage({
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
  const builder = parseBuilderPayload(project.workflowBuilderJson);

  function choiceLabel(choice: BuilderAnswer["choice"]) {
    if (choice === "yes") {
      return t("builder.choiceYes");
    }
    if (choice === "no") {
      return t("builder.choiceNo");
    }
    return t("builder.choiceComment");
  }

  return (
    <div className="mt-8 space-y-6">
      <h2 className="text-lg font-semibold text-foreground">{t("review.title")}</h2>
      <p className="text-sm text-muted">{t("review.lead")}</p>
      <dl className="divide-y divide-border rounded-xl border border-border bg-background/40 text-sm">
        <div className="grid gap-1 px-4 py-3 sm:grid-cols-3">
          <dt className="font-medium text-muted">{t("review.goalsLabel")}</dt>
          <dd className="sm:col-span-2 whitespace-pre-wrap text-foreground">
            {project.workflowGoals?.trim() ? project.workflowGoals : t("review.empty")}
          </dd>
        </div>
        <div className="grid gap-1 px-4 py-3 sm:grid-cols-3">
          <dt className="font-medium text-muted">{t("review.builderLabel")}</dt>
          <dd className="sm:col-span-2 text-foreground">
            {builder ? (
              <div className="space-y-2 text-sm">
                <p className="font-medium text-foreground">
                  {t(`builder.proposals.${getProposalDef(builder.proposalId)?.i18nKey ?? "focusLanding"}.title`)}
                </p>
                <ul className="list-disc space-y-1 pl-4 text-muted">
                  {builder.answers.map((a) => (
                    <li key={a.id}>
                      <span className="text-foreground">{t(`builder.questions.${a.id}`)}</span>
                      {": "}
                      <span>{choiceLabel(a.choice)}</span>
                      {a.choice === "comment" && a.comment?.trim() ? (
                        <span className="mt-1 block whitespace-pre-wrap text-foreground">{a.comment}</span>
                      ) : null}
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              t("review.empty")
            )}
          </dd>
        </div>
        {project.workflowStructure?.trim() ? (
          <div className="grid gap-1 px-4 py-3 sm:grid-cols-3">
            <dt className="font-medium text-muted">{t("review.structureNotesLabel")}</dt>
            <dd className="sm:col-span-2 whitespace-pre-wrap text-foreground">{project.workflowStructure}</dd>
          </div>
        ) : null}
        <div className="grid gap-1 px-4 py-3 sm:grid-cols-3">
          <dt className="font-medium text-muted">{t("review.draftsLabel")}</dt>
          <dd className="sm:col-span-2 text-foreground">{t("review.draftCount", { count: draftCount })}</dd>
        </div>
      </dl>
      <div className="flex flex-wrap gap-3">
        <Link href={`/app/${projectId}/preview`} className={buttonClassName("primary", "min-h-11 px-5")}>
          {t("review.openPreview")}
        </Link>
        <a
          href={`/api/projects/${projectId}/export`}
          className={buttonClassName("secondary", "min-h-11 inline-flex items-center px-5")}
        >
          {t("review.downloadHtml")}
        </a>
      </div>
    </div>
  );
}
