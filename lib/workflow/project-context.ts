import type { InferSelectModel } from "drizzle-orm";

import type { projects } from "@/lib/db/schema";
import {
  BRIEF_QUESTIONS,
  parseBriefPayload,
  type BriefQuestionId,
} from "@/lib/workflow/brief-questions";
import {
  getLayoutProposalDef,
  parseLayoutPayload,
} from "@/lib/workflow/layout-proposals";

export type ProjectRow = InferSelectModel<typeof projects>;

export function formatBriefAnswersForAi(
  locale: string,
  briefJson: string | null,
  labelFn: (key: string) => string,
): string {
  const brief = parseBriefPayload(briefJson);
  if (!brief) {
    return locale === "de" ? "(Briefing noch offen)" : "(Briefing not completed)";
  }
  const lines: string[] = [];
  for (const a of brief.answers) {
    const q = BRIEF_QUESTIONS.find((x) => x.id === a.id);
    const opt = q?.options.find((o) => o.id === a.optionId);
    const qLabel = labelFn(`brief.questions.${a.id}`);
    const oLabel = labelFn(`brief.options.${a.id}.${opt?.i18nKey ?? a.optionId}`);
    lines.push(`- ${qLabel}: ${oLabel}${a.customText ? ` (${a.customText})` : ""}`);
  }
  return lines.join("\n");
}

export function buildProjectAiContext(opts: {
  locale: string;
  project: Pick<ProjectRow, "name" | "workflowGoals" | "workflowBriefJson" | "workflowBuilderJson">;
  briefLines: string;
}): string {
  const layout = parseLayoutPayload(opts.project.workflowBuilderJson);
  const layoutDef = layout ? getLayoutProposalDef(layout.proposalId) : null;
  const layoutId = layout?.proposalId ?? "(none)";
  const notes = opts.project.workflowGoals?.trim() || "";
  const de = opts.locale === "de";

  return [
    de ? `Projektname: ${opts.project.name}` : `Project name: ${opts.project.name}`,
    de ? `Sprache der Website: Deutsch` : `Site language: English`,
    "",
    de ? "Briefing:" : "Briefing:",
    opts.briefLines,
    notes
      ? `\n${de ? "Zusätzliche Notizen:" : "Additional notes:"}\n${notes}`
      : "",
    "",
    de ? `Gewähltes Layout (ID): ${layoutId}` : `Selected layout (id): ${layoutId}`,
    layoutDef ? `Layout key: ${layoutDef.i18nKey}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

export const BRIEF_OPTION_IDS: Record<BriefQuestionId, string[]> = Object.fromEntries(
  BRIEF_QUESTIONS.map((q) => [q.id, q.options.map((o) => o.id)]),
) as Record<BriefQuestionId, string[]>;
