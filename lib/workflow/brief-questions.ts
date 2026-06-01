export const BRIEF_QUESTION_IDS = [
  "site_topic",
  "audience",
  "visitor_action",
  "site_tone",
] as const;

export type BriefQuestionId = (typeof BRIEF_QUESTION_IDS)[number];

export type BriefOptionDef = {
  id: string;
  i18nKey: string;
  allowsCustom?: boolean;
};

export type BriefQuestionDef = {
  id: BriefQuestionId;
  i18nKey: string;
  options: readonly BriefOptionDef[];
};

export const BRIEF_QUESTIONS: readonly BriefQuestionDef[] = [
  {
    id: "site_topic",
    i18nKey: "site_topic",
    options: [
      { id: "local_business", i18nKey: "local_business" },
      { id: "services", i18nKey: "services" },
      { id: "shop", i18nKey: "shop" },
      { id: "portfolio", i18nKey: "portfolio" },
      { id: "nonprofit", i18nKey: "nonprofit" },
      { id: "personal", i18nKey: "personal" },
      { id: "other", i18nKey: "other", allowsCustom: true },
    ],
  },
  {
    id: "audience",
    i18nKey: "audience",
    options: [
      { id: "local", i18nKey: "local" },
      { id: "regional", i18nKey: "regional" },
      { id: "national", i18nKey: "national" },
      { id: "b2b", i18nKey: "b2b" },
      { id: "community", i18nKey: "community" },
      { id: "mixed", i18nKey: "mixed" },
    ],
  },
  {
    id: "visitor_action",
    i18nKey: "visitor_action",
    options: [
      { id: "contact", i18nKey: "contact" },
      { id: "book", i18nKey: "book" },
      { id: "buy", i18nKey: "buy" },
      { id: "inform", i18nKey: "inform" },
      { id: "subscribe", i18nKey: "subscribe" },
    ],
  },
  {
    id: "site_tone",
    i18nKey: "site_tone",
    options: [
      { id: "modern", i18nKey: "modern" },
      { id: "warm", i18nKey: "warm" },
      { id: "bold", i18nKey: "bold" },
      { id: "calm", i18nKey: "calm" },
      { id: "premium", i18nKey: "premium" },
    ],
  },
] as const;

export type BriefAnswer = {
  id: BriefQuestionId;
  optionId: string;
  customText?: string;
};

export type BriefPayloadV1 = {
  version: 1;
  answers: BriefAnswer[];
};

export function getBriefQuestion(id: BriefQuestionId): BriefQuestionDef | undefined {
  return BRIEF_QUESTIONS.find((q) => q.id === id);
}

export function isValidBriefOption(questionId: BriefQuestionId, optionId: string): boolean {
  const q = getBriefQuestion(questionId);
  return Boolean(q?.options.some((o) => o.id === optionId));
}

export function parseBriefPayload(raw: string | null | undefined): BriefPayloadV1 | null {
  if (!raw?.trim()) {
    return null;
  }
  try {
    const data = JSON.parse(raw) as unknown;
    if (!data || typeof data !== "object") {
      return null;
    }
    const o = data as Record<string, unknown>;
    if (o.version !== 1 || !Array.isArray(o.answers)) {
      return null;
    }
    const answers: BriefAnswer[] = [];
    for (const row of o.answers) {
      if (!row || typeof row !== "object") {
        return null;
      }
      const r = row as Record<string, unknown>;
      if (typeof r.id !== "string" || typeof r.optionId !== "string") {
        return null;
      }
      if (!BRIEF_QUESTION_IDS.includes(r.id as BriefQuestionId)) {
        return null;
      }
      const qid = r.id as BriefQuestionId;
      if (!isValidBriefOption(qid, r.optionId)) {
        return null;
      }
      const q = getBriefQuestion(qid)!;
      const opt = q.options.find((x) => x.id === r.optionId)!;
      const customText =
        typeof r.customText === "string" ? r.customText.trim().slice(0, 500) : undefined;
      if (opt.allowsCustom && r.optionId === "other" && !customText) {
        return null;
      }
      answers.push({
        id: qid,
        optionId: r.optionId,
        ...(opt.allowsCustom && customText ? { customText } : {}),
      });
    }
    if (answers.length !== BRIEF_QUESTION_IDS.length) {
      return null;
    }
    const ids = new Set(answers.map((a) => a.id));
    if (ids.size !== BRIEF_QUESTION_IDS.length) {
      return null;
    }
    return { version: 1, answers };
  } catch {
    return null;
  }
}

export function defaultBriefPayload(): BriefPayloadV1 {
  return {
    version: 1,
    answers: BRIEF_QUESTIONS.map((q) => ({
      id: q.id,
      optionId: q.options[0].id,
    })),
  };
}
