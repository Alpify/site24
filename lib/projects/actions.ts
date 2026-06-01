"use server";

import { and, count, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { getDb } from "@/lib/db";
import { drafts, projects } from "@/lib/db/schema";
import { insertTemplateDraftsForProject } from "@/lib/templates/insert-template-drafts";
import { parseBriefPayload } from "@/lib/workflow/brief-questions";
import { parseHostingPayload } from "@/lib/workflow/hosting-checklist";
import {
  getLayoutProposalDef,
  leanOnePagerSeed,
  parseLayoutPayload,
} from "@/lib/workflow/layout-proposals";
import { isWorkflowStepId, type WorkflowStepId } from "@/lib/workflow/site-steps";

export async function createProject(locale: string, formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect(`/${locale}/login`);
  }

  const [countRow] = await getDb()
    .select({ c: count() })
    .from(projects)
    .where(eq(projects.userId, session.user.id));
  if ((countRow?.c ?? 0) >= 1) {
    redirect(`/${locale}/app?limit=1`);
  }

  const name = formData.get("name")?.toString().trim();
  if (!name || name.length > 120) {
    return;
  }

  const ideaRaw = formData.get("idea")?.toString() ?? "";
  const idea = ideaRaw.trim();
  const workflowGoals = idea.length > 0 ? idea.slice(0, 20_000) : null;
  const initialStep: WorkflowStepId = "brief";

  const [inserted] = await getDb()
    .insert(projects)
    .values({
      userId: session.user.id,
      name,
      workflowGoals,
      workflowStep: initialStep,
    })
    .returning({ id: projects.id });

  if (!inserted) {
    return;
  }

  revalidatePath(`/${locale}/app`);
  redirect(`/${locale}/app/${inserted.id}/${initialStep}`);
}

function revalidateProjectTree(locale: string, projectId: string) {
  revalidatePath(`/${locale}/app/${projectId}`, "layout");
}

export async function saveWorkflowBrief(
  locale: string,
  projectId: string,
  formData: FormData,
) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect(`/${locale}/login`);
  }

  const intent = formData.get("intent")?.toString();
  const rawPayload = formData.get("payload")?.toString() ?? "{}";
  const notes = formData.get("workflowNotes")?.toString() ?? "";

  const [owned] = await getDb()
    .select({ id: projects.id })
    .from(projects)
    .where(and(eq(projects.id, projectId), eq(projects.userId, session.user.id)))
    .limit(1);

  if (!owned) {
    return;
  }

  if (intent === "next") {
    const parsed = parseBriefPayload(rawPayload);
    if (!parsed) {
      redirect(`/${locale}/app/${projectId}/brief?invalid=1`);
    }

    await getDb()
      .update(projects)
      .set({
        workflowBriefJson: rawPayload.slice(0, 50_000),
        workflowGoals: notes.slice(0, 20_000) || null,
        workflowStep: "layout",
        updatedAt: new Date(),
      })
      .where(eq(projects.id, projectId));

    revalidateProjectTree(locale, projectId);
    redirect(`/${locale}/app/${projectId}/layout`);
  }

  await getDb()
    .update(projects)
    .set({
      workflowBriefJson: rawPayload.slice(0, 50_000),
      workflowGoals: notes.slice(0, 20_000) || null,
      updatedAt: new Date(),
    })
    .where(eq(projects.id, projectId));

  revalidateProjectTree(locale, projectId);
}

/** @deprecated Use saveWorkflowBrief */
export async function saveWorkflowGoals(
  locale: string,
  projectId: string,
  formData: FormData,
) {
  return saveWorkflowBrief(locale, projectId, formData);
}

export async function saveWorkflowLayout(
  locale: string,
  projectId: string,
  formData: FormData,
) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect(`/${locale}/login`);
  }

  const intent = formData.get("intent")?.toString();
  const rawPayload = formData.get("payload")?.toString() ?? "{}";

  const [owned] = await getDb()
    .select({ id: projects.id })
    .from(projects)
    .where(and(eq(projects.id, projectId), eq(projects.userId, session.user.id)))
    .limit(1);

  if (!owned) {
    return;
  }

  if (intent === "next") {
    const parsed = parseLayoutPayload(rawPayload);
    if (!parsed) {
      redirect(`/${locale}/app/${projectId}/layout?invalid=1`);
    }

    await getDb()
      .update(projects)
      .set({
        workflowBuilderJson: rawPayload.slice(0, 50_000),
        workflowStep: "polish",
        updatedAt: new Date(),
      })
      .where(eq(projects.id, projectId));

    const [countRow] = await getDb()
      .select({ c: count() })
      .from(drafts)
      .where(eq(drafts.projectId, projectId));
    const draftCount = countRow?.c ?? 0;

    if (draftCount === 0) {
      const def = getLayoutProposalDef(parsed.proposalId);
      if (def?.templateId) {
        await insertTemplateDraftsForProject(projectId, def.templateId);
      } else if (def?.id === "lean-onepager") {
        const seed = leanOnePagerSeed(locale);
        await getDb().insert(drafts).values({
          projectId,
          title: seed.title.slice(0, 200),
          body: seed.body.slice(0, 50_000),
        });
      }
    }

    revalidateProjectTree(locale, projectId);
    redirect(`/${locale}/app/${projectId}/polish`);
  }

  await getDb()
    .update(projects)
    .set({
      workflowBuilderJson: rawPayload.slice(0, 50_000),
      updatedAt: new Date(),
    })
    .where(eq(projects.id, projectId));

  revalidateProjectTree(locale, projectId);
}

