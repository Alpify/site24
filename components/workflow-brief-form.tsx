"use client";

import { useMemo, useState, useTransition } from "react";

import { buttonClassName } from "@/components/ui/button";
import { saveWorkflowBrief } from "@/lib/projects/actions";
import {
  BRIEF_QUESTIONS,
  type BriefAnswer,
  type BriefPayloadV1,
  type BriefQuestionId,
  defaultBriefPayload,
  parseBriefPayload,
} from "@/lib/workflow/brief-questions";

export type WorkflowBriefCopy = {
  progressLabel: string;
  notesLabel: string;
  notesPlaceholder: string;
  save: string;
  next: string;
  pendingSave: string;
  pendingNext: string;
  invalidBanner: string;
  customPlaceholder: string;
  questions: Record<BriefQuestionId, string>;
  options: Record<string, Record<string, string>>;
};

function mergeBrief(initialJson: string | null | undefined): BriefPayloadV1 {
  return parseBriefPayload(initialJson ?? "") ?? defaultBriefPayload();
}

export function WorkflowBriefForm({
  locale,
  projectId,
  initialJson,
  initialNotes,
  copy,
  showInvalid,
}: {
  locale: string;
  projectId: string;
  initialJson: string | null;
  initialNotes: string | null;
  copy: WorkflowBriefCopy;
  showInvalid: boolean;
}) {
  const initial = useMemo(() => mergeBrief(initialJson), [initialJson]);
  const [answers, setAnswers] = useState<BriefAnswer[]>(initial.answers);
  const [notes, setNotes] = useState(initialNotes ?? "");
  const [pending, start] = useTransition();
  const [pendingIntent, setPendingIntent] = useState<"save" | "next" | null>(null);

  const answeredCount = answers.filter((a) => a.optionId).length;
  const payloadJson = useMemo(
    () => JSON.stringify({ version: 1, answers } satisfies BriefPayloadV1),
    [answers],
  );

  function runSubmit(intent: "save" | "next") {
    const fd = new FormData();
    fd.set("payload", payloadJson);
    fd.set("workflowNotes", notes);
    fd.set("intent", intent);
    setPendingIntent(intent);
    start(async () => {
      try {
        await saveWorkflowBrief(locale, projectId, fd);
      } finally {
        setPendingIntent(null);
      }
    });
  }

  function pickOption(qid: BriefQuestionId, optionId: string) {
    setAnswers((prev) =>
      prev.map((a) =>
        a.id === qid
          ? {
              ...a,
              optionId,
              ...(optionId === "other" ? { customText: a.customText ?? "" } : { customText: undefined }),
            }
          : a,
      ),
    );
  }

  function setCustom(qid: BriefQuestionId, text: string) {
    setAnswers((prev) =>
      prev.map((a) =>
        a.id === qid ? { ...a, optionId: "other", customText: text } : a,
      ),
    );
  }

  const optionChip = (active: boolean) =>
    `rounded-xl border px-3.5 py-2.5 text-left text-sm font-medium transition-all ${
      active
        ? "border-accent bg-accent text-white shadow-md ring-2 ring-accent/25"
        : "border-border/80 bg-card text-foreground hover:border-accent/35 hover:bg-background"
    }`;

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

      <div className="flex items-center justify-between gap-3 rounded-xl border border-border/70 bg-background/60 px-4 py-3">
        <p className="text-xs font-medium text-muted">{copy.progressLabel}</p>
        <p className="text-sm font-semibold tabular-nums text-foreground">
          {answeredCount}/{BRIEF_QUESTIONS.length}
        </p>
      </div>

      <ol className="space-y-5">
        {BRIEF_QUESTIONS.map((q, idx) => {
          const row = answers.find((a) => a.id === q.id)!;
          const qCopy = copy.questions[q.id];
          return (
            <li
              key={q.id}
              className="overflow-hidden rounded-2xl border border-border/80 bg-gradient-to-br from-card via-card to-accent/[0.04] shadow-sm"
            >
              <div className="flex gap-3 border-b border-border/60 bg-background/50 px-4 py-3 sm:px-5">
                <span
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent text-xs font-bold text-white"
                  aria-hidden
                >
                  {idx + 1}
                </span>
                <p className="pt-0.5 text-sm font-semibold leading-snug text-foreground sm:text-base">
                  {qCopy}
                </p>
              </div>
              <div className="grid gap-2 p-4 sm:grid-cols-2 sm:p-5">
                {q.options.map((opt) => {
                  const active = row.optionId === opt.id;
                  const label =
                    copy.options[q.id]?.[opt.id] ?? opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      disabled={pending}
                      aria-pressed={active}
                      className={optionChip(active)}
                      onClick={() => pickOption(q.id, opt.id)}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
              {row.optionId === "other" ? (
                <div className="border-t border-border/60 px-4 pb-4 sm:px-5">
                  <label className="mt-3 block text-xs font-medium text-muted">
                    {copy.customPlaceholder}
                    <input
                      type="text"
                      value={row.customText ?? ""}
                      maxLength={500}
                      disabled={pending}
                      onChange={(e) => setCustom(q.id, e.target.value)}
                      className="mt-1.5 w-full rounded-lg border border-border bg-card px-3 py-2.5 text-sm text-foreground outline-none ring-ring focus-visible:ring-2"
                    />
                  </label>
                </div>
              ) : null}
            </li>
          );
        })}
      </ol>

      <div className="rounded-2xl border border-border/80 bg-card p-4 sm:p-5">
        <label htmlFor="workflow-notes" className="text-sm font-medium text-foreground">
          {copy.notesLabel}
        </label>
        <textarea
          id="workflow-notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={4}
          maxLength={20000}
          disabled={pending}
          placeholder={copy.notesPlaceholder}
          className="mt-2 w-full resize-y rounded-xl border border-border bg-background px-3 py-2.5 text-sm leading-relaxed text-foreground outline-none ring-ring placeholder:text-muted/70 focus-visible:ring-2"
        />
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
