"use client";

import NextLink from "next/link";
import { usePathname } from "next/navigation";

import {
  WORKFLOW_STEPS,
  WORKFLOW_STEP_IDS,
  normalizeWorkflowPathSegment,
  type WorkflowStepId,
} from "@/lib/workflow/site-steps";
import type { StepAccess } from "@/lib/workflow/progress";
import { buttonClassName } from "@/components/ui/button";

const STEP_IDS = new Set<string>(WORKFLOW_STEP_IDS);

export function ProjectWorkflowNavClient({
  locale,
  projectId,
  labels,
  previewLabel,
  ariaLabel,
  stepAccess,
}: {
  locale: string;
  projectId: string;
  labels: Record<WorkflowStepId, string>;
  previewLabel: string;
  ariaLabel: string;
  stepAccess: Record<WorkflowStepId, StepAccess>;
}) {
  const pathname = usePathname();
  const last = pathname.split("/").filter(Boolean).pop() ?? "";
  const activeStep: WorkflowStepId = STEP_IDS.has(last)
    ? (last as WorkflowStepId)
    : normalizeWorkflowPathSegment(last);
  const previewActive = last === "preview";

  return (
    <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
      <nav
        aria-label={ariaLabel}
        className="flex flex-wrap gap-1 rounded-xl border border-border/70 bg-background/50 p-1.5 shadow-sm"
      >
        {WORKFLOW_STEPS.map(({ id }, idx) => {
          const active = id === activeStep;
          const access = stepAccess[id];
          const locked = access === "locked";
          const complete = access === "complete";

          return (
            <NextLink
              key={id}
              href={
                locked
                  ? `/${locale}/app/${projectId}/${id}`
                  : `/${locale}/app/${projectId}/${id}`
              }
              aria-current={active ? "page" : undefined}
              aria-disabled={locked}
              tabIndex={locked ? -1 : undefined}
              className={buttonClassName(
                active ? "primary" : complete ? "secondary" : "ghost",
                `relative min-h-9 rounded-lg px-3 py-2 text-xs sm:text-sm ${
                  locked ? "pointer-events-none opacity-40" : ""
                }`,
              )}
            >
              <span className="flex items-center gap-1.5">
                <span
                  className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold ${
                    complete && !active
                      ? "bg-emerald-600 text-white"
                      : active
                        ? "bg-white/20 text-white"
                        : "bg-muted/40 text-muted"
                  }`}
                  aria-hidden
                >
                  {complete && !active ? "✓" : idx + 1}
                </span>
                {labels[id]}
              </span>
            </NextLink>
          );
        })}
      </nav>
      <NextLink
        href={`/${locale}/app/${projectId}/preview`}
        className={buttonClassName(
          previewActive ? "primary" : "secondary",
          "min-h-9 shrink-0 rounded-lg px-3 py-2 text-xs sm:text-sm",
        )}
        aria-current={previewActive ? "page" : undefined}
      >
        {previewLabel}
      </NextLink>
    </div>
  );
}
