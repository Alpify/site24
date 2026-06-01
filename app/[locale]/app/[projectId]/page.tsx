import { and, eq } from "drizzle-orm";
import { notFound, redirect } from "next/navigation";

import { auth } from "@/auth";
import { getDb } from "@/lib/db";
import { projects } from "@/lib/db/schema";
import { normalizeStoredWorkflowStep } from "@/lib/workflow/site-steps";

export default async function ProjectIndexRedirect({
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
    .select({ workflowStep: projects.workflowStep })
    .from(projects)
    .where(and(eq(projects.id, projectId), eq(projects.userId, session.user.id)))
    .limit(1);

  if (!project) {
    notFound();
  }

  const step = normalizeStoredWorkflowStep(project.workflowStep);
  redirect(`/${locale}/app/${projectId}/${step}`);
}
