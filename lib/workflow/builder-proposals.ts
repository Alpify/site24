import type { SiteTemplateId } from "@/lib/templates/catalog";

export const BUILDER_QUESTION_IDS = ["offer_clear", "audience_known", "content_ready"] as const;
export type BuilderQuestionId = (typeof BUILDER_QUESTION_IDS)[number];

export const BUILDER_PROPOSAL_IDS = [
  "focus-landing",
  "local-trust",
  "showcase-work",
  "lean-onepager",
] as const;
export type BuilderProposalId = (typeof BUILDER_PROPOSAL_IDS)[number];

export type BuilderProposalDef = {
  id: BuilderProposalId;
  /** When set, seed drafts from this catalog template (if project has no drafts yet). */
  templateId: SiteTemplateId | null;
  i18nKey: string;
};

export const BUILDER_PROPOSALS: readonly BuilderProposalDef[] = [
  { id: "focus-landing", templateId: "landing-basic", i18nKey: "focusLanding" },
  { id: "local-trust", templateId: "local-business", i18nKey: "localTrust" },
  { id: "showcase-work", templateId: "portfolio-minimal", i18nKey: "showcaseWork" },
  { id: "lean-onepager", templateId: null, i18nKey: "leanOnepager" },
] as const;

export type BuilderAnswerChoice = "yes" | "no" | "comment";

export type BuilderAnswer = {
  id: BuilderQuestionId;
  choice: BuilderAnswerChoice;
  comment?: string;
};

export type BuilderPayloadV1 = {
  version: 1;
  answers: BuilderAnswer[];
  proposalId: BuilderProposalId;
};

export function isBuilderProposalId(value: string): value is BuilderProposalId {
  return (BUILDER_PROPOSAL_IDS as readonly string[]).includes(value);
}

export function getProposalDef(id: string): BuilderProposalDef | undefined {
  return BUILDER_PROPOSALS.find((p) => p.id === id);
}

export function parseBuilderPayload(raw: string | null | undefined): BuilderPayloadV1 | null {
  if (!raw?.trim()) {
    return null;
  }
  try {
    const data = JSON.parse(raw) as unknown;
    if (!data || typeof data !== "object") {
      return null;
    }
    const o = data as Record<string, unknown>;
    if (o.version !== 1) {
      return null;
    }
    if (!Array.isArray(o.answers) || typeof o.proposalId !== "string") {
      return null;
    }
    if (!isBuilderProposalId(o.proposalId)) {
      return null;
    }
    const answers: BuilderAnswer[] = [];
    for (const row of o.answers) {
      if (!row || typeof row !== "object") {
        return null;
      }
      const r = row as Record<string, unknown>;
      if (
        typeof r.id !== "string" ||
        (r.choice !== "yes" && r.choice !== "no" && r.choice !== "comment")
      ) {
        return null;
      }
      if (!BUILDER_QUESTION_IDS.includes(r.id as BuilderQuestionId)) {
        return null;
      }
      const comment = typeof r.comment === "string" ? r.comment.slice(0, 2000) : undefined;
      answers.push({
        id: r.id as BuilderQuestionId,
        choice: r.choice,
        ...(r.choice === "comment" && comment ? { comment } : {}),
      });
    }
    if (answers.length !== BUILDER_QUESTION_IDS.length) {
      return null;
    }
    const ids = new Set(answers.map((a) => a.id));
    if (ids.size !== BUILDER_QUESTION_IDS.length) {
      return null;
    }
    return { version: 1, answers, proposalId: o.proposalId };
  } catch {
    return null;
  }
}

export function leanOnePagerSeed(locale: string): { title: string; body: string } {
  if (locale.startsWith("de")) {
    return {
      title: "One-Pager",
      body:
        "- Kurzer Hero mit Angebot in einem Satz\n- 2–3 Nutzen oder Schritte\n- Kontakt / nächster Schritt\n- Platz für ein Bild (später)",
    };
  }
  return {
    title: "One-pager",
    body:
      "- Short hero with your offer in one line\n- 2–3 benefits or steps\n- Contact / next step\n- Space for an image (later)",
  };
}
