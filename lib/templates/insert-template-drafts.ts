import { getDb } from "@/lib/db";
import { drafts } from "@/lib/db/schema";
import { getTemplateById, type SiteTemplateId } from "@/lib/templates/catalog";

export async function insertTemplateDraftsForProject(
  projectId: string,
  templateId: SiteTemplateId,
): Promise<void> {
  const template = getTemplateById(templateId);
  if (!template) {
    return;
  }
  for (const seed of template.drafts) {
    await getDb().insert(drafts).values({
      projectId,
      title: seed.title.slice(0, 200),
      body: seed.body ? seed.body.slice(0, 50_000) : null,
    });
  }
}
