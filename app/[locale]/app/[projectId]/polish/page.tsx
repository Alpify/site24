import { and, desc, eq } from "drizzle-orm";
import { notFound, redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { auth } from "@/auth";
import { WorkflowPolishWorkspace } from "@/components/workflow-polish-workspace";
import { isOpenRouterConfigured } from "@/lib/ai/openrouter-client";
import { getDb } from "@/lib/db";
import { drafts, projects } from "@/lib/db/schema";

export default async function WorkflowPolishPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; projectId: string }>;
  searchParams: Promise<{ aiError?: string; draftLimit?: string; incomplete?: string }>;
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

  const aiEnabled = isOpenRouterConfigured();

  const polishCopy = {
    generateAll: tw("polish.aiGenerateAll"),
    generateAllPending: tw("polish.aiGenerateAllPending"),
    generateAllConfirm: tw("polish.aiGenerateAllConfirm"),
    continueHosting: tw("polish.continueHosting"),
    continuePending: tw("polish.continuePending"),
    incompleteBanner: tw("polish.incompleteBanner"),
    editTitle: tw("polish.editTitle"),
    editBody: tw("polish.editSection"),
    saveSection: tw("polish.saveSection"),
    savingSection: tw("polish.savingSection"),
    expandSection: t("draftSuggestButton"),
    deleteSection: t("deleteDraftSubmit"),
    newSectionTitle: t("draftTitleLabel"),
    newSectionBody: t("draftBodyPlaceholder"),
    createSection: t("draftCreateSubmit"),
    empty: t("draftEmpty"),
    aiTip: tw("polish.aiTip"),
  };

  return (
    <div className="mx-auto max-w-3xl">
      <header className="space-y-2 border-b border-border/70 pb-8">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted">{tw("polish.kicker")}</p>
        <h2 className="text-xl font-semibold tracking-tight text-foreground md:text-2xl">
          {tw("polish.pageTitle")}
        </h2>
        <p className="max-w-2xl text-sm leading-relaxed text-muted">{tw("polish.pageLead")}</p>
        {!aiEnabled && process.env.NODE_ENV === "development" ? (
          <p className="text-xs text-muted">{t("aiSetupHint")}</p>
        ) : null}
        {sp.incomplete === "1" ? (
          <p
            role="alert"
            className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm text-amber-950 dark:text-amber-100"
          >
            {polishCopy.incompleteBanner}
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

      <WorkflowPolishWorkspace
        locale={locale}
        projectId={projectId}
        aiEnabled={aiEnabled}
        copy={polishCopy}
        dateFmt={dateFmt}
        drafts={draftRows.map((d) => ({
          id: d.id,
          title: d.title,
          body: d.body,
          updatedAt: d.updatedAt.toISOString(),
        }))}
      />
    </div>
  );
}
