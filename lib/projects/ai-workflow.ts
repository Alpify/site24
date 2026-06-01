import { and, count, eq } from "drizzle-orm";

import { createSectionWithAi } from "@/lib/ai/create-section";
import { expandDraftNotes } from "@/lib/ai/expand-draft-notes";
import { generateSiteSections } from "@/lib/ai/generate-site-sections";
import { reviseSectionWithAi } from "@/lib/ai/revise-section";
import { parseBriefPayload } from "@/lib/workflow/brief-questions";
import { isOpenRouterConfigured } from "@/lib/ai/openrouter-client";
import { recommendLayoutFromBrief } from "@/lib/ai/recommend-layout";
import { suggestBriefFromIdea } from "@/lib/ai/suggest-brief";
import { getDb } from "@/lib/db";
import { drafts, projects } from "@/lib/db/schema";
import { insertTemplateDraftsForProject } from "@/lib/templates/insert-template-drafts";
import { getTemplateById } from "@/lib/templates/catalog";
import {
  buildProjectAiContext,
  formatBriefAnswersForAi,
} from "@/lib/workflow/project-context";
import {
  getLayoutProposalDef,
  leanOnePagerSeed,
  parseLayoutPayload,
  type LayoutProposalId,
} from "@/lib/workflow/layout-proposals";

export type AiErrorCode = "config" | "forbidden" | "api" | "state";

export type AiResult<T> = { ok: true; data: T } | { ok: false; error: AiErrorCode };

async function loadOwnedProject(userId: string, projectId: string) {
  const [row] = await getDb()
    .select()
    .from(projects)
    .where(and(eq(projects.id, projectId), eq(projects.userId, userId)))
    .limit(1);
  return row;
}

function sectionHintsForLayout(
  locale: string,
  proposalId: LayoutProposalId,
  existingTitles: string[],
): string[] {
  if (existingTitles.length > 0) {
    return existingTitles;
  }
  const def = getLayoutProposalDef(proposalId);
  if (def?.templateId) {
    const tpl = getTemplateById(def.templateId);
    if (tpl) {
      return tpl.drafts.map((d) => d.title);
    }
  }
  if (proposalId === "lean-onepager") {
    const seed = leanOnePagerSeed(locale);
    return [seed.title];
  }
  return locale === "de"
    ? ["Startseite / Hero", "Leistungen oder Nutzen", "Über uns / Vertrauen", "Kontakt"]
    : ["Home / Hero", "Services or benefits", "About / trust", "Contact"];
}

export async function aiSuggestBriefForUser(opts: {
  userId: string;
  locale: string;
  projectId: string;
  labelFn: (key: string) => string;
}): Promise<AiResult<{ briefJson: string; notes: string }>> {
  if (!isOpenRouterConfigured()) {
    return { ok: false, error: "config" };
  }
  const project = await loadOwnedProject(opts.userId, opts.projectId);
  if (!project) {
    return { ok: false, error: "forbidden" };
  }

  try {
    const { payload, notes } = await suggestBriefFromIdea({
      locale: opts.locale,
      projectName: project.name,
      idea: project.workflowGoals ?? project.name,
    });

    const briefJson = JSON.stringify(payload);
    await getDb()
      .update(projects)
      .set({
        workflowBriefJson: briefJson,
        workflowGoals: notes || project.workflowGoals,
        updatedAt: new Date(),
      })
      .where(eq(projects.id, project.id));

    return { ok: true, data: { briefJson, notes } };
  } catch {
    return { ok: false, error: "api" };
  }
}

export async function aiRecommendLayoutForUser(opts: {
  userId: string;
  locale: string;
  projectId: string;
  labelFn: (key: string) => string;
}): Promise<AiResult<{ proposalId: LayoutProposalId; reason: string }>> {
  if (!isOpenRouterConfigured()) {
    return { ok: false, error: "config" };
  }
  const project = await loadOwnedProject(opts.userId, opts.projectId);
  if (!project) {
    return { ok: false, error: "forbidden" };
  }

  const briefLines = formatBriefAnswersForAi(
    opts.locale,
    project.workflowBriefJson,
    opts.labelFn,
  );
  const context = buildProjectAiContext({
    locale: opts.locale,
    project,
    briefLines,
  });

  try {
    const { proposalId, reason } = await recommendLayoutFromBrief({
      locale: opts.locale,
      context,
    });
    return { ok: true, data: { proposalId, reason } };
  } catch {
    return { ok: false, error: "api" };
  }
}

