import { and, eq } from "drizzle-orm";
import { notFound, redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { auth } from "@/auth";
import { buttonClassName } from "@/components/ui/button";
import { getDb } from "@/lib/db";
import { projects } from "@/lib/db/schema";
import { saveWorkflowGoals } from "@/lib/projects/actions";

export default async function WorkflowGoalsPage({
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

  const t = await getTranslations("workflow");

  return (
    <div className="mt-8">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted">{t("goals.kicker")}</p>
      <h2 className="mt-2 font-mono text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
        {t("goals.namePrefix")}
        {project.name}
      </h2>
      <p className="mt-3 text-sm leading-relaxed text-muted">{t("goals.lead")}</p>
      <form
        method="post"
        action={saveWorkflowGoals.bind(null, locale, projectId)}
        className="mt-8 space-y-4"
      >
        <div>
          <label htmlFor="workflow-goals" className="text-xs font-medium text-muted">
            {t("goals.label")}
          </label>
          <textarea
            id="workflow-goals"
            name="workflowGoals"
            rows={10}
            maxLength={20000}
            defaultValue={project.workflowGoals ?? ""}
            placeholder={t("goals.placeholder")}
            className="mt-1.5 w-full resize-y rounded-lg border border-border bg-card px-3 py-2.5 text-sm leading-relaxed text-foreground outline-none ring-ring placeholder:text-muted/70 focus-visible:ring-2"
          />
        </div>
        <div className="flex flex-wrap gap-3">
          <button type="submit" name="intent" value="save" className={buttonClassName("secondary", "min-h-11 px-5")}>
            {t("goals.save")}
          </button>
          <button type="submit" name="intent" value="next" className={buttonClassName("primary", "min-h-11 px-5")}>
            {t("goals.next")}
          </button>
        </div>
      </form>
    </div>
  );
}
