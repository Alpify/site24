import type { InferSelectModel } from "drizzle-orm";

import type { drafts, projects } from "@/lib/db/schema";
import { BRIEF_QUESTIONS, parseBriefPayload } from "@/lib/workflow/brief-questions";
import { getLayoutProposalDef, parseLayoutPayload } from "@/lib/workflow/layout-proposals";

export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function buildProjectHtmlExport(opts: {
  project: InferSelectModel<typeof projects>;
  draftRows: InferSelectModel<typeof drafts>[];
  locale: string;
}): string {
  const { project, draftRows, locale } = opts;
  const title = escapeHtml(project.name);
  const parts: string[] = [
    "<!DOCTYPE html>",
    '<html lang="' + escapeHtml(locale) + '">',
    "<head>",
    '<meta charset="utf-8" />',
    `<title>${title}</title>`,
    "<style>body{font-family:system-ui,sans-serif;max-width:42rem;margin:2rem auto;padding:0 1rem;line-height:1.5;color:#111}section{margin-bottom:2rem}h1{font-size:1.75rem}h2{font-size:1.15rem;margin-bottom:0.5rem}</style>",
    "</head>",
    "<body>",
    `<h1>${title}</h1>`,
  ];

  const briefHeading = locale.startsWith("de") ? "Briefing" : "Briefing";
  const notesHeading = locale.startsWith("de") ? "Notizen" : "Notes";
  const layoutHeading = locale.startsWith("de") ? "Layout" : "Layout";

  const brief = parseBriefPayload(project.workflowBriefJson);
  if (brief) {
    const lines = brief.answers.map((a) => {
      const q = BRIEF_QUESTIONS.find((x) => x.id === a.id);
      const opt = q?.options.find((o) => o.id === a.optionId);
      const label = opt?.id ?? a.optionId;
      return `${a.id}: ${label}${a.customText ? ` (${a.customText})` : ""}`;
    });
    parts.push(`<section><h2>${escapeHtml(briefHeading)}</h2><pre style='white-space:pre-wrap'>`);
    parts.push(escapeHtml(lines.join("\n")));
    parts.push("</pre></section>");
  }

  if (project.workflowGoals) {
    parts.push(`<section><h2>${escapeHtml(notesHeading)}</h2><pre style='white-space:pre-wrap'>`);
    parts.push(escapeHtml(project.workflowGoals));
    parts.push("</pre></section>");
  }

  const layout = parseLayoutPayload(project.workflowBuilderJson);
  if (layout) {
    const def = getLayoutProposalDef(layout.proposalId);
    parts.push(`<section><h2>${escapeHtml(layoutHeading)}</h2><pre style='white-space:pre-wrap'>`);
    parts.push(escapeHtml(`Sketch: ${def?.id ?? layout.proposalId}`));
    parts.push("</pre></section>");
  }

  for (const d of draftRows) {
    parts.push("<section>");
    parts.push(`<h2>${escapeHtml(d.title)}</h2>`);
    if (d.body) {
      parts.push(`<pre style='white-space:pre-wrap'>${escapeHtml(d.body)}</pre>`);
    }
    parts.push("</section>");
  }

  parts.push("</body></html>");
  return parts.join("");
}
