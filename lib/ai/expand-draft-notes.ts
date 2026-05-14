import { createOpenAI } from "@ai-sdk/openai";
import { generateText } from "ai";

export type ExpandDraftParams = {
  locale: string;
  projectName: string;
  draftTitle: string;
  draftBody: string | null;
};

const OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1";

export async function expandDraftNotes(
  params: ExpandDraftParams,
): Promise<string> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error("MISSING_OPENROUTER_KEY");
  }

  const modelId =
    process.env.OPENROUTER_MODEL?.trim() || "openai/gpt-4o-mini";

  const openrouter = createOpenAI({
    apiKey,
    baseURL: OPENROUTER_BASE_URL,
    headers: {
      "HTTP-Referer":
        process.env.OPENROUTER_HTTP_REFERER?.trim() || "https://site24.com",
      "X-Title": process.env.OPENROUTER_APP_TITLE?.trim() || "site24-marketing",
    },
  });

  const systemDe =
    "Du hilfst beim Website-Entwurf für site24.com. Erweitere die Nutzernotizen zu einer klaren, kurzen Gliederung (Stichpunkte oder kurze Absätze). Keine Begrüßung, keine Meta-Kommentare, keine Markdown-Überschriften mit #.";
  const systemEn =
    "You help with a site24.com website draft. Expand the user's notes into a clear, concise outline (bullets or short paragraphs). No greeting, no meta commentary, no # markdown headings.";

  const userDe = `Projektname: ${params.projectName}\nEntwurfstitel: ${params.draftTitle}\n\nAktuelle Notizen:\n${params.draftBody?.trim() || "(noch leer)"}\n\nBitte strukturiere und erweitere sinnvoll für eine spätere Website.`;
  const userEn = `Project name: ${params.projectName}\nDraft title: ${params.draftTitle}\n\nCurrent notes:\n${params.draftBody?.trim() || "(empty)"}\n\nPlease structure and expand for a future website.`;

  const { text } = await generateText({
    model: openrouter(modelId),
    system: params.locale === "de" ? systemDe : systemEn,
    prompt: params.locale === "de" ? userDe : userEn,
    maxOutputTokens: 1200,
    temperature: 0.5,
  });

  return text.trim();
}
