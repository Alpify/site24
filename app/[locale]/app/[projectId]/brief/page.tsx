import { and, eq } from "drizzle-orm";
import { notFound, redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { auth } from "@/auth";
import { WorkflowBriefForm } from "@/components/workflow-brief-form";
import { isOpenRouterConfigured } from "@/lib/ai/openrouter-client";
import { getDb } from "@/lib/db";
import { projects } from "@/lib/db/schema";
import {
  BRIEF_QUESTIONS,
  type BriefQuestionId,
} from "@/lib/workflow/brief-questions";

export default async function WorkflowBriefPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; projectId: string }>;
  searchParams: Promise<{ invalid?: string }>;
}) {
  const { locale, projectId } = await params;
  const sp = await searchParams;
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

  const t = await getTranslations("workflow");

  const questions = Object.fromEntries(
    BRIEF_QUESTIONS.map((q) => [q.id, t(`brief.questions.${q.id}`)]),
  ) as Record<BriefQuestionId, string>;

  const options: Record<string, Record<string, string>> = {};
  for (const q of BRIEF_QUESTIONS) {
    options[q.id] = Object.fromEntries(
      q.options.map((o) => [o.id, t(`brief.options.${q.id}.${o.i18nKey}`)]),
    );
  }

  const copy = {
    progressLabel: t("brief.progressLabel"),
    notesLabel: t("brief.notesLabel"),
    notesPlaceholder: t("brief.notesPlaceholder"),
    save: t("brief.save"),
    next: t("brief.next"),
    pendingSave: t("brief.pendingSave"),
    pendingNext: t("brief.pendingNext"),
    invalidBanner: t("brief.invalidBanner"),
    customPlaceholder: t("brief.customPlaceholder"),
    aiFill: t("brief.aiFill"),
    aiFillPending: t("brief.aiFillPending"),
    aiFillHint: t("brief.aiFillHint"),
    questions,
    options,
  };

  return (
    <div className="mt-8">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted">{t("brief.kicker")}</p>
      <h2 className="mt-2 font-mono text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
        {t("brief.namePrefix")}
        {project.name}
      </h2>
      <p className="mt-3 text-sm leading-relaxed text-muted">{t("brief.lead")}</p>
      <WorkflowBriefForm
        locale={locale}
        projectId={projectId}
        initialJson={project.workflowBriefJson}
        initialNotes={project.workflowGoals}
        copy={copy}
        showInvalid={sp.invalid === "1"}
        aiEnabled={isOpenRouterConfigured()}
      />
    </div>
  );
}
