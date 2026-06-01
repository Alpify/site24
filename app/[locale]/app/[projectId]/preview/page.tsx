import { and, desc, eq } from "drizzle-orm";
import { notFound, redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { auth } from "@/auth";
import { getDb } from "@/lib/db";
import { drafts, projects } from "@/lib/db/schema";
import { BRIEF_QUESTIONS, parseBriefPayload } from "@/lib/workflow/brief-questions";
import { getLayoutProposalDef, parseLayoutPayload } from "@/lib/workflow/layout-proposals";

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
  const brief = parseBriefPayload(project.workflowBriefJson);
  const layout = parseLayoutPayload(project.workflowBuilderJson);
  const proposalDef = layout ? getLayoutProposalDef(layout.proposalId) : undefined;

  return (
    <div className="mt-8 rounded-xl border border-border bg-background/80 p-6 shadow-sm">
      <p className="text-xs font-medium uppercase tracking-wide text-muted">{t("preview.badge")}</p>
      <article lang={locale} className="prose prose-neutral mt-4 max-w-none dark:prose-invert">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">{project.name}</h1>
        {brief ? (
          <section className="mt-8">
            <h2 className="text-lg font-semibold text-foreground">{t("preview.briefHeading")}</h2>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted">
              {brief.answers.map((a) => {
                const labels = a.optionIds.map((oid) => {
                  const q = BRIEF_QUESTIONS.find((x) => x.id === a.id);
                  const opt = q?.options.find((o) => o.id === oid);
                  return t(`brief.options.${a.id}.${opt?.i18nKey ?? oid}`);
                });
                return (
                  <li key={a.id}>
                    <span className="text-foreground">{t(`brief.questions.${a.id}`)}</span>
                    {": "}
                    <span className="font-medium text-foreground">
                      {labels.join(", ")}
                      {a.customText ? ` — ${a.customText}` : ""}
                    </span>
                  </li>
                );
              })}
            </ul>
          </section>
        ) : null}
        {project.workflowGoals ? (
          <section className="mt-8">
            <h2 className="text-lg font-semibold text-foreground">{t("preview.notesHeading")}</h2>
            <pre className="mt-2 whitespace-pre-wrap rounded-lg border border-border bg-card p-4 text-sm text-muted">
              {project.workflowGoals}
            </pre>
          </section>
        ) : null}
        {layout && proposalDef ? (
          <section className="mt-8">
            <h2 className="text-lg font-semibold text-foreground">{t("preview.layoutHeading")}</h2>
            <p className="mt-2 text-sm font-medium text-foreground">
              {t(`layout.proposals.${proposalDef.i18nKey}.title`)}
            </p>
            <p className="mt-1 text-sm text-muted">{t(`layout.proposals.${proposalDef.i18nKey}.hint`)}</p>
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
        !brief &&
        !project.workflowGoals &&
        !layout ? (
          <p className="mt-8 text-sm text-muted">{t("preview.empty")}</p>
        ) : null}
      </article>
    </div>
  );
}
