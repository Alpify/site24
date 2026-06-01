import type { InferSelectModel } from "drizzle-orm";

import type { drafts, projects } from "@/lib/db/schema";
import { escapeHtml } from "@/lib/export/build-project-html";
import type { LayoutProposalId } from "@/lib/workflow/layout-proposals";
import { parseLayoutPayload } from "@/lib/workflow/layout-proposals";

function bodyToHtml(body: string): string {
  const lines = body.split("\n").map((l) => l.trim());
  const items = lines.filter((l) => l.startsWith("- ") || l.startsWith("• "));
  if (items.length >= 2) {
    return `<ul>${items.map((l) => `<li>${escapeHtml(l.replace(/^[-•]\s*/, ""))}</li>`).join("")}</ul>`;
  }
  return `<p>${escapeHtml(body).replace(/\n/g, "<br />")}</p>`;
}

const LAYOUT_THEMES: Record<
  LayoutProposalId,
  { accent: string; hero: string; font: string }
> = {
  "focus-landing": {
    accent: "#2563eb",
    hero: "linear-gradient(135deg,#1e3a8a 0%,#2563eb 55%,#60a5fa 100%)",
    font: "'Segoe UI',system-ui,sans-serif",
  },
  "local-trust": {
    accent: "#0d9488",
    hero: "linear-gradient(135deg,#134e4a 0%,#0d9488 50%,#5eead4 100%)",
    font: "Georgia,'Times New Roman',serif",
  },
  "showcase-work": {
    accent: "#7c3aed",
    hero: "linear-gradient(135deg,#4c1d95 0%,#7c3aed 50%,#c4b5fd 100%)",
    font: "'Helvetica Neue',Arial,sans-serif",
  },
  "lean-onepager": {
    accent: "#ea580c",
    hero: "linear-gradient(135deg,#9a3412 0%,#ea580c 50%,#fdba74 100%)",
    font: "system-ui,sans-serif",
  },
};

