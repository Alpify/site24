"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { getDb } from "@/lib/db";
import { projects } from "@/lib/db/schema";
import { getTemplateById } from "@/lib/templates/catalog";
import { insertTemplateDraftsForProject } from "@/lib/templates/insert-template-drafts";

function revalidateProject(locale: string, projectId: string) {
  revalidatePath(`/${locale}/app/${projectId}`, "layout");
}

export async function applySiteTemplate(
  locale: string,
  projectId: string,
  templateId: string,
  _formData?: FormData,
) {
  void _formData;
  const session = await auth();
  if (!session?.user?.id) {
    redirect(`/${locale}/login`);
  }

  const template = getTemplateById(templateId);
  if (!template) {
    return;
  }

  const [owned] = await getDb()
    .select({ id: projects.id })
    .from(projects)
    .where(and(eq(projects.id, projectId), eq(projects.userId, session.user.id)))
    .limit(1);

  if (!owned) {
    return;
  }

  await insertTemplateDraftsForProject(projectId, template.id);

  revalidateProject(locale, projectId);
  redirect(`/${locale}/app/${projectId}/content`);
}
