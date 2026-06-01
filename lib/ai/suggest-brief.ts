import { generateText } from "ai";

import { createOpenRouterModel } from "@/lib/ai/openrouter-client";
import { parseJsonObject } from "@/lib/ai/parse-json-response";
import { BRIEF_OPTION_IDS } from "@/lib/workflow/project-context";
import {
  BRIEF_QUESTIONS,
  defaultBriefPayload,
  parseBriefPayload,
  type BriefPayloadV1,
} from "@/lib/workflow/brief-questions";

type AiBriefResponse = {
  answers?: { id: string; optionId: string; customText?: string }[];
  notes?: string;
};

export async function suggestBriefFromIdea(opts: {
  locale: string;
  projectName: string;
  idea: string;
}): Promise<{ payload: BriefPayloadV1; notes: string }> {
  const de = opts.locale === "de";
  const optionGuide = BRIEF_QUESTIONS.map(
    (q) =>
      `${q.id}: [${BRIEF_OPTION_IDS[q.id].join(", ")}]`,
  ).join("\n");

  const { text } = await generateText({
    model: createOpenRouterModel(),
    system: de
      ? "Du bist Briefing-Assistent für site24.com. Antworte NUR mit einem JSON-Objekt, ohne Markdown."
      : "You are a briefing assistant for site24.com. Reply ONLY with a JSON object, no markdown.",
    prompt: de
      ? `Projekt: ${opts.projectName}\nIdee des Nutzers:\n${opts.idea || "(keine Idee angegeben)"}\n\nWähle pro Frage genau eine optionId aus den erlaubten Listen.\nFragen und erlaubte optionIds:\n${optionGuide}\n\nJSON-Format:\n{"answers":[{"id":"site_topic","optionId":"..."},...],"notes":"optional 1-3 Sätze Zusammenfassung"}\n\nRegeln: genau 4 answers (site_topic, audience, visitor_action, site_tone). Bei "other" customText setzen.`
      : `Project: ${opts.projectName}\nUser idea:\n${opts.idea || "(no idea provided)"}\n\nPick exactly one optionId per question from the allowed lists.\nQuestions and allowed optionIds:\n${optionGuide}\n\nJSON shape:\n{"answers":[{"id":"site_topic","optionId":"..."},...],"notes":"optional 1-3 sentence summary"}\n\nRules: exactly 4 answers (site_topic, audience, visitor_action, site_tone). For "other" set customText.`,
    maxOutputTokens: 800,
    temperature: 0.35,
  });

  const parsed = parseJsonObject<AiBriefResponse>(text);
  if (!parsed?.answers) {
    return { payload: defaultBriefPayload(), notes: opts.idea.slice(0, 2000) };
  }

  const raw = JSON.stringify({ version: 1, answers: parsed.answers });
  const validated = parseBriefPayload(raw);
  return {
    payload: validated ?? defaultBriefPayload(),
    notes: (parsed.notes ?? opts.idea).trim().slice(0, 20_000),
  };
}
