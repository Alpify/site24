"use client";

import { useMemo, useState, useTransition } from "react";

import { buttonClassName } from "@/components/ui/button";
import { saveWorkflowHosting } from "@/lib/projects/actions";
import {
  HOSTING_CHECK_IDS,
  type HostingCheckId,
  parseHostingPayload,
} from "@/lib/workflow/hosting-checklist";

export type WorkflowHostingCopy = {
  checklistTitle: string;
  save: string;
  pendingSave: string;
  items: Record<HostingCheckId, string>;
};

export function WorkflowHostingPanel({
  locale,
  projectId,
  initialJson,
  copy,
}: {
  locale: string;
  projectId: string;
  initialJson: string | null;
  copy: WorkflowHostingCopy;
}) {
  const initial = useMemo(() => parseHostingPayload(initialJson), [initialJson]);
  const [checked, setChecked] = useState<Set<HostingCheckId>>(new Set(initial.checked));
  const [pending, start] = useTransition();

  function toggle(id: HostingCheckId) {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  function save() {
    const payload = JSON.stringify({
      version: 1,
      checked: [...checked],
    });
    const fd = new FormData();
    fd.set("payload", payload);
    start(async () => {
      await saveWorkflowHosting(locale, projectId, fd);
    });
  }

  const rowClass = (on: boolean) =>
    `flex w-full items-start gap-3 rounded-xl border px-4 py-3.5 text-left transition-all ${
      on
        ? "border-accent bg-accent/10 shadow-sm ring-1 ring-accent/20"
        : "border-border/80 bg-card hover:border-accent/30 hover:bg-background"
    }`;

  return (
    <div className="mt-6 space-y-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted">{copy.checklistTitle}</p>
      <ul className="space-y-2">
        {HOSTING_CHECK_IDS.map((id) => {
          const on = checked.has(id);
          return (
            <li key={id}>
              <button
                type="button"
                disabled={pending}
                className={rowClass(on)}
                aria-pressed={on}
                onClick={() => toggle(id)}
              >
                <span
                  className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border text-xs font-bold ${
                    on ? "border-accent bg-accent text-white" : "border-border bg-background text-transparent"
                  }`}
                  aria-hidden
                >
                  ✓
                </span>
                <span className="text-sm font-medium text-foreground">{copy.items[id]}</span>
              </button>
            </li>
          );
        })}
      </ul>
      <button
        type="button"
        disabled={pending}
        onClick={save}
        className={buttonClassName("secondary", "min-h-10 px-5")}
      >
        {pending ? copy.pendingSave : copy.save}
      </button>
    </div>
  );
}
