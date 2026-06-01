import { and, eq } from "drizzle-orm";
import { notFound, redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { auth } from "@/auth";
import { WorkflowBuilderForm } from "@/components/workflow-builder-form";
import { getDb } from "@/lib/db";
import { projects } from "@/lib/db/schema";

export default async function WorkflowBuilderPage({
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
    stepsHeading: t("builder.stepsHeading"),
    proposalsTitle: t("builder.proposalsTitle"),
    sketchBadge: t("builder.sketchBadge"),
    choiceYes: t("builder.choiceYes"),
    choiceNo: t("builder.choiceNo"),
    choiceComment: t("builder.choiceComment"),
    commentPlaceholder: t("builder.commentPlaceholder"),
    save: t("builder.save"),
    next: t("builder.next"),
    pendingSave: t("builder.pendingSave"),
    pendingNext: t("builder.pendingNext"),
    invalidBanner: t("builder.invalidBanner"),
    questions: {
      offer_clear: t("builder.questions.offer_clear"),
      audience_known: t("builder.questions.audience_known"),
      content_ready: t("builder.questions.content_ready"),
    },
    proposals: {
      focusLanding: {
        title: t("builder.proposals.focusLanding.title"),
        hint: t("builder.proposals.focusLanding.hint"),
      },
      localTrust: {
        title: t("builder.proposals.localTrust.title"),
        hint: t("builder.proposals.localTrust.hint"),
      },
      showcaseWork: {
        title: t("builder.proposals.showcaseWork.title"),
        hint: t("builder.proposals.showcaseWork.hint"),
      },
      leanOnepager: {
        title: t("builder.proposals.leanOnepager.title"),
        hint: t("builder.proposals.leanOnepager.hint"),
      },
    },
  };

  return (
    <div className="mt-8">
      <h2 className="text-lg font-semibold text-foreground">{t("builder.pageTitle")}</h2>
      <p className="mt-2 text-sm leading-relaxed text-muted">{t("builder.pageLead")}</p>
      <WorkflowBuilderForm
        locale={locale}
        projectId={projectId}
        initialJson={project.workflowBuilderJson}
        copy={copy}
        showInvalid={sp.invalid === "1"}
      />
    </div>
  );
}
