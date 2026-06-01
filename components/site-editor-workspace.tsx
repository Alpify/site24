"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";

import { buttonClassName } from "@/components/ui/button";
import { saveWorkflowPolish } from "@/lib/projects/actions";
import {
  LAYOUT_PROPOSALS,
  type LayoutProposalId,
} from "@/lib/workflow/layout-proposals";

export type SiteEditorCopy = {
  previewTitle: string;
  previewHint: string;
  selectedLabel: string;
  instructionLabel: string;
  instructionPlaceholder: string;
  applyAi: string;
  applyingAi: string;
  newSectionLabel: string;
  newSectionPlaceholder: string;
  addSection: string;
  addingSection: string;
  regenerateSite: string;
  regenerating: string;
  layoutTitle: string;
  layoutHint: string;
  continueHosting: string;
  generatingBanner: string;
  multiSelectHint: string;
  noSelection: string;
};

type PreviewMessage =
  | { source?: string; type: "preview-ready" }
  | { source?: string; type: "section-select"; sectionId: string; title: string }
  | { source?: string; type: "section-marquee"; sectionIds: string[] }
  | { source?: string; type: "section-multi-select"; sectionIds: string[] };

export function SiteEditorWorkspace({
  locale,
  projectId,
  aiEnabled,
  copy,
  layoutLabels,
  currentLayoutId,
  autogen,
}: {
  locale: string;
  projectId: string;
  aiEnabled: boolean;
  copy: SiteEditorCopy;
  layoutLabels: Record<string, { title: string; hint: string }>;
  currentLayoutId: LayoutProposalId | null;
  autogen: boolean;
}) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [previewKey, setPreviewKey] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedTitle, setSelectedTitle] = useState("");
  const [instruction, setInstruction] = useState("");
  const [newSectionDesc, setNewSectionDesc] = useState("");
  const [generating, setGenerating] = useState(autogen && aiEnabled);
  const [busy, setBusy] = useState(false);
  const [pending, startTransition] = useTransition();

  const previewSrc = `/api/projects/${encodeURIComponent(projectId)}/preview-html?locale=${encodeURIComponent(locale)}&k=${previewKey}`;

  const refreshPreview = useCallback(() => {
    setPreviewKey((k) => k + 1);
  }, []);

  useEffect(() => {
    if (!autogen || !aiEnabled) return;
    let cancelled = false;
    setGenerating(true);
    fetch(
      `/api/projects/${encodeURIComponent(projectId)}/ai/generate-site?locale=${encodeURIComponent(locale)}`,
      { method: "POST", credentials: "include" },
    )
      .then((r) => r.json())
      .then(() => {
        if (!cancelled) refreshPreview();
      })
      .finally(() => {
        if (!cancelled) setGenerating(false);
      });
    return () => {
      cancelled = true;
    };
  }, [autogen, aiEnabled, locale, projectId, refreshPreview]);

  useEffect(() => {
    function onMessage(ev: MessageEvent) {
      const data = ev.data as PreviewMessage;
      if (!data || data.source !== "site24-preview") return;
      if (data.type === "section-select") {
        setSelectedId(data.sectionId);
        setSelectedTitle(data.title);
      }
      if (data.type === "section-multi-select" && data.sectionIds.length > 0) {
        setSelectedId(data.sectionIds[0] ?? null);
        setSelectedTitle(copy.multiSelectHint);
      }
    }
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [copy.multiSelectHint]);

  async function reviseSection() {
    if (!selectedId || !instruction.trim() || !aiEnabled) return;
    setBusy(true);
    try {
      const res = await fetch(
        `/api/projects/${encodeURIComponent(projectId)}/sections/${encodeURIComponent(selectedId)}/revise?locale=${encodeURIComponent(locale)}`,
        {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ instruction: instruction.trim() }),
        },
      );
      if (res.ok) {
        setInstruction("");
        refreshPreview();
      }
    } finally {
      setBusy(false);
    }
  }

  async function addSection() {
    if (!newSectionDesc.trim() || !aiEnabled) return;
    setBusy(true);
    try {
      const res = await fetch(
        `/api/projects/${encodeURIComponent(projectId)}/sections/create?locale=${encodeURIComponent(locale)}`,
        {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ description: newSectionDesc.trim() }),
        },
      );
      if (res.ok) {
        setNewSectionDesc("");
        refreshPreview();
      }
    } finally {
      setBusy(false);
    }
  }

  async function applyLayout(proposalId: LayoutProposalId) {
    if (!aiEnabled) return;
    setBusy(true);
    try {
      const res = await fetch(
        `/api/projects/${encodeURIComponent(projectId)}/ai/apply-layout?locale=${encodeURIComponent(locale)}`,
        {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ proposalId }),
        },
      );
      if (res.ok) refreshPreview();
    } finally {
      setBusy(false);
    }
  }

  async function regenerateSite() {
    if (!aiEnabled) return;
    setGenerating(true);
    try {
      const res = await fetch(
        `/api/projects/${encodeURIComponent(projectId)}/ai/generate-site?locale=${encodeURIComponent(locale)}`,
        { method: "POST", credentials: "include" },
      );
      if (res.ok) refreshPreview();
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="mt-6 space-y-6">
      {generating ? (
        <p
          role="status"
          className="rounded-xl border border-accent/30 bg-accent/10 px-4 py-3 text-sm text-foreground"
        >
          {copy.generatingBanner}
        </p>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(280px,0.8fr)]">
        <div className="space-y-2">
          <p className="text-sm font-semibold text-foreground">{copy.previewTitle}</p>
          <p className="text-xs text-muted">{copy.previewHint}</p>
          <div className="overflow-hidden rounded-2xl border border-border bg-muted/20 shadow-inner">
            <iframe
              ref={iframeRef}
              title={copy.previewTitle}
              src={previewSrc}
              className="h-[min(72vh,640px)] w-full bg-white"
              sandbox="allow-scripts allow-same-origin"
            />
          </div>
        </div>

        <aside className="space-y-5">
          <div className="rounded-2xl border border-border/80 bg-card p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">
              {copy.selectedLabel}
            </p>
            <p className="mt-1 text-sm font-medium text-foreground">
              {selectedTitle || copy.noSelection}
            </p>
            <label className="mt-4 block text-xs font-medium text-muted">
              {copy.instructionLabel}
              <textarea
                value={instruction}
                onChange={(e) => setInstruction(e.target.value)}
                rows={4}
                disabled={!selectedId || !aiEnabled || busy}
                placeholder={copy.instructionPlaceholder}
                className="mt-1.5 w-full resize-y rounded-lg border border-border bg-background px-3 py-2 text-sm"
              />
            </label>
            <button
              type="button"
              disabled={!selectedId || !instruction.trim() || !aiEnabled || busy}
              onClick={() => void reviseSection()}
              className={buttonClassName("primary", "mt-3 min-h-10 w-full text-sm")}
            >
              {busy ? copy.applyingAi : copy.applyAi}
            </button>
          </div>

          <div className="rounded-2xl border border-border/80 bg-card p-4 shadow-sm">
            <p className="text-sm font-semibold text-foreground">{copy.newSectionLabel}</p>
            <textarea
              value={newSectionDesc}
              onChange={(e) => setNewSectionDesc(e.target.value)}
              rows={3}
              disabled={!aiEnabled || busy}
              placeholder={copy.newSectionPlaceholder}
              className="mt-2 w-full resize-y rounded-lg border border-border bg-background px-3 py-2 text-sm"
            />
            <button
              type="button"
              disabled={!newSectionDesc.trim() || !aiEnabled || busy}
              onClick={() => void addSection()}
              className={buttonClassName("secondary", "mt-3 min-h-10 w-full text-sm")}
            >
              {busy ? copy.addingSection : copy.addSection}
            </button>
          </div>

          {aiEnabled ? (
            <button
              type="button"
              disabled={generating || busy}
              onClick={() => void regenerateSite()}
              className={buttonClassName("ghost", "min-h-10 w-full text-sm")}
            >
              {generating ? copy.regenerating : copy.regenerateSite}
            </button>
          ) : null}

          <div className="rounded-2xl border border-border/80 bg-card/60 p-4">
            <p className="text-sm font-semibold text-foreground">{copy.layoutTitle}</p>
            <p className="mt-1 text-xs text-muted">{copy.layoutHint}</p>
            <ul className="mt-3 space-y-2">
              {LAYOUT_PROPOSALS.map((p) => {
                const active = currentLayoutId === p.id;
                const lab = layoutLabels[p.i18nKey];
                return (
                  <li key={p.id}>
                    <button
                      type="button"
                      disabled={!aiEnabled || busy || generating}
                      onClick={() => void applyLayout(p.id)}
                      className={`w-full rounded-xl border px-3 py-2.5 text-left text-sm transition-colors ${
                        active
                          ? "border-accent bg-accent/10 font-medium text-foreground"
                          : "border-border/70 bg-background hover:border-accent/40"
                      }`}
                    >
                      <span className="block font-medium">{lab?.title ?? p.id}</span>
                      <span className="mt-0.5 block text-xs text-muted">{lab?.hint ?? ""}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>

          <form
            action={saveWorkflowPolish.bind(null, locale, projectId)}
            onSubmit={(e) => {
              startTransition(() => {
                /* server redirect */
              });
            }}
          >
            <input type="hidden" name="intent" value="next" />
            <button
              type="submit"
              disabled={pending || generating}
              className={buttonClassName("primary", "min-h-11 w-full shadow-md")}
            >
              {copy.continueHosting}
            </button>
          </form>
        </aside>
      </div>
    </div>
  );
}
