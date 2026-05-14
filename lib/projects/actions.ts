"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { expandDraftNotes } from "@/lib/ai/expand-draft-notes";
import { getDb } from "@/lib/db";
import { drafts, projects } from "@/lib/db/schema";

export async function createProject(locale: string, formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect(`/${locale}/login`);
  }

  const name = formData.get("name")?.toString().trim();
  if (!name || name.length > 120) {
    return;
  }

  await getDb().insert(projects).values({
    userId: session.user.id,
    name,
  });

  revalidatePath(`/${locale}/app`);
}

export async function createDraft(
  locale: string,
  projectId: string,
  formData: FormData,
) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect(`/${locale}/login`);
  }

  const title = formData.get("title")?.toString().trim();
  if (!title || title.length > 200) {
    return;
  }

  const bodyRaw = formData.get("body")?.toString().trim();
  const body = bodyRaw && bodyRaw.length > 0 ? bodyRaw.slice(0, 50_000) : null;

  const [owned] = await getDb()
    .select({ id: projects.id })
    .from(projects)
    .where(and(eq(projects.id, projectId), eq(projects.userId, session.user.id)))
    .limit(1);

  if (!owned) {
    return;
  }

  await getDb().insert(drafts).values({
    projectId,
    title,
    body,
  });

  revalidatePath(`/${locale}/app/${projectId}`);
}

export async function expandDraftWithAi(
  locale: string,
  projectId: string,
  draftId: string,
) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect(`/${locale}/login`);
  }

  if (!process.env.OPENROUTER_API_KEY) {
    redirect(`/${locale}/app/${projectId}?aiError=config`);
  }

  const [owned] = await getDb()
    .select({ id: projects.id, name: projects.name })
    .from(projects)
    .where(and(eq(projects.id, projectId), eq(projects.userId, session.user.id)))
    .limit(1);

  if (!owned) {
    return;
  }

  const [draft] = await getDb()
    .select()
    .from(drafts)
    .where(and(eq(drafts.id, draftId), eq(drafts.projectId, projectId)))
    .limit(1);

  if (!draft) {
    return;
  }

  try {
    const suggestion = await expandDraftNotes({
      locale,
      projectName: owned.name,
      draftTitle: draft.title,
      draftBody: draft.body,
    });

    const marker = locale === "de" ? "\n\n--- KI ---\n" : "\n\n--- AI ---\n";
    const base = draft.body ?? "";
    const newBody = (base + marker + suggestion).slice(0, 50_000);

    await getDb()
      .update(drafts)
      .set({ body: newBody, updatedAt: new Date() })
      .where(eq(drafts.id, draftId));
  } catch {
    redirect(`/${locale}/app/${projectId}?aiError=api`);
  }

  revalidatePath(`/${locale}/app/${projectId}`);
}
