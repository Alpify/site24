export type SiteTemplateId = "landing-basic" | "local-business" | "portfolio-minimal";

export type TemplateDraftSeed = { title: string; body: string | null };

export type SiteTemplate = {
  id: SiteTemplateId;
  /** i18n key under workflow.templates.<key> for title + description */
  i18nKey: string;
  drafts: TemplateDraftSeed[];
};

export const SITE_TEMPLATE_CATALOG: readonly SiteTemplate[] = [
  {
    id: "landing-basic",
    i18nKey: "landingBasic",
    drafts: [
      {
        title: "Startseite",
        body: "- Hero: Hauptversprechen\n- 3 Nutzen\n- Call-to-Action\n- Vertrauen (Logos oder Zitat)",
      },
      {
        title: "Über uns / Leistungen",
        body: "- Kurz vorstellen\n- Leistungen als Liste\n- Für wen ist das Angebot?",
      },
      { title: "Kontakt & Footer", body: "- Kontaktweg\n- Impressum/Datenschutz-Hinweis" },
    ],
  },
  {
    id: "local-business",
    i18nKey: "localBusiness",
    drafts: [
      {
        title: "Startseite (lokal)",
        body: "- Standort & Öffnungszeiten\n- Angebot in einem Satz\n- Termin / Anruf CTA",
      },
      {
        title: "Leistungen & Preise (optional)",
        body: "- Leistungsliste\n- FAQ\n- Garantie / Zertifikate",
      },
      { title: "Kontakt & Anfahrt", body: "- Karte / Adresse\n- Parken\n- Barrierefreiheit" },
    ],
  },
  {
    id: "portfolio-minimal",
    i18nKey: "portfolioMinimal",
    drafts: [
      { title: "Intro", body: "- Name / Rolle\n- 1 Satz Positionierung\n- Link zu Arbeiten" },
      {
        title: "Projekt 1",
        body: "- Problem\n- Vorgehen\n- Ergebnis\n- Bildideen (Platzhalter)",
      },
      { title: "Projekt 2", body: "- …\n- …" },
      { title: "Kontakt", body: "- E-Mail / Social\n- Verfügbarkeit" },
    ],
  },
] as const;

export function getTemplateById(id: string): SiteTemplate | undefined {
  return SITE_TEMPLATE_CATALOG.find((t) => t.id === id);
}
