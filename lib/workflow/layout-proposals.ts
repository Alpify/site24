import type { SiteTemplateId } from "@/lib/templates/catalog";

export const LAYOUT_PROPOSAL_IDS = [
  "focus-landing",
  "local-trust",
  "showcase-work",
  "lean-onepager",
] as const;

export type LayoutProposalId = (typeof LAYOUT_PROPOSAL_IDS)[number];

export type LayoutProposalDef = {
  id: LayoutProposalId;
  templateId: SiteTemplateId | null;
  i18nKey: string;
};

export const LAYOUT_PROPOSALS: readonly LayoutProposalDef[] = [
  { id: "focus-landing", templateId: "landing-basic", i18nKey: "focusLanding" },
  { id: "local-trust", templateId: "local-business", i18nKey: "localTrust" },
  { id: "showcase-work", templateId: "portfolio-minimal", i18nKey: "showcaseWork" },
  { id: "lean-onepager", templateId: null, i18nKey: "leanOnepager" },
] as const;

export type LayoutPayloadV2 = {
  version: 2;
  proposalId: LayoutProposalId;
};

/** @deprecated Legacy builder payload — still parsed for layout step. */
export type LegacyBuilderPayloadV1 = {
  version: 1;
  proposalId: LayoutProposalId;
  answers?: unknown[];
};

export function isLayoutProposalId(value: string): value is LayoutProposalId {
  return (LAYOUT_PROPOSAL_IDS as readonly string[]).includes(value);
}

export function getLayoutProposalDef(id: string): LayoutProposalDef | undefined {
  return LAYOUT_PROPOSALS.find((p) => p.id === id);
}

export function parseLayoutPayload(raw: string | null | undefined): LayoutPayloadV2 | null {
  if (!raw?.trim()) {
    return null;
  }
  try {
    const data = JSON.parse(raw) as unknown;
    if (!data || typeof data !== "object") {
      return null;
    }
    const o = data as Record<string, unknown>;
    if (o.version === 2 && typeof o.proposalId === "string" && isLayoutProposalId(o.proposalId)) {
      return { version: 2, proposalId: o.proposalId };
    }
    if (o.version === 1 && typeof o.proposalId === "string" && isLayoutProposalId(o.proposalId)) {
      return { version: 2, proposalId: o.proposalId };
    }
    return null;
  } catch {
    return null;
  }
}

export function leanOnePagerSeed(locale: string): { title: string; body: string } {
  if (locale.startsWith("de")) {
    return {
      title: "One-Pager",
      body:
        "- Kurzer Hero mit Angebot in einem Satz\n- 2–3 Nutzen oder Schritte\n- Kontakt / nächster Schritt\n- Platz für ein Bild (später)",
    };
  }
  return {
    title: "One-pager",
    body:
      "- Short hero with your offer in one line\n- 2–3 benefits or steps\n- Contact / next step\n- Space for an image (later)",
  };
}