export function buildInteractiveSitePreviewHtml(opts: {
  project: InferSelectModel<typeof projects>;
  draftRows: InferSelectModel<typeof drafts>[];
  locale: string;
}): string {
  const { project, draftRows, locale } = opts;
  const layout = parseLayoutPayload(project.workflowBuilderJson);
  const proposalId: LayoutProposalId = layout?.proposalId ?? "focus-landing";
  const theme = LAYOUT_THEMES[proposalId];
  const title = escapeHtml(project.name);
  const cta = locale.startsWith("de") ? "Kontakt aufnehmen" : "Get in touch";

  const sections = draftRows
    .map((d, idx) => {
      const isHero = idx === 0;
      const inner = d.body ? bodyToHtml(d.body) : `<p class="muted">${locale.startsWith("de") ? "Inhalt folgt …" : "Content coming …"}</p>`;
      return `<section class="site-section${isHero ? " site-hero" : ""}" data-section-id="${escapeHtml(d.id)}" data-section-title="${escapeHtml(d.title)}" tabindex="0">
  <div class="section-inner">
    <h2>${escapeHtml(d.title)}</h2>
    ${inner}
  </div>
</section>`;
    })
    .join("\n");

  const empty =
    draftRows.length === 0
      ? `<section class="site-section site-hero" data-section-id="placeholder" data-section-title="${escapeHtml(title)}">
  <div class="section-inner"><h1>${title}</h1><p>${locale.startsWith("de") ? "Website wird generiert …" : "Generating your site …"}</p></div>
</section>`
      : sections;

  return `<!DOCTYPE html>
<html lang="${escapeHtml(locale)}">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${title}</title>
<style>
:root { --accent: ${theme.accent}; --hero: ${theme.hero}; }
* { box-sizing: border-box; }
body { margin: 0; font-family: ${theme.font}; color: #0f172a; background: #f8fafc; line-height: 1.55; }
header.site-bar { display: flex; align-items: center; justify-content: space-between; padding: 0.75rem 1.25rem; background: #fff; border-bottom: 1px solid #e2e8f0; position: sticky; top: 0; z-index: 5; }
header.site-bar strong { font-size: 1rem; }
header.site-bar a { background: var(--accent); color: #fff; text-decoration: none; padding: 0.45rem 1rem; border-radius: 999px; font-size: 0.85rem; font-weight: 600; }
.site-section { scroll-margin-top: 4rem; outline: none; transition: box-shadow 0.15s; }
.site-section .section-inner { max-width: 52rem; margin: 0 auto; padding: 2.5rem 1.25rem; }
.site-hero { background: var(--hero); color: #fff; }
.site-hero h2, .site-hero h1 { font-size: clamp(1.75rem, 4vw, 2.5rem); margin: 0 0 1rem; line-height: 1.15; }
.site-hero p, .site-hero li { color: rgba(255,255,255,0.92); }
.site-section:not(.site-hero) { background: #fff; border-bottom: 1px solid #e2e8f0; }
.site-section:not(.site-hero) h2 { font-size: 1.35rem; margin: 0 0 0.75rem; color: #0f172a; }
.site-section ul { margin: 0.5rem 0 0; padding-left: 1.25rem; }
.site-section li { margin: 0.35rem 0; }
.muted { opacity: 0.7; }
.site-section:hover { box-shadow: inset 0 0 0 2px color-mix(in srgb, var(--accent) 35%, transparent); }
.site-section.is-selected { box-shadow: inset 0 0 0 3px var(--accent); }
.site-section.is-in-marquee { box-shadow: inset 0 0 0 2px #f59e0b; }
#select-rect { position: fixed; border: 2px dashed #f59e0b; background: rgba(245,158,11,0.12); pointer-events: none; z-index: 50; display: none; }
footer { text-align: center; padding: 2rem 1rem; font-size: 0.8rem; color: #64748b; }
</style>
</head>
<body>
<div id="select-rect"></div>
<header class="site-bar"><strong>${title}</strong><a href="#contact">${cta}</a></header>
<main>${empty}</main>
<footer id="contact">${locale.startsWith("de") ? "Vorschau · site24" : "Preview · site24"}</footer>
<script>
(function(){
  var selectedId = null;
  var rectEl = document.getElementById('select-rect');
  var drag = null;

  function sections() {
    return Array.prototype.slice.call(document.querySelectorAll('[data-section-id]'));
  }

  function notify(payload) {
    if (window.parent && window.parent !== window) {
      window.parent.postMessage(Object.assign({ source: 'site24-preview' }, payload), '*');
    }
  }

  function setSelected(id) {
    selectedId = id;
    sections().forEach(function(el) {
      el.classList.toggle('is-selected', el.getAttribute('data-section-id') === id);
      el.classList.remove('is-in-marquee');
    });
    var el = document.querySelector('[data-section-id="' + id + '"]');
    if (el) {
      notify({ type: 'section-select', sectionId: id, title: el.getAttribute('data-section-title') || '' });
    }
  }

  sections().forEach(function(el) {
    el.addEventListener('click', function(e) {
      e.preventDefault();
      setSelected(el.getAttribute('data-section-id'));
    });
  });

  document.addEventListener('mousedown', function(e) {
    if (e.button !== 0) return;
    drag = { x0: e.clientX, y0: e.clientY, x1: e.clientX, y1: e.clientY };
    rectEl.style.display = 'block';
  });

  document.addEventListener('mousemove', function(e) {
    if (!drag) return;
    drag.x1 = e.clientX;
    drag.y1 = e.clientY;
    var l = Math.min(drag.x0, drag.x1);
    var t = Math.min(drag.y0, drag.y1);
    var w = Math.abs(drag.x1 - drag.x0);
    var h = Math.abs(drag.y1 - drag.y0);
    rectEl.style.left = l + 'px';
    rectEl.style.top = t + 'px';
    rectEl.style.width = w + 'px';
    rectEl.style.height = h + 'px';
    if (w > 12 && h > 12) {
      var r = { left: l, top: t, right: l + w, bottom: t + h };
      var hits = [];
      sections().forEach(function(el) {
        var b = el.getBoundingClientRect();
        var hit = !(b.right < r.left || b.left > r.right || b.bottom < r.top || b.top > r.bottom);
        el.classList.toggle('is-in-marquee', hit);
        if (hit) hits.push(el.getAttribute('data-section-id'));
      });
      notify({ type: 'section-marquee', sectionIds: hits });
    }
  });

  document.addEventListener('mouseup', function() {
    if (!drag) return;
    var w = Math.abs(drag.x1 - drag.x0);
    var h = Math.abs(drag.y1 - drag.y0);
    if (w > 12 && h > 12) {
      var hits = [];
      sections().forEach(function(el) {
        if (el.classList.contains('is-in-marquee')) {
          hits.push(el.getAttribute('data-section-id'));
        }
      });
      if (hits.length === 1) setSelected(hits[0]);
      else if (hits.length > 1) notify({ type: 'section-multi-select', sectionIds: hits });
    }
    drag = null;
    rectEl.style.display = 'none';
    sections().forEach(function(el) { el.classList.remove('is-in-marquee'); });
  });

  notify({ type: 'preview-ready' });
})();
</script>
</body>
</html>`;
}
