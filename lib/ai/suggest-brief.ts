import { generateText } from "ai";

import { createOpenRouterModel } from "@/lib/ai/openrouter-client";
import { parseJsonObject } from "@/lib/ai/parse-json-response";
import { BRIEF_OPTION_IDS } from "@/lib/workflow/project-context";
import {
  BRIEF_QUESTION_IDS,
  BRIEF_QUESTIONS,
  defaultBriefPayload,
  parseBriefPayload,
  type BriefPayloadV2,
} from "@/lib/workflow/brief-questions";

type AiBriefResponse = {
  answers?: { id: string; optionIds?: string[]; optionId?: string; customText?: string }[];
  notes?: string;
};

export async function suggestBriefFromIdea(opts: {
  locale: string;
  projectName: string;
  idea: string;
}): Promise<{ payload: BriefPayloadV2; notes: string }> {
  const de = opts.locale === "de";
  const optionGuide = BRIEF_QUESTIONS.map((q) => {
    const multi = q.multiSelect ? " (mehrere möglich)" : " (genau eine)";
    return `${q.id}${multi}: [${BRIEF_OPTION_IDS[q.id].join(", ")}]`;
  }).join("\n");

  const { text } = await generateText({
    model: createOpenRouterModel(),
    system: de
      ? "Du bist Briefing-Assistent für site24.com. Antworte NUR mit JSON."
      : "You are a briefing assistant for site24.com. Reply ONLY with JSON.",
    prompt: de
      ? `Projekt: ${opts.projectName}\nIdee:\n${opts.idea || "(keine)"}\n\nFragen:\n${optionGuide}\n\nJSON: {"answers":[{"id":"site_topic","optionIds":["local_business",...]}, ...], "notes":"..."}\n\nAlle IDs: ${BRIEF_QUESTION_IDS.join(", ")}. Pro Frage mindestens 1 optionId. content_status nur 1 Wert. Bei other customText.`
      : `Project: ${opts.projectName}\nIdea:\n${opts.idea || "(none)"}\n\nQuestions:\n${optionGuide}\n\nJSON: {"answers":[{"id":"site_topic","optionIds":["local_business",...]}, ...], "notes":"..."}\n\nAll ids: ${BRIEF_QUESTION_IDS.join(", ")}. At least 1 optionId per question. content_status only 1. For other set customText.`,
    maxOutputTokens: 1200,
    temperature: 0.35,
  });

  const parsed = parseJsonObject<AiBriefResponse>(text);
  if (!parsed?.answers) {
    return { payload: defaultBriefPayload(), notes: opts.idea.slice(0, 2000) };
  }

  const normalized = parsed.answers.map((a) => ({
    id: a.id,
    optionIds: a.optionIds ?? (a.optionId ? [a.optionId] : []),
    customText: a.customText,
  }));

  const raw = JSON.stringify({ version: 2, answers: normalized });
  const validated = parseBriefPayload(raw);
  return {
    payload: validated ?? defaultBriefPayload(),
    notes: (parsed.notes ?? opts.idea).trim().slice(0, 20_000),
  };
}
