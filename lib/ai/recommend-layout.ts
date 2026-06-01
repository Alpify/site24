import { generateText } from "ai";

import { createOpenRouterModel } from "@/lib/ai/openrouter-client";
import { parseJsonObject } from "@/lib/ai/parse-json-response";
import {
  LAYOUT_PROPOSAL_IDS,
  isLayoutProposalId,
  type LayoutProposalId,
} from "@/lib/workflow/layout-proposals";

type AiLayoutResponse = {
  proposalId?: string;
  reason?: string;
};

export async function recommendLayoutFromBrief(opts: {
  locale: string;
  context: string;
}): Promise<{ proposalId: LayoutProposalId; reason: string }> {
  const de = opts.locale === "de";
  const ids = LAYOUT_PROPOSAL_IDS.join(", ");

  const { text } = await generateText({
    model: createOpenRouterModel(),
    system: de
      ? "Du empfiehlst eine Layout-Skizze für site24.com. Nur JSON, kein Markdown."
      : "You recommend a layout sketch for site24.com. JSON only, no markdown.",
    prompt: de
      ? `${opts.context}\n\nErlaubte proposalId: ${ids}\n\nJSON: {"proposalId":"...","reason":"1 kurzer Satz auf Deutsch"}\n\nfocus-landing: klassische Landing. local-trust: lokales Geschäft. showcase-work: Portfolio. lean-onepager: eine kompakte Seite.`
      : `${opts.context}\n\nAllowed proposalId: ${ids}\n\nJSON: {"proposalId":"...","reason":"1 short sentence in English"}\n\nfocus-landing: classic landing. local-trust: local business. showcase-work: portfolio. lean-onepager: single compact page.`,
    maxOutputTokens: 200,
    temperature: 0.2,
  });

  const parsed = parseJsonObject<AiLayoutResponse>(text);
  const id = parsed?.proposalId?.trim() ?? "";
  const proposalId = isLayoutProposalId(id) ? id : "focus-landing";
  const reason =
    parsed?.reason?.trim() ||
    (de ? "Passt gut zu deinem Briefing." : "Fits your briefing well.");

  return { proposalId, reason: reason.slice(0, 500) };
}
