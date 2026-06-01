import { generateText } from "ai";

import { createOpenRouterModel } from "@/lib/ai/openrouter-client";
import { parseJsonObject } from "@/lib/ai/parse-json-response";

export type GeneratedSection = {
  title: string;
  body: string;
};

type AiSectionsResponse = {
  sections?: { title?: string; body?: string }[];
};

export async function generateSiteSections(opts: {
  locale: string;
  context: string;
  sectionHints: string[];
}): Promise<GeneratedSection[]> {
  const de = opts.locale === "de";
  const hints = opts.sectionHints.map((h, i) => `${i + 1}. ${h}`).join("\n");

  const { text } = await generateText({
    model: createOpenRouterModel(),
    system: de
      ? "Du schreibst Website-Entwürfe für site24.com: klare Überschriften und nutzbare Stichpunkte/Absätze. Nur JSON."
      : "You write website draft sections for site24.com: clear headings and usable bullets/copy. JSON only.",
    prompt: de
      ? `${opts.context}\n\nErstelle Texte für diese Abschnitte:\n${hints}\n\nJSON: {"sections":[{"title":"...","body":"..."}]}\n\nRegeln: body als Stichpunkte mit \"- \" oder kurze Absätze; keine # Überschriften; Ton aus Briefing; max ~120 Wörter pro Abschnitt; Sprache Deutsch.`
      : `${opts.context}\n\nWrite copy for these sections:\n${hints}\n\nJSON: {"sections":[{"title":"...","body":"..."}]}\n\nRules: body as \"- \" bullets or short paragraphs; no # headings; match briefing tone; max ~120 words per section; English.`,
    maxOutputTokens: 2800,
    temperature: 0.55,
  });

  const parsed = parseJsonObject<AiSectionsResponse>(text);
  if (!parsed?.sections?.length) {
    return [];
  }

  return parsed.sections
    .map((s) => ({
      title: (s.title ?? "").trim().slice(0, 200),
      body: (s.body ?? "").trim().slice(0, 50_000),
    }))
    .filter((s) => s.title.length > 0 && s.body.length > 0);
}
