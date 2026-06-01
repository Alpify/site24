"use client";

import { useMemo, useState, useTransition } from "react";

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
}: {
  locale: string;
  projectId: string;
  initialJson: string | null;
  copy: WorkflowLayoutCopy;
  showInvalid: boolean;
}) {
  const initial = useMemo(() => mergeLayout(initialJson), [initialJson]);
  const [proposalId, setProposalId] = useState<LayoutProposalId>(initial.proposalId);
  const [pending, start] = useTransition();
  const [pendingIntent, setPendingIntent] = useState<"save" | "next" | null>(null);

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

      <p className="text-xs font-semibold uppercase tracking-wide text-muted">{copy.proposalsTitle}</p>
      <div className="grid gap-4 sm:grid-cols-2">
        {LAYOUT_PROPOSALS.map((p, idx) => {
          const active = proposalId === p.id;
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