export async function aiGeneratePolishForUser(opts: {
  userId: string;
  locale: string;
  projectId: string;
  labelFn: (key: string) => string;
  replaceExisting?: boolean;
}): Promise<AiResult<{ updated: number }>> {
  if (!isOpenRouterConfigured()) {
    return { ok: false, error: "config" };
  }
  const project = await loadOwnedProject(opts.userId, opts.projectId);
  if (!project) {
    return { ok: false, error: "forbidden" };
  }

  let layout = parseLayoutPayload(project.workflowBuilderJson);
  if (!layout) {
    const rec = await aiRecommendLayoutForUser(opts);
    if (!rec.ok) {
      return { ok: false, error: rec.error };
    }
    layout = { version: 2, proposalId: rec.data.proposalId };
    await getDb()
      .update(projects)
      .set({
        workflowBuilderJson: JSON.stringify(layout),
        updatedAt: new Date(),
      })
      .where(eq(projects.id, project.id));
  }

  const briefLines = formatBriefAnswersForAi(
    opts.locale,
    project.workflowBriefJson,
    opts.labelFn,
  );
  const context = buildProjectAiContext({
    locale: opts.locale,
    project,
    briefLines,
  });

  const existing = await getDb()
    .select({ id: drafts.id, title: drafts.title })
    .from(drafts)
    .where(eq(drafts.projectId, project.id));

  if (opts.replaceExisting && existing.length > 0) {
    await getDb().delete(drafts).where(eq(drafts.projectId, project.id));
  } else if (existing.length === 0) {
    const def = getLayoutProposalDef(layout.proposalId);
    if (def?.templateId) {
      await insertTemplateDraftsForProject(project.id, def.templateId);
    } else if (def?.id === "lean-onepager") {
      const seed = leanOnePagerSeed(opts.locale);
      await getDb().insert(drafts).values({
        projectId: project.id,
        title: seed.title.slice(0, 200),
        body: seed.body.slice(0, 50_000),
      });
    }
  }

  const draftRows = await getDb()
    .select()
    .from(drafts)
    .where(eq(drafts.projectId, project.id));

  const hints = sectionHintsForLayout(
    opts.locale,
    layout.proposalId,
    draftRows.map((d) => d.title),
  );

  try {
    const generated = await generateSiteSections({
      locale: opts.locale,
      context,
      sectionHints: hints,
    });

    if (generated.length === 0) {
      return { ok: false, error: "api" };
    }

    let updated = 0;
    for (let i = 0; i < draftRows.length && i < generated.length; i++) {
      const d = draftRows[i]!;
      const g = generated[i]!;
      await getDb()
        .update(drafts)
        .set({ body: g.body, title: g.title || d.title, updatedAt: new Date() })
        .where(eq(drafts.id, d.id));
      updated++;
    }

    for (let i = draftRows.length; i < generated.length; i++) {
      const g = generated[i]!;
      const [c] = await getDb()
        .select({ c: count() })
        .from(drafts)
        .where(eq(drafts.projectId, project.id));
      if ((c?.c ?? 0) >= 12) break;
      await getDb().insert(drafts).values({
        projectId: project.id,
        title: g.title.slice(0, 200),
        body: g.body.slice(0, 50_000),
      });
      updated++;
    }

    await getDb()
      .update(projects)
      .set({ workflowStep: "polish", updatedAt: new Date() })
      .where(eq(projects.id, project.id));

    return { ok: true, data: { updated } };
  } catch {
    return { ok: false, error: "api" };
  }
}

export async function aiEnhanceDraftForUser(opts: {
  userId: string;
  locale: string;
  projectId: string;
  draftId: string;
  labelFn: (key: string) => string;
}): Promise<AiResult<null>> {
  if (!isOpenRouterConfigured()) {
    return { ok: false, error: "config" };
  }
  const project = await loadOwnedProject(opts.userId, opts.projectId);
  if (!project) {
    return { ok: false, error: "forbidden" };
  }

  const [draft] = await getDb()
    .select()
    .from(drafts)
    .where(and(eq(drafts.id, opts.draftId), eq(drafts.projectId, project.id)))
    .limit(1);

  if (!draft) {
    return { ok: false, error: "state" };
  }

  const briefLines = formatBriefAnswersForAi(
    opts.locale,
    project.workflowBriefJson,
    opts.labelFn,
  );
  const context = buildProjectAiContext({
    locale: opts.locale,
    project,
    briefLines,
  });

  try {
    const suggestion = await expandDraftNotes({
      locale: opts.locale,
      projectName: project.name,
      draftTitle: draft.title,
      draftBody: draft.body,
      context,
    });

    const marker =
      opts.locale === "de"
        ? "\n\n--- KI-Vorschlag ---\n"
        : "\n\n--- AI suggestion ---\n";
    const base = draft.body ?? "";
    const newBody = (base + marker + suggestion).slice(0, 50_000);

    await getDb()
      .update(drafts)
      .set({ body: newBody, updatedAt: new Date() })
      .where(eq(drafts.id, draft.id));

    return { ok: true, data: null };
  } catch {
    return { ok: false, error: "api" };
  }
}

