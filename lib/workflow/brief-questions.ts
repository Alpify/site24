export const BRIEF_QUESTION_IDS = [
  "site_topic",
  "audience",
  "visitor_action",
  "site_tone",
  "brand_personality",
  "must_have",
  "content_status",
  "priority",
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
  /** When true, users can pick several options (chips). */
  multiSelect: boolean;
  options: readonly BriefOptionDef[];
};

export const BRIEF_QUESTIONS: readonly BriefQuestionDef[] = [
  {
    id: "site_topic",
    i18nKey: "site_topic",
    multiSelect: true,
    options: [
      { id: "local_business", i18nKey: "local_business" },
      { id: "services", i18nKey: "services" },
      { id: "shop", i18nKey: "shop" },
      { id: "portfolio", i18nKey: "portfolio" },
      { id: "nonprofit", i18nKey: "nonprofit" },
      { id: "personal", i18nKey: "personal" },
      { id: "events", i18nKey: "events" },
      { id: "other", i18nKey: "other", allowsCustom: true },
    ],
  },
  {
    id: "audience",
    i18nKey: "audience",
    multiSelect: true,
    options: [
      { id: "local", i18nKey: "local" },
      { id: "regional", i18nKey: "regional" },
      { id: "national", i18nKey: "national" },
      { id: "b2b", i18nKey: "b2b" },
      { id: "community", i18nKey: "community" },
      { id: "young", i18nKey: "young" },
      { id: "seniors", i18nKey: "seniors" },
      { id: "mixed", i18nKey: "mixed" },
    ],
  },
  {
    id: "visitor_action",
    i18nKey: "visitor_action",
    multiSelect: true,
    options: [
      { id: "contact", i18nKey: "contact" },
      { id: "book", i18nKey: "book" },
      { id: "buy", i18nKey: "buy" },
      { id: "inform", i18nKey: "inform" },
      { id: "subscribe", i18nKey: "subscribe" },
      { id: "download", i18nKey: "download" },
      { id: "visit", i18nKey: "visit" },
    ],
  },
  {
    id: "site_tone",
    i18nKey: "site_tone",
    multiSelect: true,
    options: [
      { id: "modern", i18nKey: "modern" },
      { id: "warm", i18nKey: "warm" },
      { id: "bold", i18nKey: "bold" },
      { id: "calm", i18nKey: "calm" },
      { id: "premium", i18nKey: "premium" },
      { id: "playful", i18nKey: "playful" },
    ],
  },
  {
    id: "brand_personality",
    i18nKey: "brand_personality",
    multiSelect: true,
    options: [
      { id: "trustworthy", i18nKey: "trustworthy" },
      { id: "innovative", i18nKey: "innovative" },
      { id: "personal", i18nKey: "personal" },
      { id: "expert", i18nKey: "expert" },
      { id: "sustainable", i18nKey: "sustainable" },
      { id: "luxury", i18nKey: "luxury" },
    ],
  },
  {
    id: "must_have",
    i18nKey: "must_have",
    multiSelect: true,
    options: [
      { id: "hero", i18nKey: "hero" },
      { id: "services_list", i18nKey: "services_list" },
      { id: "about", i18nKey: "about" },
      { id: "testimonials", i18nKey: "testimonials" },
      { id: "gallery", i18nKey: "gallery" },
      { id: "pricing", i18nKey: "pricing" },
      { id: "faq", i18nKey: "faq" },
      { id: "blog", i18nKey: "blog" },
      { id: "contact_form", i18nKey: "contact_form" },
      { id: "map", i18nKey: "map" },
    ],
  },
  {
    id: "content_status",
    i18nKey: "content_status",
    multiSelect: false,
    options: [
      { id: "have_copy", i18nKey: "have_copy" },
      { id: "need_help", i18nKey: "need_help" },
      { id: "starting_fresh", i18nKey: "starting_fresh" },
    ],
  },
  {
    id: "priority",
    i18nKey: "priority",
    multiSelect: true,
    options: [
      { id: "fast_launch", i18nKey: "fast_launch" },
      { id: "design", i18nKey: "design" },
      { id: "seo", i18nKey: "seo" },
      { id: "conversions", i18nKey: "conversions" },
      { id: "accessibility", i18nKey: "accessibility" },
    ],
  },
] as const;

