import type { InferSelectModel } from "drizzle-orm";

import type { drafts, projects } from "@/lib/db/schema";
import { getProposalDef, parseBuilderPayload } from "@/lib/workflow/builder-proposals";

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

  const goalsHeading = locale.startsWith("de") ? "Idee" : "Idea";
  const structureHeading = locale.startsWith("de") ? "Seitenstruktur" : "Site structure";

  if (project.workflowGoals) {
    parts.push(`<section><h2>${escapeHtml(goalsHeading)}</h2><pre style='white-space:pre-wrap'>`);
    parts.push(escapeHtml(project.workflowGoals));
    parts.push("</pre></section>");
  }
  if (project.workflowStructure) {
    parts.push(`<section><h2>${escapeHtml(structureHeading)}</h2><pre style='white-space:pre-wrap'>`);
    parts.push(escapeHtml(project.workflowStructure));
    parts.push("</pre></section>");
  }

  const builder = parseBuilderPayload(project.workflowBuilderJson);
  if (builder) {
    const builderHeading = locale.startsWith("de") ? "Baukasten" : "Builder";
    const def = getProposalDef(builder.proposalId);
    const sketch = def?.id ?? builder.proposalId;
    const lines = builder.answers.map((a) => `${a.id}: ${a.choice}`).join("\n");
    parts.push(`<section><h2>${escapeHtml(builderHeading)}</h2><pre style='white-space:pre-wrap'>`);
    parts.push(escapeHtml(`Sketch: ${sketch}\n${lines}`));
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
