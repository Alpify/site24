export const WORKFLOW_STEP_IDS = ["goals", "builder", "content", "review"] as const;

export type WorkflowStepId = (typeof WORKFLOW_STEP_IDS)[number];

export function isWorkflowStepId(value: string): value is WorkflowStepId {
  return (WORKFLOW_STEP_IDS as readonly string[]).includes(value);
}

/** Maps legacy DB values to current step ids. */
export function normalizeStoredWorkflowStep(raw: string): WorkflowStepId {
  if (raw === "structure") {
    return "builder";
  }
  if (isWorkflowStepId(raw)) {
    return raw;
  }
  return "goals";
}

/** Ordered steps for the in-app website workflow (IDs match `project.workflowStep`). */
export const WORKFLOW_STEPS: readonly { id: WorkflowStepId; i18nKey: string }[] = [
  { id: "goals", i18nKey: "goals" },
  { id: "builder", i18nKey: "builder" },
  { id: "content", i18nKey: "content" },
  { id: "review", i18nKey: "review" },
] as const;

export function workflowStepIndex(step: WorkflowStepId): number {
  return WORKFLOW_STEP_IDS.indexOf(step);
}