export type BriefAnswer = {
  id: BriefQuestionId;
  optionIds: string[];
  customText?: string;
};

export type BriefPayloadV2 = {
  version: 2;
  answers: BriefAnswer[];
};

/** @deprecated v1 shape — parsed into v2 */
export type BriefPayloadV1 = {
  version: 1;
  answers: { id: BriefQuestionId; optionId: string; customText?: string }[];
};

export type BriefPayload = BriefPayloadV2;

export function getBriefQuestion(id: BriefQuestionId): BriefQuestionDef | undefined {
  return BRIEF_QUESTIONS.find((q) => q.id === id);
}

export function isValidBriefOption(questionId: BriefQuestionId, optionId: string): boolean {
  const q = getBriefQuestion(questionId);
  return Boolean(q?.options.some((o) => o.id === optionId));
}

function migrateV1ToV2(v1: BriefPayloadV1): BriefPayloadV2 {
  const byId = new Map(v1.answers.map((a) => [a.id, a]));
  return {
    version: 2,
    answers: BRIEF_QUESTIONS.map((q) => {
      const row = byId.get(q.id);
      const optionIds = row?.optionId ? [row.optionId] : [];
      return {
        id: q.id,
        optionIds,
        ...(row?.customText ? { customText: row.customText } : {}),
      };
    }),
  };
}

export function parseBriefPayload(raw: string | null | undefined): BriefPayloadV2 | null {
  if (!raw?.trim()) {
    return null;
  }
  try {
    const data = JSON.parse(raw) as unknown;
    if (!data || typeof data !== "object") {
      return null;
    }
    const o = data as Record<string, unknown>;

    if (o.version === 1 && Array.isArray(o.answers)) {
      const v1 = o as BriefPayloadV1;
      return validateBriefPayload(migrateV1ToV2(v1));
    }

    if (o.version !== 2 || !Array.isArray(o.answers)) {
      return null;
    }

    const answers: BriefAnswer[] = [];
    for (const row of o.answers) {
      if (!row || typeof row !== "object") {
        return null;
      }
      const r = row as Record<string, unknown>;
      if (typeof r.id !== "string" || !Array.isArray(r.optionIds)) {
        return null;
      }
      if (!BRIEF_QUESTION_IDS.includes(r.id as BriefQuestionId)) {
        return null;
      }
      const qid = r.id as BriefQuestionId;
      const optionIds = r.optionIds.filter((x): x is string => typeof x === "string");
      for (const oid of optionIds) {
        if (!isValidBriefOption(qid, oid)) {
          return null;
        }
      }
      const q = getBriefQuestion(qid)!;
      const customText =
        typeof r.customText === "string" ? r.customText.trim().slice(0, 500) : undefined;
      if (optionIds.includes("other") && q.options.some((x) => x.id === "other") && !customText) {
        return null;
      }
      answers.push({
        id: qid,
        optionIds: [...new Set(optionIds)],
        ...(customText ? { customText } : {}),
      });
    }

    return validateBriefPayload({ version: 2, answers });
  } catch {
    return null;
  }
}

function validateBriefPayload(payload: BriefPayloadV2): BriefPayloadV2 | null {
  if (payload.answers.length !== BRIEF_QUESTION_IDS.length) {
    return null;
  }
  const ids = new Set(payload.answers.map((a) => a.id));
  if (ids.size !== BRIEF_QUESTION_IDS.length) {
    return null;
  }
  for (const a of payload.answers) {
    const q = getBriefQuestion(a.id)!;
    if (a.optionIds.length === 0) {
      return null;
    }
    if (!q.multiSelect && a.optionIds.length > 1) {
      return null;
    }
  }
  return payload;
}

export function defaultBriefPayload(): BriefPayloadV2 {
  return {
    version: 2,
    answers: BRIEF_QUESTIONS.map((q) => ({
      id: q.id,
      optionIds: q.multiSelect ? [] : [],
    })),
  };
}

export function briefAnswerLabels(
  answer: BriefAnswer,
  labelOption: (qid: BriefQuestionId, optionI18nKey: string) => string,
): string[] {
  const q = getBriefQuestion(answer.id);
  if (!q) return [];
  return answer.optionIds.map((oid) => {
    const opt = q.options.find((o) => o.id === oid);
    return labelOption(answer.id, opt?.i18nKey ?? oid);
  });
}