export async function aiGenerateFullSiteForUser(opts: {
  userId: string;
  locale: string;
  projectId: string;
  labelFn: (key: string) => string;
}): Promise<AiResult<{ proposalId: LayoutProposalId; sections: number }>> {
  if (!isOpenRouterConfigured()) {
    return { ok: false, error: "config" };
  }
  const project = await loadOwnedProject(opts.userId, opts.projectId);
  if (!project) {
    return { ok: false, error: "forbidden" };
  }
  if (!parseBriefPayload(project.workflowBriefJson)) {
    return { ok: false, error: "state" };
  }

  const gen = await aiGeneratePolishForUser({
    ...opts,
    replaceExisting: true,
  });
  if (!gen.ok) {
    return { ok: false, error: gen.error };
  }

  const refreshed = await loadOwnedProject(opts.userId, opts.projectId);
  const layout = parseLayoutPayload(refreshed?.workflowBuilderJson ?? null);
  const [c] = await getDb()
    .select({ c: count() })
    .from(drafts)
    .where(eq(drafts.projectId, project.id));

  await getDb()
    .update(projects)
    .set({ workflowStep: "polish", updatedAt: new Date() })
    .where(eq(projects.id, project.id));

  return {
    ok: true,
    data: {
      proposalId: layout?.proposalId ?? "focus-landing",
      sections: c?.c ?? gen.data.updated,
    },
  };
}

export async function aiReviseSectionForUser(opts: {
  userId: string;
  locale: string;
  projectId: string;
  draftId: string;
  instruction: string;
  labelFn: (key: string) => string;
}): Promise<AiResult<null>> {
  if (!isOpenRouterConfigured()) {
    return { ok: false, error: "config" };
  }
  const project = await loadOwnedProject(opts.userId, opts.projectId);
  if (!project) {
    return { ok: false, error: "forbidden" };
  }
  const [draft] = await getDb()
    .select()
    .from(drafts)
    .where(and(eq(drafts.id, opts.draftId), eq(drafts.projectId, project.id)))
    .limit(1);
  if (!draft || !opts.instruction.trim()) {
    return { ok: false, error: "state" };
  }

  const briefLines = formatBriefAnswersForAi(
    opts.locale,
    project.workflowBriefJson,
    opts.labelFn,
  );
  const context = buildProjectAiContext({
    locale: opts.locale,
    project,
    briefLines,
  });

  try {
    const body = await reviseSectionWithAi({
      locale: opts.locale,
      context,
      sectionTitle: draft.title,
      currentBody: draft.body,
      instruction: opts.instruction.trim(),
    });
    await getDb()
      .update(drafts)
      .set({ body, updatedAt: new Date() })
      .where(eq(drafts.id, draft.id));
    return { ok: true, data: null };
  } catch {
    return { ok: false, error: "api" };
  }
}

export async function aiCreateSectionForUser(opts: {
  userId: string;
  locale: string;
  projectId: string;
  description: string;
  labelFn: (key: string) => string;
}): Promise<AiResult<{ draftId: string }>> {
  if (!isOpenRouterConfigured()) {
    return { ok: false, error: "config" };
  }
  const project = await loadOwnedProject(opts.userId, opts.projectId);
  if (!project) {
    return { ok: false, error: "forbidden" };
  }
  if (!opts.description.trim()) {
    return { ok: false, error: "state" };
  }

  const [c] = await getDb()
    .select({ c: count() })
    .from(drafts)
    .where(eq(drafts.projectId, project.id));
  if ((c?.c ?? 0) >= 12) {
    return { ok: false, error: "state" };
  }

  const briefLines = formatBriefAnswersForAi(
    opts.locale,
    project.workflowBriefJson,
    opts.labelFn,
  );
  const context = buildProjectAiContext({
    locale: opts.locale,
    project,
    briefLines,
  });

  try {
    const section = await createSectionWithAi({
      locale: opts.locale,
      context,
      description: opts.description.trim(),
    });
    const [row] = await getDb()
      .insert(drafts)
      .values({
        projectId: project.id,
        title: section.title,
        body: section.body || null,
      })
      .returning({ id: drafts.id });
    if (!row) {
      return { ok: false, error: "api" };
    }
    return { ok: true, data: { draftId: row.id } };
  } catch {
    return { ok: false, error: "api" };
  }
}

export async function aiApplyLayoutForUser(opts: {
  userId: string;
  locale: string;
  projectId: string;
  proposalId: LayoutProposalId;
  labelFn: (key: string) => string;
}): Promise<AiResult<{ proposalId: LayoutProposalId }>> {
  const project = await loadOwnedProject(opts.userId, opts.projectId);
  if (!project) {
    return { ok: false, error: "forbidden" };
  }

  await getDb()
    .update(projects)
    .set({
      workflowBuilderJson: JSON.stringify({
        version: 2,
        proposalId: opts.proposalId,
      }),
      updatedAt: new Date(),
    })
    .where(eq(projects.id, project.id));

  const gen = await aiGeneratePolishForUser({
    userId: opts.userId,
    locale: opts.locale,
    projectId: opts.projectId,
    labelFn: opts.labelFn,
    replaceExisting: true,
  });
  if (!gen.ok) {
    return { ok: false, error: gen.error };
  }
  return { ok: true, data: { proposalId: opts.proposalId } };
}
