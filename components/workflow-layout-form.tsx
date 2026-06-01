"use client";

import { useEffect, useMemo, useState, useTransition } from "react";

import { buttonClassName } from "@/components/ui/button";
import { saveWorkflowLayout } from "@/lib/projects/actions";
import {
  LAYOUT_PROPOSALS,
  type LayoutPayloadV2,
  type LayoutProposalId,
  parseLayoutPayload,
} from "@/lib/workflow/layout-proposals";

export type WorkflowLayoutCopy = {
  proposalsTitle: string;
  sketchBadge: string;
  save: string;
  next: string;
  pendingSave: string;
  pendingNext: string;
  invalidBanner: string;
  aiRecommendLabel: string;
  aiRecommendApply: string;
  aiRecommendLoading: string;
  proposals: Record<string, { title: string; hint: string }>;
};

function defaultLayout(): LayoutPayloadV2 {
  return { version: 2, proposalId: LAYOUT_PROPOSALS[0].id };
}

function mergeLayout(initial: string | null | undefined): LayoutPayloadV2 {
  return parseLayoutPayload(initial ?? "") ?? defaultLayout();
}

export function WorkflowLayoutForm({
  locale,
  projectId,
  initialJson,
  copy,
  showInvalid,
  aiEnabled,
}: {
  locale: string;
  projectId: string;
  initialJson: string | null;
  copy: WorkflowLayoutCopy;
  showInvalid: boolean;
  aiEnabled: boolean;
}) {
  const initial = useMemo(() => mergeLayout(initialJson), [initialJson]);
  const [proposalId, setProposalId] = useState<LayoutProposalId>(initial.proposalId);
  const [pending, start] = useTransition();
  const [pendingIntent, setPendingIntent] = useState<"save" | "next" | null>(null);
  const [aiPick, setAiPick] = useState<{
    proposalId: LayoutProposalId;
    reason: string;
  } | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  useEffect(() => {
    if (!aiEnabled) return;
    let cancelled = false;
    setAiLoading(true);
    fetch(
      `/api/projects/${encodeURIComponent(projectId)}/ai/recommend-layout?locale=${encodeURIComponent(locale)}`,
      { method: "POST", credentials: "include", cache: "no-store" },
    )
      .then((r) => r.json())
      .then((body: { proposalId?: LayoutProposalId; reason?: string }) => {
        if (cancelled || !body.proposalId) return;
        setAiPick({
          proposalId: body.proposalId,
          reason: body.reason ?? "",
        });
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setAiLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [aiEnabled, locale, projectId]);

  const payloadJson = useMemo(
    () => JSON.stringify({ version: 2, proposalId } satisfies LayoutPayloadV2),
    [proposalId],
  );

  function runSubmit(intent: "save" | "next") {
    const fd = new FormData();
    fd.set("payload", payloadJson);
    fd.set("intent", intent);
    setPendingIntent(intent);
    start(async () => {
      try {
        await saveWorkflowLayout(locale, projectId, fd);
      } finally {
        setPendingIntent(null);
      }
    });
  }

  return (
    <div className="mt-8 space-y-6">
      {showInvalid ? (
        <p
          role="alert"
          className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-800 dark:text-red-200"
        >
          {copy.invalidBanner}
        </p>
      ) : null}

      {aiEnabled && (aiLoading || aiPick) ? (
        <div className="rounded-2xl border border-accent/30 bg-accent/5 px-4 py-3 text-sm">
          {aiLoading ? (
            <p className="text-muted">{copy.aiRecommendLoading}</p>
          ) : aiPick ? (
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-foreground">
                <span className="font-semibold">{copy.aiRecommendLabel}</span>{" "}
                <span className="text-muted">{aiPick.reason}</span>
              </p>
              <button
                type="button"
                className={buttonClassName("secondary", "min-h-9 shrink-0 px-4 text-xs sm:text-sm")}
                onClick={() => setProposalId(aiPick.proposalId)}
              >
                {copy.aiRecommendApply}
              </button>
            </div>
          ) : null}
        </div>
      ) : null}

      <p className="text-xs font-semibold uppercase tracking-wide text-muted">{copy.proposalsTitle}</p>
      <div className="grid gap-4 sm:grid-cols-2">
        {LAYOUT_PROPOSALS.map((p, idx) => {
          const active = proposalId === p.id;
          const recommended = aiPick?.proposalId === p.id;
          const pc = copy.proposals[p.i18nKey];
          const letter = String.fromCharCode(65 + idx);
          return (
            <button
              key={p.id}
              type="button"
              disabled={pending}
              onClick={() => setProposalId(p.id)}
              className={`group relative flex flex-col rounded-2xl border-2 p-4 text-left transition-all ${
                active
                  ? "border-accent bg-accent/10 shadow-lg ring-2 ring-accent/25"
                  : recommended
                    ? "border-accent/50 bg-accent/5 hover:border-accent/60 hover:shadow-md"
                    : "border-border/80 bg-card/80 hover:border-accent/35 hover:shadow-md"
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <span
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-sm font-bold ${
                    active ? "bg-accent text-white" : "bg-muted/30 text-muted group-hover:text-foreground"
                  }`}
                  aria-hidden
                >
                  {letter}
                </span>
                <span className="rounded-full border border-border/80 bg-background/90 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted">
                  {copy.sketchBadge}
                </span>
              </div>
              <p className="mt-3 font-semibold text-foreground">{pc?.title ?? p.id}</p>
              <p className="mt-1 text-xs leading-relaxed text-muted">{pc?.hint ?? ""}</p>
              <div
                className="mt-4 flex-1 space-y-1.5 rounded-xl border border-dashed border-border/60 bg-gradient-to-b from-muted/15 to-transparent p-3"
                aria-hidden
              >
                <div className="h-2 w-[70%] rounded-full bg-muted/40" />
                <div className="h-2 w-full rounded-full bg-muted/25" />
                <div className="h-2 w-[85%] rounded-full bg-muted/25" />
                <div className="mt-3 grid grid-cols-3 gap-1.5">
                  <div className="h-10 rounded-lg bg-muted/20" />
                  <div className="h-10 rounded-lg bg-muted/20" />
                  <div className="h-10 rounded-lg bg-muted/20" />
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
        <button
          type="button"
          disabled={pending}
          className={buttonClassName("secondary", "min-h-11 w-full px-6 sm:w-auto")}
          onClick={() => runSubmit("save")}
        >
          {pending && pendingIntent === "save" ? copy.pendingSave : copy.save}
        </button>
        <button
          type="button"
          disabled={pending}
          className={buttonClassName("primary", "min-h-11 w-full px-6 shadow-md sm:w-auto")}
          onClick={() => runSubmit("next")}
        >
          {pending && pendingIntent === "next" ? copy.pendingNext : copy.next}
        </button>
      </div>
    </div>
  );
}
