import { generateText } from "ai";

import { createOpenRouterModel } from "@/lib/ai/openrouter-client";
import { parseJsonObject } from "@/lib/ai/parse-json-response";

type AiSection = { title?: string; body?: string };

export async function createSectionWithAi(opts: {
  locale: string;
  context: string;
  description: string;
}): Promise<{ title: string; body: string }> {
  const de = opts.locale === "de";

  const { text } = await generateText({
    model: createOpenRouterModel(),
    system: de
      ? "Du legst einen neuen Website-Abschnitt an. Antworte nur mit JSON."
      : "You create a new website section. Reply with JSON only.",
    prompt: de
      ? `${opts.context}\n\nNeuer Abschnitt — Wunsch:\n${opts.description}\n\nJSON: {"title":"Kurztitel","body":"Stichpunkte mit - oder Absätze"}\nSprache: Deutsch.`
      : `${opts.context}\n\nNew section — request:\n${opts.description}\n\nJSON: {"title":"Short title","body":"bullets with - or paragraphs"}\nLanguage: English.`,
    maxOutputTokens: 900,
    temperature: 0.55,
  });

  const parsed = parseJsonObject<AiSection>(text);
  return {
    title: (parsed?.title ?? (de ? "Neuer Abschnitt" : "New section")).trim().slice(0, 200),
    body: (parsed?.body ?? "").trim().slice(0, 50_000),
  };
}
