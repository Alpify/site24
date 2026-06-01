"use client";

import NextLink from "next/link";
import { usePathname } from "next/navigation";

import {
  WORKFLOW_STEPS,
  WORKFLOW_STEP_IDS,
  normalizeWorkflowPathSegment,
  type WorkflowStepId,
} from "@/lib/workflow/site-steps";
import { buttonClassName } from "@/components/ui/button";

const STEP_IDS = new Set<string>(WORKFLOW_STEP_IDS);

export function ProjectWorkflowNavClient({
  locale,
  projectId,
  labels,
  previewLabel,
  ariaLabel,
}: {
  locale: string;
  projectId: string;
  labels: Record<WorkflowStepId, string>;
  previewLabel: string;
  ariaLabel: string;
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
        {WORKFLOW_STEPS.map(({ id }) => {
          const active = id === activeStep;
          return (
            <NextLink
              key={id}
              href={`/${locale}/app/${projectId}/${id}`}
              className={buttonClassName(
                active ? "primary" : "ghost",
                "min-h-9 rounded-lg px-3 py-2 text-xs sm:text-sm",
              )}
              aria-current={active ? "page" : undefined}
            >
              {labels[id]}
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
