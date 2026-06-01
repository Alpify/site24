import { generateText } from "ai";

import { createOpenRouterModel } from "@/lib/ai/openrouter-client";

export async function reviseSectionWithAi(opts: {
  locale: string;
  context: string;
  sectionTitle: string;
  currentBody: string | null;
  instruction: string;
}): Promise<string> {
  const de = opts.locale === "de";

  const { text } = await generateText({
    model: createOpenRouterModel(),
    system: de
      ? "Du überarbeitest einen Website-Abschnitt für site24.com. Liefere nur den neuen Abschnittstext (Stichpunkte mit \"- \" oder kurze Absätze). Keine Meta-Kommentare, kein JSON."
      : "You revise one website section for site24.com. Return only the new section copy (bullets with \"- \" or short paragraphs). No meta commentary, no JSON.",
    prompt: de
      ? `${opts.context}\n\nAbschnitt: ${opts.sectionTitle}\n\nAktueller Text:\n${opts.currentBody?.trim() || "(leer)"}\n\nÄnderungswunsch:\n${opts.instruction}\n\nSchreibe den überarbeiteten Abschnitt auf Deutsch.`
      : `${opts.context}\n\nSection: ${opts.sectionTitle}\n\nCurrent copy:\n${opts.currentBody?.trim() || "(empty)"}\n\nChange request:\n${opts.instruction}\n\nWrite the revised section in English.`,
    maxOutputTokens: 1400,
    temperature: 0.55,
  });

  return text.trim().slice(0, 50_000);
}
