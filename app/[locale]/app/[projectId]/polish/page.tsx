import { and, eq } from "drizzle-orm";
import { notFound, redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { auth } from "@/auth";
import { SiteEditorWorkspace } from "@/components/site-editor-workspace";
import { isOpenRouterConfigured } from "@/lib/ai/openrouter-client";
import { getDb } from "@/lib/db";
import { projects } from "@/lib/db/schema";
import { parseLayoutPayload } from "@/lib/workflow/layout-proposals";

export default async function WorkflowPolishPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; projectId: string }>;
  searchParams: Promise<{ aiError?: string; autogen?: string }>;
}) {
  const { locale, projectId } = await params;
  const sp = await searchParams;
  const session = await auth();
  if (!session?.user?.id) {
    redirect(`/${locale}/login`);
  }

  const tw = await getTranslations("workflow");
  const t = await getTranslations("projectPage");

  const [project] = await getDb()
    .select()
    .from(projects)
    .where(and(eq(projects.id, projectId), eq(projects.userId, session.user.id)))
    .limit(1);

  if (!project) {
    notFound();
  }

  const layout = parseLayoutPayload(project.workflowBuilderJson);
  const aiEnabled = isOpenRouterConfigured();

  const layoutLabels = Object.fromEntries(
    ["focusLanding", "localTrust", "showcaseWork", "leanOnepager"].map((key) => [
      key,
      {
        title: tw(`layout.proposals.${key}.title`),
        hint: tw(`layout.proposals.${key}.hint`),
      },
    ]),
  );

  const editorCopy = {
    previewTitle: tw("editor.previewTitle"),
    previewHint: tw("editor.previewHint"),
    selectedLabel: tw("editor.selectedLabel"),
    instructionLabel: tw("editor.instructionLabel"),
    instructionPlaceholder: tw("editor.instructionPlaceholder"),
    applyAi: tw("editor.applyAi"),
    applyingAi: tw("editor.applyingAi"),
    newSectionLabel: tw("editor.newSectionLabel"),
    newSectionPlaceholder: tw("editor.newSectionPlaceholder"),
    addSection: tw("editor.addSection"),
    addingSection: tw("editor.addingSection"),
    regenerateSite: tw("editor.regenerateSite"),
    regenerating: tw("editor.regenerating"),
    layoutTitle: tw("editor.layoutTitle"),
    layoutHint: tw("editor.layoutHint"),
    continueHosting: tw("polish.continueHosting"),
    generatingBanner: tw("editor.generatingBanner"),
    multiSelectHint: tw("editor.multiSelectHint"),
    noSelection: tw("editor.noSelection"),
  };

  return (
    <div className="mx-auto max-w-6xl">
      <header className="space-y-2 border-b border-border/70 pb-8">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted">{tw("polish.kicker")}</p>
        <h2 className="text-xl font-semibold tracking-tight text-foreground md:text-2xl">
          {tw("polish.pageTitle")}
        </h2>
        <p className="max-w-3xl text-sm leading-relaxed text-muted">{tw("polish.pageLead")}</p>
        {!aiEnabled && process.env.NODE_ENV === "development" ? (
          <p className="text-xs text-muted">{t("aiSetupHint")}</p>
        ) : null}
        {sp.aiError === "api" ? (
          <p
            role="alert"
            className="rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-800 dark:text-red-200"
          >
            {t("aiErrorApi")}
          </p>
        ) : null}
      </header>

      <SiteEditorWorkspace
        locale={locale}
        projectId={projectId}
        aiEnabled={aiEnabled}
        copy={editorCopy}
        layoutLabels={layoutLabels}
        currentLayoutId={layout?.proposalId ?? null}
        autogen={sp.autogen === "1"}
      />
    </div>
  );
}
