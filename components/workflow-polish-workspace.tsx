"use client";

import { useState, useTransition } from "react";

import { WorkflowAiButton } from "@/components/workflow-ai-button";
import { buttonClassName } from "@/components/ui/button";
import { createDraft, deleteDraft, saveWorkflowPolish, updateDraft } from "@/lib/projects/actions";

export type PolishDraftRow = {
  id: string;
  title: string;
  body: string | null;
  updatedAt: string;
};

export type WorkflowPolishCopy = {
  generateAll: string;
  generateAllPending: string;
  generateAllConfirm: string;
  continueHosting: string;
  continuePending: string;
  incompleteBanner: string;
  editTitle: string;
  editBody: string;
  saveSection: string;
  savingSection: string;
  expandSection: string;
  deleteSection: string;
  newSectionTitle: string;
  newSectionBody: string;
  createSection: string;
  empty: string;
  aiTip: string;
};

export function WorkflowPolishWorkspace({
  locale,
  projectId,
  drafts: initialDrafts,
  aiEnabled,
  copy,
  dateFmt,
}: {
  locale: string;
  projectId: string;
  drafts: PolishDraftRow[];
  aiEnabled: boolean;
  copy: WorkflowPolishCopy;
  dateFmt: Intl.DateTimeFormat;
  showIncomplete?: boolean;
}) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [pending, start] = useTransition();

  return (
    <div className="mt-8 space-y-8">
      {aiEnabled ? (
        <div className="flex flex-col gap-3 rounded-2xl border border-accent/25 bg-gradient-to-br from-accent/10 via-card to-card p-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm leading-relaxed text-muted">{copy.aiTip}</p>
          <WorkflowAiButton
            locale={locale}
            projectId={projectId}
            endpoint={`/api/projects/${projectId}/ai/generate-polish`}
            label={copy.generateAll}
            pendingLabel={copy.generateAllPending}
            confirmMessage={copy.generateAllConfirm}
            successRedirect={`/${locale}/app/${projectId}/polish`}
            variant="primary"
          />
        </div>
      ) : null}

      {initialDrafts.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border/80 bg-muted/10 px-4 py-10 text-center text-sm text-muted">
          {copy.empty}
        </p>
      ) : (
        <ul className="space-y-4">
          {initialDrafts.map((d) => (
            <li
              key={d.id}
              className="overflow-hidden rounded-2xl border border-border/80 bg-card shadow-sm"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 bg-background/50 px-4 py-3 sm:px-5">
                <h3 className="text-base font-semibold text-foreground">{d.title}</h3>
                <time className="text-xs tabular-nums text-muted" dateTime={d.updatedAt}>
                  {dateFmt.format(new Date(d.updatedAt))}
                </time>
              </div>
              {editingId === d.id ? (
                <form
                  action={updateDraft.bind(null, locale, projectId, d.id)}
                  className="space-y-4 p-4 sm:p-5"
                >
                  <div>
                    <label className="text-xs font-medium text-muted">{copy.editTitle}</label>
                    <input
                      name="title"
                      defaultValue={d.title}
                      required
                      maxLength={200}
                      className="mt-1.5 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted">{copy.editBody}</label>
                    <textarea
                      name="body"
                      defaultValue={d.body ?? ""}
                      rows={8}
                      maxLength={50000}
                      className="mt-1.5 w-full resize-y rounded-lg border border-border bg-background px-3 py-2 text-sm leading-relaxed"
                    />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button type="submit" className={buttonClassName("primary", "min-h-10 px-4 text-sm")}>
                      {copy.saveSection}
                    </button>
                    <button
                      type="button"
                      className={buttonClassName("ghost", "min-h-10 px-4 text-sm")}
                      onClick={() => setEditingId(null)}
                    >
                      ✕
                    </button>
                  </div>
                </form>
              ) : (
                <div className="space-y-4 p-4 sm:p-5">
                  {d.body ? (
                    <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">{d.body}</p>
                  ) : (
                    <p className="text-sm italic text-muted">—</p>
                  )}
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setEditingId(d.id)}
                      className={buttonClassName("secondary", "min-h-9 px-3 text-xs sm:text-sm")}
                    >
                      {copy.editBody}
                    </button>
                    {aiEnabled ? (
                      <WorkflowAiButton
                        locale={locale}
                        projectId={projectId}
                        endpoint={`/api/projects/${projectId}/drafts/${d.id}/expand`}
                        label={copy.expandSection}
                        pendingLabel="…"
                        successRedirect={`/${locale}/app/${projectId}/polish`}
                        variant="secondary"
                        className={buttonClassName("secondary", "min-h-9 px-3 text-xs sm:text-sm")}
                      />
                    ) : null}
                    <form action={deleteDraft} className="inline">
                      <input type="hidden" name="locale" value={locale} />
                      <input type="hidden" name="projectId" value={projectId} />
                      <input type="hidden" name="draftId" value={d.id} />
                      <button
                        type="submit"
                        className={buttonClassName(
                          "ghost",
                          "min-h-9 px-3 text-xs text-muted hover:text-red-600 sm:text-sm",
                        )}
                      >
                        {copy.deleteSection}
                      </button>
                    </form>
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      <section className="rounded-2xl border border-border/70 bg-card/50 p-5">
        <h3 className="text-base font-semibold text-foreground">{copy.newSectionTitle}</h3>
        <form
          method="post"
          action={createDraft.bind(null, locale, projectId)}
          className="mt-4 flex max-w-xl flex-col gap-3"
        >
          <input
            name="title"
            required
            maxLength={200}
            placeholder={copy.newSectionTitle}
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
          />
          <textarea
            name="body"
            rows={3}
            maxLength={50000}
            placeholder={copy.newSectionBody}
            className="resize-y rounded-lg border border-border bg-background px-3 py-2 text-sm"
          />
          <button type="submit" className={buttonClassName("secondary", "min-h-10 self-start px-5 text-sm")}>
            {copy.createSection}
          </button>
        </form>
      </section>

      <form
        action={saveWorkflowPolish.bind(null, locale, projectId)}
        onSubmit={(e) => {
          if (!initialDrafts.some((d) => (d.body?.trim().length ?? 0) >= 20)) {
            e.preventDefault();
            window.location.assign(`/${locale}/app/${projectId}/polish?incomplete=1`);
          }
        }}
      >
        <input type="hidden" name="intent" value="next" />
        <button
          type="submit"
          disabled={pending}
          className={buttonClassName("primary", "min-h-11 w-full px-6 shadow-md sm:w-auto")}
          onClick={() =>
            start(() => {
              /* transition tracks pending for UX if needed */
            })
          }
        >
          {copy.continueHosting}
        </button>
      </form>
    </div>
  );
}
