import { and, eq } from "drizzle-orm";
import type { InferSelectModel } from "drizzle-orm";
import type { ReactNode } from "react";
import { notFound, redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { auth } from "@/auth";
import { Link } from "@/i18n/routing";
import { ProjectWorkflowNavClient } from "@/components/project-workflow-nav-client";
import { buildPageMetadata } from "@/lib/build-page-metadata";
import { buttonClassName } from "@/components/ui/button";
import { getDb } from "@/lib/db";
import { drafts, projects } from "@/lib/db/schema";
import { computeWorkflowProgress } from "@/lib/workflow/progress";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; projectId: string }>;
}) {
  const { locale, projectId } = await params;
  const t = await getTranslations({ locale, namespace: "metadata.project" });
  const session = await auth();
  let title = t("titleFallback");
  if (session?.user?.id) {
    try {
      const [project] = await getDb()
        .select({ name: projects.name })
        .from(projects)
        .where(and(eq(projects.id, projectId), eq(projects.userId, session.user.id)))
        .limit(1);
      if (project) {
        title = t("titleWithName", { name: project.name });
      }
    } catch {
      // keep titleFallback
    }
  }
  return {
    ...buildPageMetadata({
      locale,
      pathname: `/app/${projectId}`,
      title,
      description: t("description"),
    }),
    robots: { index: false, follow: false },
  };
}

export default async function ProjectWorkspaceLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string; projectId: string }>;
}) {
  const { locale, projectId } = await params;
  const session = await auth();
  if (!session?.user?.id) {
    redirect(`/${locale}/login`);
  }

  const tDb = await getTranslations("projectPage");
  const tFlow = await getTranslations("workflow");

  let project: InferSelectModel<typeof projects> | undefined;
  try {
    const [row] = await getDb()
      .select()
      .from(projects)
      .where(and(eq(projects.id, projectId), eq(projects.userId, session.user.id)))
      .limit(1);
    project = row;
  } catch {
    return (
      <section className="border-b border-border bg-card py-16">
        <div className="mx-auto max-w-4xl px-[max(1rem,env(safe-area-inset-left))] sm:px-6 lg:pr-[max(1rem,env(safe-area-inset-right))]">
          <h1 className="text-2xl font-semibold text-foreground">{tDb("dbErrorTitle")}</h1>
          <p className="mt-3 text-sm text-muted">{tDb("dbErrorBody")}</p>
          <Link href="/app" className={`${buttonClassName("secondary", "mt-8")} inline-flex`}>
            {tDb("backToProjects")}
          </Link>
        </div>
      </section>
    );
  }

  if (!project) {
    notFound();
  }

  const draftRows = await getDb()
    .select({ body: drafts.body })
    .from(drafts)
    .where(eq(drafts.projectId, projectId));
  const draftsWithBody = draftRows.filter((d) => (d.body?.trim().length ?? 0) >= 20).length;
  const progress = computeWorkflowProgress({
    workflowStep: project.workflowStep,
    workflowBriefJson: project.workflowBriefJson,
    workflowBuilderJson: project.workflowBuilderJson,
    draftsWithBody,
  });

  const labels = {
    brief: tFlow("nav.brief"),
    layout: tFlow("nav.layout"),
    polish: tFlow("nav.polish"),
    hosting: tFlow("nav.hosting"),
  } as const;

  return (
    <section className="border-b border-border bg-card py-12 md:py-16">
      <div className="mx-auto max-w-4xl px-[max(1rem,env(safe-area-inset-left))] sm:px-6 lg:pr-[max(1rem,env(safe-area-inset-right))]">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-baseline sm:justify-between">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
            {project.name}
          </h1>
          <Link
            href="/app"
            className="text-sm font-medium text-accent underline-offset-4 hover:underline"
          >
            {tDb("backToProjects")}
          </Link>
        </div>
        <p className="mt-2 text-sm leading-relaxed text-muted">{tFlow("workspaceLead")}</p>
        <ProjectWorkflowNavClient
          locale={locale}
          projectId={projectId}
          labels={labels}
          previewLabel={tFlow("nav.preview")}
          ariaLabel={tFlow("nav.aria")}
          stepAccess={progress.steps}
        />
        {children}
      </div>
    </section>
  );
}
