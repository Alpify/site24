import { generateText } from "ai";

import { createOpenRouterModel } from "@/lib/ai/openrouter-client";

export type ExpandDraftParams = {
  locale: string;
  projectName: string;
  draftTitle: string;
  draftBody: string | null;
  context?: string;
};

export async function expandDraftNotes(
  params: ExpandDraftParams,
): Promise<string> {
  const systemDe =
    "Du hilfst beim Website-Entwurf für site24.com. Erweitere die Nutzernotizen zu einer klaren, kurzen Gliederung (Stichpunkte oder kurze Absätze). Keine Begrüßung, keine Meta-Kommentare, keine Markdown-Überschriften mit #.";
  const systemEn =
    "You help with a site24.com website draft. Expand the user's notes into a clear, concise outline (bullets or short paragraphs). No greeting, no meta commentary, no # markdown headings.";

  const userDe = `${params.context ? `${params.context}\n\n` : ""}Projektname: ${params.projectName}\nAbschnitt: ${params.draftTitle}\n\nAktuelle Notizen:\n${params.draftBody?.trim() || "(noch leer)"}\n\nBitte strukturiere und erweitere sinnvoll für eine spätere Website.`;
  const userEn = `${params.context ? `${params.context}\n\n` : ""}Project name: ${params.projectName}\nSection: ${params.draftTitle}\n\nCurrent notes:\n${params.draftBody?.trim() || "(empty)"}\n\nPlease structure and expand for a future website.`;

  const { text } = await generateText({
    model: createOpenRouterModel(),
    system: params.locale === "de" ? systemDe : systemEn,
    prompt: params.locale === "de" ? userDe : userEn,
    maxOutputTokens: 1200,
    temperature: 0.5,
  });

  return text.trim();
}
