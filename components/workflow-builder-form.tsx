"use client";

import { useMemo, useState, useTransition } from "react";

import { saveWorkflowBuilder } from "@/lib/projects/actions";
import { buttonClassName } from "@/components/ui/button";
import {
  BUILDER_PROPOSALS,
  BUILDER_QUESTION_IDS,
  type BuilderAnswer,
  type BuilderAnswerChoice,
  type BuilderPayloadV1,
  type BuilderProposalId,
  type BuilderQuestionId,
  parseBuilderPayload,
} from "@/lib/workflow/builder-proposals";

export type WorkflowBuilderCopy = {
  stepsHeading: string;
  proposalsTitle: string;
  sketchBadge: string;
  choiceYes: string;
  choiceNo: string;
  choiceComment: string;
  commentPlaceholder: string;
  save: string;
  next: string;
  pendingSave: string;
  pendingNext: string;
  invalidBanner: string;
  questions: Record<BuilderQuestionId, string>;
  proposals: Record<
    string,
    {
      title: string;
      hint: string;
    }
  >;
};

function defaultPayload(): BuilderPayloadV1 {
  return {
    version: 1,
    answers: BUILDER_QUESTION_IDS.map((id) => ({
      id,
      choice: "yes" satisfies BuilderAnswerChoice,
    })),
    proposalId: BUILDER_PROPOSALS[0].id,
  };
}

function mergePayload(
  initial: string | null | undefined,
  fallbackProposal: BuilderProposalId,
): BuilderPayloadV1 {
  const parsed = parseBuilderPayload(initial ?? "");
  if (parsed) {
    return parsed;
  }
  const base = defaultPayload();
  return { ...base, proposalId: fallbackProposal };
}

export function WorkflowBuilderForm({
  locale,
  projectId,
  initialJson,
  copy,
  showInvalid,
}: {
  locale: string;
  projectId: string;
  initialJson: string | null;
  copy: WorkflowBuilderCopy;
  showInvalid: boolean;
}) {
  const initial = useMemo(
    () => mergePayload(initialJson, BUILDER_PROPOSALS[0].id),
    [initialJson],
  );

  const [answers, setAnswers] = useState<BuilderAnswer[]>(initial.answers);
  const [proposalId, setProposalId] = useState<BuilderProposalId>(initial.proposalId);
  const [pending, start] = useTransition();
  const [pendingIntent, setPendingIntent] = useState<"save" | "next" | null>(null);

  const payloadJson = useMemo(
    () =>
      JSON.stringify({
        version: 1,
        answers,
        proposalId,
      } satisfies BuilderPayloadV1),
    [answers, proposalId],
  );

  function runSubmit(intent: "save" | "next") {
    const fd = new FormData();
    fd.set("payload", payloadJson);
    fd.set("intent", intent);
    setPendingIntent(intent);
    start(async () => {
      try {
        await saveWorkflowBuilder(locale, projectId, fd);
      } finally {
        setPendingIntent(null);
      }
    });
  }

  function setChoice(id: BuilderQuestionId, choice: BuilderAnswerChoice) {
    setAnswers((prev) =>
      prev.map((a) =>
        a.id === id
          ? {
              ...a,
              choice,
              ...(choice === "comment" ? { comment: a.comment ?? "" } : { comment: undefined }),
            }
          : a,
      ),
    );
  }

  function setComment(id: BuilderQuestionId, text: string) {
    setAnswers((prev) =>
      prev.map((a) => (a.id === id ? { ...a, choice: "comment" as const, comment: text } : a)),
    );
  }

  const choicePill = (active: boolean) =>
    `min-h-10 rounded-full border px-4 py-2 text-sm font-medium transition-all ${
      active
        ? "border-accent bg-accent text-white shadow-md ring-2 ring-accent/30"
        : "border-border bg-card text-foreground hover:border-accent/40 hover:bg-background"
    }`;

  return (
    <div className="mt-8 space-y-8">
      {showInvalid ? (
        <p
          role="alert"
          className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-800 dark:text-red-200"
        >
          {copy.invalidBanner}
        </p>
      ) : null}

      <div className="overflow-hidden rounded-2xl border border-border/80 bg-gradient-to-br from-card via-card to-accent/5 shadow-sm ring-1 ring-border/50">
        <div className="grid gap-8 p-5 sm:p-6 lg:grid-cols-12 lg:gap-10">
          <div className="space-y-5 lg:col-span-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">{copy.stepsHeading}</p>
            <ol className="space-y-4">
              {BUILDER_QUESTION_IDS.map((qid, idx) => {
                const row = answers.find((a) => a.id === qid)!;
                return (
                  <li
                    key={qid}
                    className="rounded-2xl border border-border/70 bg-background/70 p-4 shadow-sm backdrop-blur-sm"
                  >
                    <div className="flex gap-3">
                      <span
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent text-sm font-bold text-white shadow"
                        aria-hidden
                      >
                        {idx + 1}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium leading-snug text-foreground">{copy.questions[qid]}</p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {(["yes", "no", "comment"] as const).map((c) => (
                            <button
                              key={c}
                              type="button"
                              className={choicePill(row.choice === c)}
                              aria-pressed={row.choice === c}
                              disabled={pending}
                              onClick={() => setChoice(qid, c)}
                            >
                              {c === "yes"
                                ? copy.choiceYes
                                : c === "no"
                                  ? copy.choiceNo
                                  : copy.choiceComment}
                            </button>
                          ))}
                        </div>
                        {row.choice === "comment" ? (
                          <label className="mt-3 block">
                            <span className="sr-only">{copy.commentPlaceholder}</span>
                            <textarea
                              value={row.comment ?? ""}
                              onChange={(e) => setComment(qid, e.target.value)}
                              rows={3}
                              maxLength={2000}
                              placeholder={copy.commentPlaceholder}
                              disabled={pending}
                              className="mt-1 w-full resize-y rounded-xl border border-border bg-card px-3 py-2.5 text-sm text-foreground outline-none ring-ring placeholder:text-muted/70 focus-visible:ring-2"
                            />
                          </label>
                        ) : null}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ol>
          </div>

          <div className="lg:col-span-7">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">{copy.proposalsTitle}</p>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {BUILDER_PROPOSALS.map((p, idx) => {
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
          </div>
        </div>

        <div className="flex flex-col gap-3 border-t border-border/60 bg-background/60 px-5 py-4 sm:flex-row sm:items-center sm:justify-end sm:px-6">
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
    </div>
  );
}