/** @deprecated Use saveWorkflowLayout */
export async function saveWorkflowBuilder(
  locale: string,
  projectId: string,
  formData: FormData,
) {
  return saveWorkflowLayout(locale, projectId, formData);
}

export async function saveWorkflowHosting(
  locale: string,
  projectId: string,
  formData: FormData,
) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect(`/${locale}/login`);
  }

  const rawPayload = formData.get("payload")?.toString() ?? "{}";
  parseHostingPayload(rawPayload);

  const [owned] = await getDb()
    .select({ id: projects.id })
    .from(projects)
    .where(and(eq(projects.id, projectId), eq(projects.userId, session.user.id)))
    .limit(1);

  if (!owned) {
    return;
  }

  await getDb()
    .update(projects)
    .set({
      workflowStructure: rawPayload.slice(0, 10_000),
      workflowStep: "hosting",
      updatedAt: new Date(),
    })
    .where(eq(projects.id, projectId));

  revalidateProjectTree(locale, projectId);
}

export async function setWorkflowStep(
  locale: string,
  projectId: string,
  step: string,
) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect(`/${locale}/login`);
  }

  if (!isWorkflowStepId(step)) {
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

  await getDb()
    .update(projects)
    .set({ workflowStep: step, updatedAt: new Date() })
    .where(eq(projects.id, projectId));

  revalidateProjectTree(locale, projectId);
  redirect(`/${locale}/app/${projectId}/${step}`);
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

  const MAX_DRAFTS_PER_PROJECT = 12;
  const [draftCount] = await getDb()
    .select({ c: count() })
    .from(drafts)
    .where(eq(drafts.projectId, projectId));
  if ((draftCount?.c ?? 0) >= MAX_DRAFTS_PER_PROJECT) {
    redirect(`/${locale}/app/${projectId}/polish?draftLimit=1`);
  }

  await getDb().insert(drafts).values({
    projectId,
    title,
    body,
  });

  revalidateProjectTree(locale, projectId);
  redirect(`/${locale}/app/${projectId}/polish`);
}

export async function updateDraft(
  locale: string,
  projectId: string,
  draftId: string,
  formData: FormData,
) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect(`/${locale}/login`);
  }

  const title = formData.get("title")?.toString().trim();
  const bodyRaw = formData.get("body")?.toString() ?? "";
  const body = bodyRaw.trim().length > 0 ? bodyRaw.trim().slice(0, 50_000) : null;

  if (!title || title.length > 200) {
    redirect(`/${locale}/app/${projectId}/polish?invalid=1`);
  }

  const [owned] = await getDb()
    .select({ id: projects.id })
    .from(projects)
    .where(and(eq(projects.id, projectId), eq(projects.userId, session.user.id)))
    .limit(1);

  if (!owned) {
    return;
  }

  await getDb()
    .update(drafts)
    .set({ title, body, updatedAt: new Date() })
    .where(and(eq(drafts.id, draftId), eq(drafts.projectId, projectId)));

  revalidateProjectTree(locale, projectId);
}

export async function saveWorkflowPolish(
  locale: string,
  projectId: string,
  formData: FormData,
) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect(`/${locale}/login`);
  }

  const intent = formData.get("intent")?.toString();

  const [owned] = await getDb()
    .select({ id: projects.id })
    .from(projects)
    .where(and(eq(projects.id, projectId), eq(projects.userId, session.user.id)))
    .limit(1);

  if (!owned) {
    return;
  }

  if (intent === "next") {
    const rows = await getDb()
      .select({ body: drafts.body })
      .from(drafts)
      .where(eq(drafts.projectId, projectId));
    const hasContent = rows.some((r) => (r.body?.trim().length ?? 0) >= 20);
    if (!hasContent) {
      redirect(`/${locale}/app/${projectId}/polish?incomplete=1`);
    }

    await getDb()
      .update(projects)
      .set({ workflowStep: "hosting", updatedAt: new Date() })
      .where(eq(projects.id, projectId));

    revalidateProjectTree(locale, projectId);
    redirect(`/${locale}/app/${projectId}/hosting`);
  }

  await getDb()
    .update(projects)
    .set({ workflowStep: "polish", updatedAt: new Date() })
    .where(eq(projects.id, projectId));

  revalidateProjectTree(locale, projectId);
}

export async function deleteDraft(formData: FormData) {
  const localeRaw = formData.get("locale")?.toString()?.trim();
  const projectId = formData.get("projectId")?.toString()?.trim();
  const draftId = formData.get("draftId")?.toString()?.trim();
  const locale = localeRaw === "en" || localeRaw === "de" ? localeRaw : "de";

  if (!projectId || !draftId) {
    redirect(`/${locale}/login`);
  }

  const session = await auth();
  if (!session?.user?.id) {
    redirect(`/${locale}/login`);
  }

  const [owned] = await getDb()
    .select({ id: projects.id })
    .from(projects)
    .where(and(eq(projects.id, projectId), eq(projects.userId, session.user.id)))
    .limit(1);

  if (!owned) {
    redirect(`/${locale}/app/${projectId}/polish?aiError=state`);
  }

  await getDb()
    .delete(drafts)
    .where(and(eq(drafts.id, draftId), eq(drafts.projectId, projectId)));

  revalidateProjectTree(locale, projectId);
  redirect(`/${locale}/app/${projectId}/polish`);
}
