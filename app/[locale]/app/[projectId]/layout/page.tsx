import { and, eq } from "drizzle-orm";
import { notFound, redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { auth } from "@/auth";
import { WorkflowLayoutForm } from "@/components/workflow-layout-form";
import { isOpenRouterConfigured } from "@/lib/ai/openrouter-client";
import { getDb } from "@/lib/db";
import { projects } from "@/lib/db/schema";

export default async function WorkflowLayoutPage({
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

  const copy = {
    proposalsTitle: t("layout.proposalsTitle"),
    sketchBadge: t("layout.sketchBadge"),
    save: t("layout.save"),
    next: t("layout.next"),
    pendingSave: t("layout.pendingSave"),
    pendingNext: t("layout.pendingNext"),
    invalidBanner: t("layout.invalidBanner"),
    aiRecommendLabel: t("layout.aiRecommendLabel"),
    aiRecommendApply: t("layout.aiRecommendApply"),
    aiRecommendLoading: t("layout.aiRecommendLoading"),
    proposals: {
      focusLanding: {
        title: t("layout.proposals.focusLanding.title"),
        hint: t("layout.proposals.focusLanding.hint"),
      },
      localTrust: {
        title: t("layout.proposals.localTrust.title"),
        hint: t("layout.proposals.localTrust.hint"),
      },
      showcaseWork: {
        title: t("layout.proposals.showcaseWork.title"),
        hint: t("layout.proposals.showcaseWork.hint"),
      },
      leanOnepager: {
        title: t("layout.proposals.leanOnepager.title"),
        hint: t("layout.proposals.leanOnepager.hint"),
      },
    },
  };

  return (
    <div className="mt-8">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted">{t("layout.kicker")}</p>
      <h2 className="mt-2 text-lg font-semibold text-foreground sm:text-xl">{t("layout.pageTitle")}</h2>
      <p className="mt-2 text-sm leading-relaxed text-muted">{t("layout.pageLead")}</p>
      <WorkflowLayoutForm
        locale={locale}
        projectId={projectId}
        initialJson={project.workflowBuilderJson}
        copy={copy}
        showInvalid={sp.invalid === "1"}
        aiEnabled={isOpenRouterConfigured()}
      />
    </div>
  );
}
