import { and, desc, eq } from "drizzle-orm";
import { notFound, redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { auth } from "@/auth";
import { getDb } from "@/lib/db";
import { drafts, projects } from "@/lib/db/schema";
import { getProposalDef, parseBuilderPayload } from "@/lib/workflow/builder-proposals";

export default async function ProjectPreviewPage({
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

  const draftRows = await getDb()
    .select()
    .from(drafts)
    .where(eq(drafts.projectId, projectId))
    .orderBy(desc(drafts.createdAt));

  const t = await getTranslations("workflow");
  const builder = parseBuilderPayload(project.workflowBuilderJson);
  const proposalDef = builder ? getProposalDef(builder.proposalId) : undefined;

  return (
    <div className="mt-8 rounded-xl border border-border bg-background/80 p-6 shadow-sm">
      <p className="text-xs font-medium uppercase tracking-wide text-muted">{t("preview.badge")}</p>
      <article lang={locale} className="prose prose-neutral mt-4 max-w-none dark:prose-invert">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">{project.name}</h1>
        {project.workflowGoals ? (
          <section className="mt-8">
            <h2 className="text-lg font-semibold text-foreground">{t("preview.goalsHeading")}</h2>
            <pre className="mt-2 whitespace-pre-wrap rounded-lg border border-border bg-card p-4 text-sm text-muted">
              {project.workflowGoals}
            </pre>
          </section>
        ) : null}
        {builder && proposalDef ? (
          <section className="mt-8">
            <h2 className="text-lg font-semibold text-foreground">{t("preview.builderHeading")}</h2>
            <p className="mt-2 text-sm font-medium text-foreground">
              {t(`builder.proposals.${proposalDef.i18nKey}.title`)}
            </p>
            <p className="mt-1 text-sm text-muted">{t(`builder.proposals.${proposalDef.i18nKey}.hint`)}</p>
          </section>
        ) : null}
        {project.workflowStructure ? (
          <section className="mt-8">
            <h2 className="text-lg font-semibold text-foreground">{t("preview.structureHeading")}</h2>
            <pre className="mt-2 whitespace-pre-wrap rounded-lg border border-border bg-card p-4 text-sm text-muted">
              {project.workflowStructure}
            </pre>
          </section>
        ) : null}
        {draftRows.map((d) => (
          <section key={d.id} className="mt-8 border-t border-border pt-8">
            <h2 className="text-lg font-semibold text-foreground">{d.title}</h2>
            {d.body ? (
              <pre className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-muted">{d.body}</pre>
            ) : null}
          </section>
        ))}
        {draftRows.length === 0 &&
        !project.workflowGoals &&
        !project.workflowStructure &&
        !builder ? (
          <p className="mt-6 text-sm text-muted">{t("preview.empty")}</p>
        ) : null}
      </article>
    </div>
  );
}
