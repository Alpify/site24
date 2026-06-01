import { and, eq } from "drizzle-orm";

import { expandDraftNotes } from "@/lib/ai/expand-draft-notes";
import { getDb } from "@/lib/db";
import { drafts, projects } from "@/lib/db/schema";

export type ExpandDraftErrorCode = "config" | "forbidden" | "notfound" | "api";

export type ExpandDraftForUserResult =
  | { ok: true }
  | { ok: false; error: ExpandDraftErrorCode };

export async function expandDraftForUser(opts: {
  userId: string;
  locale: string;
  projectId: string;
  draftId: string;
}): Promise<ExpandDraftForUserResult> {
  if (!process.env.OPENROUTER_API_KEY) {
    return { ok: false, error: "config" };
  }

  const [owned] = await getDb()
    .select({ id: projects.id, name: projects.name })
    .from(projects)
    .where(and(eq(projects.id, opts.projectId), eq(projects.userId, opts.userId)))
    .limit(1);

  if (!owned) {
    return { ok: false, error: "forbidden" };
  }

  const [draft] = await getDb()
    .select()
    .from(drafts)
    .where(and(eq(drafts.id, opts.draftId), eq(drafts.projectId, opts.projectId)))
    .limit(1);

  if (!draft) {
    return { ok: false, error: "notfound" };
  }

  try {
    const suggestion = await expandDraftNotes({
      locale: opts.locale,
      projectName: owned.name,
      draftTitle: draft.title,
      draftBody: draft.body,
    });

    const marker =
      opts.locale === "de"
        ? "\n\n--- Strukturvorschlag ---\n"
        : "\n\n--- Structured suggestion ---\n";
    const base = draft.body ?? "";
    const newBody = (base + marker + suggestion).slice(0, 50_000);

    await getDb()
      .update(drafts)
      .set({ body: newBody, updatedAt: new Date() })
      .where(eq(drafts.id, opts.draftId));
  } catch {
    return { ok: false, error: "api" };
  }

  return { ok: true };
}
